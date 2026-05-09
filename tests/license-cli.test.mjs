import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";

function runLicenseCli(args, env = {}) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, ["scripts/license.mjs", ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      windowsHide: true,
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

test("license CLI issues and verifies a Pro license without leaking the secret", async () => {
  const env = { VEDA_LICENSE_SECRET: "test-license-cli-secret" };
  const issued = await runLicenseCli([
    "issue",
    "--customer",
    "cus_cli_001",
    "--days",
    "30",
    "--slot",
    "7",
  ], env);

  const issuePayload = JSON.parse(issued.stdout);
  assert.equal(issuePayload.status, "issued");
  assert.equal(issuePayload.foundingSlot, 7);
  assert.match(issuePayload.licenseKey, /^veda_pro_v1\./);
  assert.equal(issued.stdout.includes(env.VEDA_LICENSE_SECRET), false);

  const verified = await runLicenseCli(["verify", issuePayload.licenseKey], env);
  const verifyPayload = JSON.parse(verified.stdout);

  assert.equal(verifyPayload.valid, true);
  assert.equal(verifyPayload.edition, "paid");
  assert.ok(verifyPayload.features.includes("supabase_audit"));
});
