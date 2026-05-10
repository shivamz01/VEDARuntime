import { createClient } from '@supabase/supabase-js';
import { SupabaseNonceRegistry } from '../packages/pro/dist/index.js';
import crypto from 'node:crypto';

async function runReplayTest() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const registry = new SupabaseNonceRegistry(supabase);

  const nonce = crypto.randomUUID();

  console.log(`Step 1: Inserting first nonce: ${nonce}`);
  const firstInsert = await registry.consume(nonce);
  console.log(`First insert: ${firstInsert ? 'SUCCESS' : 'FAILED'}`);

  if (!firstInsert) {
    console.error('First insert should have succeeded');
    process.exit(1);
  }

  console.log(`Step 2: Attempting to replay the same nonce: ${nonce}`);
  const secondInsert = await registry.consume(nonce);
  console.log(`Second insert (replay): ${secondInsert ? 'SUCCESS' : 'REJECTED'}`);

  if (secondInsert) {
    console.error('FAILED: Replay attack was successful! Nonce should have been rejected.');
    process.exit(1);
  }

  console.log('SUCCESS: Replay attack correctly rejected by Supabase nonce registry.');
}

runReplayTest().catch(console.error);
