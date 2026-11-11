#!/bin/bash

set -euo pipefail
umask 077

# pw-session.sh — shared resource lock for playwright-cli browser sessions.
#
# Playwright disables normal background throttling, so a hidden 5chan page keeps
# doing P2P and rendering work after a check finishes. Agents verifying in
# parallel therefore stack whole browser engines on one machine. This wrapper
# permits one active Playwright browser at a time and records who holds it.
#
# The lock is machine-wide, not per-repository: the contended resource is RAM and
# CPU, so every checkout that ships this script shares a single slot. Set
# PLAYWRIGHT_RESOURCE_LOCK_DIR to isolate a lock (tests, or a deliberate second
# slot on a machine with headroom).
#
# Liveness comes from `playwright-cli list --all`, which reports `status: open`
# for a running browser. A lock whose recorded session is no longer open is
# stale, and is reclaimed automatically rather than blocking every later
# workflow. When playwright-cli cannot be queried the lock is left alone, so a
# broken CLI never silently disables the budget. A browser is not listed open
# while it is still starting or already stopping, so the wrapper doing that
# records its PID in the lock, and the lock is not stale until that wrapper exits.
#
# PW_SESSION_POLL_SECONDS overrides how often `--wait` re-checks the slot.

usage() {
  cat <<'EOF'
Usage:
  ./scripts/pw-session.sh open [--wait[=SECONDS]] <session> [playwright-cli open arguments...]
  ./scripts/pw-session.sh close <session>
  ./scripts/pw-session.sh status
  ./scripts/pw-session.sh release <session>

One browser slot is shared by every worktree and repository on this machine.

  open     Acquire the slot, then start the browser. Exits 75 when the slot is
           held by a live session; --wait polls until it frees (default 300s).
           A slot whose browser is gone is reclaimed automatically.
  close    Stop the named browser, then release the slot. Always attempts the
           browser close, even when the lock was already lost, and never
           releases a slot held by a different session. A same-named session
           that another workspace holds is left running and keeps the slot.
  status   Report the holder and whether its browser is still running.
  release  Drop a lock without closing a browser. Normal cleanup uses `close`.
           Only the workspace that opened the session can release it.
EOF
}

playwright_cli="${PLAYWRIGHT_CLI_BIN:-playwright-cli}"

# Resolved in order so an explicit override never depends on HOME being set:
# some sandboxes, CI runners, and test harnesses start without it.
if [ -n "${PLAYWRIGHT_RESOURCE_LOCK_DIR:-}" ]; then
  lock_dir="$PLAYWRIGHT_RESOURCE_LOCK_DIR"
elif [ -n "${XDG_CACHE_HOME:-}" ]; then
  lock_dir="$XDG_CACHE_HOME/bitsocial/playwright-session.lock"
elif [ -n "${HOME:-}" ]; then
  lock_dir="$HOME/.cache/bitsocial/playwright-session.lock"
else
  echo "pw-session: set HOME, XDG_CACHE_HOME, or PLAYWRIGHT_RESOURCE_LOCK_DIR so the lock has a home" >&2
  exit 1
fi

owner_file="$lock_dir/owner"
started_file="$lock_dir/started-at"
workspace_file="$lock_dir/workspace"
pid_file="$lock_dir/pid"
reclaim_marker="$lock_dir/reclaiming"
default_wait_seconds=300
poll_seconds="${PW_SESSION_POLL_SECONDS:-5}"

# Recorded with the lock so close and release can refuse a same-named session
# that another workspace holds. The lock is machine-wide, so a checkout outside
# a Git worktree is unusual but not an error.
workspace="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# A process start time, so a recorded PID the OS has since given to an unrelated
# process is not mistaken for the original. `ps` prints it in local time, so the
# zone is fixed: wrappers sharing the slot may run with different TZ values.
# Empty when `ps` is unavailable. Ours is read up front so a new lock gets its
# PID record right after `mkdir`.
process_started() {
  TZ=UTC0 LC_ALL=C ps -o lstart= -p "$1" 2>/dev/null || true
}
self_started="$(process_started "$$")"

validate_session() {
  local session="$1"

  if [[ ! "$session" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$ ]]; then
    echo "pw-session: session must be 1-40 characters using letters, numbers, '.', '_', or '-'" >&2
    exit 1
  fi
}

current_owner() {
  if [ -f "$owner_file" ]; then
    sed -n '1p' "$owner_file"
  fi
}

# Echoes `live`, `dead`, or `unknown` for a session name. `unknown` means the
# browser list could not be read, and callers must treat the lock as held.
session_state() {
  local session="$1" listing line current=''

  if ! listing="$("$playwright_cli" list --all 2>/dev/null)"; then
    echo unknown
    return 0
  fi

  # `playwright-cli list --all` prints a `- <session>:` header per browser,
  # followed by indented fields including `  - status: open|closed`.
  while IFS= read -r line; do
    case "$line" in
      '- '*':')
        current="${line#- }"
        current="${current%:}"
        ;;
      '  - status: open')
        if [ "$current" = "$session" ]; then
          echo live
          return 0
        fi
        ;;
    esac
  done <<<"$listing"

  echo dead
}

held_workspace() {
  sed -n '1p' "$workspace_file" 2>/dev/null || true
}

# A same-named session opened from another workspace is a different holder. A
# lock without a record, or whose workspace no longer exists, is not refused.
held_from_here() {
  local held
  held="$(held_workspace)"
  [ -z "$held" ] || [ "$held" = "$workspace" ] || [ ! -d "$held" ]
}

# Marks this wrapper as starting or stopping the slot's browser.
mark_transition() {
  printf '%s\n%s\n' "$$" "$self_started" >"$pid_file" 2>/dev/null || true
}

clear_transition() {
  if [ "$(sed -n '1p' "$pid_file" 2>/dev/null || true)" = "$$" ]; then
    rm -f "$pid_file"
  fi
}

# True while another wrapper recorded in the lock is still starting or stopping
# the browser: the browser is not listed open then, yet the lock is not stale.
# A start time this wrapper cannot read is no proof the PID was reused.
transition_alive() {
  local pid started current
  pid="$(sed -n '1p' "$pid_file" 2>/dev/null || true)"
  started="$(sed -n '2p' "$pid_file" 2>/dev/null || true)"
  [[ "$pid" =~ ^[0-9]+$ ]] && [ "$pid" != "$$" ] && kill -0 "$pid" 2>/dev/null || return 1
  current="$(process_started "$pid")"
  [ -z "$started" ] || [ -z "$current" ] || [ "$current" = "$started" ]
}

wait_for_transition() {
  local waited=0
  while transition_alive; do
    if [ "$waited" -ge 300 ]; then
      echo "pw-session: warning: '$1' is still starting or stopping after 60s; closing it anyway" >&2
      return 0
    fi
    sleep 0.2
    waited=$((waited + 1))
  done
}

# Echoes the holder's `live`, `dead`, or `unknown` state, or `changing` while
# its wrapper is still starting or stopping the browser.
holder_state() {
  local owner="$1" state=dead

  if [ -n "$owner" ]; then
    state="$(session_state "$owner")"
  fi
  if [ "$state" = dead ] && transition_alive; then
    state=changing
  fi
  echo "$state"
}

# Identifies one acquisition of the lock, including a start or stop in progress.
lock_generation() {
  cat "$owner_file" "$started_file" "$workspace_file" "$pid_file" 2>/dev/null || true
}

write_lock_metadata() {
  mark_transition
  printf '%s\n' "$1" >"$owner_file"
  date -u '+%Y-%m-%dT%H:%M:%SZ' >"$started_file"
  printf '%s\n' "$workspace" >"$workspace_file"
}

print_status() {
  local owner started held state

  if [ ! -d "$lock_dir" ]; then
    echo "pw-session: browser slot is available"
    return 0
  fi

  owner="$(current_owner)"
  started="$(sed -n '1p' "$started_file" 2>/dev/null || true)"
  held="$(held_workspace)"
  if [ -n "$owner" ]; then
    state="$(holder_state "$owner")"
  elif transition_alive; then
    state=changing
  else
    state=unknown
  fi

  case "$state" in
    live) echo "pw-session: browser slot is held" ;;
    changing) echo "pw-session: browser slot is held (its browser is starting or stopping)" ;;
    dead) echo "pw-session: browser slot is held by a stale lock" ;;
    *) echo "pw-session: browser slot is held (browser state unverifiable)" ;;
  esac

  echo "Session: ${owner:-unknown}"
  echo "Started: ${started:-unknown}"
  echo "Workspace: ${held:-unknown}"
  echo "Lock: $lock_dir"

  case "$state" in
    live) echo "Browser: running" ;;
    changing) echo "Browser: starting or stopping" ;;
    dead)
      echo "Browser: not running — the next 'open' reclaims this slot automatically"
      ;;
    *)
      echo "Browser: unverifiable — '$playwright_cli list --all' failed, so the lock is left alone"
      ;;
  esac
}

# Clears the marker of a reclaimer that was killed before removing it. A marker
# with no PID recorded after a short grace lost its reclaimer between the two.
clear_dead_reclaimer() {
  local reclaimer

  [ -d "$reclaim_marker" ] || return 0
  reclaimer="$(sed -n '1p' "$reclaim_marker/pid" 2>/dev/null || true)"
  if [ -z "$reclaimer" ]; then
    sleep 0.2
    reclaimer="$(sed -n '1p' "$reclaim_marker/pid" 2>/dev/null || true)"
  fi
  if [ -z "$reclaimer" ] || { [[ "$reclaimer" =~ ^[0-9]+$ ]] && ! kill -0 "$reclaimer" 2>/dev/null; }; then
    rm -rf "$reclaim_marker"
  fi
}

# Atomically drop a lock we found stale. The liveness query behind that finding
# is slow, so the lock may since have been reclaimed and re-acquired, or its
# holder may have started closing. The marker directory inside the lock lets
# only one opener reclaim it, and the lock is renamed away only while it is
# still the acquisition that was examined.
reclaim_stale_lock() {
  local owner="$1" examined="$2" staged="${lock_dir}.stale.$$"

  if ! mkdir "$reclaim_marker" 2>/dev/null; then
    # Another opener is reclaiming it; clear its marker only if it died.
    clear_dead_reclaimer
    return 0
  fi
  printf '%s\n' "$$" >"$reclaim_marker/pid" 2>/dev/null || true

  if [ "$(lock_generation)" = "$examined" ] && mv "$lock_dir" "$staged" 2>/dev/null; then
    rm -rf "$staged"
    echo "pw-session: reclaimed stale slot from '$owner' (its browser is no longer running)" >&2
  else
    rm -rf "$reclaim_marker"
  fi
}

acquire() {
  local session="$1" wait_seconds="$2" examined owner state reclaims=0 empty_waits=0

  validate_session "$session"
  mkdir -p "$(dirname "$lock_dir")"

  SECONDS=0
  while true; do
    if mkdir "$lock_dir" 2>/dev/null; then
      write_lock_metadata "$session"
      echo "pw-session: acquired browser slot for '$session'"
      return 0
    fi

    examined="$(lock_generation)"
    if [ -z "$examined" ] && [ "$empty_waits" -lt 1 ]; then
      # A lock with nothing recorded yet may have just been created.
      empty_waits=1
      sleep 0.2
      continue
    fi
    owner="$(current_owner)"
    state="$(holder_state "$owner")"

    # Bounded so an unremovable lock directory fails loudly instead of spinning.
    if [ "$state" = dead ] && [ "$reclaims" -lt 3 ]; then
      reclaims=$((reclaims + 1))
      reclaim_stale_lock "${owner:-unknown}" "$examined"
      continue
    fi

    if [ "$state" = dead ]; then
      print_status >&2
      echo "pw-session: could not reclaim the stale slot at $lock_dir; remove it by hand" >&2
      return 75
    fi

    if [ "$wait_seconds" -gt 0 ] && [ "$SECONDS" -lt "$wait_seconds" ]; then
      echo "pw-session: slot held by '$owner'; retrying in ${poll_seconds}s (waited ${SECONDS}s of ${wait_seconds}s)" >&2
      sleep "$poll_seconds"
      continue
    fi

    print_status >&2
    if [ "$wait_seconds" -gt 0 ]; then
      echo "pw-session: gave up after ${wait_seconds}s; do not bypass the lock" >&2
    else
      echo "pw-session: another browser workflow is active; do not bypass the lock" >&2
    fi
    return 75
  done
}

release() {
  local session="$1" owner

  validate_session "$session"
  if [ ! -d "$lock_dir" ]; then
    echo "pw-session: browser slot is already available"
    return 0
  fi

  owner="$(current_owner)"
  if [ "$owner" != "$session" ]; then
    echo "pw-session: '$session' cannot release the slot held by '${owner:-unknown}'" >&2
    if [ -n "$owner" ] && [ "$(session_state "$owner")" = dead ]; then
      echo "pw-session: that lock is stale; the next 'open' reclaims it automatically" >&2
    fi
    return 1
  fi
  if ! held_from_here; then
    echo "pw-session: '$session' holds the slot from $(held_workspace), not this workspace; cannot release it here" >&2
    return 1
  fi

  rm -f "$owner_file" "$started_file" "$workspace_file" "$pid_file"
  clear_dead_reclaimer
  rmdir "$lock_dir"
  echo "pw-session: released browser slot for '$session'"
}

# A signal while the browser is starting: stop the launch, close anything that
# already came up, and only then release the slot.
abort_open() {
  local status="$1" waited=0

  trap '' INT TERM HUP PIPE
  set +e
  # The caller may have closed its end of our output pipes (Node's execFile does
  # on timeout), and bash would keep the unwritten text and flush it into the
  # next file it writes. Only a terminal still gets the final message.
  exec >/dev/null
  [ -t 2 ] || exec 2>/dev/null
  if [ -n "$open_pid" ]; then
    kill -TERM "$open_pid" 2>/dev/null
    while kill -0 "$open_pid" 2>/dev/null && [ "$waited" -lt 100 ]; do
      sleep 0.1
      waited=$((waited + 1))
    done
  fi
  "$playwright_cli" -s="$session" close >/dev/null 2>&1
  release "$session"
  echo "pw-session: interrupted while opening '$session'; stopped it and released the slot" >&2
  exit "$status"
}

command="${1:-}"
case "$command" in
  open)
    shift
    wait_seconds=0
    session=''
    open_args=()

    # `--wait` is accepted anywhere so `open <session> --wait` is not a silent
    # no-op. `playwright-cli open` has no --wait of its own, so nothing that
    # belongs to it is swallowed here. The first bare argument is the session;
    # the rest pass through untouched.
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --wait)
          wait_seconds="$default_wait_seconds"
          ;;
        --wait=*)
          wait_seconds="${1#--wait=}"
          if [[ ! "$wait_seconds" =~ ^[0-9]+$ ]]; then
            echo "pw-session: --wait expects a whole number of seconds" >&2
            exit 1
          fi
          ;;
        *)
          if [ -z "$session" ]; then
            session="$1"
          else
            open_args+=("$1")
          fi
          ;;
      esac
      shift
    done

    if [ -z "$session" ]; then
      usage >&2
      exit 1
    fi

    acquire "$session" "$wait_seconds"
    open_pid=''
    trap 'abort_open 130' INT
    trap 'abort_open 143' TERM
    trap 'abort_open 129' HUP
    # Run in the background so a signal reaches the trap during the launch: a
    # caller that kills only this wrapper (Node's execFile timeout does) would
    # otherwise leave the launch running after the slot is released. Guarded
    # expansion: Bash 3.2 (macOS /bin/bash) errors on an empty array under `set -u`.
    "$playwright_cli" -s="$session" open ${open_args[@]+"${open_args[@]}"} &
    open_pid=$!
    open_status=0
    wait "$open_pid" || open_status=$?
    trap - INT TERM HUP
    if [ "$open_status" -ne 0 ]; then
      release "$session"
      exit 1
    fi
    # The browser is listed open now, so liveness no longer depends on this wrapper.
    clear_transition
    ;;
  close)
    session="${2:-}"
    if [ -z "$session" ] || [ "$#" -ne 2 ]; then
      usage >&2
      exit 1
    fi
    validate_session "$session"

    owner="$(current_owner)"
    if [ "$owner" = "$session" ] && held_from_here; then
      # An open of this session that is still starting would bring its browser
      # up after this close, so let it finish or abort first.
      wait_for_transition "$session"
      owner="$(current_owner)"
    fi
    if [ "$owner" = "$session" ] && ! held_from_here; then
      echo "pw-session: '$session' holds the slot from $(held_workspace), not this workspace; left its browser and the slot untouched" >&2
      exit 1
    fi
    if [ "$owner" = "$session" ]; then
      # Keeps the slot held while the browser stops and is no longer listed open.
      mark_transition
    fi

    # Cleanup must always stop the browser, even when the lock was lost, so a
    # failed workflow cannot strand a running engine.
    close_status=0
    "$playwright_cli" -s="$session" close || close_status=$?
    if [ "$close_status" -ne 0 ]; then
      echo "pw-session: warning: closing browser '$session' exited $close_status" >&2
    fi

    if [ -z "$owner" ]; then
      echo "pw-session: browser slot was already free; closed '$session' anyway"
    elif [ "$owner" = "$session" ]; then
      release "$session"
    else
      echo "pw-session: closed '$session'; left the slot held by '$owner' untouched" >&2
    fi
    ;;
  status)
    if [ "$#" -ne 1 ]; then
      usage >&2
      exit 1
    fi
    print_status
    ;;
  release)
    session="${2:-}"
    if [ -z "$session" ] || [ "$#" -ne 2 ]; then
      usage >&2
      exit 1
    fi
    release "$session"
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
