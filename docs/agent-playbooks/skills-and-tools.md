# Skills and Tools

Use this playbook when setting up or adjusting skills and external tooling, or to discover what is already committed.

## Committed Skills Index

These live in `.claude/skills/`, `.cursor/skills/`, and `.codex/skills/` (mirrored; run `node scripts/validate-ai-workflow.mjs` after edits). Repo skill files are committed; runtime app dependencies still install through Yarn.

| Skill | Use when |
| ----- | -------- |
| `commit` | Committing current work with logical scoped commits |
| `commit-format` / `issue-format` | Formatting commit or issue suggestions in chat output |
| `make-closed-issue` | Creating an issue plus review branch and PR into `master` for already-done work |
| `review-and-merge-pr` | Triaging bot, CI, and human PR feedback, fixing valid findings, merging, and cleaning up |
| `fix-merge-conflicts` | Resolving merge conflicts non-interactively and validating the Vite site |
| `code-quality-review` | Advisory pre-push/pre-PR quality pass on the current diff |
| `refactor-pass` | Simplicity-focused refactor of recent changes |
| `deslop` | Removing AI-generated slop from the branch diff |
| `debug-agent` | Evidence-based debugging with runtime logs |
| `frontend-design` | Distinctive, production-grade frontend design guidance for net-new pages or sections |
| `impeccable` | Frontend design entry point with design subcommands (`/impeccable`) |
| `playwright-cli` | Browser automation and cross-engine UI verification |
| `implement-plan` | Executing a multi-task plan via `plan-implementer` subagents |
| `readme` | Creating or updating README.md |
| `context7` | Fetching up-to-date library docs |
| `find-skills` | Discovering or installing ecosystem skills |

## Committed Subagents

Defined in `.claude/agents/*.md`, `.cursor/agents/*.md`, `.codex/agents/*.toml` plus `.codex/config.toml` entries:

- `browser-check`
- `code-quality`
- `plan-implementer`

Read the agent file before spawning one directly.

## Playwright CLI

Use `playwright-cli` for browser automation: navigation, interaction, screenshots, tests, and extraction.

The local dev URL is `http://localhost:4173`. Start the Vite dev server first if needed:

```bash
corepack yarn start
```

Default to a fresh isolated browser session for normal verification. If the task depends on the contributor's existing browser state, ask whether they want:

- a fresh isolated `playwright-cli` session
- their current browser session reused

Do not attach to a live personal browser session without explicit confirmation.

When using `playwright-cli` for repo UI verification, run the relevant flow in all three main browser engines:

- `chrome` for Blink
- `firefox` for Gecko
- `webkit` for Safari/WebKit coverage

Use separate named sessions per engine so evidence stays isolated. If an engine is intentionally skipped, record why.

```bash
npm install -g @playwright/cli@latest
playwright-cli install --skills
```

## MCP Policy Rationale

Avoid GitHub MCP and browser MCP servers for this project because they add significant tool-schema/context overhead.

- GitHub operations: use `gh` CLI.
- Browser operations: use `playwright-cli`.
- If current browser reuse is needed, keep using Playwright-based attach paths rather than browser MCP servers.

## Model Availability

- `composer-2` family models are available only in Cursor. Do not configure them under `.claude/` or `.codex/`.
- Codex does not document a `latest` model alias. Committed custom-agent TOMLs under `.codex/**/agents/*.toml` omit both `model` and `model_reasoning_effort` so they inherit the current parent session settings.
