# Waterford Estate — product metafields for PDP blocks

Set these under **Settings → Custom data → Products** (namespace `custom`).
Blocks hide cleanly when the matching metafield is empty.

| Metafield key | Type | Used by |
|---|---|---|
| `custom.tagline` | Single line text / multi-line | Tagline block |
| `custom.awards` | List of `wine_award` metaobject references (`badge_image`, `badge_alt`, …) | Awards / medals row |

See [docs/wine-award-metaobject.md](docs/wine-award-metaobject.md) for setup scripts and field list.
| `custom.shipping_note` | Single line text | Shipping note |
| `custom.fact_1` … `custom.fact_4` | Single line text | Quick facts (generic) |
| `custom.vintage` / `alcohol` / `blend` / `oak` | Single line text | Quick facts aliases |
| `custom.fact_sheets` | Multi-line text | Fact Sheets accordion — one link per line: `Label \| https://...` |
| `custom.tasting_notes` | Multi-line text | Tasting Notes accordion (or use `appearance` / `nose` / `palate`) |
| `custom.cultivars` | Multi-line text | Cultivars accordion |
| `custom.wine_analysis` | Multi-line text | Wine Analysis accordion |
| `custom.vinification` | Multi-line text | Vinification accordion |
| `custom.vineyard` | Multi-line text | Vineyard accordion |
| `custom.maturation` | Multi-line text | Maturation accordion |
| `custom.ageing_potential` | Single line text | Ageing Potential accordion |
| `custom.shipping` | Multi-line text | Shipping accordion |
| `custom.appearance` / `nose` / `palate` | Multi-line text | Tasting Notes fallback (grid) |
| `custom.region` / `release_date` / `cases_produced` / `closure` | Single line text | Legacy Wine Details (optional) |
| `custom.blend_composition` | Multi-line / HTML | Fallback for Cultivars |
| `custom.technical_analysis` | Multi-line / HTML | Fallback for Wine Analysis |
| `custom.vineyard_winemaking` | Multi-line / HTML | Fallback for Vineyard |
| `custom.ageing_shipping` | Multi-line / HTML | Fallback for Shipping |
| `custom.video_url` / `video_title` / `video_thumbnail` | URL / text / image | Media video card |
| `custom.journal_url` | URL | Journal card link (external article) |
| `custom.journal_title` | Single line text | Journal card title |
| `custom.journal_image` | File (image) | Journal card thumbnail |
| `custom.journal_article` | Article reference (optional) | Fallback if no `journal_url` |

## Subscriptions (purchase option block)

- Block setting **Enable purchase options** is **off by default** (Path B).
- When enabled, the block only renders if `product.selling_plan_groups` is populated by a subscriptions app.
- No fake “% off” UI ships without real selling plans.
