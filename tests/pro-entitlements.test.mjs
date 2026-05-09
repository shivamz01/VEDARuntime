import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEditionFeatures,
  isFeatureAllowed
} from '../packages/pro/dist/index.js';

test('free edition excludes Supabase and audit bundle paid features', () => {
  const free = getEditionFeatures('free');

  assert.equal(isFeatureAllowed(free, 'local_runtime'), true);
  assert.equal(isFeatureAllowed(free, 'supabase_audit'), false);
  assert.equal(isFeatureAllowed(free, 'audit_bundle_export'), false);
});

test('paid edition enables Supabase and audit bundle features', () => {
  const paid = getEditionFeatures('paid');

  assert.equal(isFeatureAllowed(paid, 'local_runtime'), true);
  assert.equal(isFeatureAllowed(paid, 'supabase_audit'), true);
  assert.equal(isFeatureAllowed(paid, 'audit_bundle_export'), true);
});

test('paid edition does not claim dashboard before dashboard is implemented', () => {
  const paid = getEditionFeatures('paid');

  assert.equal(paid.features.includes('dashboard'), false);
});
