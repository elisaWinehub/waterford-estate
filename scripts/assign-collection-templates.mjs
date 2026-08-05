/**
 * Assign alternate collection templates on waterford-estate-2 only.
 * Usage: node scripts/assign-collection-templates.mjs
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const STORE = 'waterford-estate-2.myshopify.com';
const MAP = {
  ranges: 'ranges',
  'larger-formats': 'larger-formats',
  gifting: 'gifting',
};

function shopifyBin() {
  const winCmd = join(homedir(), 'AppData', 'Roaming', 'npm', 'shopify.cmd');
  if (process.platform === 'win32' && existsSync(winCmd)) return winCmd;
  return 'shopify';
}

function run(query, variables = {}, mutate = false) {
  const stamp = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const qFile = join(tmpdir(), `wf-ct-q-${stamp}.graphql`);
  const vFile = join(tmpdir(), `wf-ct-v-${stamp}.json`);
  const oFile = join(tmpdir(), `wf-ct-o-${stamp}.json`);
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
      maxBuffer: 20e6,
    });
    return JSON.parse(readFileSync(oFile, 'utf8'));
  } finally {
    for (const f of [qFile, vFile, oFile]) try { unlinkSync(f); } catch {}
  }
}

function unwrap(payload, key) {
  return payload?.[key] ?? payload?.data?.[key] ?? payload;
}

for (const [handle, suffix] of Object.entries(MAP)) {
  const col = unwrap(
    run(`query { collectionByHandle(handle: "${handle}") { id title templateSuffix } }`),
    'collectionByHandle'
  );
  if (!col?.id) {
    console.warn('missing', handle);
    continue;
  }
  const res = unwrap(
    run(
      `mutation ($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id handle templateSuffix }
          userErrors { field message }
        }
      }`,
      { input: { id: col.id, templateSuffix: suffix } },
      true
    ),
    'collectionUpdate'
  );
  if (res?.userErrors?.length) {
    console.error(handle, res.userErrors);
  } else {
    console.log(`${handle} → template ${res?.collection?.templateSuffix || suffix}`);
  }
}

console.log('done');
