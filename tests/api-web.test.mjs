import test from 'node:test';
import assert from 'node:assert/strict';

import { createApiServer, createFreeDemoPayload, createStatusPayload } from '../apps/api/dist/server.js';
import { renderHomePage } from '../apps/web/dist/server.js';

test('api status payload exposes Version 1 and free paid boundaries', () => {
  const payload = createStatusPayload();

  assert.equal(payload.productVersion, '1.0.0');
  assert.equal(payload.handoffSchemaVersion, 'v6.1.1');
  assert.ok(payload.freeFeatures.includes('local_runtime'));
  assert.ok(payload.paidFeatures.includes('supabase_audit'));
  assert.equal(payload.paidFeatures.includes('dashboard'), false);
});

test('web homepage presents free and paid product lanes', () => {
  const html = renderHomePage();

  assert.match(html, /VEDA Runtime Version 1/);
  assert.match(html, /Free/);
  assert.match(html, /Paid/);
  assert.match(html, /HANDOFF_JSON v6\.1\.1/);
  assert.doesNotMatch(html, /dashboard/i);
});

test('api defaults to a concrete local CORS origin instead of wildcard', async () => {
  const previous = process.env.VEDA_API_CORS_ORIGIN;
  delete process.env.VEDA_API_CORS_ORIGIN;
  const server = createApiServer();

  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/status`);

    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3101');
  } finally {
    if (previous === undefined) delete process.env.VEDA_API_CORS_ORIGIN;
    else process.env.VEDA_API_CORS_ORIGIN = previous;
    await new Promise(resolve => server.close(resolve));
  }
});

test('api demo refuses implicit demo HMAC keys in production mode', async () => {
  const previousMode = process.env.VEDA_RUNTIME_MODE;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousHmac = process.env.VEDA_HMAC_KEY;
  process.env.VEDA_RUNTIME_MODE = 'production';
  delete process.env.NODE_ENV;
  delete process.env.VEDA_HMAC_KEY;

  try {
    await assert.rejects(
      () => createFreeDemoPayload(),
      /VEDA_HMAC_KEY_REQUIRED/
    );
  } finally {
    restoreEnv('VEDA_RUNTIME_MODE', previousMode);
    restoreEnv('NODE_ENV', previousNodeEnv);
    restoreEnv('VEDA_HMAC_KEY', previousHmac);
  }
});

function restoreEnv(key, value) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
