# VEDA Runtime

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
  → governance gates         (ZTE / SPE / Legal / Budget)
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
Layer 0.5   CEO / VEDA Intake         — Human instruction interpretation & handoff creation
Layer 1     Runtime API               — Schema validation · nonce · signature · HMAC
Layer 1.5   @veda/shared              — Canonical TS contracts: HandoffJSON, FSMState, VedaTraceSpan
Layer 2     Governance Injection      — ZTE · SPE chain · Legal · Budget · Brand · Manual approval
Layer 3     Risk & Threat Engine      — DWRV · graph propagation · obfuscation detection
Layer 4     Workflow Engine / FSM     — DAG creation · sequential dispatch · retry governance
Layer 4.5   Capability Router         — Provider health check · fallback · cost guardrail
Layer 7     Execution Sandbox         — Deny-by-default shell · filesystem boundary · timeouts
Layer 7+    Rollback Engine           — Snapshot · verify · checkpoint · restore on failure
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
- Optional VEDA bridge adapter

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
  "signature": "ed25519-signed-payload",
  "hmac": "HMAC-SHA256-hash"
}
```


**`sovereign_key` — Free vs Pro:**

| Edition | Key | How it's verified |
|---|---|---|
| Free | `veda_local_free` | Built-in — accepted automatically, no setup needed |
| Pro | Issued after payment | Verified against your Supabase `api_keys` table |

Free users use `veda_local_free` out of the box. No account, no configuration required.

**Governance fields explained:**

| Field | What it means |
|---|---|
| `zte_cleared` | Zero Trust Enforcement — confirms the agent has passed the permission check for this specific tool or action. Every tool call requires ZTE sign-off before execution. |
| `spe_chain_passed` | Security Policy Enforcement — confirms the full security policy chain has been evaluated for this request (used on build/security execution paths). |
| `legal_cleared` | Legal gate has evaluated this request and found no compliance blockers (DPDPA, GDPR, etc). |
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
| `zte_cleared` is not `true` | `ZTE_CLEARANCE_DENIED` |
| `sovereign_key` missing or invalid | `SOVEREIGN_KEY_MISSING` / `SOVEREIGN_KEY_INVALID` |
| Any unknown or forbidden field present | `FORBIDDEN_FIELD` |
| Kill Switch active | `KILL_SWITCH_ACTIVE` |

**Permanently rejected patterns:**

- `pipeline_status: ANALYSIS_ONLY`
- `schema_version: v6.1.0` or `v6.1.3`
- Unsigned handoffs
- `curl ... | sh` or `wget ... | sh` network installer pipes

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VEDA_HMAC_KEY` | **Recommended** | `local_demo_hmac_key` | HMAC key for tamper-evident audit ledger. **Set a real key in production.** |
| `SUPABASE_URL` | Paid only | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Paid only | — | Supabase service role key |

The runtime **fails startup** if `VEDA_HMAC_KEY` is missing in production mode.

---

## Project Structure

```
VEDARuntime/
├── packages/
│   ├── shared/         — Canonical types, schema validator, constants (@veda/shared)
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

Proprietary. See LICENSE file for details.

---

**Owner:** Shivam Shrivastav · **Protocol Schema:** HANDOFF_JSON v6.1.1 · **Version:** 1.0.0
