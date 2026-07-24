# Wine Award metaobject + `custom.awards` product metafield

Store-side data model for the PDP medals row on **waterford-estate-2**.

## Definitions

### Metaobject `wine_award` (name: Wine Award)

| key | name | type |
|---|---|---|
| `vintage` | Vintage | single line text |
| `publication` | Publication | single line text |
| `award_year` | Award Year | single line text |
| `rating` | Rating | single line text |
| `badge_image` | Badge Image | file (images) |
| `badge_url` | Badge URL | URL (optional external badge image, e.g. Webflow CDN) |
| `badge_alt` | Badge Alt Text | single line text (optional; Liquid falls back to publication + year) |

Storefront access: **Public read**.

### Product metafield `custom.awards`

- Name: Awards  
- Type: **List of metaobject references** → `wine_award`  
- Owner: Product  
- Storefront: Public read  

## Scripted setup (preferred)

Requires Shopify CLI store auth (or Admin API token env vars):

```bash
# Scopes: write_metaobject_definitions, write_metaobjects, write_products, …
shopify store auth --store waterford-estate-2.myshopify.com --scopes read_products,write_products,read_metaobject_definitions,write_metaobject_definitions,read_metaobjects,write_metaobjects

node scripts/setup-wine-award-metaobject.mjs --cli
```

Or with a custom app token:

```bash
set SHOPIFY_STORE_DOMAIN=waterford-estate-2.myshopify.com
set SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_…
node scripts/setup-wine-award-metaobject.mjs --token
```

Idempotent — safe to re-run. Writes `scripts/wine-award-setup-output.json` with definition GIDs.

### Seed example awards (Antigo)

```bash
node scripts/seed-wine-award-examples.mjs
```

Creates three `wine_award` entries and attaches them to **Waterford Antigo** (`/products/antigo`). Badge images are left blank for merchants to upload in Admin (Content → Metaobjects → Wine Award).

## Manual Admin UI (fallback)

1. **Settings → Custom data → Metaobjects → Add definition**  
   Name `Wine Award`, type `wine_award`. Add the six fields above.  
2. **Settings → Custom data → Products → Add definition**  
   Name `Awards`, namespace `custom`, key `awards`, type Metaobject (list) → Wine Award.  
3. Open a product → **Awards** → add / reorder Wine Award entries. Upload badge images on each entry.

## Liquid usage

```liquid
{% for award in product.metafields.custom.awards.value %}
  {{ award.badge_image | image_url: width: 200 | image_tag: alt: award.badge_alt }}
  {{ award.rating }} — {{ award.publication }} {{ award.award_year }}
{% endfor %}
```

Raw shape check (theme editor / design mode comment is also emitted on the PDP awards block):

```liquid
{{ product.metafields.custom.awards.value | json }}
```

## Current store IDs (waterford-estate-2)

See `scripts/wine-award-setup-output.json` for the live definition GIDs after the last successful run.
