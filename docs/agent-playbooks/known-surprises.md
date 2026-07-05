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

### Preview/dev servers must use /usr/bin/python3, not a pyenv shim

- **Date:** 2026-07-05
- **Observed by:** Tommaso + Claude
- **Context:** Serving the site locally for browser verification (`python3 -m http.server`).
- **What was surprising:** A bare `python3` can resolve to a pyenv shim, and pyenv shims can fail in sandboxed shells with `getcwd: cannot access parent directories`, so the server never starts even though the command looks correct.
- **Impact:** Browser verification silently fails or blocks, and agents waste time debugging the site instead of the interpreter.
- **Mitigation:** Always start the local static server with the system interpreter: `/usr/bin/python3 -m http.server 4173 --directory .`.
- **Status:** confirmed
