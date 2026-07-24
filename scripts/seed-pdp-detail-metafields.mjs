/**
 * Seed sample Details metafields on Waterford Rose-Mary (and optional second product).
 * Store: waterford-estate-2.myshopify.com only.
 *
 * Usage:
 *   node scripts/seed-pdp-detail-metafields.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const STORE = 'waterford-estate-2.myshopify.com';

function shopifyBin() {
  if (process.env.SHOPIFY_CLI) return process.env.SHOPIFY_CLI;
  const winCmd = join(homedir(), 'AppData', 'Roaming', 'npm', 'shopify.cmd');
  if (process.platform === 'win32' && existsSync(winCmd)) return winCmd;
  return 'shopify';
}

function run(query, variables = {}) {
  const stamp = `${process.pid}-${Date.now()}`;
  const qFile = join(tmpdir(), `wf-seed-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-seed-v-${stamp}.json`);
  writeFileSync(qFile, query, { encoding: 'utf8' });
  writeFileSync(vFile, JSON.stringify(variables), { encoding: 'utf8' });
  try {
    const out = execFileSync(
      shopifyBin(),
      [
        'store',
        'execute',
        '--store',
        STORE,
        '--query-file',
        qFile,
        '--variable-file',
        vFile,
        '--allow-mutations',
        '--json',
      ],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, shell: process.platform === 'win32' }
    );
    return JSON.parse(out);
  } finally {
    try {
      unlinkSync(qFile);
    } catch {}
    try {
      unlinkSync(vFile);
    } catch {}
  }
}

const SAMPLES = [
  {
    handle: 'waterford-rose-mary',
    fields: {
      fact_sheets: [
        '2025 Rosemary | https://www.waterfordestate.co.za/s/2025-Rosemary.pdf',
        '2024 Rosemary | https://www.waterfordestate.co.za/s/2024-Rosemary.pdf',
        '2023 Rosemary | https://www.waterfordestate.co.za/s/2023-Rosemary.pdf',
        '2022 Rosemary | https://www.waterfordestate.co.za/s/2022-Rosemary.pdf',
        '2021 Rosemary | https://www.waterfordestate.co.za/s/2021-Rosemary.pdf',
      ].join('\n'),
      tasting_notes:
        'Delicate pale salmon pink with aromas of strawberry, watermelon and rose petal. The palate is crisp and dry with bright red-berry fruit, a touch of spice and a clean, refreshing finish.',
      cultivars: ['35% Shiraz', '23% Tempranillo', '19% Malbec', '12% Mourvèdre', '11% Grenache'].join('\n'),
      wine_analysis: ['Alc 12.5%', 'TA 6.18 g/L', 'RS 1.28 g/L', 'pH 3.41'].join('\n'),
      vinification:
        'Made in a Blanc de Noir style. Free-run juice is gently pressed and cool-fermented to preserve delicate aromatics and a pale colour.',
      vineyard:
        'Fruit sourced from Waterford Estate and selected Stellenbosch vineyards suited to early-picked red cultivars for rosé.',
      maturation: 'Aged on fine lees for 4 months.',
      ageing_potential: '0 – 3 years from production',
      shipping:
        'Standard SA shipping R170, or free over R1,200. Delivery typically 5–7 working days. Contact us for international distributor options.',
      vintage: '2024',
      alcohol: '12.5%',
      blend_summary: 'Shiraz-led blend',
      new_oak: 'None',
    },
  },
];

const findQ = `
query ($q: String!) {
  products(first: 5, query: $q) {
    nodes { id handle title }
  }
}
`;

const setQ = `
mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id key namespace }
    userErrors { field message code }
  }
}
`;

for (const sample of SAMPLES) {
  const found = run(findQ, { q: `handle:${sample.handle}` });
  const product = found?.data?.products?.nodes?.[0] || found?.products?.nodes?.[0];
  if (!product) {
    console.error('Product not found:', sample.handle, JSON.stringify(found));
    continue;
  }
  console.log('Seeding', product.title, product.id);

  const metafields = Object.entries(sample.fields).map(([key, value]) => ({
    ownerId: product.id,
    namespace: 'custom',
    key,
    type: key === 'ageing_potential' || key === 'vintage' || key === 'alcohol' || key === 'blend_summary' || key === 'new_oak'
      ? 'single_line_text_field'
      : 'multi_line_text_field',
    value: String(value),
  }));

  // chunk in groups of 25
  for (let i = 0; i < metafields.length; i += 25) {
    const chunk = metafields.slice(i, i + 25);
    const res = run(setQ, { metafields: chunk });
    const errors =
      res?.data?.metafieldsSet?.userErrors || res?.metafieldsSet?.userErrors || [];
    if (errors.length) {
      console.error('FAIL', sample.handle, errors);
    } else {
      console.log('set', chunk.map((m) => m.key).join(', '));
    }
  }
}

console.log('done');
