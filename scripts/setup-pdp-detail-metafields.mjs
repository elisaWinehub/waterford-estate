/**
 * Create product metafield definitions for PDP Details accordions.
 * Idempotent — skips keys that already exist.
 *
 * Usage:
 *   node scripts/setup-pdp-detail-metafields.mjs
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

const DEFINITIONS = [
  { key: 'fact_sheets', name: 'Fact sheets', type: 'multi_line_text_field', description: 'HTML or text list of fact-sheet links (one per line: Label | https://...)' },
  { key: 'tasting_notes', name: 'Tasting notes', type: 'multi_line_text_field' },
  { key: 'cultivars', name: 'Cultivars', type: 'multi_line_text_field', description: 'Blend / cultivar list (HTML or plain lines)' },
  { key: 'wine_analysis', name: 'Wine analysis', type: 'multi_line_text_field', description: 'Alc, TA, RS, pH etc.' },
  { key: 'vinification', name: 'Vinification', type: 'multi_line_text_field' },
  { key: 'vineyard', name: 'Vineyard', type: 'multi_line_text_field' },
  { key: 'maturation', name: 'Maturation', type: 'multi_line_text_field' },
  { key: 'ageing_potential', name: 'Ageing potential', type: 'single_line_text_field' },
  { key: 'shipping', name: 'Shipping', type: 'multi_line_text_field' },
  // Keep older keys used by the mockup layout
  { key: 'appearance', name: 'Appearance', type: 'multi_line_text_field' },
  { key: 'nose', name: 'Nose', type: 'multi_line_text_field' },
  { key: 'palate', name: 'Palate', type: 'multi_line_text_field' },
  { key: 'region', name: 'Region', type: 'single_line_text_field' },
  { key: 'release_date', name: 'Release date', type: 'single_line_text_field' },
  { key: 'cases_produced', name: 'Cases produced', type: 'single_line_text_field' },
  { key: 'closure', name: 'Closure', type: 'single_line_text_field' },
  { key: 'blend_composition', name: 'Blend composition', type: 'multi_line_text_field' },
  { key: 'technical_analysis', name: 'Technical analysis', type: 'multi_line_text_field' },
  { key: 'vineyard_winemaking', name: 'Vineyard & winemaking', type: 'multi_line_text_field' },
  { key: 'ageing_shipping', name: 'Ageing & shipping', type: 'multi_line_text_field' },
];

function run(query, variables = {}) {
  const stamp = `${process.pid}-${Date.now()}`;
  const qFile = join(tmpdir(), `wf-detail-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-detail-v-${stamp}.json`);
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

const listQ = `
query {
  metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: "custom") {
    nodes { id key name type { name } }
  }
}
`;

const createQ = `
mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition { id key }
    userErrors { field message code }
  }
}
`;

const existing = run(listQ);
const nodes = existing?.data?.metafieldDefinitions?.nodes || [];
const have = new Set(nodes.map((n) => n.key));
console.log('Existing custom product metafields:', [...have].sort().join(', ') || '(none)');

for (const def of DEFINITIONS) {
  if (have.has(def.key)) {
    console.log(`skip ${def.key} (exists)`);
    continue;
  }
  const input = {
    definition: {
      name: def.name,
      namespace: 'custom',
      key: def.key,
      type: def.type,
      ownerType: 'PRODUCT',
      pin: true,
      description: def.description || undefined,
    },
  };
  const res = run(createQ, input);
  const errors = res?.data?.metafieldDefinitionCreate?.userErrors || [];
  if (errors.length) {
    console.error(`FAIL ${def.key}`, errors);
  } else {
    console.log(`created ${def.key}`, res?.data?.metafieldDefinitionCreate?.createdDefinition?.id);
  }
}

console.log('done');
