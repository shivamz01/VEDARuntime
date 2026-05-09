import assert from "node:assert/strict";
import test from "node:test";
import {
  SupabaseAuditLedger,
  SupabasePipelineLog,
} from "../packages/pro/dist/index.js";

function makeThenableQuery(rows) {
  const query = {
    eq: async (column, value) => {
      assert.notEqual(column, "1", "real Supabase must not use synthetic eq('1','1') filters");
      return { data: rows.filter(row => row[column] === value), error: null };
    },
    then: (resolve, reject) => Promise.resolve({ data: rows, error: null }).then(resolve, reject),
  };
  return query;
}

function createRealLikeSupabase() {
  const store = {
    audit_ledger: [
      {
        span_id: "9c86c40d-94a0-4f63-b900-1f2e9d973211",
        workflow_id: "workflow-existing",
        step_id: "first",
        agent_name: "test",
        agent_version: "1.0.0",
        event_type: "EXISTING",
        timestamp: "2026-01-01T00:00:00.000Z",
        status: "SUCCESS",
        prev_hmac: "GENESIS",
        hmac: "already-present",
        metadata: {},
      },
    ],
    pipeline_log: [
      {
        pipeline_id: "pipeline-existing",
        pipeline_name: "Existing",
        status: "COMPLETED",
        trust_score: 100,
        duration_ms: 10,
        data_status: "REAL",
        schema_version: "v6.1.1",
        created_at: "2026-01-01T00:00:00.000Z",
        gates_passed: 1,
        errors_count: 0,
        trace_span_count: 1,
        metadata: {},
      },
    ],
  };

  return {
    from: table => ({
      select: () => makeThenableQuery(store[table] ?? []),
      insert: row => ({
        select: async () => {
          store[table].push(row);
          return { data: row, error: null };
        },
      }),
    }),
  };
}

test("SupabaseAuditLedger.readAll awaits select directly for all-row reads", async () => {
  const ledger = new SupabaseAuditLedger(createRealLikeSupabase(), "test-hmac-key");

  const rows = await ledger.readAll();

  assert.equal(rows.length, 1);
  assert.equal(rows[0].workflow_id, "workflow-existing");
});

test("SupabasePipelineLog.readAll awaits select directly for all-row reads", async () => {
  const pipelineLog = new SupabasePipelineLog(createRealLikeSupabase());

  const rows = await pipelineLog.readAll();

  assert.equal(rows.length, 1);
  assert.equal(rows[0].pipeline_id, "pipeline-existing");
});
