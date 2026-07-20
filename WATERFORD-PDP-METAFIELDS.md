# Waterford Estate — product metafields for PDP blocks

Set these under **Settings → Custom data → Products** (namespace `custom`).
Blocks hide cleanly when the matching metafield is empty.

| Metafield key | Type | Used by |
|---|---|---|
| `custom.tagline` | Single line text / multi-line | Tagline block |
| `custom.awards` | List of files or metaobjects with image+alt | Awards block |
| `custom.shipping_note` | Single line text | Shipping note |
| `custom.fact_1` … `custom.fact_4` | Single line text | Quick facts (generic) |
| `custom.vintage` / `alcohol` / `blend` / `oak` | Single line text | Quick facts aliases |
| `custom.appearance` / `nose` / `palate` | Multi-line text | Tasting Notes accordion |
| `custom.region` / `release_date` / `cases_produced` / `closure` | Single line text | Wine Details |
| `custom.blend_composition` | Rich text / HTML | Blend bar + key |
| `custom.technical_analysis` | Rich text / HTML | Analysis table |
| `custom.vineyard_winemaking` | Rich text / HTML | Vineyard accordion |
| `custom.ageing_shipping` | Rich text / HTML | Ageing accordion |
| `custom.video_url` / `video_title` | URL / text | Media video card |
| `custom.journal_article` | Article reference | Journal card |

## Subscriptions (purchase option block)

- Block setting **Enable purchase options** is **off by default** (Path B).
- When enabled, the block only renders if `product.selling_plan_groups` is populated by a subscriptions app.
- No fake “% off” UI ships without real selling plans.
