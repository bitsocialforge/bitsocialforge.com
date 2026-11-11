import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pwSession = path.join(repoRoot, "scripts/pw-session.sh");

// playwright-cli test double. As with the real daemon, a browser is listed `status: open` only
// once its launch has finished, `close` reports "not open" before then, and a signal during the
// launch aborts it. Gate files let a test hold a launch, a liveness query, a close, or an
// observation at an exact point.
const fakeCli = String.raw`#!/bin/bash
set -u
state="${"$"}{FAKE_PW_STATE:?}"
session=default
command=''
body=''
for arg in "$@"; do
  case "$arg" in
    -s=*) session="${"$"}{arg#-s=}" ;;
    *)
      if [ -z "$command" ]; then
        command="$arg"
      elif [ -z "$body" ]; then
        body="$arg"
      fi
      ;;
  esac
done
printf '%s %s\n' "$command" "$session" >>"$state/log"

# Waits (at most ~20s, and never after the test removed its state) for a gate file.
await_gate() {
  local ticks=0
  touch "$1.entered"
  while [ ! -e "$1" ] && [ -d "$state" ] && [ "$ticks" -lt 400 ]; do
    sleep 0.05
    ticks=$((ticks + 1))
  done
}

case "$command" in
  list)
    if [ -n "${"$"}{FAKE_PW_LIST_GATE:-}" ]; then await_gate "$FAKE_PW_LIST_GATE"; fi
    echo "/workspace:"
    for marker in "$state"/*.open; do
      [ -e "$marker" ] || continue
      printf '%s\n' "- $(basename "$marker" .open):" "  - status: open"
    done
    ;;
  open)
    trap 'rm -f "$state/$session.launching"; exit 143' TERM
    touch "$state/$session.launching"
    if [ -n "${"$"}{FAKE_PW_OPEN_GATE:-}" ]; then await_gate "$FAKE_PW_OPEN_GATE"; fi
    touch "$state/$session.open"
    rm -f "$state/$session.launching"
    echo "### Browser $session opened"
    ;;
  close)
    if [ ! -e "$state/$session.open" ]; then
      echo "Browser '$session' is not open."
      exit 0
    fi
    rm -f "$state/$session.open"
    if [ -n "${"$"}{FAKE_PW_CLOSE_GATE:-}" ]; then await_gate "$FAKE_PW_CLOSE_GATE"; fi
    echo "Browser '$session' closed"
    ;;
  run-code)
    if [ ! -e "$state/$session.open" ]; then
      printf '### Error\nThe browser %s is not open\n' "$session"
      exit 1
    fi
    case "$body" in
      *'page.goto('*) printf '### Result\n{"ariaSnapshot":true}\n' ;;
      *'ariaSnapshot({mode'*)
        if [ -n "${"$"}{FAKE_PW_BLOCK_OBSERVE:-}" ]; then
          touch "$state/observe-blocked"
          ticks=0
          while [ -e "$state/$session.open" ] && [ "$ticks" -lt 400 ]; do
            sleep 0.05
            ticks=$((ticks + 1))
          done
          printf '### Error\nSession closed\n'
          exit 1
        fi
        printf '### Result\n%s\n' "$(cat "$state/observation.json")"
        ;;
      *) printf '### Result\ntrue\n' ;;
    esac
    ;;
  *)
    echo "fake playwright-cli: unsupported command '$command'" >&2
    exit 1
    ;;
esac
`;

export const fixturePlan = () => ({
  version: 1,
  url: "http://127.0.0.1:4173/",
  goal: "Open settings, choose Dark, then close settings.",
  actions: [
    { id: "open", op: "click", role: "button", name: "Settings" },
    { id: "close", op: "click", role: "button", name: "Close" },
  ],
  requiredActions: ["open", "close"],
  assertions: [{ type: "bodyClass", value: "dark", present: true }],
});

export interface Exit {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

export function start(
  file: string,
  args: string[],
  { cwd, env }: { cwd: string; env: NodeJS.ProcessEnv },
) {
  const child = spawn(file, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk));
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
  const exit = new Promise<Exit>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
  return { child, exit };
}

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  );

async function until(condition: () => Promise<boolean>, what: string, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (!(await condition())) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

export async function createFakePlaywright() {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "jev-fake-playwright-")));
  const state = path.join(root, "state");
  const cli = path.join(root, "playwright-cli");
  const lock = path.join(root, "lock");
  await mkdir(state);
  await writeFile(cli, fakeCli, { mode: 0o755 });
  await writeFile(
    path.join(state, "observation.json"),
    JSON.stringify({
      url: fixturePlan().url,
      snapshot: '- button "Settings" [ref=e1]',
      assertions: [false],
    }),
  );
  const env = (extra: Record<string, string> = {}): NodeJS.ProcessEnv => {
    const result: NodeJS.ProcessEnv = {
      ...process.env,
      PLAYWRIGHT_CLI_BIN: cli,
      PLAYWRIGHT_RESOURCE_LOCK_DIR: lock,
      FAKE_PW_STATE: state,
      ...extra,
    };
    // Workspaces come from each test's directory, never from an enclosing Git environment.
    delete result.GIT_DIR;
    delete result.GIT_WORK_TREE;
    return result;
  };
  return {
    root,
    state,
    cli,
    lock,
    env,
    gate: (name: string) => path.join(state, `gate-${name}`),
    release: (gate: string) => writeFile(gate, ""),
    waitFor: (file: string) => until(() => exists(file), path.basename(file)),
    session: (args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) =>
      start("bash", [pwSession, ...args], { cwd: options.cwd ?? root, env: options.env ?? env() }),
    async openBrowsers() {
      return (await readdir(state))
        .filter((file) => file.endsWith(".open"))
        .map((file) => file.slice(0, -5));
    },
    async commands(name: string) {
      const log = await readFile(path.join(state, "log"), "utf8").catch(() => "");
      return log.split("\n").filter((line) => line.startsWith(`${name} `)).length;
    },
    async launchesSettled() {
      await until(
        async () => !(await readdir(state)).some((file) => file.endsWith(".launching")),
        "launches to finish",
      );
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
