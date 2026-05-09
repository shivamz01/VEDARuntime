import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AuditBundleExporter,
  SupabaseAuditLedger
} from '../packages/pro/dist/index.js';

function createMockSupabase() {
  const store = {
    audit_ledger: []
  };

  const selectRows = (table) => ({
    eq: async (col, val) => {
      if (col === '1') return { data: store[table], error: null };
      return { data: store[table].filter(row => row[col] === val), error: null };
    },
    then: (resolve, reject) => Promise.resolve({ data: store[table], error: null }).then(resolve, reject)
  });

  return {
    from: (table) => ({
      select: () => selectRows(table),
      insert: (row) => ({
        select: async () => {
          store[table].push(row);
          return { data: row, error: null };
        }
      })
    }),
    _getStore: () => store
  };
}

test('supabase audit ledger continues HMAC chain across runtime restarts', async () => {
  const client = createMockSupabase();
  const hmacKey = 'test_hmac_key_for_supabase_restart_chain';

  const firstLedger = new SupabaseAuditLedger(client, hmacKey);
  const firstSpan = await firstLedger.appendSpan({
    workflow_id: 'workflow-paid-audit-chain',
    step_id: 'first',
    agent_name: 'paid-audit-test',
    event_type: 'FIRST_APPEND',
    status: 'SUCCESS',
    metadata: {}
  });

  const restartedLedger = new SupabaseAuditLedger(client, hmacKey);
  const secondSpan = await restartedLedger.appendSpan({
    workflow_id: 'workflow-paid-audit-chain',
    step_id: 'second',
    agent_name: 'paid-audit-test',
    event_type: 'SECOND_APPEND',
    status: 'SUCCESS',
    metadata: {}
  });

  assert.equal(secondSpan.prev_hmac, firstSpan.hmac);
});

test('audit bundle export rejects tampered span content', async () => {
  const client = createMockSupabase();
  const hmacKey = 'test_hmac_key_for_audit_bundle';
  const ledger = new SupabaseAuditLedger(client, hmacKey);
  const exporter = new AuditBundleExporter(hmacKey);

  const span = await ledger.appendSpan({
    workflow_id: 'workflow-paid-audit-bundle',
    step_id: 'first',
    agent_name: 'paid-audit-test',
    event_type: 'FIRST_APPEND',
    status: 'SUCCESS',
    metadata: { trusted: true }
  });

  const cleanBundle = exporter.export('workflow-paid-audit-bundle', [span]);
  const tamperedBundle = exporter.export('workflow-paid-audit-bundle', [{
    ...span,
    metadata: { trusted: false }
  }]);

  assert.equal(cleanBundle.hmac_chain_valid, true);
  assert.equal(tamperedBundle.hmac_chain_valid, false);
});
