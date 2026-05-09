# VEDA Runtime

![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen) ![License](https://img.shields.io/badge/license-AGPL--3.0--only-blue) ![Version](https://img.shields.io/badge/version-1.0.0-informational)

**Production-safe execution kernel for governed AI agent workflows.**

> Deterministic orchestration · Cryptographic audit ledgers · Rollback checkpoints · Strict governance for real LLM agent workflows.

---

## What is VEDA Runtime?

VEDA Runtime is the operational layer that converts AI-generated intent into **bounded, signed, traceable, and recoverable execution**.

It is not an AI employee system. It is not an autonomous company OS. It is not an AGI framework.

It is a **deterministic orchestration and execution kernel** for AI systems that need to operate safely in real workflows — where execution must be provable, not just described.

---

## The Problem

Most AI agent frameworks today fail at the infrastructure layer, not the model layer:

| Failure | What Goes Wrong |
|---|---|
| Context poisoning | Agents receive stale history, cross-workflow contamination, injected prompts |
| Recursive collapse | Tool failure → retry → replan → failure loops with no exit |
| Unsafe tool access | Unrestricted shell, arbitrary file writes, no sandbox boundary |
| No recovery path | Files and state modified without snapshots |
| Opaque execution | Logs describe what the model said, not what actually executed |
| Hallucinated governance | Security checks declared in text, never enforced in code |

VEDA Runtime makes these failure modes structurally harder inside its execution boundary.

---

## Runtime Proof Bar

A feature claim is accepted only when the full chain passes:

```
input
  → schema validation       (HANDOFF_JSON v6.1.1)
  → nonce insert             (atomic replay prevention)
  → signature verification   (ed25519 + HMAC-SHA256)
  → context governance       (scoped, filtered, budget-capped)
  → governance gates         (Zero Trust · Security Policy · Legal · Budget)
  → rollback checkpoint      (required before any destructive action)
  → sandbox execution        (deny-by-default shell policy)
  → VedaTrace span           (structured observability)
  → audit ledger append      (HMAC-chained, tamper-evident)
  → verified output
```

Anything that does not pass this end-to-end chain is `SPEC_ONLY`, `PARTIAL`, or `BLOCKED` — not production-ready.

---

## Core Guarantees

- **Fail Closed** — unknown, unsigned, malformed, or unverified requests are rejected immediately
- **No Full History to Agents** — Context Governor scopes and filters before any model call
- **No Destructive Action Without Rollback** — verified checkpoint required before every WRITE/EXEC
- **No Unsafe Shell** — `git`, `npm`, `curl`, `rm`, `python`, shell interpreters denied by default
- **No Audit Claim Without Correct HMAC** — `VEDA_HMAC_KEY` only; startup fails if the key is missing
- **No Simulation as Production** — `DATA_STATUS: SIMULATED` cannot claim production readiness
- **One Agent at a Time** — no parallel dispatch in v1.x; sequential, deterministic execution only

---

## Architecture

```
Layer 0     Kill Switch               — Absolute halt authority; cannot be overridden
Layer 0.5   Orchestrator / Intake     — Interprets human instruction and creates the signed handoff
Layer 1     Runtime API               — Schema validation · nonce · signature · HMAC
Layer 1.5   @veda-runtime-v1/shared   — Canonical TS contracts: HandoffJSON, FSMState, VedaTraceSpan
Layer 2     Governance Injection      — Zero Trust · Security Policy · Legal · Budget · Brand · Manual approval
Layer 3     Risk & Threat Engine      — Dynamic Weighted Risk Vector (DWRV) · graph propagation · obfuscation detection
Layer 4     Workflow Engine / FSM     — DAG creation · sequential dispatch · retry governance
Layer 4.5   Capability Router         — Provider health check · fallback · cost guardrail

            ── Layers 5 and 6 are intentionally reserved for application-level
               policy and department governance. They sit above the runtime kernel
               and are not execution components. ──

Layer 7     Execution Sandbox         — Deny-by-default shell · filesystem boundary · timeouts
Layer 7+    Rollback Engine           — Snapshot · verify · checkpoint · restore API
Layer 8     Observability Engine      — VedaTrace spans · metrics · failure replay
Layer 8.5   Sovereign Audit Ledger    — HMAC-chained · append-only · tamper-evident
```

---

## Editions

### Core Engine — Free

Runs entirely locally. No cloud dependencies required.

| Component | Purpose |
|---|---|
| Runtime Kernel | Central execution engine that orchestrates the full proof chain |
| Handoff Validator | Validates every payload against HANDOFF_JSON v6.1.1; rejects malformed or forbidden fields |
| Nonce Registry | Atomic append-only JSONL replay-attack prevention |
| Context Governor | Security firewall — scopes, filters, and budget-caps all context before it reaches any agent |
| Execution Sandbox | Deny-by-default shell policy; blocks unsafe commands and path traversal |
| Rollback Engine | Verified file snapshots before any destructive action; blocks execution if checkpoint fails |
| HMAC-Chained Audit Ledger | Append-only local JSONL ledger; every span cryptographically chained via HMAC-SHA256 |
| Cryptographic Handoffs | ed25519 signing + HMAC-SHA256 payload integrity verification |

### Pro Extensions — Paid

Cloud-native adapters and governance scaling:

- Supabase persistence (audit ledger, nonce registry, `pipeline_log`)
- API status telemetry and web status page
- Advanced governance profile packs
- Exportable audit proof bundles
- VEDA bridge adapter — connects this runtime to a broader VEDA OS agent ecosystem

---

## Prerequisites

- **Node.js >= 20** — verify with `node --version`
- **npm** — ships with Node.js

No cloud accounts, databases, or external services required for the Free Edition.

---

## Quick Start

```bash
git clone https://github.com/shivamz01/VEDARuntime.git
cd VEDARuntime
npm install
npm run build
```

**Verify the build:**

```bash
npm run test
```

All tests should pass — covering shared contracts, ed25519 + HMAC verification, sandbox policy, rollback boundaries, audit-chain continuity, and pipeline runner behavior.

**Run the release gate:**

```bash
npm run release:check
```

Builds all workspaces, runs the full test suite, executes Free and Paid proof demos, prints runtime status, and writes a machine-checkable JSON summary under `logs/`.

---

## Run a Proof Workflow

```bash
npm run demo:free
```

This executes a complete, deterministic proof workflow out-of-the-box:

1. Creates a valid `HANDOFF_JSON v6.1.1` payload
2. Seals it with ed25519 and HMAC-SHA256
3. Validates schema, verifies signature and HMAC
4. Inserts nonce into the local replay-prevention registry
5. Scopes context through the Context Governor
6. Creates a verified rollback checkpoint
7. Executes the sandbox-approved tool call
8. Writes HMAC-chained audit spans to the local ledger
9. Outputs the cryptographic proof and execution result

---

## Native Pipelines

| Command | Purpose |
|---|---|
| `npm run pipeline:proof` | Build → contract tests → Free proof demo → status |
| `npm run pipeline:audit` | Build → handoff/audit tests → Paid proof demo → status |
| `npm run pipeline:ship` | Full release-candidate gate: build + tests + demos + status |
| `npm run status` | Print current runtime status payload |

Each pipeline fails closed on the first broken step and writes `logs/pipeline-<name>-<timestamp>.json` as the source of truth.

---

## HANDOFF_JSON v6.1.1

Every inter-agent or runtime execution request must use this protocol. The schema string is a **locked protocol identifier** — it must not be altered.

```json
{
  "schema_version": "v6.1.1",
  "timestamp": "2026-05-09T12:00:00Z",
  "nonce": "c6f6e2da-e691-4da2-a709-e684a592faa6",
  "source_agent": "orchestrator",
  "target_agent": "file-writer",
  "task_id": "TASK-001",
  "payload": {
    "instruction": "Write the processed report to output/report.md",
    "context": "user-session-abc123",
    "data": { "report_content": "..." },
    "constraints": ["write-sandbox-only", "no-network"]
  },
  "governance": {
    "zte_cleared": true,
    "spe_chain_passed": true,
    "legal_cleared": true,
    "budget_cleared": true
  },
  "DATA_STATUS": "REAL",
  "phase": "2",
  "sovereign_key": "veda_local_free",
  "signature": "<ed25519 signature — generated by the runtime>",
  "hmac": "<HMAC-SHA256 hash — generated by the runtime>"
}
```

> **Note:** You never construct `signature` or `hmac` by hand. The runtime generates both automatically when you call `npm run demo:free` or build a handoff using the SDK helpers in `packages/shared`. See `examples/free-demo.mjs` for a full working example.

---

**Field reference:**

| Field | Values / Format | What it means |
|---|---|---|
| `schema_version` | `"v6.1.1"` (locked) | Protocol version — must be exactly this string |
| `nonce` | UUID v4 or 32+ hex chars | One-time value; prevents replay attacks |
| `DATA_STATUS` | `REAL` · `SIMULATED` · `PARTIAL` | `REAL` = live execution · `SIMULATED` = test/demo data · `PARTIAL` = mixed |
| `phase` | `"1"` or `"2"` | `1` = planning / validation pass · `2` = execution pass |
| `sovereign_key` | See table below | Identity key for the requesting agent |

**`sovereign_key` — Free vs Pro:**

| Edition | Key | How it's verified |
|---|---|---|
| Free | `veda_local_free` | Built-in — accepted automatically, no setup needed |
| Pro | `veda_pro_<32+ hex>` | Verified by signed Pro license key before Paid runtime construction |

Free users use `veda_local_free` out of the box. No account, no configuration required.

---

**Governance fields explained:**

| Field | What it means |
|---|---|
| `zte_cleared` | **Zero Trust Enforcement** — confirms the agent has passed the permission check for this specific tool or action. Every tool call requires ZTE sign-off before execution. |
| `spe_chain_passed` | **Security Policy Enforcement** — confirms the full security policy chain has been evaluated (required on build and security execution paths). |
| `legal_cleared` | Legal gate has evaluated this request and found no compliance blockers. |
| `budget_cleared` | Token and cost budget gate has confirmed this request is within limits. |

For Free Edition local use, the runtime evaluates these gates internally. You declare intent in the handoff; the runtime enforces or blocks it.

---

**Rejection codes:**

| Condition | Code |
|---|---|
| `schema_version` is not `v6.1.1` | `SCHEMA_VERSION_MISMATCH` |
| Missing or invalid nonce | `NONCE_MISSING` / `NONCE_INVALID` |
| Nonce already consumed | `NONCE_REPLAY` |
| Timestamp older than 300 seconds | `NONCE_STALE` |
| Signature verification fails | `SIGNATURE_INVALID` |
| HMAC verification fails | `HMAC_INVALID` |
| `DATA_STATUS` missing or invalid | `DATA_STATUS_MISSING` / `DATA_STATUS_INVALID` |
| `phase` missing or invalid | `PHASE_MISSING` / `PHASE_INVALID` |
| `zte_cleared` is not `true` | `ZTE_CLEARANCE_DENIED` |
| `sovereign_key` missing or invalid | `SOVEREIGN_KEY_MISSING` / `SOVEREIGN_KEY_INVALID` |
| Any unknown or forbidden field present | `FORBIDDEN_FIELD` |
| Kill Switch active | `KILL_SWITCH_ACTIVE` |

**Permanently rejected patterns:**

- `pipeline_status: ANALYSIS_ONLY` — legacy internal field; always rejected if present
- `schema_version: v6.1.0` or `v6.1.3` — deprecated versions; only `v6.1.1` is accepted
- Unsigned handoffs
- `curl ... | sh` or `wget ... | sh` network installer pipes

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VEDA_HMAC_KEY` | **Required in production** | Demo-only fallback outside production | HMAC key for tamper-evident audit ledger. **Set a real key in production.** |
| `VEDA_API_CORS_ORIGIN` | API server | `http://localhost:3101` | Allowed web origin for API responses. Do not use wildcard in production. |
| `SUPABASE_URL` | Paid only | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Paid only | — | Supabase service role key |

The API demo path **fails startup** if `VEDA_HMAC_KEY` is missing in production mode (`VEDA_RUNTIME_MODE=production` or `NODE_ENV=production`). See `.env.example` for the full list.

---

## Project Structure

```
VEDARuntime/
├── packages/
│   ├── shared/         — Canonical types, schema validator, constants (@veda-runtime-v1/shared)
│   ├── audit/          — Local nonce registry + HMAC-chained audit ledger
│   ├── sandbox/        — Deny-by-default shell policy engine
│   ├── runtime/        — Runtime Kernel: Context Governor, Rollback Engine, orchestrator
│   ├── pro/            — Edition entitlement gates (free vs paid)
│   └── bridge-veda/    — Optional VEDA ecosystem bridge adapter
├── apps/
│   ├── api/            — Runtime HTTP API surface
│   └── web/            — Status web page
├── tests/              — Deterministic acceptance tests
├── examples/
│   └── free-demo.mjs   — Local proof workflow (zero cloud dependencies)
├── scripts/
│   ├── pipeline.mjs          — Native proof/audit/ship pipeline runner
│   ├── support-collect.mjs   — Redacted support bundle collector
│   └── status.mjs            — Runtime status payload
└── docs/               — PRD, architecture, pricing, policy, and templates
```

---

## Pricing

| Plan | Price | Notes |
|---|---|---|
| Free | $0 / month | Full Core Engine, local-only, no cloud required |
| Pro | $20 / month | Supabase persistence, telemetry, governance packs |
| Founding Offer | $13 / month | First 3 months · Limited to first 2,000 paid users |

See [`BUYING.md`](./BUYING.md) for payment flow and founding offer terms.  
See [`LICENSE_TIERS.md`](./LICENSE_TIERS.md) for Free vs Pro capability boundaries.

---

## Support

- [`SUPPORT.md`](./SUPPORT.md) — Free and paid support workflow
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) — Common failure paths
- [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) — Open bugs and deferred items

**Collect a support bundle:**

```bash
npm run support:collect
```

Creates a redacted `logs/support-bundle-<timestamp>.json` — no secrets, no customer data.

---

## What This Is Not

VEDA Runtime does not position itself as:

- AI employees or autonomous workers
- An autonomous company OS
- An AGI orchestration layer
- A self-improving agent swarm

It is production-safe runtime infrastructure. The goal is making AI execution deterministic, observable, and recoverable — not making it appear larger than it is.

---

## License

AGPL-3.0-only. See [LICENSE](./LICENSE) for the full license text.

---

**Owner:** Shivam Shrivastav · **Protocol Schema:** HANDOFF_JSON v6.1.1 · **Version:** 1.0.0
