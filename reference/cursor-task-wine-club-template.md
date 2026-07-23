# Cursor Task — Wine Club Page Template (Shopify Horizon)

## Summary

Build the Wine Club page as a Shopify Horizon **page template** (`templates/page.wine-club.json`) made entirely of independent, schema-driven sections — no hardcoded content anywhere. Every section must be fully editable from the theme editor: images, headings, body copy, icons, padding, color scheme, and block order, exactly the way any other Horizon section works. This is a from-scratch build of new sections; it does not touch the header or footer, which are already built and should not be modified, re-created, or referenced beyond the normal `{% section %}` includes already in `layout/theme.liquid`.

Reference for visual/structural intent: `wine-club-mockup.html` (in this repo) — six sections in this order: Hero, Intro, Member Benefits, Club Signup (WineHub integration point), This Quarter's Selection (case preview), FAQ. Treat the mockup as the starting visual design, not a fixed layout — every value shown in it (copy, image, icon, spacing) must become an editable setting or block field, not fixed markup.

## Architecture requirements (apply to every section in this task)

- Each section is its own file: `sections/wine-club-hero.liquid`, `sections/wine-club-intro.liquid`, `sections/wine-club-benefits.liquid`, `sections/wine-club-signup.liquid`, `sections/wine-club-case-preview.liquid`, `sections/wine-club-faq.liquid`.
- Every section's `{% schema %}` must include a `presets` array so it can be added fresh from "Add section" in the theme editor, not just edited once placed by the template JSON.
- Every section must include `padding_top` and `padding_bottom` range settings (suggest 0–120, step 4, matching whatever step Horizon's other sections already use — check an existing Horizon section file for the convention and match it exactly rather than inventing a different scale).
- Every section must include a `color_scheme` setting, pulling from the theme's global color scheme list (Settings → Colors) rather than individual raw color pickers per section — this is the idiomatic Horizon/OS2.0 pattern and keeps the Wine Club page consistent with color changes made theme-wide. Confirm this matches how other Horizon sections handle color before building; if Horizon uses a different pattern, follow that instead and note the deviation.
- Any heading field must include a `heading_size` select (Small / Medium / Large / X-Large) mapping to the section's heading font-size scale — this is the "typography" editability requirement. Don't add per-section font-family pickers; font family is a theme-wide typography setting (Settings → Typography) and should stay that way.
- Any repeatable content (benefit items, FAQ questions, manually curated products) must use Shopify's native `blocks` array so merchants can add, remove, reorder, and hide entries from the theme editor with zero code changes — don't hardcode a fixed count of anything.
- Icon fields follow one consistent pattern across the whole template: a `select` setting listing a curated preset icon set relevant to membership/wine club content (case, discount tag, priority star, shipping truck, wine glass, pause/cancel, calendar) with a `Custom` option that reveals an `image_picker` field for merchants who want to upload their own icon instead of using a preset. Check whether Horizon already ships an icon snippet system (`snippets/icon-*.liquid`) and extend that rather than building a parallel one.
- Reuse the `.card` / `.card-photo` / `.card-body` product card component already established for the collection and product templates in the case-preview section — don't rebuild a new card style. Reuse the native `<details>/<summary>` accordion pattern already established on the product template for the FAQ section, for the same reason.
- Scope any new CSS this template needs under section-specific classes (e.g. `.wine-club-hero`, `.wine-club-benefits`) rather than generic names, consistent with the collision-avoidance approach used on the header/footer and product tasks.
- Do not modify `sections/header.liquid`, `sections/footer.liquid`, or their assets. This task only adds new files and one new template.

## Section 1 — Hero (`sections/wine-club-hero.liquid`)

Full-bleed image hero with dark overlay and bottom-left text, matching the same visual pattern already used on the collection page hero — reuse that component's approach (image + overlay + eyebrow + heading) rather than designing a new hero pattern.

**Settings**

| Key | Type | Label | Notes |
|---|---|---|---|
| `background_image` | `image_picker` | Background image | No default — show a clear empty-state prompt in the editor if unset |
| `overlay_opacity` | `range` (0–100, step 5) | Overlay darkness | Default 45 |
| `color_scheme` | `color_scheme` | Color scheme | Controls text color / scheme tint |
| `eyebrow_text` | `text` | Eyebrow label | Default "Membership" |
| `heading` | `text` | Heading | Default "The Waterford Wine Club" |
| `heading_size` | `select` (Small/Medium/Large/X-Large) | Heading size | Default Large |
| `content_position` | `select` (Left/Center) | Text alignment | Default Left |
| `content_alignment_vertical` | `select` (Top/Center/Bottom) | Vertical position | Default Bottom |
| `min_height` | `range` (240–600, step 20) | Hero height (desktop) | Default 340 |
| `mobile_min_height` | `range` (160–400, step 20) | Hero height (mobile) | Default 260 |

**Blocks**

| Type | Fields | Notes |
|---|---|---|
| `button` | `text` (text), `link` (url), `style` (select: Primary/Secondary) | Optional, 0 or more — lets a merchant add a "Join the Club" CTA directly in the hero if they want one there instead of (or in addition to) the intro section |

## Section 2 — Intro (`sections/wine-club-intro.liquid`)

The centered intro paragraph + CTA that sits below the breadcrumb, matching the collection page's `.page-head` pattern.

**Settings**

| Key | Type | Label | Notes |
|---|---|---|---|
| `heading` | `text` | Optional supporting heading | Default blank — most pages won't need a second heading here since the hero already has one |
| `text` | `richtext` | Intro text | Default the current mockup copy |
| `text_alignment` | `select` (Left/Center) | Text alignment | Default Center |
| `max_width` | `range` (400–900, step 20) | Reading width (px) | Default 640 |
| `color_scheme` | `color_scheme` | Color scheme | |
| `padding_top` / `padding_bottom` | `range` | Section padding | |

**Blocks**

| Type | Fields | Notes |
|---|---|---|
| `button` | `text`, `link`, `style` | Repeatable — supports one CTA ("Join the Club") or more (e.g. an additional "View membership tiers" link) |

## Section 3 — Member Benefits (`sections/wine-club-benefits.liquid`)

**Settings**

| Key | Type | Label | Notes |
|---|---|---|---|
| `eyebrow_text` | `text` | Eyebrow | Default "Member Benefits" |
| `heading` | `text` | Heading | Default "Your all-access pass to Waterford Estate" |
| `heading_size` | `select` | Heading size | |
| `description` | `richtext` | Optional supporting text | |
| `columns_desktop` | `select` (2/3/4) | Columns | Default 3 |
| `color_scheme` | `color_scheme` | | |
| `padding_top` / `padding_bottom` | `range` | | |

**Blocks** — type `benefit_item`, repeatable (recommend a reasonable max like 8, not a hard-coded exact count)

| Field | Type | Notes |
|---|---|---|
| `icon` | `select` | Preset icon list (case, tag, star, truck, wine glass, calendar, pause) plus "Custom" |
| `custom_icon` | `image_picker` | Only relevant/shown when `icon` is set to Custom |
| `heading` | `text` | e.g. "Curated cases" |
| `text` | `richtext` | Benefit description |

## Section 4 — Club Signup / WineHub integration (`sections/wine-club-signup.liquid`)

This is the section that hosts the actual subscription/membership signup experience. The intended real path is the WineHub app rendering into an app block here — this section should not hardcode a custom subscription UI as production content. It supports four block types so the merchant has flexibility depending on what's installed and when:

**Settings**

| Key | Type | Label | Notes |
|---|---|---|---|
| `eyebrow_text` | `text` | Eyebrow | Default "Build Your Case" |
| `heading` | `text` | Heading | Default "Choose your membership" |
| `heading_size` | `select` | | |
| `description` | `richtext` | | |
| `powered_by_text` | `text` | "Powered by" label | Default "Powered by WineHub" — editable/clearable since the merchant may switch apps later |
| `color_scheme` | `color_scheme` | | |
| `padding_top` / `padding_bottom` | `range` | | |

**Blocks**

| Type | Fields | Notes |
|---|---|---|
| `app` | — | `{"type": "@app"}` — the primary integration point. WineHub (or any subscription app) renders its own UI here once installed and assigned. |
| `custom_liquid` | `label` (text, admin-only reference), `code` (`liquid` setting type), `full_width` (checkbox) | Lets the merchant paste any third-party embed code, script, or custom HTML/Liquid without a dev — this is the general "3rd party embed" capability requested. Flag in a code comment that this setting type renders raw code and should only be editable by trusted staff. |
| `frequency_card` | `icon` (select, same preset list as benefits), `custom_icon` (image_picker), `title` (text), `discount_text` (text), `cadence_text` (text), `button_text` (text), `button_link` (url) | Manual, static fallback matching the mockup's frequency-tier cards — for use before an app is installed, or if the merchant prefers to hand-build a simple pricing display without an app dependency. Repeatable. |
| `step_indicator` | `step_1_label`, `step_2_label`, `step_3_label` (text), `active_step` (select 1/2/3) | Optional decorative progress bar matching the mockup's Frequency → Quantity → Review indicator. Purely presentational, no functional logic. |

**Default preset**: ship this section with one `app` block already added by default and no `frequency_card`/`step_indicator` blocks, since the intended production path is the real app. Note in a code comment that `frequency_card` and `step_indicator` blocks exist as a manual fallback and should be removed once a real app block is functioning, to avoid two conflicting signup UIs stacking on the same page.

## Section 5 — Case Preview (`sections/wine-club-case-preview.liquid`)

**Settings**

| Key | Type | Label | Notes |
|---|---|---|---|
| `eyebrow_text` | `text` | | Default "A Taste of What's Inside" |
| `heading` | `text` | | Default "This quarter's selection" |
| `heading_size` | `select` | | |
| `description` | `richtext` | | |
| `collection` | `collection` | Auto-pull from collection | Optional — if set, section renders products from this collection automatically and ignores manual product blocks |
| `products_to_show` | `range` (2–6) | | Only relevant when `collection` is set; default 3 |
| `columns_desktop` | `select` (2/3/4) | | Default 3 |
| `color_scheme` | `color_scheme` | | |
| `padding_top` / `padding_bottom` | `range` | | |

**Blocks** — type `product` (product picker), repeatable. Used for manual curation when `collection` is left blank. Document clearly in the section's schema `info` text which mode is active based on whether `collection` is set, so it's not ambiguous to a merchant editing this in the theme editor.

Card markup/CSS must match the existing collection/product template's `.card` component exactly — no visual drift between a card here and a card elsewhere on the site.

## Section 6 — FAQ (`sections/wine-club-faq.liquid`)

**Settings**

| Key | Type | Label | Notes |
|---|---|---|---|
| `eyebrow_text` | `text` | | Default "FAQ" |
| `heading` | `text` | | Default "Membership questions" |
| `heading_size` | `select` | | |
| `max_width` | `range` (400–900) | | Default 760 |
| `color_scheme` | `color_scheme` | | |
| `padding_top` / `padding_bottom` | `range` | | |

**Blocks** — type `question`, repeatable

| Field | Type | Notes |
|---|---|---|
| `question` | `text` | |
| `answer` | `richtext` | |
| `default_open` | `checkbox` | Default false — set true on at most one block if the merchant wants a question pre-expanded, matching the native `<details open>` pattern |

## Optional: page-wide app slot section (`sections/app-block-slot.liquid`)

A minimal, reusable section containing only an `app` block type plus padding/color-scheme settings — no other content. Its only purpose is to let a merchant drop any app embed (reviews, upsells, a second WineHub touchpoint, anything) anywhere on the page by adding this section wherever they want in the theme editor, rather than being limited to the one app slot inside the signup section. Give it a clear name in the editor like "App block slot" so it's obviously a utility section, not confused with the signup section's dedicated app block.

## Template composition — `templates/page.wine-club.json`

Compose the six sections above in this default order: Hero → Intro → Member Benefits → Club Signup → Case Preview → FAQ. All six (plus the optional app-slot section) must be independently addable, removable, and reorderable via the theme editor once this template is active — that's default Online Store 2.0 behavior as long as each section has a proper `presets` block in its schema, so don't add anything that would lock the section order or prevent removal.

After building, assign this template to the actual Wine Club page: Shopify Admin → Online Store → Pages → select or create the "Wine Club" page → Theme template dropdown → `page.wine-club`.

## Acceptance criteria

From the theme editor, with zero code changes, a merchant must be able to:

- Change the hero background image, eyebrow text, heading, heading size, overlay darkness, and text position.
- Add, remove, reorder, and hide individual benefit items, including swapping each item's icon between the preset list and a custom uploaded image.
- Edit every heading, paragraph, and button label on the page through section settings or block fields — no copy should remain hardcoded from the mockup.
- Adjust top/bottom padding and color scheme independently on every section.
- Add an app block to the Club Signup section (or the optional app-slot section) and have it render without any surrounding custom UI conflicting with it.
- Paste a third-party embed/HTML snippet into a `custom_liquid` block and have it render on the page.
- Switch the Case Preview section between "pull from a collection" and "manually pick products" by setting or clearing the `collection` setting.
- Add, remove, and reorder FAQ questions, and mark one open by default.
- Confirm the header and footer are untouched — same files, same rendering, no new dependencies introduced into them by this task.

## Files

- `sections/wine-club-hero.liquid`
- `sections/wine-club-intro.liquid`
- `sections/wine-club-benefits.liquid`
- `sections/wine-club-signup.liquid`
- `sections/wine-club-case-preview.liquid`
- `sections/wine-club-faq.liquid`
- `sections/app-block-slot.liquid` (optional utility section)
- `templates/page.wine-club.json`
- Any new scoped CSS this template needs, added to an existing shared stylesheet if one already exists for custom sections in this project, or a new `assets/wine-club.css` if not — reuse the collection/product template's card and accordion CSS rather than duplicating it.

## Reference

`wine-club-mockup.html` in this repo is the visual/structural starting point — match its design language (colors, type, spacing, component styles) but treat every piece of content in it as a placeholder default value for a setting or block field, not fixed markup.
