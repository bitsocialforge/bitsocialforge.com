# Commit and Issue Format

Use this when proposing or implementing meaningful code changes.

## Commit Suggestion Format

- **Title:** Conventional Commits style, short, wrapped in backticks.
- Use `perf` (not `fix`) for performance optimizations.
- **Description:** Optional 2-3 informal sentences describing the solution. Concise, technical, no bullet points.

Example:

> **Commit title:** `fix(hero): prevent headline overflow on 375px screens`
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
