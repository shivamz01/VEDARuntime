import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PaidRuntimeKernel } from '../packages/pro/dist/index.js';

// ─── Mock Supabase Client ───────────────────────────────────────────
function createMockSupabase() {
  const store = {
    nonce_registry: [],
    audit_ledger: [],
    pipeline_log: []
  };

  return {
    from: (table) => ({
      select: () => ({
        eq: async (col, val) => {
          if (col === '1') return { data: store[table], error: null };
          return { data: store[table].filter(row => row[col] === val), error: null };
        }
      }),
      insert: (row) => ({
        select: async () => {
          // Mock unique constraint error for nonce
          if (table === 'nonce_registry' && store[table].some(r => r.nonce === row.nonce)) {
            return { data: null, error: { message: 'duplicate key value violates unique constraint', code: '23505' } };
          }
          store[table].push(row);
          return { data: row, error: null };
        }
      })
    }),
    _getStore: () => store
  };
}

// ─── Run Paid Demo ──────────────────────────────────────────────────
const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-v1-paid-demo-'));
const mockSupabase = createMockSupabase();

const kernel = new PaidRuntimeKernel({
  rootDir,
  hmacKey: process.env.VEDA_HMAC_KEY || 'local_demo_hmac_key',
  supabaseClient: mockSupabase,
  profileId: 'enterprise_strict'
});

console.log('Running Paid Edition Demo (Enterprise Strict Profile)...\n');

try {
  const result = await kernel.executeDemo({
    instruction: 'Create a rollback-safe paid proof file.',
    workflowId: 'paid-demo-workflow',
    sessionScope: 'paid-session',
    memory: [
      {
        id: 'paid-memory-1',
        workflow_id: 'paid-demo-workflow',
        session_scope: 'paid-session',
        content: 'Use enterprise secure execution.',
        created_at: new Date().toISOString(),
        relevance_score: 0.98,
        source_type: 'USER'
      }
    ]
  });

  const store = mockSupabase._getStore();

  console.log(JSON.stringify({
    status: result.status,
    dataStatus: result.dataStatus,
    profile: 'enterprise_strict',
    rootDir,
    rollbackVerified: result.rollback.verified,
    supabaseInserts: {
      nonceCount: store.nonce_registry.length,
      auditSpanCount: store.audit_ledger.length,
      pipelineLogWritten: store.pipeline_log.length > 0
    }
  }, null, 2));

} catch (error) {
  console.error('Demo failed:', error.message);
}
