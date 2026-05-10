import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';

import {
  DuplicateNonceError,
  SupabaseNonceRegistry
} from '../packages/pro/dist/index.js';

async function loadEnvLocal() {
  try {
    const raw = await readFile('.env.local', 'utf8');

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const index = trimmed.indexOf('=');
      if (index === -1) continue;

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional when env vars are already exported.
  }
}

await loadEnvLocal();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key}_MISSING`);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const registry = new SupabaseNonceRegistry(supabase);

const nonce = crypto.randomUUID();
const workflowId = `replay-test-${Date.now()}`;
const createdAt = new Date();
const expiresAt = new Date(createdAt.getTime() + 300_000);

console.log(`Step 1: inserting first nonce: ${nonce}`);

const firstRecord = await registry.insert({
  nonce,
  created_at: createdAt.toISOString(),
  expires_at: expiresAt.toISOString(),
  source_agent: 'pro-replay-test',
  workflow_id: workflowId
});

if (firstRecord.nonce !== nonce) {
  throw new Error('FIRST_INSERT_RETURNED_WRONG_NONCE');
}

const existsAfterFirstInsert = await registry.exists(nonce);

if (!existsAfterFirstInsert) {
  throw new Error('NONCE_EXISTS_CHECK_FAILED_AFTER_FIRST_INSERT');
}

console.log('First insert: SUCCESS');

console.log(`Step 2: attempting replay with same nonce: ${nonce}`);

let replayRejected = false;
let replayError = null;

try {
  await registry.insert({
    nonce,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    source_agent: 'pro-replay-test',
    workflow_id: workflowId
  });
} catch (error) {
  replayError = error;
  replayRejected =
    error instanceof DuplicateNonceError ||
    error?.name === 'DuplicateNonceError' ||
    String(error?.message ?? '').includes('NONCE_REPLAY');
}

if (!replayRejected) {
  console.error('Replay error:', replayError);
  throw new Error('FAILED: Replay attack was accepted. Duplicate nonce should be rejected.');
}

console.log('Second insert: REJECTED');

console.log(JSON.stringify({
  status: 'COMPLETED',
  supabase: 'REAL',
  workflowId,
  nonce,
  firstInsert: true,
  existsAfterFirstInsert,
  replayRejected: true
}, null, 2));