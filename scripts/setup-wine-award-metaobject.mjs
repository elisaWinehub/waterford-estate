/**
 * Idempotent setup for Waterford Estate wine awards data model.
 *
 * Creates:
 *   1. Metaobject definition type `wine_award` (six fields)
 *   2. Product metafield `custom.awards` → list.metaobject_reference to wine_award
 *
 * Auth (either works):
 *   A) Env vars (task-preferred):
 *        SHOPIFY_STORE_DOMAIN=waterford-estate-2.myshopify.com
 *        SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_…
 *   B) Shopify CLI store auth (this repo's usual path):
 *        shopify store auth --store waterford-estate-2.myshopify.com --scopes …
 *        then run with --cli (default when token env is missing)
 *
 * Admin API version: 2025-10 (bump when the project standardizes on a newer version).
 *
 * Usage:
 *   node scripts/setup-wine-award-metaobject.mjs
 *   node scripts/setup-wine-award-metaobject.mjs --cli
 *   node scripts/setup-wine-award-metaobject.mjs --token
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_VERSION = '2025-10';
const DEFAULT_STORE = 'waterford-estate-2.myshopify.com';

const STORE =
  process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '') ||
  DEFAULT_STORE;

const TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || '';
const FORCE_CLI = process.argv.includes('--cli');
const FORCE_TOKEN = process.argv.includes('--token');
const USE_CLI = FORCE_CLI || (!FORCE_TOKEN && !TOKEN);

const OUTPUT_PATH = join(__dirname, 'wine-award-setup-output.json');

const METAOBJECT_TYPE = 'wine_award';

const FIELD_DEFINITIONS = [
  { key: 'vintage', name: 'Vintage', type: 'single_line_text_field', required: false },
  { key: 'publication', name: 'Publication', type: 'single_line_text_field', required: false },
  { key: 'award_year', name: 'Award Year', type: 'single_line_text_field', required: false },
  { key: 'rating', name: 'Rating', type: 'single_line_text_field', required: false },
  {
    key: 'badge_image',
    name: 'Badge Image',
    type: 'file_reference',
    required: false,
    validations: [{ name: 'file_type_options', value: '["Image"]' }],
  },
  { key: 'badge_alt', name: 'Badge Alt Text', type: 'single_line_text_field', required: false },
];

function runViaCli(query, variables = {}) {
  const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const qFile = join(tmpdir(), `wf-award-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-award-v-${stamp}.json`);
  const oFile = join(tmpdir(), `wf-award-o-${stamp}.json`);
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
    try {
      unlinkSync(qFile);
    } catch {}
    try {
      unlinkSync(vFile);
    } catch {}
    try {
      unlinkSync(oFile);
    } catch {}
  }
}

async function runViaToken(query, variables = {}) {
  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (json.errors?.length) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data ?? json;
}

async function gql(query, variables) {
  if (USE_CLI) return runViaCli(query, variables);
  if (!TOKEN) {
    throw new Error(
      'Missing SHOPIFY_ADMIN_API_ACCESS_TOKEN. Set env vars or re-run with --cli after shopify store auth.'
    );
  }
  return runViaToken(query, variables);
}

function unwrap(payload, key) {
  return payload?.[key] ?? payload?.data?.[key] ?? payload;
}

async function findMetaobjectDefinition() {
  const data = await gql(`
    query FindWineAwardDefinition {
      metaobjectDefinitionByType(type: "${METAOBJECT_TYPE}") {
        id
        type
        name
        fieldDefinitions {
          key
          name
          type { name }
          required
        }
      }
    }
  `);
  return unwrap(data, 'metaobjectDefinitionByType');
}

async function createMetaobjectDefinition() {
  const data = await gql(
    `
    mutation CreateWineAwardMetaobject($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
          type
          name
          fieldDefinitions {
            key
            name
            type { name }
            required
          }
        }
        userErrors { field message code }
      }
    }
  `,
    {
      definition: {
        type: METAOBJECT_TYPE,
        name: 'Wine Award',
        description: 'Wine competition / critic award badge for product medals row',
        access: {
          storefront: 'PUBLIC_READ',
        },
        fieldDefinitions: FIELD_DEFINITIONS,
      },
    }
  );

  const result = unwrap(data, 'metaobjectDefinitionCreate');
  if (result?.userErrors?.length) {
    throw new Error(`metaobjectDefinitionCreate errors: ${JSON.stringify(result.userErrors, null, 2)}`);
  }
  return result.metaobjectDefinition;
}

async function findAwardsMetafieldDefinition() {
  const data = await gql(`
    query FindAwardsMetafield {
      metafieldDefinitions(first: 20, ownerType: PRODUCT, namespace: "custom", key: "awards") {
        nodes {
          id
          name
          namespace
          key
          type { name }
          validations { name value }
        }
      }
    }
  `);
  const nodes = unwrap(data, 'metafieldDefinitions')?.nodes || [];
  return nodes[0] || null;
}

async function createAwardsMetafieldDefinition(metaobjectDefinitionId) {
  const data = await gql(
    `
    mutation CreateAwardsMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          name
          namespace
          key
          type { name }
          validations { name value }
        }
        userErrors { field message code }
      }
    }
  `,
    {
      definition: {
        name: 'Awards',
        namespace: 'custom',
        key: 'awards',
        description: 'List of Wine Award metaobjects shown in the product medals row',
        type: 'list.metaobject_reference',
        ownerType: 'PRODUCT',
        access: {
          storefront: 'PUBLIC_READ',
        },
        validations: [
          {
            name: 'metaobject_definition_id',
            value: metaobjectDefinitionId,
          },
        ],
      },
    }
  );

  const result = unwrap(data, 'metafieldDefinitionCreate');
  if (result?.userErrors?.length) {
    throw new Error(`metafieldDefinitionCreate errors: ${JSON.stringify(result.userErrors, null, 2)}`);
  }
  return result.createdDefinition;
}

async function main() {
  console.log(`Store: ${STORE}`);
  console.log(`Auth: ${USE_CLI ? 'Shopify CLI (store execute)' : 'Admin API token'}`);
  console.log(`API version (token path): ${API_VERSION}`);

  let metaDef = await findMetaobjectDefinition();
  if (metaDef?.id) {
    console.log(`Metaobject definition already exists: ${metaDef.id}`);
  } else {
    console.log('Creating metaobject definition wine_award…');
    try {
      metaDef = await createMetaobjectDefinition();
    } catch (err) {
      // Retry without file_type_options validation if API rejects it
      if (String(err.message).includes('validation') || String(err.message).includes('file_type')) {
        console.warn('Retrying without badge_image file_type_options validation…');
        FIELD_DEFINITIONS.find((f) => f.key === 'badge_image').validations = undefined;
        metaDef = await createMetaobjectDefinition();
      } else {
        throw err;
      }
    }
    console.log(`Created metaobject definition: ${metaDef.id}`);
  }

  let metafieldDef = await findAwardsMetafieldDefinition();
  if (metafieldDef?.id) {
    console.log(`Product metafield custom.awards already exists: ${metafieldDef.id}`);
  } else {
    console.log('Creating product metafield custom.awards…');
    metafieldDef = await createAwardsMetafieldDefinition(metaDef.id);
    console.log(`Created metafield definition: ${metafieldDef.id}`);
  }

  const output = {
    store: STORE,
    apiVersion: API_VERSION,
    authMode: USE_CLI ? 'cli' : 'token',
    createdAt: new Date().toISOString(),
    metaobjectDefinition: {
      id: metaDef.id,
      type: metaDef.type || METAOBJECT_TYPE,
      name: metaDef.name || 'Wine Award',
      fields: (metaDef.fieldDefinitions || FIELD_DEFINITIONS).map((f) => ({
        key: f.key,
        name: f.name,
        type: f.type?.name || f.type,
        required: f.required ?? false,
      })),
    },
    metafieldDefinition: {
      id: metafieldDef.id,
      namespace: metafieldDef.namespace || 'custom',
      key: metafieldDef.key || 'awards',
      name: metafieldDef.name || 'Awards',
      type: metafieldDef.type?.name || 'list.metaobject_reference',
    },
  };

  mkdirSync(__dirname, { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(output, null, 2));
  console.log(`\nWrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err.stderr || err.message || err);
  process.exit(1);
});
