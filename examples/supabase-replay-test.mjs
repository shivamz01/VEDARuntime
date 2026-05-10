import { createClient } from '@supabase/supabase-js';
import { SupabaseNonceRegistry, DuplicateNonceError } from '../packages/pro/dist/index.js';
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
  const record = {
    nonce,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 300_000).toISOString(),
    source_agent: 'replay-tester'
  };

  console.log(`Step 1: Inserting first nonce: ${nonce}`);
  try {
    await registry.insert(record);
    console.log('First insert: SUCCESS');
  } catch (error) {
    console.error('First insert failed:', error.message);
    process.exit(1);
  }

  console.log(`Step 2: Attempting to replay the same nonce: ${nonce}`);
  try {
    await registry.insert(record);
    console.error('FAILED: Replay attack was successful! Nonce should have been rejected.');
    process.exit(1);
  } catch (error) {
    if (error instanceof DuplicateNonceError || error.message.includes('NONCE_REPLAY')) {
      console.log('Second insert (replay): REJECTED (Correct)');
      console.log('SUCCESS: Replay attack correctly rejected by Supabase nonce registry.');
    } else {
      console.error('FAILED: Unexpected error during replay:', error.message);
      process.exit(1);
    }
  }
}

runReplayTest().catch(console.error);
