# WRFrontiersDB Style Guide

The canonical visual style guide for the WRFrontiersDB family. It documents the shared
palette, typography, and reusable UI elements that both consumers render identically:

- **WRFrontiersDB-Site**
- **WRFrontiers-Discount-Visualizer**

Both pull this repo (WRFrontiersDB-Design) in as a git submodule and import `index.css`,
so everything here is the single source of truth. Each consumer additionally keeps a thin
`docs/style-guide.md` that points here and adds only repo-specific notes (delivery model,
where component CSS lives).

For **how to consume the submodule, the local dev/testing loop, and how a change reaches
the live sites**, see [`README.md`](./README.md). For agents: load the `styling` skill in
either consumer before writing or editing any CSS.

The authoritative values live in [`design-tokens.css`](./design-tokens.css) and
[`elements.css`](./elements.css); this guide is the human-readable companion. When they
disagree, the CSS wins - fix this doc.

---

## Principles

- **Use tokens, not raw hex.** Every chrome color, font, radius, and transition resolves
  through a `var(--wrf-*)`. A raw hex value in component CSS is a lint-flaggable exception.
- **Reuse the shared elements.** Links, buttons, toggles, tooltips, form controls, focus
  rings, scrollbars, and selection are defined here once. Add the class; don't hand-roll.
- **Domain colors stay raw, on purpose.** Meaningful, data-driven colors - rarity / faction
  / talent swatches, savings greens, Discord blurple, OG-card gradients - are NOT chrome
  and are intentionally left as raw hex in each consumer. They are out of scope for tokens.

---

## Palette

The unified WRF theme: cyan accent on charcoal. All values are tokens in
`design-tokens.css`.

### Surfaces

| Token | Hex | Role |
| --- | --- | --- |
| `--wrf-bg` | `#1a1a1a` | Page background |
| `--wrf-surface` | `#2a2a2a` | Cards, inputs, cells |
| `--wrf-surface-2` | `#333333` | Raised: table header, tooltip bubble |
| `--wrf-border` | `#444444` | Hairlines, input borders |

### Text

| Token | Hex | Role |
| --- | --- | --- |
| `--wrf-text` | `#ffffff` | Primary text |
| `--wrf-text-muted` | `#999999` | Secondary text, labels, disabled |

### Accent (cyan)

| Token | Value | Role |
| --- | --- | --- |
| `--wrf-accent` | `#4fc3f7` | Links (hover), primary buttons, active states, focus ring |
| `--wrf-accent-hover` | `#29b6f6` | Hover on accent surfaces |
| `--wrf-accent-active-bg` | `rgba(79,195,247,.1)` | Tint behind active/selected rows |

### Semantic

| Token | Hex | Role |
| --- | --- | --- |
| `--wrf-success` | `#81c784` | Positive / confirmed |
| `--wrf-warning` | `#ffc107` | Caution |
| `--wrf-danger` | `#ef233c` | Error / destructive |

---

## Typography

Montserrat, **self-hosted** (weights 400 / 500 / 700) via `fonts.css` - no Google Fonts
request. Consumers set `font-family: var(--wrf-font-sans)` on the body.

| Token | Stack |
| --- | --- |
| `--wrf-font-sans` | `'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif` |
| `--wrf-font-mono` | `'Monaco', 'Menlo', 'Ubuntu Mono', monospace` |

Use the mono stack for numeric/tabular values (e.g. calculator totals).

---

## Elements

The reused vocabulary. Global rules (`a`, form controls, focus, scrollbar, selection)
apply on their own; buttons, toggles, and tooltips are opt-in classes you add in markup.

### Links / hrefs — dotted underline

Global `a` styling. A link is text-colored with a **muted dotted underline**; on hover it
turns to the accent (both text and underline). No separate `:visited` treatment.

```
color: var(--wrf-link);                     /* = --wrf-text */
border-bottom: 1px dotted var(--wrf-link-underline);  /* = --wrf-text-muted */
/* hover */
color / border-bottom-color: var(--wrf-link-hover);   /* = --wrf-accent */
```

Tokens: `--wrf-link`, `--wrf-link-underline`, `--wrf-link-hover`. A button that is an
`<a>` overrides the dotted underline via `.wrf-btn`.

### Buttons — `.wrf-btn`

Base class `.wrf-btn` + one variant. Filled/pill shape, `--wrf-radius-md`, scales slightly
on `:active`.

| Class | Look | Use |
| --- | --- | --- |
| `.wrf-btn--primary` | Filled cyan, dark text (`--wrf-bg` on `--wrf-accent`); hover → `--wrf-accent-hover` | Main call to action |
| `.wrf-btn--secondary` | Raised surface, border; hover adds an accent border | Secondary / neutral actions |

```html
<button class="wrf-btn wrf-btn--primary">Share</button>
<a class="wrf-btn wrf-btn--secondary" href="/">Back home</a>
```

Add `.wrf-btn--sm` (with either variant) for a compact button in a dense panel.

### Link button — `.wrf-link-btn`

A `<button>` that looks exactly like a link (dotted underline, accent on hover), for
in-text actions that are not navigation - "revert", a clickable table label.

```html
<button type="button" class="wrf-link-btn">Use A</button>
```

### Toggle / segmented control — `.wrf-toggle`

A pill group of `.wrf-toggle__btn`; the selected one carries `.active` (accent fill, dark
text). Wire selection in the consumer's JS.

```html
<div class="wrf-toggle">
  <button class="wrf-toggle__btn active">Grid</button>
  <button class="wrf-toggle__btn">Timeline</button>
</div>
```

A button can instead carry `aria-pressed="true"` (same look as `.active`), so assistive
tech announces the state. `.wrf-toggle--sm` is the compact size for dense panels.

```html
<div class="wrf-toggle wrf-toggle--sm" role="group" aria-label="Camera side">
  <button type="button" class="wrf-toggle__btn" aria-pressed="true">Front</button>
  <button type="button" class="wrf-toggle__btn" aria-pressed="false">Back</button>
</div>
```

### Panel — `.wrf-panel`

The bordered surface for a page section (`--wrf-surface`, `--wrf-border`,
`--wrf-radius-md`). `.wrf-panel--inset` is a card nested inside a panel: page background,
`--wrf-radius-sm`, tighter padding.

```html
<section class="wrf-panel">
  <article class="wrf-panel wrf-panel--inset">...</article>
</section>
```

### Custom select — `.wrf-select` + `.wrf-listbox`

For a dropdown whose options need rich content (icons, badges) a native `<select>` can't
show: a `.wrf-select` trigger (form-control look with a caret) that opens a `.wrf-listbox`
popup of `.wrf-listbox__option`s (optionally split by `.wrf-listbox__group` headers). The
selected option carries `aria-selected="true"`; the highlighted one `.is-active`. The
wrapper must be `position: relative`, and the consumer's JS owns the ARIA listbox
behaviour (keyboard, focus, open/close).

```html
<div style="position: relative">
  <button type="button" class="wrf-select" aria-haspopup="listbox" aria-expanded="true">
    Typhon
  </button>
  <ul class="wrf-listbox" role="listbox">
    <li class="wrf-listbox__group" role="presentation">Robots</li>
    <li class="wrf-listbox__option is-active" role="option" aria-selected="true">Typhon</li>
  </ul>
</div>
```

**Searchable variant.** For long option lists, the popup becomes a
`.wrf-listbox.wrf-listbox--searchable` wrapper: a `.wrf-listbox__search` input pinned at the
top above a scrolling `.wrf-listbox__list` (which carries `role="listbox"`). The consumer's
JS filters by toggling `hidden` on options and group headers, and shows a
`.wrf-listbox__empty` line when nothing matches. Focus sits in the input (a
`role="combobox"` pointing at the list via `aria-controls` / `aria-activedescendant`).

```html
<div class="wrf-listbox wrf-listbox--searchable">
  <input type="search" class="wrf-listbox__search" role="combobox" placeholder="Search..." />
  <ul class="wrf-listbox__list" role="listbox">
    <li class="wrf-listbox__option is-active" role="option" aria-selected="true">Typhon</li>
    <li class="wrf-listbox__empty" hidden>No matches</li>
  </ul>
</div>
```

### Tooltip — `.wrf-tooltip`

A "?" info affordance: a subtle circular icon (`.wrf-tooltip__icon`, surface-2) and a
raised bubble (`.wrf-tooltip__bubble`) revealed on hover/focus.

```html
<span class="wrf-tooltip" tabindex="0">
  <span class="wrf-tooltip__icon">?</span>
  <span class="wrf-tooltip__bubble">Explanatory text.</span>
</span>
```

The bubble is `position: fixed` so it escapes any `overflow` ancestor (cards, scrolling
tables) and `white-space: normal` so it wraps even inside `nowrap`/uppercase headers. It
is placed by the shared **`wrf-tooltip.js`** positioning script. This repo hosts CSS only,
so **each consumer ships an identical copy of that script** (canonical source in
[`README.md`](./README.md)) and any page using `.wrf-tooltip` must load it - without it the
bubble anchors to the viewport corner.

### Form controls

`select`, `input`, `textarea` inherit a surface background, border, `--wrf-radius-sm`, and
the body font globally. No class needed.

### Focus, scrollbars, selection

- **Focus ring:** `:focus-visible` → 2px `--wrf-accent` outline, 2px offset.
- **Scrollbars** (WebKit/Blink): thin, `--wrf-border` thumb on `--wrf-bg` track, brightens
  to `--wrf-text-muted` on hover.
- **Selection:** `--wrf-accent` background, `--wrf-bg` text.

---

## Scale & motion

| Token | Value | Use |
| --- | --- | --- |
| `--wrf-radius-sm` | `4px` | Inputs, small chips, scrollbar thumb |
| `--wrf-radius-md` | `8px` | Cards, buttons, tooltip bubble |
| `--wrf-transition` | `0.2s ease` | Standard hover/state transition |

---

## Do / Don't

**Do**
- Reach for a `var(--wrf-*)` token for any chrome color, font, radius, or transition.
- Add `.wrf-btn` / `.wrf-link-btn` / `.wrf-toggle` / `.wrf-panel` / `.wrf-select` /
  `.wrf-tooltip` rather than restyling a bare element.
- Keep component CSS scoped in the consumer; the shared layer stays here.

**Don't**
- Hardcode a chrome hex (`#2a2a2a`, `#4fc3f7`, ...) in component CSS - use the token.
- Fork an element's look in one consumer; change it here so both stay in sync.
- Tokenize domain colors (rarity/savings/faction/etc.) - those stay raw by design.
