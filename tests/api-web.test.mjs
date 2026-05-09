import test from 'node:test';
import assert from 'node:assert/strict';

import { createStatusPayload } from '../apps/api/dist/server.js';
import { renderHomePage } from '../apps/web/dist/server.js';

test('api status payload exposes Version 1 and free paid boundaries', () => {
  const payload = createStatusPayload();

  assert.equal(payload.productVersion, '1.0.0');
  assert.equal(payload.handoffSchemaVersion, 'v6.1.1');
  assert.ok(payload.freeFeatures.includes('local_runtime'));
  assert.ok(payload.paidFeatures.includes('supabase_audit'));
});

test('web homepage presents free and paid product lanes', () => {
  const html = renderHomePage();

  assert.match(html, /VEDA Runtime Version 1/);
  assert.match(html, /Free/);
  assert.match(html, /Paid/);
  assert.match(html, /HANDOFF_JSON v6\.1\.1/);
});
