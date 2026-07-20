# Waterford header/footer port notes

## Decisions (defaults from task)
- **Nav data:** Path A — hardcoded mega-menu from live Webflow HTML
- **In the Press:** hardcoded CMS cards from live source at export time
- **Age gate:** modal IS live on waterfordestate.co.za — ported with localStorage remember
- **Cart:** Login kept as account link; added Horizon cart-drawer trigger with item count
- **Newsletter:** external ebforms link preserved if present in source
- **CSS:** scoped under .wf-chrome + critical fallbacks in `assets/legacy-chrome.css`
- **Fonts:** self-hosted `pp-editorial-old-*.ttf`; Roboto via Google Fonts link
- **Logos:** `logo-fountain-only.svg`, `logo-full.svg` in theme assets

## Shopify URL mappings (best-effort; update when pages exist)
See replacements in `sections/waterford-header.liquid` / `waterford-footer.liquid`.
