/**
 * Seed wine awards (text + badge URLs from waterfordestate.co.za CDN)
 * onto the products shown in the client screenshots.
 *
 * Store: waterford-estate-2.myshopify.com only.
 *
 * Usage: node scripts/seed-product-awards-from-screenshots.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const STORE = 'waterford-estate-2.myshopify.com';

function shopifyBin() {
  const winCmd = join(homedir(), 'AppData', 'Roaming', 'npm', 'shopify.cmd');
  if (process.platform === 'win32' && existsSync(winCmd)) return winCmd;
  return 'shopify';
}

function run(query, variables = {}, mutate = false) {
  const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const qFile = join(tmpdir(), `wf-awards-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-awards-v-${stamp}.json`);
  const oFile = join(tmpdir(), `wf-awards-o-${stamp}.json`);
  writeFileSync(qFile, query);
  writeFileSync(vFile, JSON.stringify(variables));
  const args = [
    'store', 'execute', '--store', STORE,
    '--query-file', qFile, '--variable-file', vFile,
    '--json', '--output-file', oFile,
  ];
  if (mutate) args.push('--allow-mutations');
  try {
    execFileSync(shopifyBin(), args, {
      encoding: 'utf8',
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 20 * 1024 * 1024,
    });
    return JSON.parse(readFileSync(oFile, 'utf8'));
  } finally {
    for (const f of [qFile, vFile, oFile]) {
      try { unlinkSync(f); } catch {}
    }
  }
}

function unwrap(payload, key) {
  return payload?.[key] ?? payload?.data?.[key] ?? payload;
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** Products + awards from screenshots. badge_url filled after scrape when possible. */
const PRODUCTS = [
  {
    handle: 'waterford-cap-classique',
    webflow: 'waterford-blanc-de-blancs-cap-classique',
    awards: [
      { vintage: '2018', publication: "Platter's Wine Guide 2026", award_year: '2026', rating: '5 Stars', badge_hint: /platter|5\s*star/i },
      { vintage: '2017', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '91 Points', badge_hint: /ta.*91|91.*ta|tim.*91|91/i },
      { vintage: '2015', publication: 'Tim Atkin Special Report 2023', award_year: '2023', rating: '92 Points', badge_hint: /ta.*92|92.*ta|tim.*92|92/i },
    ],
  },
  {
    handle: 'waterford-estate-the-jem',
    webflow: 'the-jem',
    awards: [
      { vintage: '2017', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars', badge_hint: /platter|4\.5/i },
      { vintage: '2017', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '97 Points', badge_hint: /ta.*97|97|tim/i },
      { vintage: '2016', publication: 'Robert Parker Wine Advocate 2024', award_year: '2024', rating: '93 points', badge_hint: /parker|advocate|93/i },
    ],
  },
  {
    handle: 'cabernet-sauvignon',
    webflow: 'waterford-estate-cabernet-sauvignon',
    awards: [
      { vintage: '2019', publication: "Platter's Wine Guide 2024", award_year: '2024', rating: '4.5 Stars', badge_hint: /platter|4\.5/i },
      { vintage: '2019', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '93 Points', badge_hint: /ta.*93|93|tim/i },
      { vintage: '2019', publication: 'The Global Cabernet Sauvignon Masters 2025', award_year: '2025', rating: 'Gold', badge_hint: /global|master|gold|cabernet/i },
    ],
  },
  {
    handle: 'antigo',
    webflow: 'waterford-antigo',
    awards: [
      { vintage: '2021', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '92 Points', badge_hint: /ta.*92|92|tim/i },
      { vintage: '2021', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars', badge_hint: /platter|4\.5/i },
      { vintage: '2020', publication: 'Gilbert & Gaillard International Awards', award_year: '2024', rating: 'Double Gold', badge_hint: /gilbert|gaillard|double/i },
    ],
  },
  {
    handle: 'waterford-estate-grenache-noir-single-vineyard',
    webflow: 'waterford-estate-grenache-noir-single-vineyard',
    awards: [
      { vintage: '2022', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars', badge_hint: /platter|4\.5/i },
      { vintage: '2022', publication: 'Gilbert & Gaillard International Awards 2025', award_year: '2025', rating: 'Double Gold', badge_hint: /gilbert|gaillard|double/i },
      { vintage: '2022', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '93 Points', badge_hint: /ta.*93|93|tim/i },
    ],
  },
  {
    handle: 'kevin-arnold-shiraz',
    webflow: 'kevin-arnold-shiraz',
    awards: [
      { vintage: '2021', publication: "Platter's Wine Guide 2026", award_year: '2026', rating: '4.5 Stars', badge_hint: /platter.*2026|2026.*platter|platter/i },
      { vintage: '2021', publication: 'Tim Atkin Special Report 2025', award_year: '2025', rating: '93 Points', badge_hint: /ta.*93|93|tim/i },
      { vintage: '2020', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars', badge_hint: /platter.*2025|2025.*platter|4\.5/i },
    ],
  },
  {
    handle: 'pecan-stream-pebble-hill',
    webflow: 'pecan-stream-pebble-hill',
    awards: [
      { vintage: '2021', publication: 'Gold Wine Awards 2024', award_year: '2024', rating: 'Gold', badge_hint: /gold.?wine|gold/i },
    ],
  },
  {
    handle: 'old-vine-project-chenin-blanc-1',
    webflow: 'waterford-old-vine-project-chenin-blanc',
    awards: [
      { vintage: '2024', publication: 'Gilbert & Gaillard International Awards 2025', award_year: '2025', rating: 'Double Gold', badge_hint: /gilbert|gaillard|double/i },
      { vintage: '2024', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars', badge_hint: /platter|4\.5/i },
      { vintage: '2023', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '93 Points', badge_hint: /ta.*93|93|tim/i },
    ],
  },
  {
    handle: 'waterford-estate-chardonnay-single-vineyard',
    webflow: 'waterford-estate-chardonnay-single-vineyard',
    awards: [
      { vintage: '2022', publication: 'Tim Atkin Special Report 2025', award_year: '2025', rating: '92 Points', badge_hint: /ta.*92|92|tim/i },
      { vintage: '2022', publication: "Platter's Wine Guide 2026", award_year: '2026', rating: '4.5 Stars', badge_hint: /platter|4\.5/i },
      { vintage: '2021', publication: 'Robert Parker Wine Advocate 2025', award_year: '2025', rating: '93 Points', badge_hint: /parker|advocate|93/i },
    ],
  },
  {
    handle: 'waterford-heatherleigh',
    webflow: 'waterford-heatherleigh',
    awards: [
      { vintage: 'NV', publication: "Platter's Wine Guide 2023", award_year: '2023', rating: '4 Stars', badge_hint: /platter.*2023|2023.*platter|4\s*star/i },
      { vintage: 'NV', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars', badge_hint: /platter.*2025|2025.*platter|4\.5/i },
    ],
  },
  {
    handle: 'waterford-rose-mary',
    webflow: 'waterford-rose-mary',
    awards: [
      { vintage: '2025', publication: 'Winemag Rosé Report 2025', award_year: '2025', rating: '92 Points', badge_hint: /winemag|ros[eé]|92/i },
      { vintage: '2025', publication: 'WCellar Top 10 SA Wines 2026', award_year: '2026', rating: '', badge_hint: /wcellar|cellar|top.?10/i },
      { vintage: '2024', publication: 'Rosé Wine and Spirit Challenge 2025', award_year: '2025', rating: 'Gold', badge_hint: /ros[eé].*spirit|spirit.*challenge|gold/i },
    ],
  },
  {
    handle: 'pecan-stream-chenin-blanc-1',
    webflow: 'pecan-stream-chenin-blanc',
    awards: [
      { vintage: '2024', publication: 'Gold Wine Awards 2024', award_year: '2024', rating: 'Gold', badge_hint: /gold.?wine|gold/i },
    ],
  },
];

function fetchBadgeUrls(webflowSlug) {
  const url = `https://www.waterfordestate.co.za/wines/${webflowSlug}`;
  const out = join(tmpdir(), `wf-${slug(webflowSlug)}.html`);
  try {
    execFileSync('curl.exe', ['-sL', url, '-o', out], { stdio: 'ignore' });
    const html = readFileSync(out, 'utf8');
    const urls = [...html.matchAll(/https:\/\/cdn\.prod\.website-files\.com\/[^"'\\\s>]+\.(?:png|jpe?g|webp|avif|svg)/gi)]
      .map((m) => decodeURIComponent(m[0]));
    // Prefer award-like filenames; exclude bottle / hero photos
    const badges = [...new Set(urls)].filter((u) => {
      const name = u.toLowerCase();
      if (/_web_750|bottle|magnum|favicon|webclip|logo|fountain|scaled|cabernet\.jpg|waterford-\d/i.test(name)) return false;
      return /platter|ta\s|tim|atkin|parker|gilbert|gaillard|gold|star|point|wcellar|winemag|ros[eé]|master|badge|medal|award|diners|advocate|double|report/i.test(name)
        || /\/[0-9a-f]{8,}[^/]*\.(avif|png|jpe?g|webp)$/i.test(name) && !/mrt|web_750|waterford%20estate/i.test(name);
    });
    return badges;
  } catch {
    return [];
  } finally {
    try { unlinkSync(out); } catch {}
  }
}

function pickBadge(badges, award, used) {
  const candidates = badges.filter((u) => !used.has(u));
  if (!candidates.length) return '';
  const hinted = candidates.find((u) => award.badge_hint.test(u));
  if (hinted) return hinted;
  // Prefer small-ish award assets (filename keywords already filtered)
  return candidates[0] || '';
}

function ensureBadgeUrlField() {
  const defs = unwrap(
    run(`
      query {
        metaobjectDefinitionByType(type: "wine_award") {
          id
          fieldDefinitions { key name }
        }
      }
    `),
    'metaobjectDefinitionByType'
  );
  if (!defs?.id) throw new Error('wine_award metaobject definition missing — run setup-wine-award-metaobject.mjs first');
  const has = (defs.fieldDefinitions || []).some((f) => f.key === 'badge_url');
  if (has) {
    console.log('badge_url field exists');
    return;
  }
  console.log('Adding badge_url field to wine_award…');
  const res = unwrap(
    run(
      `
      mutation ($definition: MetaobjectDefinitionUpdateInput!, $id: ID!) {
        metaobjectDefinitionUpdate(id: $id, definition: $definition) {
          metaobjectDefinition { id }
          userErrors { field message code }
        }
      }
    `,
      {
        id: defs.id,
        definition: {
          fieldDefinitions: [
            {
              create: {
                key: 'badge_url',
                name: 'Badge URL',
                type: 'url',
                description: 'External badge image URL (e.g. Webflow CDN) when not uploaded to Files',
              },
            },
          ],
        },
      },
      true
    ),
    'metaobjectDefinitionUpdate'
  );
  if (res?.userErrors?.length) {
    console.error('badge_url field errors', res.userErrors);
  } else {
    console.log('badge_url field created');
  }
}

function findProduct(handle) {
  const res = unwrap(
    run(`
      query {
        productByHandle(handle: "${handle}") {
          id
          title
          handle
        }
      }
    `),
    'productByHandle'
  );
  return res;
}

function upsertAward(handle, fields) {
  const existing = unwrap(
    run(`
      query {
        metaobjectByHandle(handle: { type: "wine_award", handle: "${handle}" }) {
          id
        }
      }
    `),
    'metaobjectByHandle'
  );

  const fieldInputs = Object.entries(fields)
    .filter(([, v]) => v != null && v !== '')
    .map(([key, value]) => ({ key, value: String(value) }));

  if (existing?.id) {
    const updated = unwrap(
      run(
        `
        mutation ($id: ID!, $metaobject: MetaobjectUpdateInput!) {
          metaobjectUpdate(id: $id, metaobject: $metaobject) {
            metaobject { id handle }
            userErrors { field message code }
          }
        }
      `,
        { id: existing.id, metaobject: { fields: fieldInputs } },
        true
      ),
      'metaobjectUpdate'
    );
    if (updated?.userErrors?.length) throw new Error(JSON.stringify(updated.userErrors));
    return updated.metaobject.id;
  }

  const created = unwrap(
    run(
      `
      mutation ($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject { id handle }
          userErrors { field message code }
        }
      }
    `,
      {
        metaobject: {
          type: 'wine_award',
          handle,
          fields: fieldInputs,
        },
      },
      true
    ),
    'metaobjectCreate'
  );
  if (created?.userErrors?.length) throw new Error(JSON.stringify(created.userErrors));
  return created.metaobject.id;
}

function attachAwards(productId, awardIds) {
  const res = unwrap(
    run(
      `
      mutation ($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key }
          userErrors { field message code }
        }
      }
    `,
      {
        metafields: [
          {
            ownerId: productId,
            namespace: 'custom',
            key: 'awards',
            type: 'list.metaobject_reference',
            value: JSON.stringify(awardIds),
          },
        ],
      },
      true
    ),
    'metafieldsSet'
  );
  if (res?.userErrors?.length) throw new Error(JSON.stringify(res.userErrors));
}

async function main() {
  ensureBadgeUrlField();

  const cacheDir = join(tmpdir(), 'wf-award-badges');
  mkdirSync(cacheDir, { recursive: true });

  for (const product of PRODUCTS) {
    const shopProduct = findProduct(product.handle);
    if (!shopProduct?.id) {
      console.warn(`SKIP missing product handle=${product.handle}`);
      continue;
    }
    console.log(`\n== ${shopProduct.title} (${product.handle}) ==`);

    const badges = fetchBadgeUrls(product.webflow);
    console.log(`  scraped ${badges.length} badge candidates`);
    badges.slice(0, 8).forEach((u) => console.log('   -', u.split('/').pop()));

    const used = new Set();
    const awardIds = [];

    for (const [i, award] of product.awards.entries()) {
      const badgeUrl = pickBadge(badges, award, used);
      if (badgeUrl) used.add(badgeUrl);

      const handle = slug(`${product.handle}-${award.publication}-${award.rating || award.award_year}-${i}`);
      const alt = [award.publication, award.rating].filter(Boolean).join(' — ');
      const id = upsertAward(handle, {
        vintage: award.vintage,
        publication: award.publication,
        award_year: award.award_year,
        rating: award.rating,
        badge_alt: alt,
        badge_url: badgeUrl || '',
      });
      awardIds.push(id);
      console.log(`  award: ${award.vintage} | ${award.publication} | ${award.rating || '—'} → ${badgeUrl ? 'badge' : 'NO BADGE'}`);
    }

    attachAwards(shopProduct.id, awardIds);
    console.log(`  attached ${awardIds.length} awards`);
  }

  console.log('\ndone');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
