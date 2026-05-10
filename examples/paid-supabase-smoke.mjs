import { createClient } from '@supabase/supabase-js';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  AuditBundleExporter,
  createLicensedPaidRuntime,
  issueLicenseKey
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
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local is optional if env vars are already exported.
  }
}

await loadEnvLocal();

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'VEDA_HMAC_KEY',
  'VEDA_LICENSE_SECRET'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key}_MISSING`);
  }
}

const workflowId = `paid-smoke-${Date.now()}`;
const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-v1-paid-supabase-'));

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

const licenseKey = issueLicenseKey(
  {
    license_id: `lic-${workflowId}`,
    customer_id: 'local-pro-smoke',
    plan: 'pro',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    founding_slot: 1
  },
  process.env.VEDA_LICENSE_SECRET
);

const kernel = createLicensedPaidRuntime({
  rootDir,
  hmacKey: process.env.VEDA_HMAC_KEY,
  supabaseClient: supabase,
  licenseKey,
  licenseSecret: process.env.VEDA_LICENSE_SECRET,
  profileId: 'enterprise_strict'
});

const result = await kernel.executeDemo({
  instruction: 'Create a rollback-safe paid Supabase proof file.',
  workflowId,
  sessionScope: 'paid-supabase-smoke-session',
  memory: [
    {
      id: 'paid-supabase-memory-1',
      workflow_id: workflowId,
      session_scope: 'paid-supabase-smoke-session',
      content: 'Use real Supabase persistence for Pro verification.',
      created_at: new Date().toISOString(),
      relevance_score: 0.99,
      source_type: 'USER'
    }
  ]
});

const { data: nonceRows, error: nonceError } = await supabase
  .from('nonce_registry')
  .select('*')
  .eq('workflow_id', workflowId);

if (nonceError) throw new Error(`NONCE_READ_FAILED: ${nonceError.message}`);

const { data: auditRows, error: auditError } = await supabase
  .from('audit_ledger')
  .select('*')
  .eq('workflow_id', workflowId);

if (auditError) throw new Error(`AUDIT_READ_FAILED: ${auditError.message}`);

const { data: pipelineRows, error: pipelineError } = await supabase
  .from('pipeline_log')
  .select('*')
  .eq('pipeline_id', workflowId);

if (pipelineError) throw new Error(`PIPELINE_READ_FAILED: ${pipelineError.message}`);

const exporter = new AuditBundleExporter(process.env.VEDA_HMAC_KEY);
const bundle = exporter.export(workflowId, result.spans);

const proof = {
  status: result.status,
  supabase: 'REAL',
  workflowId,
  rootDir,
  nonceInserted: (nonceRows ?? []).length === 1,
  auditSpanCount: (auditRows ?? []).length,
  pipelineLogWritten: (pipelineRows ?? []).length === 1,
  auditBundleValid: bundle.hmac_chain_valid === true && bundle.span_count === result.spans.length,
  rollbackVerified: result.rollback.verified === true
};

console.log(JSON.stringify(proof, null, 2));

if (
  proof.status !== 'COMPLETED' ||
  proof.supabase !== 'REAL' ||
  !proof.nonceInserted ||
  proof.auditSpanCount < 5 ||
  !proof.pipelineLogWritten ||
  !proof.auditBundleValid ||
  !proof.rollbackVerified
) {
  throw new Error('PRO_SUPABASE_SMOKE_FAILED');
}