# AGENTS.md

## Purpose

This file defines the always-on rules for AI agents working on bitsocialforge.com.
Use this as the default policy. Load linked playbooks only when their trigger condition applies.

## Surprise Handling

The role of this file is to reduce recurring agent mistakes and confusion points in this repository.
If you encounter something surprising or ambiguous while working, alert the developer immediately.
After confirmation, add a concise entry to `docs/agent-playbooks/known-surprises.md` so future agents avoid the same issue.
Only record items that are repo-specific, likely to recur, and have a concrete mitigation.

## Project Overview

bitsocialforge.com is the company website for **Bitsocial Forge Inc.**, the
infrastructure company executing Phase 1 of the Bitsocial master plan. It is a
static React + TypeScript site built with Vite, deployed on Vercel, with DNS on
Cloudflare.

- `index.html` — Vite HTML shell, metadata, and analytics bootstrap
- `src/` — React + TypeScript application code
- `styles.css` — global visual system and CSS variables
- `fonts/` — self-hosted woff2 fonts (Martian Mono, Spline Sans Mono) + `fonts.css`
- `public/` — passthrough files copied verbatim into the build (`robots.txt`, `sitemap.xml`, and `public/assets/` with logo, favicon, OG image)
- `package.json` / `yarn.lock` — Yarn-managed React/Vite/TypeScript toolchain
- `vite.config.ts` / `tsconfig.json` — Vite and TypeScript config
- `vercel.json` — Vite build + static hosting config

Related repos: `forge-rpc` (first product, private), `bitsocial-web` (protocol
landing/docs sites, public). The company is distinct from the open Bitsocial
protocol: Forge builds **convenience infrastructure, not the owner of the
protocol** — copy on the site must never blur that line.

## Brand and Content Rules

- Company name is **Bitsocial Forge Inc.** ("Bitsocial Forge" or "Forge" in running text). Never "BitSocial", "Bitsocial Labs", or "Plebbit Labs" (old name).
- Canonical handles: GitHub `github.com/bitsocialforge`, X `@bitsocialforge`. Product dashboard domain: `rpc.bitsocialforge.com`.
- Forge RPC is **in development** — do not present it as live, and do not hyperlink `rpc.bitsocialforge.com` until it launches.
- The visual identity is fixed: black background, forge-orange (`--ember: #FF6A00`) monospace type, and the seven-node lattice network logo (solid ember nodes joined by 30° connectors, no hexagon or other container shape, never the old black-on-white mark). The mark is always ember orange on black. All colors come from CSS variables in `styles.css`.
- Master-plan claims (phases, quotes) must match `bitsocial-web/about` content; do not invent roadmap items.

## Instruction Priority

- **MUST** rules are mandatory.
- **SHOULD** rules are strong defaults unless task context requires a different choice.
- If guidance conflicts, prefer: user request > MUST > SHOULD > playbooks.

## Agent Operating Principles

- Before editing, state important assumptions when the task is ambiguous. Ask instead of silently choosing between materially different interpretations.
- Prefer the smallest implementation that solves the requested problem. Do not add speculative abstractions, configurability, or features.
- Keep diffs surgical. Do not refactor, reformat, rename, or "improve" adjacent code unless it is necessary for the task.
- Clean up only artifacts created by the current change, such as newly unused styles or dead markup.
- For non-trivial work, define success criteria and verify them with the narrowest reliable checks before marking the task complete.

## LLM Knowledge Base Policy

Use compiled context for orientation, not as source of truth.

Source of truth:

- `src/**`, `index.html`, `styles.css`, `package.json`, Vite/TypeScript config, asset files, and runtime/live evidence when relevant.

Compiled context:

- `AGENTS.md`, `CLAUDE.md`, and repo-managed `.codex/`, `.cursor/`, and `.claude/` workflow files.
- `docs/agent-playbooks/**` and `docs/agent-playbooks/known-surprises.md`.

Agents may use compiled context to navigate quickly, but must verify against source files before making behavioral claims or edits.

## Task Router (Read First)

| Situation | Required action |
| --------- | --------------- |
| Frontend UI design, redesign, critique, audit, polish, layout, typography, color, motion, or visual hierarchy work | Use the `impeccable` skill (one entry point with design subcommands under `/impeccable`); for net-new pages or sections, use the `frontend-design` skill first |
| UI or visual behavior changed | Verify in a real browser (`corepack yarn start`) — check console errors, failed local asset requests, and mobile (375px) plus desktop layouts |
| Public-facing copy changed | Re-check the Brand and Content Rules above; keep `<title>`, meta description, and OG tags consistent with the new copy |
| New reviewable feature, fix, docs change, or chore started while on `master` | Create a short-lived `codex/feature/*`, `codex/fix/*`, `codex/docs/*`, or `codex/chore/*` branch from `master` before editing |
| New unrelated task started while another task branch is checked out | Create a separate worktree from `master` with a descriptive name; one active task branch per worktree |
| Open PR needs feedback triage or merge readiness check | Use the `review-and-merge-pr` skill |
| Before pushing or opening a PR | Run the advisory `code-quality-review` skill on the current diff; treat findings as suggestions, not blockers |
| Repo AI workflow files changed (`.codex/**`, `.cursor/**`, `.claude/**`, `AGENTS.md`, `docs/agent-playbooks/**`, `scripts/agent-hooks/**`) | Keep the Codex, Cursor, and Claude copies aligned when they represent the same workflow; run `node scripts/validate-ai-workflow.mjs`; update `AGENTS.md` if the default agent policy changes |
| GitHub operation needed | Use `gh` CLI, not GitHub MCP |
| User asks for commit or issue phrasing | Use `docs/agent-playbooks/commit-issue-format.md` |
| Bug report | Reproduce the reported behavior or establish the defect from conclusive source/runtime evidence before editing; for a specific file/line, also start with a git history scan (`git log --oneline`, `git blame`, scoped `git show`) |
| Surprising or ambiguous repo behavior encountered | Alert the developer and, once confirmed, document it in `docs/agent-playbooks/known-surprises.md` |

## Stack

- React 19 + TypeScript + Vite 8, managed with Yarn 4 (`nodeLinker: node-modules`) and Node 22.12.0 to stay close to 5chan and adjacent Bitsocial projects.
- TypeScript is the default for new source files. Use `.tsx` for React components and `.ts` for non-component code; do not add plain `.js` app code unless a dependency or platform boundary requires it.
- Keep the site a static client app: no backend runtime, no server-side rendering, no forms that submit data, no wallet integration, and no authentication in this repo.
- Self-hosted fonts only (`fonts/*.woff2` via `fonts/fonts.css`). No external CDNs, trackers, or analytics without an explicit user request.
- Vercel static hosting builds `dist` from Vite; every push to `master` on `bitsocialforge/bitsocialforge.com` auto-deploys production.
- Cloudflare DNS (DNS-scope API token lives outside the repo; never commit credentials).

## Core MUST Rules

### Frontend Rules

- Keep dependencies minimal and intentional. Do not add frameworks, routers, state libraries, CSS-in-JS, component libraries, analytics, or runtime services unless the task truly needs them.
- Keep `package.json`, `yarn.lock`, `.yarnrc.yml`, and Vite/TypeScript config in sync when the toolchain changes.
- Keep all styling in `styles.css` driven by the CSS variables at the top of the file. Do not hardcode colors in markup or introduce a parallel styling layer.
- Preserve `prefers-reduced-motion` fallbacks whenever you add or change animation.
- Keep the site fully self-contained: every `href`/`src` to a local asset must resolve to a file in the repo.
- Keep semantic HTML and accessibility affordances (landmarks, `aria-label`s, focus-visible styles, alt text) intact when editing React markup.

### Git Workflow Rules

- Keep `master` releasable — it deploys to production on every push. Do not treat `master` as a scratch branch.
- If the user asks for a reviewable feature or fix and the current branch is `master`, create a short-lived task branch before making code changes unless the user explicitly asks to work directly on `master`.
- Name short-lived AI task branches by intent under the Codex prefix: `codex/feature/*`, `codex/fix/*`, `codex/docs/*`, `codex/chore/*`.
- Open PRs from task branches into `master`. Never open PRs as draft unless the user explicitly asks.
- Use worktrees only when parallel tasks need isolated checkouts, with descriptive worktree names. One active task branch per worktree.

### Bug Investigation Rules

- A bug fix requires either a reproduction of the reported behavior or conclusive source/runtime evidence that identifies both the defect and the correct fix with equivalent certainty.
- If the bug cannot be reproduced and the evidence is not conclusive, do not guess or make speculative changes. Report what was checked, say that the bug was not reproduced, and ask for the missing reproduction details when useful.
- When proceeding from conclusive evidence without a reproduction, explain why the evidence is sufficient and add a targeted regression test when practical.

### Verification Rules

- Never mark work complete without verification.
- For code changes, run `corepack yarn install --immutable`, `corepack yarn type-check`, `corepack yarn lint`, and `corepack yarn build`.
- Serve the site locally with `corepack yarn start` and load it in a real browser.
- After UI changes, check: zero console errors, no failed local asset requests, desktop and 375px mobile layouts, and dark/ember theme integrity.
- If verification fails, fix and re-run until passing or until you hit a real blocker you can explain concretely.

### Tooling Constraints

- Use `gh` CLI for GitHub work. Do not use GitHub MCP.
- If many MCP tools are present in context, warn the user and suggest disabling the unused ones.

### AI Tooling Rules

- Treat `.codex/`, `.cursor/`, and `.claude/` as repo-managed contributor tooling, not private scratch space.
- Do not add or use a repo-level `.agents/` directory. Keep skills in `.codex/skills/`, `.cursor/skills/`, and `.claude/skills/` only.
- Keep equivalent workflow files aligned across all toolchains when their directories contain the same skill, hook, or agent.
- Keep shared behavior equivalent while preserving harness-specific models, config formats, hook entry points, and tool invocation syntax.
- Codex does not document a `latest` model alias. Every committed custom-agent TOML under `.codex/**/agents/*.toml` must omit both `model` and `model_reasoning_effort` so the agent inherits the current parent session settings; keep explicit model controls in other toolchains and tool APIs harness-specific.
- Hook entry points are harness-specific: the `hooks` key in `.claude/settings.json` (Claude Code does not read a standalone hooks.json), `.cursor/hooks.json`, and `.codex/hooks.json`.
- Review `.codex/config.toml`, `.codex/hooks.json`, `.cursor/hooks.json`, and `.claude/settings.json` before changing agent orchestration or hook behavior, because they are the entry points contributors will actually load.

### Security and Boundaries

- Never commit secrets or API keys. Cloudflare and Vercel credentials live outside the repo.
- Never push to a remote unless the user explicitly asks.
- Do not add backend services, forms that submit data, wallet integration, or authentication to this repo — it is a static marketing site.

## Core SHOULD Rules

- Keep context lean: delegate heavy or verbose tasks when possible.
- For complex work, parallelize independent checks.
- When proposing or implementing meaningful code changes, include both a Conventional Commit title suggestion and a short GitHub issue suggestion, using `docs/agent-playbooks/commit-issue-format.md`.
- When stuck on a bug, search the web for recent fixes or workarounds.
- After user corrections, identify the root cause and apply the lesson in subsequent steps.

## Local Development

```bash
corepack enable
corepack yarn install
corepack yarn start   # http://localhost:4173
```

Edit React code in `src/` and shared styles in `styles.css`.

AI workflow parity check:

```bash
node scripts/validate-ai-workflow.mjs
```

## Playbooks (Load On Demand)

Use these only when relevant to the active task:

- Hooks setup and scripts: `docs/agent-playbooks/hooks-setup.md`
- Commit and issue output format: `docs/agent-playbooks/commit-issue-format.md`
- Skills/tools setup, MCP rationale, and committed skills/subagents index: `docs/agent-playbooks/skills-and-tools.md`
- Bug investigation workflow: `docs/agent-playbooks/bug-investigation.md`
- Deployment (Vercel + Cloudflare): `docs/agent-playbooks/deployment.md`
- Known surprises log: `docs/agent-playbooks/known-surprises.md`
