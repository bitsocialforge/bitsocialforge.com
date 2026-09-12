# Agent hooks

The only lifecycle behavior is best-effort formatting of existing edited JS/TS files with the installed oxfmt. Shared implementation: `scripts/agent-hooks/format.mjs`; native wrappers: `.codex/hooks/format.sh`, `.cursor/hooks/format.sh`, and `.claude/hooks/format.sh`.

| App | Entry point | Event |
|---|---|---|
| Codex | `.codex/hooks.json` | `PostToolUse`, matcher `apply_patch` |
| Cursor | `.cursor/hooks.json` | `afterFileEdit` |
| Claude Code | `.claude/settings.json` under `hooks` | `PostToolUse`, matcher `Edit|Write|MultiEdit` |

Claude Code does not load standalone `.claude/hooks.json`. Existing non-hook settings, plugin configuration, and launch configuration remain separate native inputs. These entry points follow the documented [Codex](https://learn.chatgpt.com/docs/hooks), [Cursor](https://cursor.com/docs/hooks), and [Claude](https://code.claude.com/docs/en/hooks) schemas.

The formatter parses the event’s actual file paths, including Codex patch additions, updates, and moves. It ignores read-only/failed events, deletions, missing files, unsupported extensions, and paths or symlinks outside the repository. It passes filenames as argument-array entries, disables Corepack network access, and skips when oxfmt is absent. Failures are reported without blocking edits.

There are no stop loops, session-start installs, package-edit installs, or Git cleanup hooks. Run dependency synchronization when the task changes dependencies; choose verification using [verification.md](verification.md). Commit, push, merge, and cleanup remain explicit actions within the user’s authorization.

After edits, run `yarn ai-workflow:sync`, `yarn ai-workflow:check`, and `yarn ai-workflow:test`. Tests use temporary repositories and a fake formatter to check side effects without installing dependencies or starting app servers. An app’s trust/reload controls may affect activation; fixture tests are not an end-to-end app activation test.
