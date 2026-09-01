# WRFrontiersDB-Design

Shared design system for the WRFrontiersDB family - the single source of truth for
design tokens (colors, typography, spacing, radius, motion) and the self-hosted brand
font (Montserrat). Consumed by:

- [WRFrontiersDB-Site](https://github.com/Surxe/WRFrontiersDB-Site)
- [WRFrontiers-Discount-Visualizer](https://github.com/Surxe/WRFrontiers-Discount-Visualizer)

Both pull this repo in as a git submodule so the two sites stay visually in sync while
remaining separately deployed. Longer term the sites may merge; this repo is structured
so that becomes a folder move, not a rewrite.

## Contents

| File | Purpose |
| --- | --- |
| `index.css` | Entry point - `@import`s fonts, tokens, then elements. Import this. |
| `design-tokens.css` | `:root` custom properties (`--wrf-*`) - the unified palette + scale. |
| `elements.css` | Shared element styles - links, buttons (`.wrf-btn`), toggles (`.wrf-toggle`), tooltips (`.wrf-tooltip`), form controls, focus, scrollbars, selection. |
| `fonts.css` | `@font-face` for self-hosted Montserrat 400/500/700. |
| `fonts/` | Vendored Montserrat `.woff2` (latin subset). |
| `OFL.txt` | SIL Open Font License 1.1 for Montserrat. |

Plain CSS only - no preprocessor syntax - so it works whether a consumer bundles it
(Astro/Vite ESM `import`) or links it directly.

## Consuming it

1. Add the submodule (path is the consumer's choice; keep it inside the Astro project
   root so Vite can resolve `import`s):

   ```sh
   # Site (Astro at repo root)
   git submodule add https://github.com/Surxe/WRFrontiersDB-Design vendor/wrf-design
   # Visualizer (Astro under src/frontend)
   git submodule add https://github.com/Surxe/WRFrontiersDB-Design src/frontend/vendor/wrf-design
   ```

2. Import the entry stylesheet from the base layout / every HTML entry point:

   ```astro
   ---
   import '../../vendor/wrf-design/index.css';
   ---
   ```

3. Use the tokens instead of raw hex:

   ```css
   a { color: var(--wrf-link); }
   .card { background: var(--wrf-surface); border: 1px solid var(--wrf-border); }
   body { font-family: var(--wrf-font-sans); }
   ```

4. CI must check out submodules. With `actions/checkout`:

   ```yaml
   - uses: actions/checkout@v4
     with:
       submodules: recursive
   ```

   Fresh local clones: `git submodule update --init --recursive`.

## Tooltip positioning script (`.wrf-tooltip`)

`.wrf-tooltip__bubble` is `position: fixed` so it escapes any `overflow` ancestor.
It is placed by a tiny script. This repo hosts **CSS only**, so each consumer ships
an identical copy of the script below (site: `public/js/wrf-tooltip.js`; visualizer:
`src/frontend/src/scripts/wrf-tooltip.js`) and keeps it in sync with this canonical
source. Any page using `.wrf-tooltip` must load it.

```js
// Positions .wrf-tooltip__bubble above its icon and nudges it back inside the
// viewport near an edge. Mirror of WRFrontiersDB-Design/README.md - keep in sync.
const MARGIN = 8;

function placeBubble(tip) {
  const bubble = tip.querySelector('.wrf-tooltip__bubble');
  if (!bubble) return;
  const icon = tip.getBoundingClientRect();
  bubble.style.setProperty('--tt-shift', '0px');
  bubble.style.left = `${icon.left + icon.width / 2}px`;
  bubble.style.top = `${icon.top}px`;
  const rect = bubble.getBoundingClientRect();
  let shift = 0;
  if (rect.right > window.innerWidth - MARGIN) {
    shift = -(rect.right - (window.innerWidth - MARGIN));
  } else if (rect.left < MARGIN) {
    shift = MARGIN - rect.left;
  }
  if (shift !== 0) bubble.style.setProperty('--tt-shift', `${shift}px`);
}

function handle(e) {
  const tip = e.target && e.target.closest && e.target.closest('.wrf-tooltip');
  if (tip) placeBubble(tip);
}

document.addEventListener('mouseover', handle);
document.addEventListener('focusin', handle);
```

## Tokens

See `design-tokens.css` for the authoritative list. Groups: surfaces (`--wrf-bg`,
`--wrf-surface`, `--wrf-surface-2`, `--wrf-border`), text (`--wrf-text`,
`--wrf-text-muted`), accent (`--wrf-accent`, `--wrf-accent-hover`,
`--wrf-accent-active-bg`), semantic (`--wrf-success`, `--wrf-warning`, `--wrf-danger`),
links (`--wrf-link`, `--wrf-link-underline`, `--wrf-link-hover`), typography
(`--wrf-font-sans`, `--wrf-font-mono`), shape/motion (`--wrf-radius-*`,
`--wrf-transition`).

## Updating shared styles

1. Commit and push a change here.
2. In each consuming repo, bump the submodule pointer:

   ```sh
   git -C vendor/wrf-design pull origin main
   git add vendor/wrf-design && git commit -m "Bump wrf-design"
   ```
