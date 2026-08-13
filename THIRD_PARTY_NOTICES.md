# Third-party notices

This repository includes third-party material under the original license terms
listed below. Those terms apply to the identified material instead of the
project-level GPL license.

## Repository-managed skills

The same skill packages are mirrored under `.claude/skills/`, `.codex/skills/`,
and `.cursor/skills/` so each supported agent toolchain receives identical
instructions.

| Material | Upstream project | License | Local license or notice |
| --- | --- | --- | --- |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 | Each mirrored package contains `LICENSE.txt`; a shared copy is in [`third_party/licenses/Apache-2.0.txt`](third_party/licenses/Apache-2.0.txt). |
| `find-skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills) | MIT | [`third_party/licenses/vercel-skills-MIT.txt`](third_party/licenses/vercel-skills-MIT.txt) |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | [`third_party/licenses/Apache-2.0.txt`](third_party/licenses/Apache-2.0.txt) and [`third_party/notices/impeccable-NOTICE.md`](third_party/notices/impeccable-NOTICE.md) |
| Impeccable's `reference/ios.md` and `reference/android.md` source material | [ehmo/platform-design-skills](https://github.com/ehmo/platform-design-skills) | MIT | [`third_party/licenses/platform-design-skills-MIT.txt`](third_party/licenses/platform-design-skills-MIT.txt) |
| Impeccable's bundled `scripts/modern-screenshot.umd.js` | [qq15725/modern-screenshot](https://github.com/qq15725/modern-screenshot) | MIT | [`third_party/licenses/modern-screenshot-MIT.txt`](third_party/licenses/modern-screenshot-MIT.txt) |

The mirrored packages may contain local integration changes. Their retained
upstream portions remain under the licenses above.

## Fonts

| Material | Upstream project | License | Local license |
| --- | --- | --- | --- |
| Exo | [Google Fonts: Exo](https://github.com/google/fonts/tree/main/ofl/exo) | SIL Open Font License 1.1 | [`public/fonts/LICENSE-exo.txt`](public/fonts/LICENSE-exo.txt) |
| Spline Sans Mono | [Google Fonts: Spline Sans Mono](https://github.com/google/fonts/tree/main/ofl/splinesansmono) | SIL Open Font License 1.1 | [`public/fonts/LICENSE-spline-sans-mono.txt`](public/fonts/LICENSE-spline-sans-mono.txt) |

Package dependencies that are installed from `yarn.lock` retain their own
licenses and copyright notices.
