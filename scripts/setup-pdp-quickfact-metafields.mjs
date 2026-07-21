/**
 * Create product metafield definitions used by the Waterford PDP quick-facts strip.
 * Idempotent — skips keys that already exist.
 *
 * Usage:
 *   node scripts/setup-pdp-quickfact-metafields.mjs
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
  { key: 'vintage', name: 'Vintage', type: 'single_line_text_field' },
  { key: 'alcohol', name: 'Alcohol', type: 'single_line_text_field' },
  { key: 'blend_summary', name: 'Blend summary', type: 'single_line_text_field' },
  { key: 'new_oak', name: 'New oak', type: 'single_line_text_field' },
  { key: 'tagline', name: 'Tagline', type: 'multi_line_text_field' },
  { key: 'video_url', name: 'Video URL', type: 'url' },
  { key: 'video_thumbnail', name: 'Video thumbnail', type: 'file_reference' },
  { key: 'distributors', name: 'Distributors', type: 'single_line_text_field' },
];

function run(query, variables = {}) {
  const stamp = `${process.pid}-${Date.now()}`;
  const qFile = join(tmpdir(), `wf-qf-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-qf-v-${stamp}.json`);
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
    },
  };
  if (def.type === 'file_reference') {
    input.definition.validations = [{ name: 'file_type_options', value: '["Image"]' }];
  }
  const res = run(createQ, input);
  const errors = res?.data?.metafieldDefinitionCreate?.userErrors || [];
  if (errors.length) {
    console.error(`FAIL ${def.key}`, errors);
  } else {
    console.log(`created ${def.key}`, res?.data?.metafieldDefinitionCreate?.createdDefinition?.id);
  }
}

console.log('done');
