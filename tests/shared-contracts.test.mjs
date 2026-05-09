import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';

import {
  HANDOFF_SCHEMA_VERSION,
  PRODUCT_VERSION,
  sealHandoff,
  verifyHandoffCrypto,
  validateHandoffShape
} from '../packages/shared/dist/index.js';

function validUnsignedHandoff(overrides = {}) {
  return {
    schema_version: 'v6.1.1',
    timestamp: new Date().toISOString(),
    nonce: '7f44f889-41f4-47d7-9133-f0d5f7e6a23a',
    source_agent: 'ceo-veda',
    target_agent: 'runtime-worker',
    task_id: 'VT-RUNTIME-001',
    payload: {
      instruction: 'write local proof',
      context: 'scoped',
      data: {},
      constraints: []
    },
    governance: {
      zte_cleared: true,
      spe_chain_passed: true,
      legal_cleared: true,
      budget_cleared: true
    },
    DATA_STATUS: 'REAL',
    phase: '2',
    sovereign_key: 'veda_local_free',
    ...overrides
  };
}

test('product version is Version 1 while handoff schema remains v6.1.1', () => {
  assert.equal(PRODUCT_VERSION, '1.0.0');
  assert.equal(HANDOFF_SCHEMA_VERSION, 'v6.1.1');
});

test('handoff validation rejects forbidden analysis-only pipeline status', () => {
  const result = validateHandoffShape({
    ...validUnsignedHandoff(),
    signature: 'sig_test',
    hmac: 'hmac_test',
    pipeline_status: 'ANALYSIS_ONLY'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('FORBIDDEN_FIELD_pipeline_status'));
});

test('handoff validation accepts canonical free and pro sovereign keys', () => {
  const free = validateHandoffShape({
    ...sealForShape(validUnsignedHandoff()),
  });
  const pro = validateHandoffShape({
    ...sealForShape(validUnsignedHandoff({
      sovereign_key: 'veda_pro_0123456789abcdef0123456789abcdef'
    })),
  });

  assert.equal(free.valid, true, free.errors.join(','));
  assert.equal(pro.valid, true, pro.errors.join(','));
});

test('handoff validation rejects non-canonical runtime sovereign keys', () => {
  const result = validateHandoffShape(sealForShape(validUnsignedHandoff({
    sovereign_key: 'veda_runtime_local_demo'
  })));

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('SOVEREIGN_KEY_INVALID'));
});

test('handoff crypto accepts ed25519 signed payload with matching HMAC', () => {
  const keyPair = generateKeyPairSync('ed25519');
  const hmacKey = 'test_hmac_key_for_handoff_crypto';
  const handoff = sealHandoff(validUnsignedHandoff(), {
    hmacKey,
    privateKey: keyPair.privateKey
  });

  const result = verifyHandoffCrypto(handoff, {
    hmacKey,
    publicKey: keyPair.publicKey
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('handoff crypto rejects tampered payloads and HMAC values', () => {
  const keyPair = generateKeyPairSync('ed25519');
  const hmacKey = 'test_hmac_key_for_handoff_crypto';
  const handoff = sealHandoff(validUnsignedHandoff(), {
    hmacKey,
    privateKey: keyPair.privateKey
  });

  const tamperedPayload = {
    ...handoff,
    payload: {
      ...handoff.payload,
      instruction: 'tampered instruction'
    }
  };
  const flippedHmacSuffix = handoff.hmac.endsWith('0') ? '1' : '0';
  const tamperedHmac = {
    ...handoff,
    hmac: `${handoff.hmac.slice(0, -1)}${flippedHmacSuffix}`
  };

  const payloadResult = verifyHandoffCrypto(tamperedPayload, {
    hmacKey,
    publicKey: keyPair.publicKey
  });
  const hmacResult = verifyHandoffCrypto(tamperedHmac, {
    hmacKey,
    publicKey: keyPair.publicKey
  });

  assert.equal(payloadResult.valid, false);
  assert.ok(payloadResult.errors.includes('SIGNATURE_INVALID'));
  assert.ok(payloadResult.errors.includes('HMAC_INVALID'));
  assert.equal(hmacResult.valid, false);
  assert.ok(hmacResult.errors.includes('HMAC_INVALID'));
});

function sealForShape(unsigned) {
  const keyPair = generateKeyPairSync('ed25519');
  return sealHandoff(unsigned, {
    hmacKey: 'test_hmac_key_for_shape_validation',
    privateKey: keyPair.privateKey
  });
}
