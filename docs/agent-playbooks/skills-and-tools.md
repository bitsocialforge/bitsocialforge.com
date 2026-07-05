# Skills and Tools

Use this playbook when setting up/adjusting skills and external tooling.

## Installed Skills

The same skill set is installed in `.claude/skills/`, `.cursor/skills/`, and `.codex/skills/`. Keep the three copies aligned when changing any of them. Most were transferred and adapted from the `bitsocial-web` repo's AI workflow tooling; repo-specific steps (build commands, repo slugs, dev URLs) were rewritten for this static site.

| Skill                 | Purpose                                                                          |
| --------------------- | -------------------------------------------------------------------------------- |
| `commit`              | Review diffs, split into logical commits, write Conventional Commit messages      |
| `commit-format`       | Output format for commit message suggestions                                      |
| `issue-format`        | Output format for GitHub issue suggestions                                        |
| `make-closed-issue`   | Create an issue for completed work, commit, and close it with the commit hash     |
| `deslop`              | Remove AI-generated slop from the current diff                                    |
| `find-skills`         | Discover/install skills from the open ecosystem (`npx skills`)                    |
| `fix-merge-conflicts` | Resolve merge conflicts non-interactively and re-verify                           |
| `impeccable`          | Frontend design entry point with design subcommands (`/impeccable`)               |
| `frontend-design`     | Distinctive, production-grade frontend design guidance for net-new pages/sections |
| `code-quality-review` | Advisory pre-push/pre-PR quality review of the current diff                       |
| `readme`              | Generate thorough project documentation                                           |
| `refactor-pass`       | Simplicity-focused cleanup pass after recent changes                              |
| `review-and-merge-pr` | Triage PR feedback, fix valid findings, merge when ready                          |
| `playwright-cli`      | Browser automation for UI verification                                            |
| `context7`            | Up-to-date library documentation lookups via the Context7 API                     |
| `debug-agent`         | Evidence-based debugging with runtime NDJSON logs                                 |
| `implement-plan`      | Orchestrate a multi-task plan with `plan-implementer` subagents                   |

## Playwright CLI

Use `playwright-cli` for browser automation (navigation, interaction, screenshots, extraction).

The local dev URL is `http://localhost:4173` — start the static server first if needed:

```bash
/usr/bin/python3 -m http.server 4173 --directory .
```

When using `playwright-cli` for repo UI verification, do not stop after one engine. Run the relevant flow in all three main browser engines:

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

## Model Availability

- `composer-2` family models are available only in Cursor. Do not configure them under `.claude/` or `.codex/`.
- For `.codex/agents/**`, use `gpt-5.4` by default. Do not use `gpt-5.3-codex` or `gpt-5.3-codex-spark`.
