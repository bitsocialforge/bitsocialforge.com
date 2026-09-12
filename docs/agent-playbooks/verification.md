# Verification

Select checks from the affected behavior and preserve explicit user, CI, and deployment requirements. Start with the narrowest reliable check. Reuse evidence for an unchanged final state; repeat after relevant edits, failures, or unresolved concerns.

| Change | Checks |
|---|---|
| Documentation, comments, wording | Review facts, links, and diff; no app build or server |
| AI tooling | `yarn ai-workflow:sync`, `yarn ai-workflow:check`, `yarn ai-workflow:test`; changed shell/Node script syntax |
| Isolated TypeScript logic | Focused behavior evidence, `yarn type-check`, relevant lint; broaden when integration risk remains |
| CSS/layout/theme | Affected browser layouts and theme, desktop and 375px mobile; build when CSS processing or asset wiring changes |
| Shared app, runtime dependencies, build/deployment config | `yarn agent:verify`, plus affected browser behavior |
| Package manifest | `corepack yarn install` and synchronized lockfile; distinguish tooling-only dev dependencies from app/runtime/build changes |

`yarn agent:verify` explicitly runs type checking, lint, build, local HTML/CSS asset checks, HTML shell structure checks, and verifies that public assets reached `dist`. It does not install dependencies, start a server, mutate Git, or run on stop. It needs the repository’s installed toolchain and `/usr/bin/python3` for the retained HTML/CSS checks.

For UI changes, use an isolated named Playwright session. Verify relevant interactions, console errors, failed local requests, keyboard/accessibility behavior, and responsive layout. Small localized changes can use Chromium; shared CSS, responsive layout, browser-sensitive APIs, broad interactions, and release verification use Chromium, Firefox, and WebKit sequentially. Use each engine for desktop and mobile before closing it. Stop only the exact session/server created by the task; never use global browser cleanup.

Confirm a compatible server belongs to this checkout before reusing it. Otherwise use `corepack yarn start` and the printed URL. A contributor’s current browser is reused only when explicitly requested. Do not start a server for documentation-only work.

One owner runs installs, builds, full checks, and browser work. Inspect existing processes first and never stop a process whose ownership is unclear. Format only task-owned files rather than running a repository-wide rewrite as a commit ritual.
