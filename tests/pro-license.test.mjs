import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createLicensedPaidRuntime,
  getEditionFeatures,
  issueLicenseKey,
  verifyLicenseKey,
} from "../packages/pro/dist/index.js";

function createMockSupabase() {
  const store = {
    nonce_registry: [],
    audit_ledger: [],
    pipeline_log: [],
  };

  const selectRows = table => ({
    eq: async (col, val) => ({ data: store[table].filter(row => row[col] === val), error: null }),
    then: (resolve, reject) => Promise.resolve({ data: store[table], error: null }).then(resolve, reject),
  });

  return {
    from: table => ({
      select: () => selectRows(table),
      insert: row => ({
        select: async () => {
          store[table].push(row);
          return { data: row, error: null };
        },
      }),
    }),
  };
}

test("issueLicenseKey creates a verifiable Pro license with paid features", () => {
  const secret = "test-license-secret";
  const key = issueLicenseKey({
    license_id: "lic_test_001",
    customer_id: "cus_test_001",
    plan: "pro",
    issued_at: "2026-01-01T00:00:00.000Z",
    expires_at: "2026-02-01T00:00:00.000Z",
    founding_slot: 1,
  }, secret);

  const result = verifyLicenseKey(key, secret, {
    now: new Date("2026-01-15T00:00:00.000Z"),
  });

  assert.equal(result.valid, true);
  assert.equal(result.edition, "paid");
  assert.ok(result.features.includes("supabase_audit"));
  assert.equal(result.features.includes("dashboard"), false);
});

test("verifyLicenseKey fails closed for tampered or expired keys", () => {
  const secret = "test-license-secret";
  const key = issueLicenseKey({
    license_id: "lic_test_002",
    customer_id: "cus_test_002",
    plan: "pro",
    issued_at: "2026-01-01T00:00:00.000Z",
    expires_at: "2026-01-02T00:00:00.000Z",
  }, secret);

  const tampered = key.replace("veda_pro_v1", "veda_free_v1");
  const tamperedResult = verifyLicenseKey(tampered, secret, {
    now: new Date("2026-01-01T12:00:00.000Z"),
  });
  const expiredResult = verifyLicenseKey(key, secret, {
    now: new Date("2026-01-03T00:00:00.000Z"),
  });

  assert.equal(tamperedResult.valid, false);
  assert.deepEqual(tamperedResult.features, getEditionFeatures("free").features);
  assert.equal(expiredResult.valid, false);
  assert.ok(expiredResult.errors.includes("LICENSE_EXPIRED"));
});

test("createLicensedPaidRuntime rejects missing license before constructing paid runtime", async () => {
  const rootDir = path.join(await mkdtemp(path.join(tmpdir(), "veda-license-")), "runtime");

  assert.throws(() => createLicensedPaidRuntime({
    rootDir,
    hmacKey: "test-hmac-key",
    supabaseClient: createMockSupabase(),
    licenseKey: "",
    licenseSecret: "test-license-secret",
  }), /VEDA_LICENSE_INVALID/);
});

test("createLicensedPaidRuntime accepts a valid Pro license", async () => {
  const secret = "test-license-secret";
  const key = issueLicenseKey({
    license_id: "lic_test_003",
    customer_id: "cus_test_003",
    plan: "pro",
    issued_at: "2026-01-01T00:00:00.000Z",
    expires_at: "2026-12-31T00:00:00.000Z",
  }, secret);

  const runtime = createLicensedPaidRuntime({
    rootDir: path.join(await mkdtemp(path.join(tmpdir(), "veda-license-")), "runtime"),
    hmacKey: "test-hmac-key",
    supabaseClient: createMockSupabase(),
    licenseKey: key,
    licenseSecret: secret,
    licenseNow: new Date("2026-01-15T00:00:00.000Z"),
  });

  assert.ok(runtime);
});
