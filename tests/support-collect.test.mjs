import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  collectSupportBundle,
  getEnvPresence,
  readLatestPipelineArtifacts,
} from "../scripts/support-collect.mjs";

test("getEnvPresence reports configured secrets without leaking values", () => {
  const env = {
    VEDA_HMAC_KEY: "super-secret-hmac",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_KEY: "",
    OTHER_SECRET: "do-not-collect",
  };

  const presence = getEnvPresence(env);

  assert.deepEqual(presence, {
    VEDA_HMAC_KEY: true,
    SUPABASE_URL: true,
    SUPABASE_SERVICE_KEY: false,
  });
  assert.equal(JSON.stringify(presence).includes("super-secret-hmac"), false);
  assert.equal(JSON.stringify(presence).includes("do-not-collect"), false);
});

test("readLatestPipelineArtifacts summarizes recent pipeline logs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "veda-support-logs-"));
  const logsDir = path.join(root, "logs");
  await mkdir(logsDir, { recursive: true });
  await writeFile(
    path.join(logsDir, "pipeline-proof-2026-01-01.json"),
    JSON.stringify({
      pipeline: "proof",
      status: "completed",
      startedAt: "2026-01-01T00:00:00.000Z",
      endedAt: "2026-01-01T00:00:01.000Z",
      steps: [{ name: "unit", status: "passed" }],
    }),
  );

  const artifacts = await readLatestPipelineArtifacts(logsDir, 5);

  assert.equal(artifacts.length, 1);
  assert.equal(artifacts[0].pipeline, "proof");
  assert.equal(artifacts[0].status, "completed");
  assert.equal(artifacts[0].steps.length, 1);
});

test("collectSupportBundle writes a safe support artifact", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "veda-support-bundle-"));
  await mkdir(path.join(root, "logs"), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "@veda/runtime",
      version: "1.0.0",
      scripts: { test: "node --test" },
    }),
  );
  await writeFile(
    path.join(root, "logs", "pipeline-ship-2026-01-01.json"),
    JSON.stringify({
      pipeline: "ship",
      status: "completed",
      startedAt: "2026-01-01T00:00:00.000Z",
      endedAt: "2026-01-01T00:00:02.000Z",
      steps: [{ name: "release", status: "passed" }],
    }),
  );

  const { bundle, artifactPath } = await collectSupportBundle({
    cwd: root,
    artifactDir: path.join(root, "logs"),
    env: {
      VEDA_HMAC_KEY: "real-secret",
      SUPABASE_URL: "https://example.supabase.co",
    },
    now: new Date("2026-01-01T00:00:00.000Z"),
    commandRunner: async (command) => {
      if (command === "node") return "v24.0.0";
      if (command === "npm") return "11.0.0";
      if (command === "git") return "abc1234";
      return "";
    },
  });

  const artifactText = await readFile(artifactPath, "utf8");

  assert.equal(bundle.project.name, "@veda/runtime");
  assert.equal(bundle.environment.envPresence.VEDA_HMAC_KEY, true);
  assert.equal(bundle.pipelineArtifacts[0].pipeline, "ship");
  assert.equal(artifactText.includes("real-secret"), false);
  assert.equal(artifactText.includes("https://example.supabase.co"), false);
});
