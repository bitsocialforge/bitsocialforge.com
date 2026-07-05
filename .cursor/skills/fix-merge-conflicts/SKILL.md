---
name: fix-merge-conflicts
description: Resolve all merge conflicts on the current branch non-interactively, validate the build, and commit. Use when the user says "fix merge conflicts", "resolve conflicts", or when git status shows conflicting files.
disable-model-invocation: true
---

# Fix Merge Conflicts

Resolve all merge conflicts on the current branch non-interactively and leave the repo buildable.

## Constraints

- Do not ask the user for input. Make best-effort decisions and explain them in a summary.
- Prefer minimal changes that preserve both sides' intent.
- Do not push or tag — only commit locally.

## Workflow

### 1. Detect conflicts

```bash
git status --porcelain
```

Collect files with `U` statuses or containing `<<<<<<<` / `=======` / `>>>>>>>` markers.

### 2. Resolve conflicts per file

Open each conflicting file and remove conflict markers. Merge both sides logically when feasible.

**When sides are mutually exclusive**, pick the variant that:

1. Keeps the site valid (local asset references resolve, HTML structure intact)
2. Preserves existing behavior and visuals

**File-type strategies:**

| File type                       | Strategy                                                       |
| ------------------------------- | -------------------------------------------------------------- |
| `index.html` / `styles.css`     | Merge both sides logically; keep CSS variables and semantics   |
| Config files (`.json`, `.yaml`) | Preserve union of safe settings; don't delete required fields  |
| Markdown / text                 | Include both unique sections, deduplicate headings             |
| Binary files                    | Prefer current branch (ours)                                   |
| Generated / build artifacts     | Prefer current branch (ours), or regenerate                    |

### 3. Validate

Run the repo verification check. Fix any failures before proceeding.

```bash
scripts/agent-hooks/verify.sh < /dev/null
```

### 4. Verify no remaining markers

```bash
rg '<<<<<<<|=======|>>>>>>>' --type html --type css --type json --type md
```

If any markers remain, go back and resolve them.

### 5. Finalize

```bash
git add -A
git commit -m "chore: resolve merge conflicts"
```

## Operational Guidance

- If a resolution is ambiguous and breaks verification, prefer the variant that passes.
- For large refactors causing conflicts, keep class names, CSS variables, and section structure consistent.
- Keep edits minimal — don't reformat unrelated code.

## Deliverables

- Clean working tree with all conflicts resolved
- Passing `scripts/agent-hooks/verify.sh`
- One local commit: `chore: resolve merge conflicts`
- Brief summary of files touched and notable resolution choices
