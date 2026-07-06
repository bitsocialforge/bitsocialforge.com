# Commit and Issue Format

Use this when proposing or implementing meaningful code changes.

The committed `commit-format` and `issue-format` skills are the canonical, stricter templates with self-checks; prefer them when the harness loads skills. This playbook is the short fallback summary. Keep the two in sync.

## Commit Suggestion Format

- **Title:** Conventional Commits style with a required scope (`type(scope): description`), short, wrapped in backticks. The scope is a short human-readable area name, matching how this repo commits.
- Use `perf` (not `fix`) for performance optimizations.
- **Description:** Optional 2-3 informal sentences describing the solution. Concise, technical, no bullet points.

Example:

> **Commit title:** `fix(hero): prevent headline overflow on mobile`
>
> Lowered the `clamp()` floor for the hero `h1` in `styles.css` so the headline stays inside the viewport on small screens.

## GitHub Issue Suggestion Format

- **Title:** As short as possible, wrapped in backticks.
- **Description:** 2-3 informal sentences describing the problem (not the solution), as if still unresolved.

Example:

> **GitHub issue:**
>
> - **Title:** `Hero headline overflows on small screens`
> - **Description:** The hero headline wraps outside the viewport at 375px because the font-size floor is too large. Part of the text gets clipped on narrow phones.
