import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { LocalAuditLedger } from '../packages/audit/dist/index.js';

test('local audit ledger continues HMAC chain across runtime restarts', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-audit-'));
  const hmacKey = 'test_hmac_key_for_restart_chain';

  const firstLedger = LocalAuditLedger.inRoot(rootDir, hmacKey);
  const firstSpan = await firstLedger.appendSpan({
    workflow_id: 'workflow-audit-chain',
    step_id: 'first',
    agent_name: 'audit-test',
    event_type: 'FIRST_APPEND',
    status: 'SUCCESS',
    metadata: {}
  });

  const restartedLedger = LocalAuditLedger.inRoot(rootDir, hmacKey);
  const secondSpan = await restartedLedger.appendSpan({
    workflow_id: 'workflow-audit-chain',
    step_id: 'second',
    agent_name: 'audit-test',
    event_type: 'SECOND_APPEND',
    status: 'SUCCESS',
    metadata: {}
  });

  assert.equal(secondSpan.prev_hmac, firstSpan.hmac);
});
