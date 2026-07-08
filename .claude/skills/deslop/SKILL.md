---
name: deslop
description: Scan recent changes for AI-generated code slop and remove it. Use when the user says "deslop", "remove slop", "clean up AI code", or asks to remove AI-generated artifacts from the codebase.
disable-model-invocation: true
---

# Remove AI Code Slop

Scan the diff against master and remove AI-generated slop introduced in this branch.

## Workflow

1. **Get the diff**

   ```bash
   git diff master...HEAD
   ```

   If there are also uncommitted changes, include them:

   ```bash
   git diff master
   ```

2. **Scan each changed file** for the slop categories below
3. **Fix** each instance — remove or rewrite to match the surrounding code style
4. **Verify** the site still works:
   ```bash
   scripts/agent-hooks/verify.sh < /dev/null
   ```
   For visual changes, also serve the site (`corepack yarn start`) and check the browser console for errors plus desktop and 375px mobile layouts.
5. **Report** a 1-3 sentence summary of what you changed

## Slop Categories

### Unnecessary comments

AI loves adding comments that restate the code. Remove comments that a human wouldn't write. Keep comments that explain _why_ — domain reasoning, constraints, trade-offs, or non-obvious intent.

```css
/* ❌ Slop — restates the code */
.hero {
  display: flex; /* use flexbox for layout */
}

/* ❌ Slop — obvious from context */
/* Style the call-to-action buttons */
.cta .btn { ... }

/* ✅ Keep — explains non-obvious intent */
/* clamp() floor keeps the h1 under 4 lines at 375px */
h1 { font-size: clamp(2.1rem, 8vw, 4.6rem); }
```

### Excessive defensive checks

This site is a small static React + TypeScript app. If a diff introduces component complexity, remove guards and state the surrounding code does not need — for example memoization, effects, or defensive wrappers around markup that is always rendered.

### Hardcoded values

AI hardcodes colors or font stacks instead of using the CSS variables defined at the top of `styles.css`. Replace hardcoded values with the existing variables.

### Inconsistent style

Any pattern that doesn't match the rest of the file: different naming conventions, different rule ordering, unnecessary abstractions, or overly verbose code where the file is concise.

### Over-engineering

AI tends to add unnecessary wrapper markup, redundant utility classes, or duplicated rules that obscure simple styling. If one rule can do the job, collapse the duplication.

## Judgment Call: When to Keep Comments

Comments are necessary when code expresses:

- Non-obvious intent or domain-specific reasoning
- Constraints that aren't apparent from the implementation
- Trade-offs or "why not X" decisions
- Workarounds with context on when they can be removed

When in doubt, check if similar code nearby has comments. Match the file's existing comment density.
