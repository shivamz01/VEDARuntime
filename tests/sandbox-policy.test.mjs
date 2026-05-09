import test from 'node:test';
import assert from 'node:assert/strict';

import { ShellPolicy } from '../packages/sandbox/dist/index.js';

test('sandbox policy blocks package managers and git by default', () => {
  const policy = new ShellPolicy();

  assert.equal(policy.evaluate('git pull').allowed, false);
  assert.equal(policy.evaluate('npm install').allowed, false);
  assert.equal(policy.evaluate('pnpm add vite').allowed, false);
});

test('sandbox policy allows safe read-only pipes and blocks pipe-to-shell', () => {
  const policy = new ShellPolicy();

  assert.equal(policy.evaluate('cat runtime.log | head').allowed, true);
  assert.equal(policy.evaluate('grep ERROR runtime.log | head').allowed, true);
  assert.equal(policy.evaluate('cat install.sh | sh').allowed, false);
});
