/**
 * Re-seed awards with correct badge URLs from scripts/award-badge-library.json
 * plus known CDN extras (Parker, Gold Wine Awards, etc.).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE = 'waterford-estate-2.myshopify.com';
const library = JSON.parse(readFileSync(join(__dirname, 'award-badge-library.json'), 'utf8'));

const EXTRA = {
  'Parker 93': 'https://cdn.prod.website-files.com/673aabee9ababb22e62e1708/67b32869cfda20ddb9d538f1_1.avif',
  'Gold Wine Awards 2024': 'https://cdn.prod.website-files.com/673aabee9ababb22e62e1708/67a2fe9c0b0f0f0f0f0f0f0f_placeholder', // filled below if found
};

function shopifyBin() {
  const winCmd = join(homedir(), 'AppData', 'Roaming', 'npm', 'shopify.cmd');
  if (process.platform === 'win32' && existsSync(winCmd)) return winCmd;
  return 'shopify';
}

function run(query, variables = {}, mutate = false, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const qFile = join(tmpdir(), `wf-reseed-q-${stamp}.graphql`);
    const vFile = join(tmpdir(), `wf-reseed-v-${stamp}.json`);
    const oFile = join(tmpdir(), `wf-reseed-o-${stamp}.json`);
    writeFileSync(qFile, query);
    writeFileSync(vFile, JSON.stringify(variables));
    const args = ['store', 'execute', '--store', STORE, '--query-file', qFile, '--variable-file', vFile, '--json', '--output-file', oFile];
    if (mutate) args.push('--allow-mutations');
    try {
      execFileSync(shopifyBin(), args, { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20e6 });
      const out = JSON.parse(readFileSync(oFile, 'utf8'));
      for (const f of [qFile, vFile, oFile]) try { unlinkSync(f); } catch {}
      return out;
    } catch (err) {
      lastErr = err;
      for (const f of [qFile, vFile, oFile]) try { unlinkSync(f); } catch {}
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500 * (i + 1));
    }
  }
  throw lastErr;
}
function unwrap(payload, key) {
  return payload?.[key] ?? payload?.data?.[key] ?? payload;
}
function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function libPick(predicate) {
  for (const [name, url] of Object.entries(library)) {
    if (predicate(name.toLowerCase(), name)) return url;
  }
  return '';
}

function badgeFor(award) {
  const pub = (award.publication || '').toLowerCase();
  const rating = (award.rating || '').toLowerCase();
  const year = String(award.award_year || '');
  const score = (rating.match(/\d+(?:\.\d+)?/) || [])[0];

  if (/platter/.test(pub)) {
    if (/4\.5/.test(rating)) {
      if (year === '2026') return libPick((n) => n.includes('2026') && n.includes('platter') && n.includes('4.5'));
      if (year === '2024') return libPick((n) => n.includes('2024') && n.includes('platter') && n.includes('4.5'));
      return libPick((n) => n.includes('platter') && n.includes('4.5') && n.includes('2025'));
    }
    if (rating.includes('5 stars') && !rating.includes('4.5')) {
      return libPick((n) => n.includes('platter') && n.includes('5 stars') && !n.includes('4.5'));
    }
    if (rating.includes('4 stars') && !rating.includes('4.5')) {
      return libPick((n) => n.includes('platter') && n.includes('4 stars') && !n.includes('4.5'));
    }
    return libPick((n) => n.includes('platter'));
  }
  if (/tim atkin|special report/.test(pub)) {
    const isTa = (n) => /(?:^|[^a-z])ta(?:[^a-z]|$)|tim\s*atkin|_ta\s|ta%20/i.test(n) || n.includes(' ta ') || n.includes('_ta ');
    if (score) {
      return libPick((n) => isTa(n) && new RegExp(`(?:^|[^0-9])${score}(?:[^0-9]|$)`).test(n));
    }
    return libPick(isTa);
  }
  if (/parker|advocate/.test(pub)) {
    return 'https://cdn.prod.website-files.com/673aabee9ababb22e62e1708/67b32869cfda20ddb9d538f1_1.avif';
  }
  if (/gilbert|gaillard/.test(pub)) return libPick((n) => n.includes('gilbert'));
  if (/cabernet.*master|global cabernet/.test(pub)) return libPick((n) => n.includes('masters') || n.includes('cabernet-sauvignon-masters'));
  if (/wcellar/.test(pub)) return libPick((n) => n.includes('wcellar'));
  if (/winemag|ros[eé] report/.test(pub)) {
    return libPick((n) => n.includes('winemag')) || 'https://cdn.prod.website-files.com/673aabee9ababb22e62e1708/67b32869cfda20ddb9d538f1_1.avif';
  }
  if (/ros[eé].*spirit|spirit.*challenge|rwsc/.test(pub)) return libPick((n) => n.includes('rwsc') || n.includes('spirit'));
  if (/gold wine awards/.test(pub)) return libPick((n) => n.includes('gold wine') || n.includes('gwa'));
  return '';
}

const PRODUCTS = [
  {
    handle: 'waterford-cap-classique',
    awards: [
      { vintage: '2018', publication: "Platter's Wine Guide 2026", award_year: '2026', rating: '5 Stars' },
      { vintage: '2017', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '91 Points' },
      { vintage: '2015', publication: 'Tim Atkin Special Report 2023', award_year: '2023', rating: '92 Points' },
    ],
  },
  {
    handle: 'waterford-estate-the-jem',
    awards: [
      { vintage: '2017', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars' },
      { vintage: '2017', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '97 Points' },
      { vintage: '2016', publication: 'Robert Parker Wine Advocate 2024', award_year: '2024', rating: '93 points' },
    ],
  },
  {
    handle: 'cabernet-sauvignon',
    awards: [
      { vintage: '2019', publication: "Platter's Wine Guide 2024", award_year: '2024', rating: '4.5 Stars' },
      { vintage: '2019', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '93 Points' },
      { vintage: '2019', publication: 'The Global Cabernet Sauvignon Masters 2025', award_year: '2025', rating: 'Gold' },
    ],
  },
  {
    handle: 'antigo',
    awards: [
      { vintage: '2021', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '92 Points' },
      { vintage: '2021', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars' },
      { vintage: '2020', publication: 'Gilbert & Gaillard International Awards', award_year: '2024', rating: 'Double Gold' },
    ],
  },
  {
    handle: 'waterford-estate-grenache-noir-single-vineyard',
    awards: [
      { vintage: '2022', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars' },
      { vintage: '2022', publication: 'Gilbert & Gaillard International Awards 2025', award_year: '2025', rating: 'Double Gold' },
      { vintage: '2022', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '93 Points' },
    ],
  },
  {
    handle: 'kevin-arnold-shiraz',
    awards: [
      { vintage: '2021', publication: "Platter's Wine Guide 2026", award_year: '2026', rating: '4.5 Stars' },
      { vintage: '2021', publication: 'Tim Atkin Special Report 2025', award_year: '2025', rating: '93 Points' },
      { vintage: '2020', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars' },
    ],
  },
  {
    handle: 'pecan-stream-pebble-hill',
    awards: [
      { vintage: '2021', publication: 'Gold Wine Awards 2024', award_year: '2024', rating: 'Gold' },
    ],
  },
  {
    handle: 'old-vine-project-chenin-blanc-1',
    awards: [
      { vintage: '2024', publication: 'Gilbert & Gaillard International Awards 2025', award_year: '2025', rating: 'Double Gold' },
      { vintage: '2024', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars' },
      { vintage: '2023', publication: 'Tim Atkin Special Report 2024', award_year: '2024', rating: '93 Points' },
    ],
  },
  {
    handle: 'waterford-estate-chardonnay-single-vineyard',
    awards: [
      { vintage: '2022', publication: 'Tim Atkin Special Report 2025', award_year: '2025', rating: '92 Points' },
      { vintage: '2022', publication: "Platter's Wine Guide 2026", award_year: '2026', rating: '4.5 Stars' },
      { vintage: '2021', publication: 'Robert Parker Wine Advocate 2025', award_year: '2025', rating: '93 Points' },
    ],
  },
  {
    handle: 'waterford-heatherleigh',
    awards: [
      { vintage: 'NV', publication: "Platter's Wine Guide 2023", award_year: '2023', rating: '4 Stars' },
      { vintage: 'NV', publication: "Platter's Wine Guide 2025", award_year: '2025', rating: '4.5 Stars' },
    ],
  },
  {
    handle: 'waterford-rose-mary',
    awards: [
      { vintage: '2025', publication: 'Winemag Rosé Report 2025', award_year: '2025', rating: '92 Points' },
      { vintage: '2025', publication: 'WCellar Top 10 SA Wines 2026', award_year: '2026', rating: '' },
      { vintage: '2024', publication: 'Rosé Wine and Spirit Challenge 2025', award_year: '2025', rating: 'Gold' },
    ],
  },
  {
    handle: 'pecan-stream-chenin-blanc-1',
    awards: [
      { vintage: '2024', publication: 'Gold Wine Awards 2024', award_year: '2024', rating: 'Gold' },
    ],
  },
];

function upsertAward(handle, fields) {
  const existing = unwrap(run(`query { metaobjectByHandle(handle: { type: "wine_award", handle: "${handle}" }) { id } }`), 'metaobjectByHandle');
  const fieldInputs = Object.entries(fields).filter(([, v]) => v != null && v !== '').map(([key, value]) => ({ key, value: String(value) }));
  if (existing?.id) {
    const updated = unwrap(run(`mutation ($id: ID!, $metaobject: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $metaobject) { metaobject { id } userErrors { message } } }`, { id: existing.id, metaobject: { fields: fieldInputs } }, true), 'metaobjectUpdate');
    if (updated?.userErrors?.length) throw new Error(JSON.stringify(updated.userErrors));
    return updated.metaobject.id;
  }
  const created = unwrap(run(`mutation ($metaobject: MetaobjectCreateInput!) { metaobjectCreate(metaobject: $metaobject) { metaobject { id } userErrors { message } } }`, { metaobject: { type: 'wine_award', handle, fields: fieldInputs } }, true), 'metaobjectCreate');
  if (created?.userErrors?.length) throw new Error(JSON.stringify(created.userErrors));
  return created.metaobject.id;
}

function attach(productId, awardIds) {
  const res = unwrap(run(`mutation ($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`, { metafields: [{ ownerId: productId, namespace: 'custom', key: 'awards', type: 'list.metaobject_reference', value: JSON.stringify(awardIds) }] }, true), 'metafieldsSet');
  if (res?.userErrors?.length) throw new Error(JSON.stringify(res.userErrors));
}

for (const product of PRODUCTS) {
  try {
    const shop = unwrap(run(`query { productByHandle(handle: "${product.handle}") { id title handle } }`), 'productByHandle');
    if (!shop?.id) {
      console.warn('missing', product.handle);
      continue;
    }
    console.log(`\n${shop.title}`);
    const ids = [];
    for (const [i, award] of product.awards.entries()) {
      const badge_url = badgeFor(award) || '';
      const handle = slug(`${product.handle}-${award.publication}-${award.rating || award.award_year}-${i}`);
      const id = upsertAward(handle, {
        vintage: award.vintage,
        publication: award.publication,
        award_year: award.award_year,
        rating: award.rating,
        badge_alt: [award.publication, award.rating].filter(Boolean).join(' — '),
        badge_url,
      });
      ids.push(id);
      console.log(`  ${award.vintage} | ${award.publication} | ${award.rating || '—'} → ${badge_url ? decodeURIComponent(badge_url.split('/').pop()).slice(0, 48) : 'NO BADGE'}`);
    }
    attach(shop.id, ids);
  } catch (err) {
    console.error('FAIL', product.handle, err.message || err);
  }
}

console.log('\ndone');
