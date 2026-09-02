# WRFrontiersDB-Design

Shared design system for the WRFrontiersDB family - the single source of truth for
design tokens (colors, typography, spacing, radius, motion) and the self-hosted brand
font (Montserrat). Consumed by:

- [WRFrontiersDB-Site](https://github.com/Surxe/WRFrontiersDB-Site)
- [WRFrontiers-Discount-Visualizer](https://github.com/Surxe/WRFrontiers-Discount-Visualizer)

Both pull this repo in as a git submodule so the two sites stay visually in sync while
remaining separately deployed. Longer term the sites may merge; this repo is structured
so that becomes a folder move, not a rewrite.

The human-readable **[Style Guide](./STYLE-GUIDE.md)** documents the palette, typography,
and reusable elements. This README covers consuming the submodule, the local dev loop, and
how a change reaches the live sites.

## Contents

| File | Purpose |
| --- | --- |
| `index.css` | Entry point - `@import`s fonts, tokens, then elements. Import this. |
| `design-tokens.css` | `:root` custom properties (`--wrf-*`) - the unified palette + scale. |
| `elements.css` | Shared element styles - links, buttons (`.wrf-btn`), toggles (`.wrf-toggle`), tooltips (`.wrf-tooltip`), form controls, focus, scrollbars, selection. |
| `fonts.css` | `@font-face` for self-hosted Montserrat 400/500/700. |
| `fonts/` | Vendored Montserrat `.woff2` (latin subset). |
| `lint-styles.cjs` | Zero-dep style linter - flags raw chrome hex in a consumer's CSS. |
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

## Linting consumer styles (`lint-styles.cjs`)

A zero-dependency Node script (Node >= 16) that guards the "use tokens, not raw
chrome hex" rule in a consumer. It scans `.css` files and the `<style>` blocks of
`.astro` files, and flags any hex color literal that is not on that consumer's
DOMAIN-color allow list. It lives here so the rule has a single source of truth;
each consumer supplies a small `.wrf-lint.json` for its own domain colors and
paths. Run it from the consumer's repo root:

```sh
node <submodule-path>/lint-styles.cjs --config .wrf-lint.json
```

Config (`.wrf-lint.json`):

```json
{
  "roots": ["src"],
  "extensions": [".astro", ".css"],
  "excludeDirs": ["vendor", "dist"],
  "allow": ["#5865f2", "#fff176"]
}
```

- `roots` - dirs to scan (relative to the repo root). `extensions` and
  `excludeDirs` are optional (`vendor`, `node_modules`, `dist`, `.astro`, `.git`
  are always excluded, so the submodule's own token file is never scanned).
- `allow` - the DOMAIN colors that intentionally stay raw (rarity / faction /
  talent / savings greens / brand blurple / gradient stops). 3- and 6-digit forms
  match interchangeably.
- **Inline escape:** a hex on a line whose comment contains `wrf-allow-hex` is
  ignored, for a genuine one-off.

Exits non-zero with `file:line` for each violation. Wire it into CI as a
pull-request check (each consumer adds an npm script + workflow step).

Scope note: it scans `<style>` blocks and `.css`, not inline `style="..."`
attributes or hex inside JS/TS - keep chrome colors out of those by convention.

## Local development & testing

You do **not** need CI (or even a submodule pointer bump) to *test* a change to the shared
CSS. Both consumers import this repo's CSS as a relative ESM import
(`import '.../vendor/wrf-design/index.css'`) straight into their Vite module graph - there
is no copy-into-`public/` step - so **editing a file in the submodule checkout hot-reloads
live in the consumer's dev server.** The pinned submodule SHA and CI only decide what a
*fresh clone* builds; a local dev server reads your working tree.

The loop (pick the consumer you want to see the change in):

1. **Branch inside the submodule checkout first**, so edits are committable and not lost.
   The submodule is checked out at the pinned SHA (detached HEAD):

   ```sh
   cd vendor/wrf-design         # or src/frontend/vendor/wrf-design in the visualizer
   git switch -c my-change
   ```

2. **Edit the CSS** here (`elements.css`, `design-tokens.css`, ...).

3. **Run that consumer's dev server** from the consumer's project root and verify by HMR:
   - **WRFrontiersDB-Site**: use its `run-dev-server` skill (Astro dev at repo root).
   - **WRFrontiers-Discount-Visualizer**: `npm run dev` in `src/frontend`.

   A `npm run build` in the consumer is a good non-visual smoke test that everything still
   resolves and bundles.

**Gotcha - independent checkouts.** WRFrontiersDB-Site and WRFrontiers-Discount-Visualizer
hold *separate* submodule working copies; editing one does not touch the other. To compare
the change in both, push your branch and check it out in the other consumer's submodule
(`git -C <its-submodule-path> fetch && git switch my-change`), then run its dev server.

## Shipping a change (how it reaches the live sites)

This repo has **no deploy of its own** - it is a CSS/asset library, and each consumer pins
it to a specific commit (a gitlink SHA). Merging here does **not** change either live site.
Propagation is an explicit 3-step chain:

1. **Merge** the change here (PR → `main`).
2. **Bump the submodule pointer in EACH consumer** and commit the new gitlink, via a PR:

   ```sh
   git -C vendor/wrf-design pull origin main      # or src/frontend/vendor/wrf-design
   git add vendor/wrf-design && git commit -m "Bump wrf-design"
   ```

   Until this lands, that consumer keeps building against the OLD pinned commit.
3. **Redeploy the consumer** - and the two differ:
   - **WRFrontiersDB-Site** auto-deploys on push to `main`. Its PR base is `dev`, so the
     bump must still be promoted `dev` → `main` to go live.
   - **WRFrontiers-Discount-Visualizer** deploys **only** via a manual `workflow_dispatch`
     (Actions tab / `gh workflow run`). Merging to `main` does not deploy it.

CI in both consumers already checks out submodules recursively, so whatever SHA is pinned
is what gets built. When the two consumers eventually merge, steps 1-2 collapse into one
ordinary commit.
