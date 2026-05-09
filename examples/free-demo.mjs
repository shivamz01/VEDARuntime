import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { RuntimeKernel } from '../packages/runtime/dist/index.js';

const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-v1-demo-'));
const kernel = RuntimeKernel.createFree({
  rootDir,
  hmacKey: process.env.VEDA_HMAC_KEY || 'local_demo_hmac_key'
});

const result = await kernel.executeDemo({
  instruction: 'Create a rollback-safe local proof file.',
  workflowId: 'demo-workflow',
  sessionScope: 'demo-session',
  memory: [
    {
      id: 'demo-memory',
      workflow_id: 'demo-workflow',
      session_scope: 'demo-session',
      content: 'Use the local free proof path only.',
      created_at: new Date().toISOString(),
      relevance_score: 0.95,
      source_type: 'USER'
    }
  ]
});

console.log(JSON.stringify({
  status: result.status,
  dataStatus: result.dataStatus,
  rootDir,
  spans: result.spans.length,
  auditRows: result.auditRows.length,
  rollbackVerified: result.rollback.verified
}, null, 2));
