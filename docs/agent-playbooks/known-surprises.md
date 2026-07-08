# Known Surprises

This file tracks repository-specific confusion points that caused agent mistakes.

## Entry Criteria

Add an entry only if all are true:

- It is specific to this repository (not generic advice).
- It is likely to recur for future agents.
- It has a concrete mitigation that can be followed.

If uncertain, ask the developer before adding an entry.

## Entry Template

```md
### [Short title]

- **Date:** YYYY-MM-DD
- **Observed by:** agent name or contributor
- **Context:** where/when it happened
- **What was surprising:** concrete unexpected behavior
- **Impact:** what went wrong or could go wrong
- **Mitigation:** exact step future agents should take
- **Status:** confirmed | superseded
```

## Entries

### Static preview server advice is superseded by Vite

- **Date:** 2026-07-05
- **Observed by:** Tommaso + Claude
- **Context:** Before the React/Vite migration, browser verification used `python3 -m http.server`.
- **What was surprising:** A bare `python3` could resolve to a pyenv shim and fail in sandboxed shells with `getcwd: cannot access parent directories`, so the server never started even though the command looked correct.
- **Impact:** This is no longer the normal dev-server path after the Vite migration, but old instructions may still mention the static server.
- **Mitigation:** Use `corepack yarn start` for local browser verification. If a one-off Python static server is ever needed for historical artifacts, use `/usr/bin/python3`, not a pyenv shim.
- **Status:** superseded
