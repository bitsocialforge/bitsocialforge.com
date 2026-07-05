---
name: refactor-pass
description: Perform a refactor pass focused on simplicity after recent changes. Use when the user asks for a refactor/cleanup pass, simplification, dead-code removal, or says "refactor pass".
---

# Refactor Pass

## Workflow

1. **Review recent changes** — identify simplification opportunities:
   - `git diff` for unstaged changes
   - `git diff --cached` for staged changes
   - `git log --oneline -5` for recent commits if no uncommitted changes

2. **Apply refactors** (in priority order):
   - Remove dead markup and CSS rules that no longer match any element
   - Straighten convoluted selectors and rule ordering
   - Remove redundant declarations already covered by inherited or shared rules
   - Consolidate duplicated declarations into shared rules or CSS variables

3. **Verify** — run the repo verification check:

   ```bash
   scripts/agent-hooks/verify.sh < /dev/null
   ```

4. **Optional suggestions** — identify abstractions or reusable patterns only if they clearly improve clarity. Keep suggestions brief; don't refactor speculatively.

## Project-Specific Patterns to Enforce

When refactoring, watch for these anti-patterns from AGENTS.md:

| Anti-pattern                                      | Refactor to                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hardcoded colors in rules or markup               | CSS variables defined at the top of `styles.css`                                          |
| Inline `style` attributes for reusable styling    | Classes in `styles.css` (per-element custom properties like the ember particles are fine) |
| Copy-pasted markup blocks                         | One shared class and consistent structure                                                 |
| Animation without a `prefers-reduced-motion` path | Add or preserve the reduced-motion fallback                                               |
| Generic `div`s for semantic content               | Semantic HTML (`section`, `nav`, `blockquote`, landmarks)                                 |

## Rules

- Don't change behavior — refactors must be semantically equivalent
- Don't introduce new dependencies, frameworks, or build tooling
- If verification fails after refactoring, fix it before finishing
