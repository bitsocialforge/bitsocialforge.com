# Agent Hooks Setup

This repo ships lifecycle hooks shared across Claude Code, Cursor, and Codex. The implementations live in `scripts/agent-hooks/`; each harness has thin wrappers in `.claude/hooks/`, `.cursor/hooks/`, `.codex/hooks/` plus its own entry-point config. Run `node scripts/validate-ai-workflow.mjs` after changing any of this.

## Hooks

| Stop hook | Script | Purpose |
| --------- | ------ | ------- |
| stop | `scripts/agent-hooks/sync-git-branches.sh` | Prune stale refs and delete integrated temporary task branches |
| stop | `scripts/agent-hooks/code-quality-review-reminder.sh` | Remind the agent to run the advisory `code-quality-review` skill when reviewable files changed |
| stop | `scripts/agent-hooks/verify.sh` | Hard-gate Vite site verification: dependencies install, TypeScript/lint/build pass, and local assets resolve |

There is no edit-time hook in this repo. Formatting and TypeScript checks run through the shared verification path when reviewable files change.

## Entry Points

The three harnesses wire the same scripts but use different config files and schemas. Do not copy one harness's schema to another.

| Harness | Entry point | Schema | Stop event |
| ------- | ----------- | ------ | ---------- |
| Claude Code | `hooks` key in `.claude/settings.json` | Claude hooks schema; standalone `.claude/hooks.json` is not read | `Stop` |
| Cursor | `.cursor/hooks.json` | `{"version": 1, "hooks": {...}}` with Cursor event names | `stop` |
| Codex | `.codex/hooks.json` | Codex hooks schema, intentionally Claude-compatible with `type: "command"` | `Stop` |

## What `verify.sh` Checks

`scripts/agent-hooks/verify.sh` runs the repo's Vite/TypeScript checks and uses the system python (`/usr/bin/python3`) only for small local reference parsers. It checks:

1. `corepack yarn install --immutable`
2. `corepack yarn type-check`
3. `corepack yarn lint`
4. `corepack yarn build`
5. Every file under `public/` was copied into `dist/` by the build.
6. Every local `href`/`src` referenced in `index.html` resolves to an existing file in the repo (checking `public/` for absolute paths), excluding Vercel-managed `/_vercel/*` runtime paths.
7. Every `url(...)` referenced in `styles.css` and `fonts/fonts.css` resolves.
8. `index.html` has no malformed tag structure.

In strict mode, failures exit `2` so hook-aware agents treat them as blocking. The script checks `stop_hook_active` to avoid infinite stop loops and skips when the working tree is clean. Set `AGENT_VERIFY_MODE=advisory` or pass `--advisory` only when you intentionally need signal from a broken tree without blocking the session.

Lifecycle hooks do not replace manual browser verification. For UI or visual changes, still run `corepack yarn start` and use `playwright-cli` checks across `chrome`, `firefox`, and `webkit`, plus a 375px mobile viewport flow in each engine when responsiveness changed.

## Editing Rules

- Change behavior in `scripts/agent-hooks/*.sh`; keep the per-harness wrappers as thin `exec` delegates.
- When adding a hook, wire it in all three entry points or add a documented exemption in `scripts/validate-ai-workflow.mjs`.
- Do not paste example hook implementations into docs; link the real scripts so they cannot drift.
