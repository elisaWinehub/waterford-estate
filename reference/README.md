# Header / footer static reference

Source of truth: `header-footer-static.html` (literal static transplant).

## Allowed Liquid only
- `{{ 'logo-*.svg' | asset_url }}` and font file URLs in CSS
- Theme loads `legacy-chrome.css` / `legacy-nav.js` from `layout/theme.liquid`

## Intentionally static
- All hrefs (including Webflow paths and absolute waterfordestate.co.za URLs)
- Login link (not cart drawer)
- Mega-menu markup
- Copyright year text
- Journal "In the Press" cards (CDN thumbnails left hotlinked — confirm redistribution rights)

## Placeholder / non-final hrefs to resolve later
- `/our-story/*`, `/shop/*`, `/reservations/*`, `/events/*`, `/membership/*`, `/journal/*`, `/contact`, `/ranges-main`, `/experiences`, etc.
