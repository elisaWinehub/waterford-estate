# Cursor Task — Product Template Rebuild (exact match to mockup) + Awards Data Model

## Why this task exists

The last pass on the product template drifted significantly from `product-main-page.html`: the Details accordion isn't rendering as tabs/accordion at all, the medals row doesn't match, and spacing/structure has moved away from the mockup generally. This task replaces the previous brief's ambiguity with a literal, section-by-section spec — copy the structure below, don't reinterpret it. Where a value needs to come from Shopify data (price, title, images), that's called out explicitly; everything else is fixed markup.

The one confirmed intentional deviation from the mockup: the mockup's custom "Choose your purchase option" UI (one-time vs. subscribe & save, with frequency tiers) does **not** get built as custom code. That entire block gets replaced with an empty app-block slot reserved for the WineHub subscriptions app to render into later. See the "Purchase option" section below.

Reference file: `product-main-page.html`, already in the repo. Read it directly before starting — the section headers below map to specific class names and line ranges in that file so you can diff against it as you go.

## Section-by-section spec

### Header / footer

Already handled by a separate task (`cursor-task-header-footer-static.md` / `header-footer-static.html`). Don't rebuild these here — include the same static header/footer sections used on the collection template.

### Breadcrumb

```html
<div class="breadcrumb">Shop &nbsp;&rsaquo;&nbsp; {{ product.type }} &nbsp;&rsaquo;&nbsp; <span>{{ product.title }}</span></div>
```
(`Shop` and the collection crumb should link to the relevant collection URL; the middle crumb should reflect whichever collection the product was reached through if available, falling back to `product.type`.)

### Gallery

Structure from lines 220–229 of the mockup: `.pdp-top > .gallery > .pdp-photo` (main image, `id="mainImg"`) + `.thumb-row` of `.thumb` buttons. Copy this exactly, but drive it from `product.media` / `product.images` instead of one repeated placeholder image — one `.thumb` button per media item, `onclick`/click-handler swaps `#mainImg`'s `src`/`alt` exactly as the existing `swapImg()` function in the mockup does. Keep the sticky positioning (`.gallery{position:sticky;top:96px;}`).

### Title / tagline

```html
<h1 class="serif pdp-title">{{ product.title }}</h1>
<p class="pdp-tagline">{{ product.metafields.custom.tagline.value | default: product.description | strip_html | truncate: 220 }}</p>
```
Recommend a dedicated `tagline` metafield (single line/multi-line text) rather than reusing the full description, since the mockup's tagline is a short 1–2 sentence hook distinct from the longer Details accordion copy.

### Medals row (awards)

See the full "Awards & accolades data model" section below — this replaces the 3 hardcoded `<img>` tags at lines 235–239 with a loop over a product metafield. The container stays `<div class="medals-row">`, same CSS (`.medals-row{display:flex;align-items:center;gap:22px;flex-wrap:wrap;}` / `.medals-row img{height:58px;width:auto;}`), just data-driven and variable-length instead of hardcoded to exactly 3 images.

### Price

```html
<div class="price-box">
  <div class="price">{{ product.price | money }} <small>/ {{ product.variants.first.weight }}{{ product.variants.first.weight_unit }}</small></div>
</div>
```
(Adjust the unit output to however the theme already formats variant size elsewhere — the point is `.price-box`/`.price` markup and classes stay identical to lines 241–243.)

### Purchase option — app block slot, not custom UI

Do **not** implement the `.po-wrap` / `.po-card` / `.po-frequency` / `.po-freq-row` markup from lines 245–281 of the mockup. That UI was a design placeholder for what a subscription option could look like; the real implementation will come from the WineHub app once it's installed, and it will render its own markup into this slot.

Reserve the space with an app block in the section schema, positioned exactly where `.po-wrap` sits in the mockup — after `.price-box`, before `.buy-actions`:

```json
{
  "type": "@app",
  "id": "app-purchase-options"
}
```

Until an app is assigned to that slot, it should render nothing (no placeholder box, no border) — the layout should look identical to `.price-box` sitting directly above `.buy-actions` with normal spacing between them, matching what's currently live on the built page (which the earlier screenshot confirms already has no purchase-option UI showing).

### Quantity + add to cart

```html
<div class="buy-actions">
  <div class="qty"><button type="button" onclick="stepQty(-1)">–</button><span id="qtyVal">1</span><button type="button" onclick="stepQty(1)">+</button></div>
  <button class="button buy-btn" type="submit">Add to cart</button>
</div>
<div class="ship-note">Ships within South Africa in 3–5 days · international distributors listed below</div>
```
Wrap in the theme's standard `{% form 'product' %}` so Add to cart actually works; keep the qty stepper's markup and `stepQty()` JS logic exactly as in the mockup (lines 284, 534–538), just make the hidden quantity input reflect `#qtyVal`'s value on submit.

### Quick facts strip

```html
<div class="quickfacts">
  <div class="qf"><b>{{ product.metafields.custom.vintage.value }}</b><span>Vintage</span></div>
  <div class="qf"><b>{{ product.metafields.custom.alcohol.value }}</b><span>Alcohol</span></div>
  <div class="qf"><b>{{ product.metafields.custom.blend_summary.value }}</b><span>Blend</span></div>
  <div class="qf"><b>{{ product.metafields.custom.new_oak.value }}</b><span>New oak</span></div>
</div>
```
Same `.quickfacts`/`.qf` markup as lines 289–294, four metafields feeding the four stat cells. If these metafields don't exist yet in the store, create them (single line text is fine for all four — these are short display values, not data to compute against).

### Details accordion — this is the piece that's currently missing entirely

This must be four native `<details class="acc-item"><summary>…</summary><div class="acc-body">…</div></details>` elements inside a `.accordion` wrapper, exactly matching the structure at lines 299–369 of the mockup — not a JS tab component, not omitted, not a custom accordion library. `<details>`/`<summary>` is a native HTML element; it works with zero JavaScript and matches how the real live site's accordions behave.

The four sections, each its own theme block per the block-based architecture (from `cursor-task-product-template.md`):

1. **Tasting Notes** — `.tasting-grid` of three columns (Appearance / Nose / Palate), each an `<h4>` + `<p>`.
2. **Wine Details** — `.acc-sub` sub-headers ("At a glance", "The blend", "Technical analysis") containing a `.stat-grid` of stat cells, a `.blend-bar` + `.blend-key` for the varietal blend percentages, and a plain `<table>` for technical analysis (alcohol, residual sugar, acidity, pH).
3. **Vineyard & Winemaking** — `.acc-sub` sub-headers ("The vineyard", "In the cellar", "Maturation") with `.stat-grid` cells and prose paragraphs.
4. **Ageing & Shipping** — `.acc-sub` sub-headers ("Ageing potential", "Shipping & delivery") with prose paragraphs.

Copy the exact CSS classes from lines 99–121 of the mockup (`.accordion`, `.acc-item`, `.acc-item summary`, `.acc-body`, `.tasting-grid`, `.stat-grid`, `.blend-bar`, `.blend-key`, `.acc-sub`) — do not substitute a different accordion visual pattern. Each block's content (the stat values, prose, blend percentages) should be block-level settings/rich-text fields so the client can edit them per product from the theme editor, per the existing block-based brief — but the accordion shell markup itself, and the fact that it renders as native `<details>`, is fixed.

### Utility line

```html
<div class="utility-line">Have a question about this wine? <a href="/pages/contact">Ask us</a><span class="sep">·</span><a href="{{ product.url }}#reviews">Write a review</a></div>
```
Same markup/classes as line 371, right-aligned inside `.pdp-info` as already positioned in the mockup.

### Media grid (video / journal / distributors)

Copy lines 375–414 exactly — three `.media-card` items (video with `.play-btn`, journal article, distributors with `.flag-row` of country pills). Make the video card link to the product's actual YouTube URL and the thumbnail its actual poster image via metafields (`custom.video_url`, `custom.video_thumbnail`); make the journal card link to the product's actual linked blog article if one exists; make the distributor pills reflect the product's actual distribution list metafield rather than a hardcoded UK/USA/Germany/Netherlands set. If any of these three don't apply to a given product (no video, no linked article), that card should be omitted from the grid rather than rendered empty — confirm with the client whether that's the desired fallback or whether a generic placeholder card is preferred.

### Related products

Copy lines 419–465 exactly — reuses the `.card`/`.card-photo`/`.card-main`/`.card-body`/`.card-controls` component already built for the collection template, scoped under `.related-grid` as in the mockup. Populate from `product.recommendations` or a manually curated related-products list metafield (confirm which the client prefers), capped at 3 items to match the mockup's 3-column grid.

## Awards & accolades data model

The client's live site currently shows a variable number of awards per wine (as few as one, as many as four in the examples seen), each with a vintage, a publication/award name, the award's year, a rating/medal description, and a badge image — e.g. "2022 | Platter's Wine Guide 2025 | 4.5 Stars" alongside the Platter's medal artwork. This needs to be editable per-product by the client without a developer, and the number of awards varies per product, so it can't be a fixed set of hardcoded image slots (which is what the current medals-row is).

**Recommended approach: a `wine_award` metaobject, referenced by a list metafield on each product.**

### 1. Metaobject definition: `wine_award`

| Field | Type | Notes |
|---|---|---|
| `vintage` | Single line text | The wine vintage the award applies to, e.g. `2022`. |
| `publication` | Single line text | e.g. `Platter's Wine Guide`, `Tim Atkin Special Report`, `Decanter World Wine Awards`, `Gilbert & Gaillard International Awards`, `The Global Cabernet Sauvignon Masters`, `Robert Parker Wine Advocate`, `Winemag.co.za SA Wine Rating`. |
| `award_year` | Single line text | The year the award/rating was published, e.g. `2025`. |
| `rating` | Single line text | e.g. `4.5 Stars`, `93 Points`, `Gold`, `Double Gold`, `92 points`. |
| `badge_image` | File (image) | The medal/badge artwork. |
| `badge_alt` | Single line text (optional) | Falls back to `publication` + `award_year` if left blank. |

### 2. Product metafield: `custom.awards`

Type: **list of metaobject references**, pointing at `wine_award`. This gives the client a drag-to-reorder list in the product admin page where each award is its own editable card (upload the badge image, fill in the four text fields) — no theme code changes needed to add, remove, or reorder a product's awards.

### 3. Liquid — medals row (matches the current mockup's badge-only presentation)

```liquid
{%- assign awards = product.metafields.custom.awards.value -%}
{%- if awards and awards.size > 0 -%}
  <div class="medals-row">
    {%- for award in awards -%}
      <img
        src="{{ award.badge_image.value | image_url: width: 160 }}"
        alt="{{ award.badge_alt.value | default: award.publication.value | append: ' ' | append: award.award_year.value }}"
        loading="lazy" width="80" height="80">
    {%- endfor -%}
  </div>
{%- endif -%}
```

### 4. Optional — full text-line + badge presentation (matches the live site's fuller Accolades section)

The screenshots the client is referencing show a text line above each badge row (`{vintage} | {publication} {award_year} | {rating}`), which is closer to how the live site currently presents accolades than the mockup's badge-only row. Since both formats come from the same data, this is a styling decision, not a data-modeling one — if the client wants this fuller presentation instead of (or in addition to) the plain badge row, add:

```liquid
{%- if awards and awards.size > 0 -%}
  <ul class="award-lines">
    {%- for award in awards -%}
      <li>{{ award.vintage.value }} | {{ award.publication.value }} {{ award.award_year.value }} | {{ award.rating.value }}</li>
    {%- endfor -%}
  </ul>
{%- endif -%}
```
Default to the mockup's badge-only presentation unless the client confirms they want the text lines too — flag this as an open question rather than guessing.

### 5. Why this approach over the alternatives

- **Hardcoded badges in theme code** (what exists today): requires a developer for every award update, and can't vary the count per product without editing markup per page. Rejected.
- **Single rich-text metafield per product**: the client could paste award text and images into a WYSIWYG field, but there's no structure — no reliable way to size badge images consistently, no per-award alt text, easy to break formatting. Rejected.
- **Raw JSON metafield**: fully structured, but the client would be hand-editing JSON with no visual admin UI — error-prone for a non-technical team. Rejected.
- **Metaobject + list reference** (recommended): structured fields, native image upload, drag-to-reorder list UI in the product admin, no dev involvement for day-to-day updates, and it's the same underlying pattern Shopify recommends for exactly this kind of "repeatable structured content with an image" case.

Badge images vary a lot in native shape (circular medals, hexagonal award seals, shield crests) — keep the existing mockup rule of a fixed height with auto width (`.medals-row img{height:58px;width:auto;}`) so the row stays visually aligned regardless of each badge's native aspect ratio, rather than forcing a uniform bounding box that would crop or distort some badges.

## Acceptance criteria

- Rendered product page, viewed side-by-side with `product-main-page.html`, matches structurally and visually — same classes, same layout order, same spacing.
- The Details section renders as four native `<details>/<summary>` accordion items, functioning with no JavaScript required to open/close.
- The purchase-option area is an empty, zero-height app-block slot when no app is assigned — no leftover custom subscription UI, no placeholder box.
- Medals row renders 1–4+ badges (however many the `custom.awards` metafield contains for that product) rather than a hardcoded set of exactly 3 images.
- Quick facts, tagline, and accordion content are populated from real product/metafield data, not the mockup's placeholder copy.
- Related products grid reuses the exact card component from the collection template — confirm no visual drift between a card here and a card on the collection page.
- `wine_award` metaobject and `custom.awards` product metafield exist in the store, with at least one product populated end-to-end as a working example for the client to model future entries on.

## Open questions

1. Badge-only medals row (matches mockup) vs. text-line + badge (matches live site's fuller Accolades presentation) — confirm which the client wants.
2. Media grid fallback behavior when a product has no video or no linked journal article — omit the card, or show a generic placeholder?
3. Related products: `product.recommendations` (automatic) vs. a manually curated metafield — confirm which the client prefers to maintain.
