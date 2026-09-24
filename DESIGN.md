# DESIGN.md

## Aesthetic Direction

Amber-phosphor terminal meets blacksmith forge. A near-black, warm-tinted
surface lit from below by furnace glow, with all type in monospace and all
color in the ember-orange family. Committed color strategy: orange carries the
page; there are no cool tones anywhere.

## Color (CSS variables in styles.css)

- `--bg: #050302` — near-black, warm tinted (never pure #000)
- `--bg-raised: #0d0704` — raised panels
- `--ember: #ff6a00` — primary accent: headings, links, logo strokes, markers
- `--ember-hot: #ffa14d` — hover states, inline code, highlights
- `--white-hot: #ffd9ad` — strongest text: display headings, card titles
- `--text: #d99a63` — body copy (warm amber, readable on black)
- `--text-dim: #8f5f36` — labels, secondary text
- `--line: rgba(255,106,0,.22)` / `--line-dim: rgba(255,106,0,.12)` — borders

Heat metaphor governs intensity: hotter = brighter = more important
(dim → text → ember → white-hot).

## Typography

- Display: Martian Mono (700/800), uppercase, tight leading — headings,
  buttons, phase tags. Industrial, wide, load-bearing.
- Body: Spline Sans Mono (400/500/600) — everything else.
- Both self-hosted in `fonts/` (latin subset woff2). Never add remote fonts.
- Body max width ~65ch. Hierarchy via scale and heat, not new fonts.

## Signature Elements

- Logo: rounded hexagon containing a 7-node network graph, hollow circles,
  orange strokes only, no fills. Lines are trimmed at circle edges so nodes
  stay hollow. Inline SVG in header/footer, standalone in `public/assets/`.
- Heat-rule dividers: horizontal 1px gradient (dark red → ember → white-hot
  center), like heated steel.
- Rising ember particles: fixed-position CSS-only animation, subtle, disabled
  under `prefers-reduced-motion`.
- Scanline overlay + furnace glow at viewport bottom: atmosphere, kept faint.
- Terminal window with prompt lines and blinking block cursor.
- Timeline markers: hollow circles echoing the logo nodes; the active phase is
  filled and glowing.

## Motion

- CSS-only. Blink (steps), ember rise (linear), staggered terminal line
  reveals (animation-delay). Ease-out for hover transitions.
- Everything decorative is `aria-hidden` and gated by `prefers-reduced-motion`.

## Layout

- Single column, max-width 1060px, generous vertical rhythm (~96px sections).
- Section headers: display heading + optional status badge. No index numbers:
  the sections are not a sequence.
- Mobile (≤760px): single column, nav links hidden, grid collapses.

## Hard Rules

- Black background, orange monospace type. No cool colors, no white surfaces.
- Keep the app static and self-contained: no external assets, CDNs, new trackers, backend runtime, authentication, or data-submitting forms. Existing Vercel analytics is the only approved deployment telemetry.
- React components should stay typed with TypeScript and preserve the semantic structure of the page.
- Never restyle the logo as solid/filled; hollow strokes only.
