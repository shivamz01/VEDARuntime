import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  getPipelineDefinition,
  listPipelineNames,
  resolveStepCommand,
  runPipeline
} from '../scripts/pipeline.mjs';

test('native pipeline registry exposes self-contained proof audit and ship lanes', () => {
  assert.deepEqual(listPipelineNames(), ['audit', 'proof', 'ship']);

  const proof = getPipelineDefinition('proof');
  const audit = getPipelineDefinition('audit');
  const ship = getPipelineDefinition('ship');

  assert.equal(proof.externalWorkspaceRequired, false);
  assert.equal(audit.externalWorkspaceRequired, false);
  assert.equal(ship.externalWorkspaceRequired, false);

  for (const pipeline of [proof, audit, ship]) {
    assert.ok(pipeline.steps.length > 0);
    assert.equal(pipeline.steps.some(step => step.command[0] === 'python'), false);
    assert.equal(pipeline.steps.some(step => step.command.join(' ').includes('VEDA-OS-INFRA')), false);
  }
});

test('pipeline definitions encode the expected proof and shipping gates', () => {
  assert.deepEqual(
    getPipelineDefinition('proof').steps.map(step => step.id),
    ['build', 'contracts', 'free-demo', 'status']
  );

  assert.deepEqual(
    getPipelineDefinition('audit').steps.map(step => step.id),
    ['build', 'audit-tests', 'paid-demo', 'status']
  );

  assert.deepEqual(
    getPipelineDefinition('ship').steps.map(step => step.id),
    ['build', 'contracts', 'free-demo', 'paid-demo', 'status']
  );
});

test('pipeline runner resolves npm through cmd on Windows without shell mode', () => {
  assert.deepEqual(
    resolveStepCommand(['npm', 'run', 'build'], {
      platform: 'win32',
      comspec: 'C:\\Windows\\System32\\cmd.exe'
    }),
    {
      command: 'C:\\Windows\\System32\\cmd.exe',
      args: ['/d', '/s', '/c', 'npm', 'run', 'build']
    }
  );

  assert.deepEqual(
    resolveStepCommand(['node', '--test'], {
      platform: 'win32',
      comspec: 'C:\\Windows\\System32\\cmd.exe'
    }),
    {
      command: 'node',
      args: ['--test']
    }
  );
});

test('pipeline runner fails closed and writes a machine-checkable summary artifact', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-pipeline-'));
  const calls = [];

  const result = await runPipeline('proof', {
    cwd: rootDir,
    artifactDir: rootDir,
    now: () => new Date('2026-05-09T12:00:00.000Z'),
    executor: async (step) => {
      calls.push(step.id);
      return {
        exitCode: step.id === 'contracts' ? 1 : 0,
        stdout: step.id,
        stderr: step.id === 'contracts' ? 'contract failure' : '',
        durationMs: 5
      };
    }
  });

  assert.equal(result.status, 'FAILED');
  assert.equal(result.failedStep, 'contracts');
  assert.deepEqual(calls, ['build', 'contracts']);
  assert.match(result.artifactPath, /pipeline-proof-2026-05-09T12-00-00-000Z\.json$/);

  const artifact = JSON.parse(await readFile(result.artifactPath, 'utf8'));
  assert.equal(artifact.pipeline, 'proof');
  assert.equal(artifact.status, 'FAILED');
  assert.equal(artifact.failedStep, 'contracts');
  assert.deepEqual(artifact.steps.map(step => step.id), ['build', 'contracts']);
});
