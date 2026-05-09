import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { RollbackEngine } from '../packages/runtime/dist/index.js';

test('rollback checkpoint rejects sibling paths that share the root prefix', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-root-'));
  const siblingDir = `${rootDir}-outside`;
  await mkdir(siblingDir, { recursive: true });
  const outsideFile = join(siblingDir, 'secret.txt');
  await writeFile(outsideFile, 'outside-root', 'utf8');

  const engine = new RollbackEngine(rootDir);

  await assert.rejects(
    () => engine.checkpointFile({
      workflowId: 'workflow-boundary',
      stepId: 'checkpoint',
      targetPath: outsideFile,
      vedatraceSpan: 'VT-TEST-BOUNDARY'
    }),
    /ROLLBACK_TARGET_OUTSIDE_ROOT/
  );
});

test('rollback checkpoint still accepts files inside the runtime root', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-root-'));
  const insideFile = join(rootDir, 'sandbox', 'proof.txt');
  await mkdir(join(rootDir, 'sandbox'), { recursive: true });
  await writeFile(insideFile, 'inside-root', 'utf8');

  const engine = new RollbackEngine(rootDir);
  const checkpoint = await engine.checkpointFile({
    workflowId: 'workflow-boundary',
    stepId: 'checkpoint',
    targetPath: insideFile,
    vedatraceSpan: 'VT-TEST-BOUNDARY'
  });

  assert.equal(checkpoint.verified, true);
  assert.equal(checkpoint.snapshot_type, 'FILE');
});
