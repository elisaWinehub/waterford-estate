/**
 * Create product metafield definitions for gift / mixed-case inclusions.
 * Idempotent — skips keys that already exist.
 *
 * Usage:
 *   node scripts/setup-inclusions-metafields.mjs
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
  {
    key: 'inclusions',
    name: 'Inclusions',
    type: 'multi_line_text_field',
    description: 'Gift contents / mixed-case inclusions (plain lines or HTML). Shown on gift and mixed-case product templates.',
  },
  {
    key: 'card_inclusions',
    name: 'Card inclusions summary',
    type: 'single_line_text_field',
    description: 'Short teaser on collection cards, e.g. "Includes Chardonnay, Cabernet & Shiraz". Leave blank on normal wines.',
  },
];

function run(query, variables = {}) {
  const stamp = `${process.pid}-${Date.now()}`;
  const qFile = join(tmpdir(), `wf-incl-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-incl-v-${stamp}.json`);
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
    nodes { key }
  }
}
`;

const createQ = `
mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition { id key }
    userErrors { field message }
  }
}
`;

const listRes = run(listQ);
const have = new Set((listRes?.data?.metafieldDefinitions?.nodes || []).map((n) => n.key));
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
