# VEDA Runtime

![Node.js >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen) ![License](https://img.shields.io/badge/license-AGPL--3.0--only-blue) ![Version](https://img.shields.io/badge/version-v1.1.0--pro--persistence-informational)

**Deterministic execution kernel for governed AI agent workflows.**

> Bounded execution · Cryptographic audit ledgers · Rollback checkpoints · Supabase Pro persistence · Strict governance for real LLM agent workflows.

---

## What is VEDA Runtime?

VEDA Runtime is the operational layer that converts AI-generated intent into **bounded, signed, traceable, and recoverable execution**.

It is not an AI employee system.  
It is not an autonomous company OS.  
It is not an AGI framework.

It is a **deterministic orchestration and execution kernel** for AI systems that need to operate safely in real workflows — where execution must be provable, not just described.

---

## The Problem

Most AI agent frameworks fail at the infrastructure layer, not the model layer:

| Failure | What Goes Wrong |
|---|---|
| Context poisoning | Agents receive stale history, cross-workflow contamination, injected prompts |
| Recursive collapse | Tool failure → retry → replan → failure loops with no exit |
| Unsafe tool access | Unrestricted shell, arbitrary file writes, no rollback boundary |
| No recovery path | Files and state modified without snapshots |
| Opaque execution | Logs describe what the model said, not what actually executed |
| Hallucinated governance | Security checks declared in text, never enforced in code |
| Weak persistence proof | Runtime claims are not backed by tamper-evident ledgers or readback verification |

VEDA Runtime makes these failure modes structurally harder inside its execution boundary.

---

## Runtime Proof Bar

A feature claim is accepted only when the full chain passes:

```text
input
  → schema validation       (HANDOFF_JSON v6.1.1)
  → nonce insert             (atomic replay prevention)
  → signature verification   (ed25519 + HMAC-SHA256)
  → context governance       (scoped, filtered, budget-capped)
  → governance gates         (Zero Trust · Security Policy · Legal · Budget)
  → rollback checkpoint      (required before destructive action)
  → sandbox execution        (deny-by-default shell policy)
  → VedaTrace span           (structured observability)
  → audit ledger append      (HMAC-chained, tamper-evident)
  → readback verification    (local JSONL or real Supabase persistence)
  → verified output
```

Anything that does not pass this end-to-end chain is `SPEC_ONLY`, `PARTIAL`, or `BLOCKED` — not release-ready.

---

## Core Guarantees

- **Fail Closed** — unknown, unsigned, malformed, or unverified requests are rejected immediately.
- **No Full History to Agents** — Context Governor scopes and filters before any model or tool boundary.
- **No Destructive Action Without Rollback** — verified checkpoint required before write/execute paths.
- **No Unsafe Shell by Default** — dangerous shell commands and chained execution patterns are denied.
- **No Audit Claim Without Correct HMAC** — `VEDA_HMAC_KEY` is required in production.
- **Production API Origin Enforcement** — production `/api/*` requests require an allowed `Origin`; `/health` remains available for uptime checks.
- **Rate-Limited API Surface** — status and execution demo endpoints are protected from request flooding.
- **No Wildcard CORS** — `VEDA_API_CORS_ORIGIN=*` is rejected.
- **No Simulation as Production** — `DATA_STATUS: SIMULATED` cannot claim production readiness.
- **Configurable Execution Profiles** — `local_safe` enforces serialized execution and cooldown for low-resource machines; `standard` and `pro_cloud` define bounded concurrency targets for dependency-aware schedulers.
- **Real Pro Persistence Proof** — Pro persistence is verified with real Supabase insert/readback via `npm run pro:verify`.

---

## Execution Profiles

VEDA Runtime separates execution behavior from product identity. Low-resource local machines can run safely with serialized execution, while higher-resource deployments can use bounded concurrency once the scheduler and runtime path enforce the selected profile.

| Profile | Default Concurrency | Cooldown | Purpose |
|---|---:|---:|---|
| **Local Safe** | 1 agent | 8 sec | Low CPU/GPU machines; serialized execution and mandatory cooldown |
| **Standard** | 4 agents | 0 sec | Normal developer machines; bounded dependency-aware execution target |
| **Pro Cloud** | 16 agents / 32 tools | 0 sec | Cloud deployment target; configurable bounded execution with deterministic audit ordering |

> [!IMPORTANT]
> The **Local Safe** profile enforces serialized execution and an 8-second cooldown between runtime executions to reduce resource exhaustion and runaway execution pressure on limited hardware.

> [!NOTE]
> `local_safe` is enforced by the Free runtime execution gate. `standard` and `pro_cloud` are execution profiles for bounded scheduler integration and must be treated as production-ready only when the workflow scheduler and paid runtime enforce their concurrency limits, rollback locks, and audit ordering.

### Execution Profile Semantics

| Field | Meaning |
|---|---|
| `max_parallel_agents` | Maximum agent executions allowed at one time |
| `max_parallel_tools` | Maximum tool calls allowed at one time |
| `max_provider_calls` | Maximum model/provider calls allowed at one time |
| `cooldown_seconds` | Delay between executions for low-resource or strict profiles |
| `queue_mode` | `sequential` or `dependency_aware` scheduling behavior |
| `rollback_locking` | `workflow` or `resource` rollback lock granularity |
| `audit_ordering` | Deterministic trace ordering requirement |

---

## Security Boundary

VEDA Runtime includes a deny-by-default shell policy and filesystem rollback boundary.

This is **not** the same as a container, microVM, or hardware isolation layer.

For high-risk or multi-tenant deployments, run VEDA Runtime behind additional infrastructure controls such as:

- container isolation
- separate runtime user
- restricted filesystem permissions
- network egress controls
- secret manager
- process supervisor
- rate limiting at reverse proxy/API gateway level

The built-in sandbox is a runtime policy layer. It should not be marketed as full OS-level isolation.

---

## Architecture

```text
Layer 0     Kill Switch               — Absolute halt authority; cannot be overridden
Layer 0.5   Orchestrator / Intake     — Interprets human instruction and creates signed handoff
Layer 1     Runtime API               — Schema validation · nonce · signature · HMAC
Layer 1.5   @veda-runtime-v1/shared   — Canonical TS contracts: HandoffJSON, FSMState, VedaTraceSpan
Layer 2     Governance Injection      — Zero Trust · Security Policy · Legal · Budget · Manual approval
Layer 3     Risk & Threat Engine      — Dynamic Weighted Risk Vector · graph propagation · obfuscation detection
Layer 4     Workflow Engine / FSM     — DAG creation · dependency-aware scheduling · bounded execution profiles · retry governance
Layer 4.5   Capability Router         — Provider health check · fallback · cost guardrail

            ── Layers 5 and 6 are intentionally reserved for application-level
               policy and department governance. They sit above the runtime kernel
               and are not execution components. ──

Layer 7     Execution Sandbox         — Deny-by-default shell policy · filesystem boundary · timeouts
Layer 7+    Rollback Engine           — Snapshot · verify · checkpoint · restore API
Layer 8     Observability Engine      — VedaTrace spans · metrics · failure replay
Layer 8.5   Sovereign Audit Ledger    — HMAC-chained · append-only · tamper-evident
Layer 9     Pro Persistence           — Supabase nonce registry · audit ledger · pipeline log · proof bundles
```

---

## Editions

### Core Engine — Free

Runs entirely locally. No cloud dependencies required.

| Component | Purpose |
|---|---|
| Runtime Kernel | Central execution engine that orchestrates the proof chain |
| Handoff Validator | Validates every payload against HANDOFF_JSON v6.1.1 |
| Nonce Registry | Local append-only JSONL replay prevention |
| Context Governor | Scopes, filters, and budget-caps context before execution |
| Execution Sandbox | Deny-by-default shell policy; blocks unsafe commands and path traversal |
| Rollback Engine | Verified file snapshots before destructive action |
| HMAC-Chained Audit Ledger | Local JSONL ledger; every span cryptographically chained |
| Cryptographic Handoffs | ed25519 signing + HMAC-SHA256 payload integrity verification |
| Local Safe Execution Gate | Serialized local execution with optional cooldown enforcement |

### Pro Extensions — Paid

Cloud-native adapters and governance scaling. Real Supabase persistence is verified with:

```bash
npm run pro:verify
```

| Component | Purpose |
|---|---|
| Supabase Nonce Registry | Real database-backed replay prevention |
| Supabase Audit Ledger | HMAC-chained trace spans stored in Supabase |
| Supabase Pipeline Log | High-level execution status and trust metadata |
| Audit Bundle Export | Exportable proof bundle with HMAC-chain validation |
| Governance Profile Packs | Standard, financial services, healthcare, government, enterprise strict |
| License Gate | HMAC-signed Pro license issue/verify flow |
| VEDA Bridge Adapter | Optional adapter for broader VEDA OS ecosystem integration |
| API/Web Status Surface | Runtime status and telemetry endpoints |
| Pro Execution Profiles | Bounded concurrency targets for paid/cloud scheduler integration |

---

## Prerequisites

- **Node.js >= 20**
- **npm**
- Optional for Pro: private Supabase project
- Optional for Pro: GitHub repository secrets for manual CI smoke test

Verify Node:

```bash
node --version
```

No cloud accounts, databases, or external services are required for the Free Edition.

---

## Quick Start

```bash
git clone https://github.com/shivamz01/VEDARuntime.git
cd VEDARuntime
npm install
npm run build
```

Verify the build:

```bash
npm run test
```

Run the release gate:

```bash
npm run release:check
```

`release:check` builds all workspaces, runs contract tests, executes the Free proof demo, executes the local/mock Paid proof demo, prints runtime status, and writes a machine-checkable JSON summary under `logs/`.

Real Supabase Pro persistence is verified separately with:

```bash
npm run pro:verify
```

---

## Run a Free Proof Workflow

```bash
npm run demo:free
```

This executes a complete local proof workflow:

1. Creates a valid `HANDOFF_JSON v6.1.1` payload.
2. Seals it with ed25519 and HMAC-SHA256.
3. Validates schema, signature, and HMAC.
4. Inserts nonce into the local replay-prevention registry.
5. Scopes context through the Context Governor.
6. Enforces the selected local execution profile.
7. Creates a verified rollback checkpoint.
8. Executes the sandbox-approved tool call.
9. Writes HMAC-chained audit spans to the local ledger.
10. Outputs cryptographic proof and execution result.

Expected shape:

```json
{
  "status": "COMPLETED",
  "dataStatus": "REAL",
  "spans": 5,
  "auditRows": 5,
  "rollbackVerified": true
}
```

---

## Pro Persistence Verification

Real Pro persistence requires:

- Supabase tables created from `docs/setup/supabase-schema.sql`
- server-side Supabase credentials
- `VEDA_HMAC_KEY`
- `VEDA_LICENSE_SECRET`
- official Supabase client dependency

Run:

```bash
npm run pro:verify
```

This runs:

```text
examples/paid-supabase-smoke.mjs
```

The smoke test verifies real Supabase persistence:

- `nonce_registry` insert
- `audit_ledger` span writes
- `pipeline_log` write
- audit bundle HMAC-chain validation
- rollback verification

Expected successful output:

```json
{
  "status": "COMPLETED",
  "supabase": "REAL",
  "nonceInserted": true,
  "auditSpanCount": 5,
  "pipelineLogWritten": true,
  "auditBundleValid": true,
  "rollbackVerified": true
}
```

If `supabase` is not `"REAL"`, the run does not prove Pro persistence.

For setup, see:

```text
docs/setup/supabase-pro-setup.md
```

---

## Native Pipelines

| Command | Purpose |
|---|---|
| `npm run build` | Build all workspaces in dependency order |
| `npm run test` | Build and run deterministic contract tests |
| `npm run demo:free` | Run local Free proof workflow |
| `npm run demo:paid` | Run local/mock Paid proof workflow |
| `npm run pro:verify` | Run real Supabase Pro persistence smoke test |
| `npm run pipeline:proof` | Build → contract tests → Free proof demo → status |
| `npm run pipeline:audit` | Build → audit tests → local Paid proof demo → status |
| `npm run pipeline:ship` | Full release-candidate gate |
| `npm run release:check` | Release gate wrapper around `pipeline:ship` |
| `npm run support:collect` | Create redacted support bundle |
| `npm run status` | Print runtime status payload |

Each pipeline fails closed on the first broken step and writes:

```text
logs/pipeline-<name>-<timestamp>.json
```

---

## API Surface

Default API port:

```text
3100
```

Default web origin:

```text
http://localhost:3101
```

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check; available for uptime checks |
| `GET` | `/api/status` | Runtime status payload |
| `POST` | `/api/demo/free` | Free proof demo execution path |

### API Hardening

In production mode:

```bash
VEDA_RUNTIME_MODE=production
```

or:

```bash
NODE_ENV=production
```

The API enforces:

- `VEDA_HMAC_KEY` must exist
- wildcard CORS is rejected
- `/api/*` requires allowed `Origin`
- `/health` remains available for uptime checks
- `/api/status` is rate limited
- `/api/demo/free` is rate limited

Set production CORS explicitly:

```bash
VEDA_API_CORS_ORIGIN=https://your-runtime-web.example.com
```

Do not use:

```bash
VEDA_API_CORS_ORIGIN=*
```

---

## HANDOFF_JSON v6.1.1

Every inter-agent or runtime execution request must use this protocol.

The schema string is a **locked protocol identifier**. It must not be altered.

Product/runtime version and handoff protocol version are separate:

```text
Product version: 1.1.0
HANDOFF_JSON protocol version: v6.1.1
```

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
    "data": {
      "report_content": "..."
    },
    "constraints": [
      "write-sandbox-only",
      "no-network"
    ]
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

You never construct `signature` or `hmac` by hand. The runtime generates both automatically through SDK helpers in `packages/shared`.

See:

```text
examples/free-demo.mjs
```

---

## Field Reference

| Field | Values / Format | Meaning |
|---|---|---|
| `schema_version` | `"v6.1.1"` | Locked handoff protocol version |
| `nonce` | UUID v4 or 32+ hex chars | One-time replay-prevention value |
| `DATA_STATUS` | `REAL` · `SIMULATED` · `PARTIAL` | Data/execution status |
| `phase` | `"1"` or `"2"` | `1` = planning/validation; `2` = execution |
| `sovereign_key` | Free or Pro key | Runtime identity key |

### Sovereign Key

| Edition | Key | Verification |
|---|---|---|
| Free | `veda_local_free` | Built-in; accepted automatically |
| Pro | `veda_pro_<32+ hex>` | Verified through signed Pro license flow |

---

## Governance Fields

| Field | Meaning |
|---|---|
| `zte_cleared` | Zero Trust Enforcement clearance for the requested action |
| `spe_chain_passed` | Security Policy Enforcement chain passed |
| `legal_cleared` | Legal/compliance gate cleared |
| `budget_cleared` | Token/cost budget gate cleared |
| `human_approval_required` | Used by stricter Pro governance profiles |

For Free local use, the runtime evaluates the gates internally. You declare intent in the handoff; the runtime enforces or blocks it.

---

## Rejection Codes

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
| Unknown or forbidden field present | `FORBIDDEN_FIELD` |
| Kill Switch active | `KILL_SWITCH_ACTIVE` |
| Missing production HMAC key | `VEDA_HMAC_KEY_REQUIRED` |
| Wildcard CORS configured | `VEDA_API_CORS_ORIGIN_WILDCARD_DENIED` |

### Permanently Rejected Patterns

- `pipeline_status: ANALYSIS_ONLY`
- `schema_version: v6.1.0`
- `schema_version: v6.1.3`
- unsigned handoffs
- malformed HMAC
- replayed nonce
- `curl ... | sh`
- `wget ... | sh`
- shell command chaining
- command substitution
- path traversal

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VEDA_HMAC_KEY` | Required in production | Demo fallback outside production | HMAC key for audit ledger and proof bundles |
| `VEDA_API_CORS_ORIGIN` | API server | `http://localhost:3101` | Allowed production web origin |
| `VEDA_RUNTIME_MODE` | Production deployment | — | Enables production hardening when set to `production` |
| `NODE_ENV` | Production deployment | — | Enables production hardening when set to `production` |
| `SUPABASE_URL` | Pro only | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Pro only | — | Supabase service-role key; server-side only |
| `VEDA_LICENSE_SECRET` | Pro only | — | Secret used to issue/verify Pro license keys |
| `VEDA_LICENSE_KEY` | Pro deployment only | — | Externally issued Pro license key |

Do not commit:

```text
.env
.env.local
```

Do not expose:

```text
SUPABASE_SERVICE_KEY
VEDA_HMAC_KEY
VEDA_LICENSE_SECRET
VEDA_LICENSE_KEY
```

in browser code, frontend bundles, screenshots, public GitHub issues, customer-facing logs, or README examples with real values.

---

## Supabase Pro Setup

Create the required tables by running the contents of:

```text
docs/setup/supabase-schema.sql
```

Setup guide:

```text
docs/setup/supabase-pro-setup.md
```

The Pro schema creates:

| Table | Purpose |
|---|---|
| `nonce_registry` | Prevents replayed handoff nonces |
| `audit_ledger` | Stores HMAC-chained trace spans |
| `pipeline_log` | Stores high-level execution status |

The schema enables Row Level Security, blocks `anon` and `authenticated` table access, grants server-side `service_role` access, and makes `audit_ledger` append-only with update/delete rejection triggers.

---

## GitHub Pro Smoke Test

The real Pro smoke workflow should be manual-only:

```text
.github/workflows/pro-smoke.yml
```

It requires GitHub repository secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
VEDA_HMAC_KEY
VEDA_LICENSE_SECRET
```

The manual workflow proves that Pro persistence works in a clean CI environment, not only on a local machine.

Do not run real Supabase smoke tests on every pull request unless you explicitly want CI to use private infrastructure.

---

## Project Structure

```text
VEDARuntime/
├── packages/
│   ├── shared/               — Canonical types, schema validator, constants
│   ├── audit/                — Local nonce registry + HMAC-chained audit ledger
│   ├── sandbox/              — Deny-by-default shell policy engine
│   ├── runtime/              — Runtime Kernel, Context Governor, Rollback Engine
│   ├── pro/                  — License gate, Supabase adapters, Pro proof bundles
│   └── bridge-veda/          — Optional VEDA ecosystem bridge adapter
├── apps/
│   ├── api/                  — Runtime HTTP API surface
│   └── web/                  — Status web page
├── tests/                    — Deterministic acceptance tests
├── examples/
│   ├── free-demo.mjs         — Local Free proof workflow
│   ├── paid-demo.mjs         — Local/mock Paid proof workflow
│   └── paid-supabase-smoke.mjs — Real Supabase Pro persistence smoke test
├── scripts/
│   ├── pipeline.mjs          — Native proof/audit/ship pipeline runner
│   ├── support-collect.mjs   — Redacted support bundle collector
│   └── status.mjs            — Runtime status payload
├── docs/
│   ├── setup/
│   │   ├── supabase-schema.sql
│   │   └── supabase-pro-setup.md
│   └── ...
└── logs/                     — Local generated pipeline/support artifacts
```

---

## Pricing

| Plan | Price | Notes |
|---|---|---|
| Free | $0 / month | Full Core Engine, local-only, no cloud required |
| Pro | $20 / month | Supabase persistence, telemetry, governance packs, proof bundles |
| Founding Offer | $13 / month | First 3 months · Limited to first 2,000 paid users |

See:

```text
BUYING.md
LICENSE_TIERS.md
```

---

## Support

Support docs:

```text
SUPPORT.md
TROUBLESHOOTING.md
KNOWN_ISSUES.md
```

Collect a support bundle:

```bash
npm run support:collect
```

This creates a redacted support artifact:

```text
logs/support-bundle-<timestamp>.json
```

Support bundles must not include secrets or customer data.

---

## Release Gates

### Free/Core Release Gate

Required:

```bash
npm run release:check
npm run demo:free
npm run support:collect
```

### Pro Persistence Release Gate

Required:

```bash
npm run release:check
npm run pro:verify
```

And the manual GitHub workflow:

```text
Pro Supabase Smoke Test
```

must pass with real repository secrets.

Pro persistence is release-ready only when the proof output shows:

```json
{
  "status": "COMPLETED",
  "supabase": "REAL",
  "nonceInserted": true,
  "auditSpanCount": 5,
  "pipelineLogWritten": true,
  "auditBundleValid": true,
  "rollbackVerified": true
}
```

---

## What This Is Not

VEDA Runtime does not position itself as:

- AI employees
- autonomous workers
- an autonomous company OS
- an AGI orchestration layer
- a self-improving agent swarm
- a replacement for OS-level sandboxing
- a fully isolated multi-tenant SaaS runtime in v1.x

It is runtime infrastructure for deterministic, observable, recoverable AI execution.

---

## License

AGPL-3.0-only.

See:

```text
LICENSE
```

---

**Owner:** Shivam Shrivastav · **Protocol Schema:** HANDOFF_JSON v6.1.1 · **Version:** v1.1.0-pro-persistence