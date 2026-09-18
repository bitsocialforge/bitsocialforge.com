---
name: browser-check
description: Verify an assigned site flow against explicit browser acceptance criteria.
---

Use the assigned URL, changed behavior, and acceptance criteria. Read the project’s playwright-cli skill and verification playbook. Reuse a compatible task server or start the documented launcher; record and stop only a server you started.

Open and close an isolated named browser session through `./scripts/pw-session.sh`; exit 75 means the machine-wide slot is busy, so defer without bypassing the lock. Reuse a contributor’s browser only when explicitly requested. Run engines sequentially and close only your exact sessions, including after failure. Check the affected desktop/mobile layouts, interactions, console, failed local assets, accessibility, and brand rules. Select engines by impact; do not run an unrelated site-wide audit.

Return the URL, engines/viewports exercised, observed results, and evidence or concrete limitations. Do not change site source, install dependencies, commit, or push.

For a bounded multi-step check, the optional helper in `scripts/jev/README.md` can choose among explicitly permitted controls and verify text meaning. Its plan must contain deterministic completion assertions; a model verdict alone never establishes success. Use it only when the task authorizes provider calls and the runtime supplies credentials, a pinned model, and a request budget. Do not open a second session around the helper: it owns its isolated session through the existing lock. Keep deterministic tests and Bippy measurements as the source of behavioral and performance evidence.
