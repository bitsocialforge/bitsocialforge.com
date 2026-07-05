---
name: make-closed-issue
description: Create a GitHub issue from recent changes, commit only relevant diffs, and close the issue with the commit hash. Use when the user says "make closed issue", "close issue", or wants to create a tracked, already-resolved GitHub issue for completed work.
---

# Make Closed Issue

Creates a GitHub issue, commits relevant changes, and closes the issue with the commit hash — all in one workflow.

## Inputs

- What changed and why (from prior conversation context)
- Uncommitted or staged git changes in the working tree

## Workflow

### 1. Determine label(s)

Ask the user using AskQuestion (multi-select):

| Option                | When                                 |
| --------------------- | ------------------------------------ |
| `bug`                 | Bug fix                              |
| `enhancement`         | New feature                          |
| `bug` + `enhancement` | New feature that also fixes a bug    |
| `documentation`       | README, AGENTS.md, docs-only changes |

### 2. Review diffs for relevance

```bash
git status
git diff
git diff --cached
```

Identify which files relate to the work done in this conversation. Only relevant changes get committed. Unrelated files must be excluded from staging.

**Important**: `git add -p` and `git add -i` are not available (interactive mode unsupported). If a file has mixed relevant/irrelevant changes, include the entire file and note the caveat to the user.

### 3. Generate issue title and description

From the conversation context:

- **Title**: Short, present-tense, describes the **problem** (not the solution). Use backticks for UI elements, code, or literal strings (e.g. Hero `` `Follow @bitsocialforge` `` button overflows on mobile).
- **Description**: 2-3 sentences about the problem. Use backticks for UI element names (`Forge RPC`, `Master Plan`), code references (`.heat-rule`, `--ember`), and literal text strings. Write as if the issue hasn't been fixed yet.

### 4. Create the issue

```bash
gh issue create \
  --repo bitsocialforge/bitsocialforge.com \
  --title "ISSUE_TITLE" \
  --body "ISSUE_DESCRIPTION" \
  --label "LABEL1,LABEL2" \
  --assignee "@me"
```

Capture the issue number from the output.

### 5. Commit relevant changes

Stage only the relevant files:

```bash
git add index.html styles.css ...
```

Commit using Conventional Commits with scope:

```bash
git commit -m "$(cat <<'EOF'
type(scope): concise title

Optional 1-sentence description only if the title isn't self-explanatory.
EOF
)"
```

- **Types**: `fix`, `feat`, `perf`, `refactor`, `docs`, `chore`
- **Scope**: area of the site (e.g., `hero`, `master-plan`, `styles`, `deploy`)
- Prefer title-only commits — skip description when the title is exhaustive

### 6. Comment with commit hash and close

Use the **full** (40-character) commit hash, not the short form.

```bash
COMMIT_HASH=$(git rev-parse HEAD)
gh issue comment ISSUE_NUMBER --repo bitsocialforge/bitsocialforge.com --body "$COMMIT_HASH"
gh issue close ISSUE_NUMBER --repo bitsocialforge/bitsocialforge.com
```

### 7. Report summary

Print a summary to the user:

```
Issue #NUMBER created, committed, and closed.
  Commit: HASH
  Labels: label1, label2
  URL: https://github.com/bitsocialforge/bitsocialforge.com/issues/NUMBER
```
