import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("commercial docs define the corrected founding offer", async () => {
  const buying = await readFile(path.join(root, "BUYING.md"), "utf8");
  const tiers = await readFile(path.join(root, "LICENSE_TIERS.md"), "utf8");

  for (const text of [buying, tiers]) {
    assert.match(text, /\$13\s*\/\s*month/);
    assert.match(text, /first 3 months/i);
    assert.match(text, /first 2,?000 paid users/i);
    assert.match(text, /\$20\s*\/\s*month/);
  }
});

test("customer tracker template is Excel-compatible and contains no customer data", async () => {
  const csv = await readFile(
    path.join(root, "docs", "templates", "founding_customer_tracker.csv"),
    "utf8",
  );
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  for (const required of [
    "founding_slot",
    "customer_id",
    "email",
    "plan",
    "paid_status",
    "discount_percent",
    "discount_months",
    "first_paid_at",
  ]) {
    assert.ok(headers.includes(required), `missing ${required}`);
  }

  assert.equal(lines.length, 1, "template must not include real or sample customers");
  assert.equal(csv.includes("@"), false);
});

test("package keywords avoid competitor names and unsupported compatibility claims", async () => {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const keywordText = (pkg.keywords ?? []).join(" ").toLowerCase();

  for (const forbidden of ["langchain", "langsmith", "agentops", "portkey", "crewai"]) {
    assert.equal(keywordText.includes(forbidden), false, `remove ${forbidden}`);
  }
});

test("public launch docs do not claim a dashboard exists yet", async () => {
  const files = [
    "README.md",
    path.join("docs", "USER_MANUAL.md"),
    "LICENSE_TIERS.md",
    path.join("docs", "pricing", "free-vs-paid.md"),
  ];

  for (const file of files) {
    const text = await readFile(path.join(root, file), "utf8");
    assert.doesNotMatch(text, /dashboard/i, `${file} still claims dashboard`);
  }
});

test("license metadata and public docs agree with the checked-in license", async () => {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const license = await readFile(path.join(root, "LICENSE"), "utf8");
  const readme = await readFile(path.join(root, "README.md"), "utf8");

  assert.equal(pkg.license, "AGPL-3.0-only");
  assert.match(license, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.doesNotMatch(readme, /Proprietary/i);
  assert.match(readme, /AGPL-3\.0-only/);
});

test("environment example and CI release gate are present", async () => {
  const envExample = await readFile(path.join(root, ".env.example"), "utf8");
  const workflow = await readFile(
    path.join(root, ".github", "workflows", "release-check.yml"),
    "utf8",
  );

  assert.match(envExample, /VEDA_HMAC_KEY=/);
  assert.match(envExample, /VEDA_API_CORS_ORIGIN=http:\/\/localhost:3101/);
  assert.match(workflow, /npm run release:check/);
});
