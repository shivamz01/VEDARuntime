# VEDA Runtime (Version 1)

**Version:** 1.0.0  
**Owner:** Shivam Shrivastav  
**Protocol Schema:** `HANDOFF_JSON v6.1.1`

## What is VEDA Runtime?

VEDA Runtime is a production-safe execution runtime for AI agents, MCP workflows, and multi-model orchestration.

**Its purpose is NOT to create autonomous AI employees.**  
Its purpose is to make AI execution:
- deterministic
- observable
- governed
- replayable
- recoverable
- safe enough for real workflows

## Core Thesis

Current AI systems are powerful but operationally unstable. Most agent frameworks today suffer from:
- brittle context
- recursive failures
- hallucinated actions
- uncontrolled tool execution
- missing rollback
- weak observability
- inconsistent orchestration
- unsafe memory handling
- non-deterministic execution behavior

VEDA Runtime exists to solve these operational failures at the foundational layer. Built as a standalone project from the ground up, it enforces strict operational boundaries, context scoping, rollback guarantees, and tamper-evident auditing before any production claim is allowed.

## Product Editions

VEDA Runtime is distributed across two distinct boundaries: a secure local core (Free Edition) and an enterprise-scale cloud extension (Paid Edition).

### Core Engine (Free Edition)
The foundation of the runtime operates entirely locally, ensuring deterministic and secure execution without cloud dependencies:
- **Runtime Kernel** — the central execution engine that orchestrates the full proof chain
- **Handoff Validator** — validates every payload against the locked `HANDOFF_JSON v6.1.1` schema; rejects malformed or forbidden fields immediately
- **Nonce Registry** — atomic, append-only JSONL replay-attack prevention; duplicate or stale nonces are rejected before any processing occurs
- **Context Governor** — security firewall that scopes, filters, and budget-caps all context before it reaches any agent; blocks prompt injection patterns
- **Execution Sandbox** — deny-by-default shell policy that blocks unsafe commands (`git`, `npm`, `curl`, `rm`, `python`, etc.) and prevents path traversal, write redirects, and shell chaining
- **Rollback Engine** — creates verified file snapshots before any destructive action; execution is blocked if the checkpoint cannot be verified
- **HMAC-Chained Audit Ledger** — append-only local JSONL ledger where every trace span is cryptographically chained (`HMAC-SHA256`) to its predecessor, creating a tamper-evident execution record
- **Cryptographic Handoffs** — `ed25519` signing and `HMAC-SHA256` payload integrity verification

### Enterprise Extensions (Paid Edition)
The Paid Edition provides cloud-native adapters and governance scaling:
- Supabase persistence adapters (audit, nonce, and `pipeline_log`)
- Hosted dashboard and API status telemetry
- Advanced governance profile packs
- Exportable audit proof bundles
- Optional VEDA bridge adapter for ecosystem integration

## Installation & Quick Start

### Prerequisites
- **Node.js >= 20** (check with `node --version`)
- **npm** (ships with Node.js)

No cloud accounts, databases, or external services are required. Running `npm install` fetches all necessary libraries to run the Free Edition entirely on your machine.

### Setup
```bash
git clone https://github.com/your-org/Veda-Runtime.git
cd Veda-Runtime
npm install
npm run build
```

### Verify the Build
Run the full test suite to confirm everything compiled correctly:
```bash
npm run test
```
All tests should pass, covering shared contracts, ed25519 + HMAC handoff verification, sandbox policy, rollback boundaries, audit-chain continuity, paid audit bundles, free-tier proof chain, pro entitlements, and API/web build verification.

### Run the Release Gate
Before packaging or handing this to a customer, run:
```bash
npm run release:check
```
This builds all workspaces, runs the full test suite, executes both Free and Paid proof demos, and prints the runtime status payload.

### Run the Local Proof Workflow
Execute a complete, deterministic proof workflow out-of-the-box:
```bash
npm run demo:free
```
This will:
1. Create a valid `HANDOFF_JSON v6.1.1` payload
2. Seal it with ed25519 and `HMAC-SHA256`
3. Validate it against the locked schema and verify the signature/HMAC
4. Insert a unique nonce into the local replay-prevention registry
5. Scope context through the Context Governor
6. Create a verified rollback checkpoint
7. Execute the sandbox-approved tool call
8. Write HMAC-chained audit spans to the local ledger
9. Output the cryptographic proof and execution result

### Check Runtime Status
```bash
npm run status
```

### Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VEDA_HMAC_KEY` | Recommended | `local_demo_hmac_key` | HMAC key for tamper-evident audit ledger entries. **Set a real key in production.** |
| `SUPABASE_URL` | Paid only | — | Supabase project URL (Enterprise Edition) |
| `SUPABASE_SERVICE_KEY` | Paid only | — | Supabase service role key (Enterprise Edition) |

## Project Structure

```
Veda-Runtime/
├── packages/
│   ├── shared/       — Canonical types, schema validator, constants (@veda/shared)
│   ├── audit/        — Local nonce registry + HMAC-chained audit ledger
│   ├── sandbox/      — Deny-by-default shell policy engine
│   ├── runtime/      — Runtime Kernel: Context Governor, Rollback Engine, execution orchestrator
│   ├── pro/          — Edition entitlement gates (free vs paid feature checks)
│   └── bridge-veda/  — Optional VEDA ecosystem bridge adapter
├── apps/
│   ├── api/          — Runtime HTTP API surface
│   └── web/          — Status dashboard
├── tests/            — Deterministic acceptance tests
├── examples/
│   └── free-demo.mjs — Local proof workflow (zero cloud dependencies)
└── docs/             — PRD, architecture, and protocol documentation
```

## The HANDOFF_JSON v6.1.1 Protocol

VEDA Runtime strictly enforces communication via the `HANDOFF_JSON v6.1.1` schema. This is a locked protocol identifier that guarantees any instructions, context, or state transitioning through the runtime follow an exact, tamper-proof structure.

If a payload does not strictly match the `HANDOFF_JSON v6.1.1` contract, the runtime immediately rejects it (Fail Closed).

### Required Fields
Every handoff must include:
`schema_version` · `timestamp` · `nonce` · `source_agent` · `target_agent` · `task_id` · `payload` (with `instruction`, `context`, `data`, `constraints`) · `governance` (with `zte_cleared`, `spe_chain_passed`, `legal_cleared`, `budget_cleared`) · `DATA_STATUS` · `phase` · `sovereign_key` · `signature` · `hmac`

### Schema Structure Example

```json
{
  "schema_version": "v6.1.1",
  "timestamp": "2026-05-09T12:00:00Z",
  "nonce": "c6f6e2da-e691-4da2-a709-e684a592faa6",
  "source_agent": "ceo-veda",
  "target_agent": "runtime-kernel",
  "task_id": "VT-TASK-001",
  "payload": {
    "instruction": "Execute governed workflow",
    "context": "scoped-session",
    "data": {},
    "constraints": ["free-edition", "local-only"]
  },
  "governance": {
    "zte_cleared": true,
    "spe_chain_passed": true,
    "legal_cleared": true,
    "budget_cleared": true
  },
  "DATA_STATUS": "REAL",
  "phase": "2",
  "sovereign_key": "veda_runtime_local",
  "signature": "ed25519-signed-payload",
  "hmac": "HMAC-SHA256-hash"
}
```

### Rejection Rules
| Condition | Code |
|---|---|
| `schema_version` is not `v6.1.1` | `SCHEMA_VERSION_MISMATCH` |
| Nonce missing or invalid format | `NONCE_MISSING` / `NONCE_INVALID` |
| Nonce already consumed | `NONCE_REPLAY` |
| Timestamp older than 300 seconds | `NONCE_STALE` |
| Signature verification fails | `SIGNATURE_INVALID` |
| HMAC verification fails | `HMAC_INVALID` |
| `DATA_STATUS` missing or invalid | `DATA_STATUS_MISSING` / `DATA_STATUS_INVALID` |
| `zte_cleared` is not `true` | `ZTE_CLEARANCE_DENIED` |
| `sovereign_key` missing or invalid | `SOVEREIGN_KEY_MISSING` / `SOVEREIGN_KEY_INVALID` |
| Any unknown/forbidden field present | `FORBIDDEN_FIELD` |

### Permanently Rejected Patterns
- `pipeline_status: ANALYSIS_ONLY`
- `schema_version: v6.1.0` or `v6.1.3`
- Unsigned handoffs
- `curl ... | sh` or `wget ... | sh` network installer pipes

## Runtime Proof Bar

A feature claim is considered real only when the full execution chain passes:

```
input → schema validation → signature/HMAC verification → nonce insert →
context governance → rollback checkpoint → sandbox execution → VedaTrace span →
audit ledger append → verified output
```

Anything that does not pass this end-to-end chain is classified as `SPEC_ONLY`, `PARTIAL`, or `BLOCKED` — not production-ready.

## Engineering Directives & Non-Negotiables

To maintain the absolute integrity of the execution environment, the following rules are structurally enforced:

1. **Protocol Immutability**: The product version is `1.0.0`, but it strictly adheres to the `HANDOFF_JSON v6.1.1` schema. This schema string is a locked protocol identifier and must not be altered.
2. **Fail Closed**: Any unknown, malformed, or out-of-policy handoffs will immediately fail closed. No exceptions.
3. **Context Scoping**: Full context history never reaches a worker. Workers receive only their explicitly scoped operational context.
4. **Rollback Mandate**: All destructive actions strictly require a verified rollback checkpoint prior to execution.
5. **Cryptographic Auditing**: Audit HMAC hashing requires `VEDA_HMAC_KEY` or an explicit local proof key to ensure tamper-evident records.
6. **Decoupled Architecture**: The Free Edition must never depend on Paid/Supabase wiring.
7. **Strict Entitlement Gates**: All paid and enterprise features are gated by rigid entitlement checks.
8. **No Unsafe Shell Expansion**: `git`, `npm`, `curl`, `wget`, `rm`, `python`, `node`, and shell interpreters are denied by default in the Execution Sandbox.
9. **One Agent at a Time**: No parallel agent dispatch. Sequential execution only.
10. **No Simulation as Production**: `DATA_STATUS: SIMULATED` cannot be used to claim production readiness.

## License

Proprietary. See LICENSE file for details.
