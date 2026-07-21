/**
 * Seed sample wine_award metaobjects onto Waterford Antigo (or first matching product).
 * Requires wine_award + custom.awards definitions (run setup-wine-award-metaobject.mjs first).
 *
 * Usage: node scripts/seed-wine-award-examples.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE = process.env.SHOPIFY_STORE_DOMAIN || 'waterford-estate-2.myshopify.com';

const AWARDS = [
  {
    handle: 'antigo-platters-2021-4-5',
    vintage: '2021',
    publication: "Platter's Wine Guide",
    award_year: '2026',
    rating: '4.5 Stars',
    badge_alt: "Platter's Wine Guide 2026 — 4.5 Stars",
  },
  {
    handle: 'antigo-tim-atkin-2021-93',
    vintage: '2021',
    publication: 'Tim Atkin Special Report',
    award_year: '2025',
    rating: '93 Points',
    badge_alt: 'Tim Atkin Special Report 2025 — 93 Points',
  },
  {
    handle: 'antigo-winemag-2019-92',
    vintage: '2019',
    publication: 'Winemag.co.za SA Wine Rating',
    award_year: '2024',
    rating: '92 points',
    badge_alt: 'Winemag.co.za SA Wine Rating 2024 — 92 points',
  },
];

function run(query, variables = {}) {
  const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const qFile = join(tmpdir(), `wf-seed-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-seed-v-${stamp}.json`);
  const oFile = join(tmpdir(), `wf-seed-o-${stamp}.json`);
  writeFileSync(qFile, query);
  writeFileSync(vFile, JSON.stringify(variables));
  try {
    execFileSync(
      'shopify',
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
        '--output-file',
        oFile,
      ],
      { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return JSON.parse(readFileSync(oFile, 'utf8'));
  } finally {
    for (const f of [qFile, vFile, oFile]) {
      try {
        unlinkSync(f);
      } catch {}
    }
  }
}

function unwrap(payload, key) {
  return payload?.[key] ?? payload?.data?.[key] ?? payload;
}

async function main() {
  const products = unwrap(
    run(`
      query {
        products(first: 25, query: "Antigo") {
          nodes { id title handle }
        }
      }
    `),
    'products'
  )?.nodes || [];

  let product = products.find((p) => /antigo/i.test(p.title) || /antigo/i.test(p.handle));
  if (!product) {
    const fallback = unwrap(
      run(`
        query {
          products(first: 5, query: "tag:'Red Wine'") {
            nodes { id title handle }
          }
        }
      `),
      'products'
    )?.nodes || [];
    product = fallback[0];
  }

  if (!product) throw new Error('No product found to attach awards');
  console.log(`Using product: ${product.title} (${product.id})`);

  const awardIds = [];
  for (const award of AWARDS) {
    const existing = unwrap(
      run(`
        query {
          metaobjectByHandle(handle: { type: "wine_award", handle: "${award.handle}" }) {
            id
            handle
          }
        }
      `),
      'metaobjectByHandle'
    );

    if (existing?.id) {
      console.log(`Award exists: ${award.handle} → ${existing.id}`);
      awardIds.push(existing.id);
      continue;
    }

    const created = unwrap(
      run(
        `
        mutation CreateAward($metaobject: MetaobjectCreateInput!) {
          metaobjectCreate(metaobject: $metaobject) {
            metaobject { id handle type }
            userErrors { field message code }
          }
        }
      `,
        {
          metaobject: {
            type: 'wine_award',
            handle: award.handle,
            fields: [
              { key: 'vintage', value: award.vintage },
              { key: 'publication', value: award.publication },
              { key: 'award_year', value: award.award_year },
              { key: 'rating', value: award.rating },
              { key: 'badge_alt', value: award.badge_alt },
            ],
            capabilities: {
              publishable: { status: 'ACTIVE' },
            },
          },
        }
      ),
      'metaobjectCreate'
    );

    if (created?.userErrors?.length) {
      // Retry without publishable capability if definition doesn't support it
      if (created.userErrors.some((e) => /capabilit/i.test(e.message || ''))) {
        const retry = unwrap(
          run(
            `
            mutation CreateAward($metaobject: MetaobjectCreateInput!) {
              metaobjectCreate(metaobject: $metaobject) {
                metaobject { id handle type }
                userErrors { field message code }
              }
            }
          `,
            {
              metaobject: {
                type: 'wine_award',
                handle: award.handle,
                fields: [
                  { key: 'vintage', value: award.vintage },
                  { key: 'publication', value: award.publication },
                  { key: 'award_year', value: award.award_year },
                  { key: 'rating', value: award.rating },
                  { key: 'badge_alt', value: award.badge_alt },
                ],
              },
            }
          ),
          'metaobjectCreate'
        );
        if (retry?.userErrors?.length) {
          throw new Error(JSON.stringify(retry.userErrors, null, 2));
        }
        console.log(`Created award: ${retry.metaobject.handle} → ${retry.metaobject.id}`);
        awardIds.push(retry.metaobject.id);
        continue;
      }
      throw new Error(JSON.stringify(created.userErrors, null, 2));
    }

    console.log(`Created award: ${created.metaobject.handle} → ${created.metaobject.id}`);
    awardIds.push(created.metaobject.id);
  }

  const metafieldSet = unwrap(
    run(
      `
      mutation SetAwards($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key type value }
          userErrors { field message code }
        }
      }
    `,
      {
        metafields: [
          {
            ownerId: product.id,
            namespace: 'custom',
            key: 'awards',
            type: 'list.metaobject_reference',
            value: JSON.stringify(awardIds),
          },
        ],
      }
    ),
    'metafieldsSet'
  );

  if (metafieldSet?.userErrors?.length) {
    throw new Error(JSON.stringify(metafieldSet.userErrors, null, 2));
  }

  const verify = unwrap(
    run(`
      query {
        product(id: "${product.id}") {
          title
          handle
          awards: metafield(namespace: "custom", key: "awards") {
            type
            value
            references(first: 10) {
              nodes {
                ... on Metaobject {
                  id
                  handle
                  type
                  fields { key value }
                }
              }
            }
          }
        }
      }
    `),
    'product'
  );

  const out = {
    product: { id: product.id, title: product.title, handle: product.handle },
    awardIds,
    metafield: verify?.awards,
    storefrontCheckHint: `On PDP Liquid: {{ product.metafields.custom.awards.value | json }}`,
  };

  writeFileSync(join(__dirname, 'wine-award-seed-output.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('\n=== SEED RESULT ===');
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err.stderr || err.message || err);
  process.exit(1);
});
