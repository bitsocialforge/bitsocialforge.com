# Agent Hooks Setup

If your AI coding assistant supports lifecycle hooks, configure these for this repo.

## Recommended Hooks

| Hook   | Command                                                | Purpose                                                                                            |
| ------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `stop` | `scripts/agent-hooks/sync-git-branches.sh`             | Prune stale refs and delete integrated temporary task branches                                      |
| `stop` | `scripts/agent-hooks/code-quality-review-reminder.sh`  | Remind the agent to run the advisory `code-quality-review` skill when reviewable files changed      |
| `stop` | `scripts/agent-hooks/verify.sh`                        | Hard-gate static-site verification: local asset references resolve and `index.html` structure is intact |

There is no `afterFileEdit` hook in this repo: there is no formatter, no dependency install step, and no framework-specific pattern review for a plain HTML + CSS site.

## Why

- Broken `href`/`src`/`url(...)` references and malformed HTML are caught before the agent finishes
- Reviewable diffs get an explicit advisory quality pass before push/PR
- Temporary task branches stay aligned with the repo's branch workflow
- One shared hook implementation for Codex, Cursor, and Claude

## What verify.sh Checks

`scripts/agent-hooks/verify.sh` uses the system python (`/usr/bin/python3`) and checks:

1. Every local `href`/`src` referenced in `index.html` (skipping `http`/`https`/`mailto`/`#` links) resolves to an existing file in the repo.
2. Every `url(...)` referenced in `styles.css` and `fonts/fonts.css` resolves.
3. `index.html` has no malformed tag structure (checked with `html.parser`).

By default the script exits non-zero when a required check fails (exit code 2 with `Verification failed.` on stderr, so hook-aware agents treat it as blocking). Set `AGENT_VERIFY_MODE=advisory` or pass `--advisory` only when you intentionally need signal from a broken tree without blocking the session.

Lifecycle hooks do not replace manual browser verification. For UI or visual changes, still serve the site (`/usr/bin/python3 -m http.server 4173 --directory .`) and run `playwright-cli` checks across `chrome`, `firefox`, and `webkit`, plus a 375px mobile viewport flow in each engine when responsiveness changed.

## Hook Wiring

Configure hook wiring according to your agent tool docs (`hooks.json`, equivalent, etc.). In this repo, `.claude/hooks.json`, `.cursor/hooks.json`, and `.codex/hooks.json` all register the same three `stop` hooks.

`.claude/hooks/*.sh`, `.cursor/hooks/*.sh`, and `.codex/hooks/*.sh` should stay as thin wrappers that delegate to the shared implementations under `scripts/agent-hooks/`.
