# AGENTS.md

## Project Overview

bitsocialforge.com is the company website for **Bitsocial Forge Inc.**, the
infrastructure company executing Phase 1 of the Bitsocial master plan. It is a
static React + TypeScript site built with Vite, deployed on Vercel, with DNS on
Cloudflare.

- `index.html` — Vite HTML shell, metadata, and analytics bootstrap
- `src/` — React + TypeScript application code
- `styles.css` — global visual system and CSS variables
- `fonts/` — self-hosted woff2 fonts (Exo, Spline Sans Mono) + `fonts.css`
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

## Working principles

- Explicit user instructions take precedence over repository workflow defaults. Continue authorized work through implementation, relevant verification, and fixes; stop at the requested boundary.
- Use source, tests, manifests, decision records, and runtime evidence to establish behavior. Agent instructions and generated context are orientation, not proof.
- Keep diffs scoped and preserve unrelated edits. Prefer existing code and platform capabilities before adding dependencies or abstractions.
- Define completion for non-trivial changes and verify the affected behavior. For a bug tied to a file or line, inspect relevant `git log`/`git blame` and `git show`; see [bug-investigation.md](docs/agent-playbooks/bug-investigation.md).
- Use existing evidence before adding runtime instrumentation. Remove task-owned instrumentation after verification; never erase someone else’s logs.
- Report unexpected repository issues and continue independent work. Record only confirmed recurring issues with a concrete mitigation in [known-surprises.md](docs/agent-playbooks/known-surprises.md).

## Git and ownership

- Keep `master` releasable. Use a short-lived `codex/feature/*`, `codex/fix/*`, `codex/docs/*`, or `codex/chore/*` branch unless the user requests otherwise.
- For an unrelated task while another branch is active, use a descriptive separate worktree from `master`. Never switch branches beneath another agent.
- Stage only task-owned changes; use selective index patches for mixed files. Preserve unrelated staging, artifacts, and work.
- Commit, push, publish, and merge only within the user’s authorization. Already granted authorization persists through necessary steps. Never commit secrets or build output.
- When a PR is requested, target `master` and make it ready for review. After an authorized merge, clean up only the exact verified merged branch/worktree with no later or unrelated work. No Git cleanup in lifecycle hooks.
- Use `gh` for GitHub operations. Pass multiline bodies via `--body-file`, not shell-interpolated strings. Provide commit/issue suggestions only when requested; see [commit-issue-format.md](docs/agent-playbooks/commit-issue-format.md).

## Skills, tools, and delegation

- Shared skills live in `.agents/skills/`; `.agents/roles/` is this repository’s generator source format. The generator writes native `.claude/skills/`, `.codex/agents/*.toml`, and `.cursor/agents/*.md` / `.claude/agents/*.md`. See [skills-and-tools.md](docs/agent-playbooks/skills-and-tools.md).
- Omit model and reasoning fields from committed skills and roles. Let the app, user settings, and supported runtime overrides choose or inherit them. Do not invent a universal “latest” alias.
- Keep harness-specific permissions, hooks, and metadata explicit. Equal content does not prove equal runtime behavior.
- Delegate substantial independent work when it improves speed, context isolation, or review. Small and coupled changes can remain local; use built-in workers where available instead of a compulsory specialist chain.
- Give each child its scope, acceptance criteria, relevant context, non-overlapping file ownership, and evidence to return. For independent review, omit the parent’s verdict. Use at most four active workers by default.
- One agent owns heavyweight verification. Serialize dependency installs, builds, full suites, and browser work across the task. Inspect processes first; stop only stale processes owned by this task.
- Review the final task-owned diff. Use `code-quality-review` for non-trivial changes or an explicit review; apply high-confidence fixes within existing authorization.
- Prefer existing CLIs and installed source; use official documentation when versions matter. Search for or install skills only when requested. Keep tool catalogs relevant; adjust unused integrations when their overhead is observable.
- Hooks only format affected JS/TS files with the installed formatter. Installation, verification, and Git operations are explicit task steps, never edit/stop/session-start side effects.

## Task router

| Change | Guidance and verification |
|---|---|
| Design, layout, typography, color, or motion | Use relevant `impeccable` guidance; for new surfaces, use `frontend-design`. Preserve the Brand and Content Rules above |
| UI behavior or layout | Check the affected flow in an isolated browser, console, local assets, desktop and 375px mobile; choose engines using [verification.md](docs/agent-playbooks/verification.md) |
| Public copy | Recheck brand/product claims and keep title, meta description, and OG text consistent |
| Code, automation, or build | Select affected checks using [verification.md](docs/agent-playbooks/verification.md); `yarn agent:verify` is the explicit integration pass |
| `package.json` | Run `corepack yarn install` and include `yarn.lock` |
| AI workflow files | Edit shared sources; run `yarn ai-workflow:sync`, `yarn ai-workflow:check`, and `yarn ai-workflow:test` |
| PR feedback/readiness | Use `review-and-merge-pr` within the requested scope |
| Hosting or DNS | Read [deployment.md](docs/agent-playbooks/deployment.md); credentials stay outside the repository |

## Stack

- React 19 + TypeScript + Vite 8, managed with Yarn 4 (`nodeLinker: node-modules`) and Node 22.12.0 to stay close to 5chan and adjacent Bitsocial projects.
- TypeScript is the default for new source files. Use `.tsx` for React components and `.ts` for non-component code; do not add plain `.js` app code unless a dependency or platform boundary requires it.
- Keep the site a static client app: no backend runtime, no server-side rendering, no forms that submit data, no wallet integration, and no authentication in this repo.
- Self-hosted fonts only (`fonts/*.woff2` via `fonts/fonts.css`). No external CDNs, trackers, or analytics without an explicit user request.
- Vercel static hosting builds `dist` from Vite; every push to `master` on `bitsocialforge/bitsocialforge.com` auto-deploys production.
- Cloudflare DNS (DNS-scope API token lives outside the repo; never commit credentials).

## Source and design constraints

- Keep dependencies minimal and intentional. Do not add frameworks, routers, state libraries, CSS-in-JS, component libraries, analytics, or runtime services unless the task truly needs them.
- Keep `package.json`, `yarn.lock`, `.yarnrc.yml`, and Vite/TypeScript config in sync when the toolchain changes.
- Keep all styling in `styles.css` driven by the CSS variables at the top of the file. Do not hardcode colors in markup or introduce a parallel styling layer.
- Preserve `prefers-reduced-motion` fallbacks whenever you add or change animation.
- Keep the site fully self-contained: every `href`/`src` to a local asset must resolve to a file in the repo.
- Keep semantic HTML and accessibility affordances (landmarks, `aria-label`s, focus-visible styles, alt text) intact when editing React markup.

## Local commands and playbooks

Use Corepack-managed Yarn 4 with exact dependency versions. Local development: `corepack yarn install`, then `corepack yarn start`. Confirm the launcher’s printed URL; direct Vite uses port 4173. Never start a server for documentation-only work.

Common checks: `yarn type-check`, `yarn lint`, `yarn build`, `yarn agent:verify`, `yarn ai-workflow:sync`, `yarn ai-workflow:check`, `yarn ai-workflow:test`. Format only task-owned files with installed oxfmt.

Read details on demand: [verification](docs/agent-playbooks/verification.md), [hooks](docs/agent-playbooks/hooks-setup.md), [skills/tools](docs/agent-playbooks/skills-and-tools.md), [deployment](docs/agent-playbooks/deployment.md).
