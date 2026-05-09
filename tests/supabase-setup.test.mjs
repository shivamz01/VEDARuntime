import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Supabase schema defines the three Pro tables with RLS", async () => {
  const sql = await readFile(path.join(root, "docs", "setup", "supabase-schema.sql"), "utf8");

  for (const table of ["nonce_registry", "audit_ledger", "pipeline_log"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table}\\s+enable row level security`, "i"));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table}\\s+from anon, authenticated`, "i"));
    assert.match(sql, new RegExp(`grant select, insert on table public\\.${table}\\s+to service_role`, "i"));
  }
});

test("Supabase schema matches runtime status enums and append-only audit hardening", async () => {
  const sql = await readFile(path.join(root, "docs", "setup", "supabase-schema.sql"), "utf8");

  for (const status of ["SUCCESS", "FAILURE", "BLOCKED", "TIMEOUT"]) {
    assert.match(sql, new RegExp(`'${status}'`));
  }
  for (const status of ["COMPLETED", "FAILED", "RUNNING", "BLOCKED"]) {
    assert.match(sql, new RegExp(`'${status}'`));
  }

  assert.match(sql, /schema_version\s+text\s+not null/i);
  assert.match(sql, /schema_version = 'v6\.1\.1'/i);
  assert.match(sql, /veda_reject_audit_ledger_mutation/i);
  assert.match(sql, /before update on public\.audit_ledger/i);
  assert.match(sql, /before delete on public\.audit_ledger/i);
});

test("Supabase setup docs use the official JavaScript client package", async () => {
  const doc = await readFile(path.join(root, "docs", "setup", "supabase-pro-setup.md"), "utf8");

  assert.match(doc, /@supabase\/supabase-js/);
  assert.doesNotMatch(doc, /@supabase\/supabase-client/);
  assert.match(doc, /docs\/setup\/supabase-schema\.sql/);
});
