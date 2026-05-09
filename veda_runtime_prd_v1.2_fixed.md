# VEDA Runtime — Product Requirements Document v1.2

**Version:** v1.2.1-FIXED  
**Status:** ACTIVE — Implementation-Locked Production Specification  
**Owner:** Shivam Shrivastav  
**Document Path:** `docs/RUNTIME_PRD.md`  
**Schema:** HANDOFF_JSON v6.1.1  
**Architecture Baseline:** VEDA OS v9.2 Runtime Kernel  
**Last Updated:** 2026-05-09  
**Classification:** Internal — Production Runtime Artifact

> **v1.2.1 Fix Log (adversarial audit pass)**
>
> | # | Severity | Fix |
> |---|---|---|
> | 1 | CRITICAL | Added `sovereign_key: string` to `HandoffJSON_v611` TS interface — v9.2 IdP requires this field; omission silently bypassed sovereign identity verification |
> | 2 | CRITICAL | Reconciled duplicate `VedaTraceSpan` definitions (§7.3 vs §17.4) — added `step_id?` to canonical §7.3, §17.4 now imports instead of redefining |
> | 3 | CRITICAL | Added `'SECURITY' \| 'LEGAL'` to `AgentTier` union — Context Governor Budget Table (§10.5) has rows for these tiers; missing types caused compile/runtime failure |
> | 4 | HIGH | Replaced "nonce not UUID v4" rejection rule with "nonce format invalid" — UUID v4 was never specified in canonical HANDOFF_JSON schema; added §9.2.1 defining both accepted formats |
> | 5 | HIGH | Added v1.2 migration note for nonce registry filename `.json` → `.jsonl` (§9.2) |
> | 6 | HIGH | Added `BLOCKING` and `NEEDS_WIRING` to §3.1 status vocabulary with definitions — both were used in §3 table and §20.3 but undefined |
> | 7 | MEDIUM | Added scope clarification to dead-step watchdog (§13.4): 30s governs FSM transitions, not individual tool call timeouts |
> | 8 | MEDIUM | Defined provider latency threshold in §14.3: default 5000ms, configurable via `VEDA_PROVIDER_LATENCY_THRESHOLD_MS` |
> | 9 | LOW | Added note in §6.1 explaining layers 5/6 gap in runtime stack |

---

## 0. v1.2 Executive Mandate

VEDA Runtime v1.2 is not a feature expansion release. It is a production hardening release.

The v1.0 document correctly defined the runtime thesis: deterministic, governed, replayable, recoverable AI execution. The v1.1 update correctly identified the immediate security patches around HMAC, nonce persistence, provider health checks, Context Governor, and Rollback Engine. However, v1.1 still left too much room for documentation theater: it described what should exist without making live-readiness dependent on hard implementation gates.

v1.2 closes that gap.

The mandate is simple:

**No runtime claim is accepted unless it passes build, security, execution, observability, and recovery proof.**

VEDA Runtime v1.2 promotes five things from “architecture idea” to “release blocker”:

1. Canonical shared runtime contracts.
2. Atomic nonce and handoff validation.
3. Context Governor as a required security firewall.
4. Rollback Engine as a required pre-execution gate for destructive actions.
5. VedaTrace + Audit Ledger as the proof layer for every execution claim.

The goal is not to make VEDA look bigger. The goal is to make VEDA safer, smaller, verifiable, and sellable as a real AI execution kernel.

---

## 1. Source Consolidation

v1.2 consolidates five source layers:

1. **Base PRD v0.1** — defined the product category: production-safe runtime for governed AI workflows.
2. **Claude-modified `RUNTIME_PRD.md` v1.0** — added honest status boundaries, module-level contracts, HANDOFF_JSON integration, explicit bugs, compliance framing, and launch gates.
3. **Grok audit** — correctly identified the root blocker: the system risks becoming documentation theater because many modules are `SPEC_ONLY`, `PARTIAL`, or `BLOCKED`.
4. **Perplexity audit** — reinforced the same gap pattern: runtime proof requires the end-to-end chain, not just module descriptions.
5. **Gemini v1.1 draft** — added useful v1.1 fixes for Context Governor, Rollback Engine, HMAC key isolation, nonce atomicity, sandbox command restrictions, and provider health checks.

v1.2 does not blindly merge all suggestions. It accepts the useful ones, rejects unsafe/ambiguous ones, and locks the runtime around verifiable gates.

---

## 2. Product Definition

### 2.1 What VEDA Runtime Is

VEDA Runtime is a **production-safe execution kernel for governed AI agent workflows**.

It is the operational layer underneath VEDA OS. Its job is to convert AI-generated intent into bounded, signed, traceable, recoverable execution.

VEDA Runtime is not an AI employee system. It is not an autonomous company. It is not an AGI framework. It is not a roleplay framework.

It is:

**A deterministic orchestration and execution kernel for AI systems that need to operate safely in real workflows.**

### 2.2 Core Product Promise

For every governed execution path, VEDA Runtime provides:

- bounded execution
- governed tool access
- deterministic workflow state
- scoped context handling
- rollback checkpoints
- replayable workflows
- structured observability
- tamper-evident audit records
- human override authority

### 2.3 Product Positioning

Correct market category:

**Production-safe AI runtime infrastructure.**

Comparable categories:

- Governed Agent Runtime
- Deterministic AI Workflow Engine
- Secure AI Execution Layer
- AI Runtime Kernel
- Agent Execution Control Plane

Rejected positioning:

- “AI employees”
- “autonomous company OS”
- “AGI orchestration layer”
- “self-improving agent swarm”

v1.2 product message:

**VEDA Runtime makes AI execution deterministic, observable, and recoverable.**

---

## 3. Honest Runtime Status Boundary

This section is mandatory. It is the difference between a production spec and a marketing document.

| Capability | v1.2 Status | Release Meaning |
|---|---:|---|
| Base runtime doctrine | LOCKED | Product category and non-goals are stable |
| HANDOFF_JSON v6.1.1 schema | SPEC_LOCKED | Schema is canonical, but implementation must pass validation tests |
| `@veda/shared` canonical types | BLOCKING | Must exist before TS runtime is considered real |
| Pipeline simulation | LIVE_SIMULATION | Useful proof of template logic, not live runtime proof |
| Runtime API JS surface | PARTIAL | Existing JS entry points are not enough without full validation chain |
| Context Governor | RELEASE_BLOCKER | Must be implemented before any agent receives session history |
| Capability Router | PARTIAL | Must add provider health checks and fallback proof |
| Workflow Engine / DAG | CODE_SURFACE | Must compile and execute one live workflow |
| Execution Sandbox | PARTIAL | Must remove unsafe command access and refine parser |
| Rollback Engine | RELEASE_BLOCKER | Must exist before WRITE/EXEC destructive actions |
| VedaTrace local logging | PARTIAL | Must use `VEDA_HMAC_KEY`, not auth/JWT secret |
| Supabase `pipeline_log` | NEEDS_WIRING | At least one live write required before release |
| Supabase `audit_ledger` | NEEDS_WIRING | Append-only proof required before release |
| ed25519 handoff signing | SPEC_ONLY | Crypto file existence is not enough; end-to-end verification required |
| Kill Switch | PARTIAL | Config exists, runtime enforcement must be proven |
| Redis/BullMQ queue | BLOCKED/OPTIONAL | Do not block local v1.2 on Redis; use local sequential queue fallback |
| Live production claim | BLOCKED | Blocked until acceptance suite passes |

### 3.1 Runtime Proof Bar

A feature is real only when this chain passes:

`input → schema validation → nonce insert → signature verification → context governance → governance gate → risk gate → workflow step → sandbox execution → rollback checkpoint → VedaTrace span → audit ledger append → verified output`

Anything short of this is one of:

- `SPEC_ONLY` — defined in documentation, no code exists
- `CODE_SURFACE` — code file exists, untested and unproven
- `PARTIAL` — code exists, some paths proven, others not
- `LIVE_SIMULATION` — full template logic proven, but no live inference or Supabase writes
- `BLOCKED` — cannot proceed; blocked by an unresolved upstream dependency
- `BLOCKING` — this item must be completed before other items can proceed; unblocking the system depends on it
- `NEEDS_WIRING` — module exists but is not connected to the live runtime path
- `LIVE_VERIFIED` — end-to-end proof exists with real data

No other status labels are allowed.

---

## 4. v1.2 Non-Negotiable Invariants

These are hard runtime laws.

1. **Fail closed.** Unknown, stale, unsigned, malformed, or unverified requests are rejected.
2. **One agent executes at a time.** No parallel agent dispatch in v1.2.
3. **Cooldown remains enforced.** Minimum 8-second cooldown between inference calls.
4. **No full history to agents.** Agents receive only Context Governor output.
5. **No destructive action without rollback.** WRITE/EXEC destructive paths require verified checkpoint first.
6. **No audit claim without correct HMAC.** VedaTrace and audit rows use `VEDA_HMAC_KEY`, never `jwtSecret` or any auth secret.
7. **No replayable nonce.** Nonce validation must be atomic and durable.
8. **No unsafe shell expansion.** `git`, `npm`, `yarn`, package installers, network installers, and shell interpreters are denied by default.
9. **No provider dispatch without health check.** Router must verify provider health before model invocation.
10. **No compliance claim without enforcement proof.** Compliance hooks are `SPEC_ONLY` until a gate blocks and logs correctly.
11. **No simulation promoted as live.** `DATA_STATUS: SIMULATED` cannot be used to claim production readiness.
12. **No forbidden handoff fields.** `pipeline_status: ANALYSIS_ONLY` is rejected on sight.

---

## 5. Problem Statement

Production AI workflows usually fail at the infrastructure layer, not only the model layer.

They fail because:

- context is uncontrolled
- tool access is too permissive
- retries are recursive and unbounded
- rollback is missing
- provider routing is not health-aware
- logs are narrative, not evidentiary
- governance is declared, not enforced
- tests simulate paths that production never verifies

VEDA Runtime exists to make these failure modes structurally harder inside its execution boundary.

### Failure Class 1 — Context Poisoning

Agents receive stale session history, irrelevant memory, previous failed outputs, and cross-workflow contamination.

v1.2 mitigation:

- Context Governor mandatory
- session-scoped retrieval
- TTL expiry
- relevance threshold
- hard token cap
- prompt/output injection screen

### Failure Class 2 — Recursive Execution Collapse

Agents loop through tool failure → retry → replan → tool call → failure.

v1.2 mitigation:

- max recursion depth
- max retries per step
- one retry authority only
- dead-step watchdog
- budget gate before retry

### Failure Class 3 — Unsafe Tool Access

Agents execute unsafe shell, write arbitrary files, or invoke external commands without boundaries.

v1.2 mitigation:

- ZTE permission check per tool
- sandbox cwd enforcement
- deny-by-default shell policy
- AST/structured shell parsing
- content firewall
- destructive-op rollback preflight

### Failure Class 4 — No Recovery Path

Files, configs, memory, or workflow state are modified without snapshots.

v1.2 mitigation:

- Rollback Engine required before destructive action
- verified checkpoint before execution
- workflow recovery from last completed step
- idempotency key per step

### Failure Class 5 — Opaque Execution

Logs describe model text, not actual execution.

v1.2 mitigation:

- VedaTrace event spans
- tool trace
- provider trace
- rollback checkpoint trace
- governance trace
- HMAC chain
- audit ledger append

### Failure Class 6 — Hallucinated Governance

Agents claim that security/compliance checks ran, but nothing enforced them.

v1.2 mitigation:

- enforcement-first gate model
- CISO veto final
- gate output must be machine-verifiable
- missing gate span = gate did not happen

### Failure Class 7 — Spec/Runtime Drift

PRDs claim production readiness while implementation remains blocked.

v1.2 mitigation:

- live status dashboard
- acceptance test suite
- release gates
- README claim sync
- feature status from tests, not manual edits

---

## 6. System Architecture v1.2

### 6.1 Runtime Layer Stack

```txt
Layer 0     Kill Switch
            Absolute halt authority. Cannot be overridden by any agent.

Layer 0.5   CEO, VEDA Intake
            Human instruction interpretation and handoff creation.

Layer 1     Runtime API + Handoff Validator + Context Governor
            Schema validation, nonce validation, signature verification, scoped context.

Layer 1.5   Canonical Shared Contracts
            @veda/shared types: HandoffJSON, FSMState, RollbackCheckpoint, VedaTraceSpan.

Layer 2     Governance Injection Layer
            ZTE, SPE chain, Legal, Budget, Brand, manual approval.

Layer 3     Risk & Threat Engine
            DWRV, graph propagation, obfuscation detection, risk thresholding.

Layer 4     Workflow Engine + Queue
            DAG creation, FSM state, sequential dispatch, retry governance.

Layer 4.5   Capability Router
            Provider scoring, provider health check, fallback, cost guardrail.

            ── Note: Layers 5 (Executive C-Suite) and 6 (Department Leads) are
               VEDA OS governance layers. They make policy decisions and manage
               department pipelines but are not runtime execution components.
               The Runtime Kernel operates within and beneath them. They are
               documented in AGENTS.md and enforced through the Governance
               Injection Layer (Layer 2). ──

Layer 7     Execution Sandbox
            RBAC, shell jail, filesystem boundary, content firewall, timeouts.

Layer 7+    Rollback Engine
            Snapshot, verify restore path, checkpoint, restore on failure.

Layer 8     Observability Engine
            VedaTrace spans, metrics, logs, failure replay.

Layer 8.5   Sovereign Audit Ledger
            HMAC chained append-only records, ed25519 row seal target.
```

### 6.2 v1.2 Data Flow

```txt
1. Human instruction received
2. CEO, VEDA creates HANDOFF_JSON v6.1.1
3. Runtime API validates schema
4. Nonce Registry performs atomic insert
5. Signature verifier checks ed25519 signature
6. HMAC verifier checks VEDA_HMAC_KEY-based payload integrity
7. Context Governor builds scoped context
8. Governance Injection executes ZTE/SPE/Legal/Budget/Brand gates
9. Risk Engine scores task
10. Workflow Engine creates or resumes FSM step
11. Capability Router verifies provider health
12. Rollback Engine creates and verifies checkpoint if action is destructive
13. Execution Sandbox performs approved tool call
14. VedaTrace writes structured span
15. Audit Ledger appends tamper-evident row
16. Output returned
17. Next step queued only after cooldown and gate validation
```

### 6.3 Sequential Queue Rule

v1.2 can support a local queue without Redis/BullMQ for the first production-verified workflow.

Redis/BullMQ remains acceptable later, but it must not block the foundation. The first release should prove the kernel locally with a deterministic in-process queue before distributed queue complexity is introduced.

---

## 7. Canonical Shared Contracts

### 7.1 Module Purpose

`@veda/shared` becomes the first implementation dependency. Without it, TypeScript runtime code remains blocked.

### 7.2 Required File

`veda-os-v7-ts/packages/shared/src/types.ts`

### 7.3 Required Exports

Minimum required exports:

```typescript
export type DataStatus = 'REAL' | 'SIMULATED' | 'PARTIAL';
export type FSMState = 'PENDING' | 'QUEUED' | 'RUNNING' | 'BLOCKED' | 'FAILED' | 'COMPLETED';
export type AgentTier = 'CORE' | 'EXECUTIVE' | 'DEPT_LEAD' | 'WORKER' | 'SECURITY' | 'LEGAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SpanStatus = 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'TIMEOUT';

export interface HandoffJSON_v611 {
  schema_version: 'v6.1.1';
  timestamp: string;
  nonce: string;
  source_agent: string;
  target_agent: string;
  task_id: string;
  workflow_id?: string;
  payload: {
    instruction: string;
    context: string;
    data: Record<string, unknown>;
    constraints: string[];
  };
  governance: {
    zte_cleared: boolean;
    spe_chain_passed: boolean;
    legal_cleared: boolean;
    budget_cleared: boolean;
    brand_cleared?: boolean;
    human_approval_required?: boolean;
  };
  DATA_STATUS: DataStatus;
  phase: '1' | '2';
  sovereign_key: string;  // REQUIRED: veda_[dept]_[hash] — verified against Supabase api_keys (v9.2 IdP)
  signature: string;
  hmac: string;
}

export interface NonceRecord {
  nonce: string;
  created_at: string;
  expires_at: string;
  source_agent: string;
  workflow_id?: string;
  consumed: boolean;
}

export interface ContextBudget {
  max_tokens: number;
  recency_weight: number;
  task_relevance_threshold: number;
  session_scope: string;
  ttl_seconds: number;
}

export interface MemorySlice {
  id: string;
  workflow_id: string;
  session_scope: string;
  content: string;
  created_at: string;
  relevance_score?: number;
  source_type: 'USER' | 'AGENT' | 'TOOL' | 'MEMORY' | 'DOC';
}

export interface GovernedContext {
  task_prompt: string;
  relevant_memory: MemorySlice[];
  token_budget_consumed: number;
  items_filtered: number;
  budget_ceiling_hit: boolean;
  session_scope: string;
}

export interface RollbackCheckpoint {
  checkpoint_id: string;
  workflow_id: string;
  step_id: string;
  snapshot_type: 'FILE' | 'WORKFLOW' | 'SHELL_ARTIFACTS';
  created_at: string;
  snapshot_data: unknown;
  verified: boolean;
  restore_test_hash?: string;
  vedatrace_span: string;
}

export interface VedaTraceSpan {
  span_id: string;
  workflow_id: string;
  step_id?: string;        // present when span is tied to a specific workflow step
  agent_name: string;
  agent_version: string;   // canonical: agent version string e.g. "v1.2"
  event_type: string;
  timestamp: string;
  status: SpanStatus;
  prev_hmac: string;
  hmac: string;
  metadata: Record<string, unknown>;
}
```

### 7.4 Acceptance Criteria

`@veda/shared` is accepted only when:

- all TS packages can import it
- `npm run build` or equivalent compile command passes
- no duplicate local definitions exist for HANDOFF_JSON/FSM/Rollback/VedaTrace
- schema version is exactly `v6.1.1`
- forbidden fields are explicitly rejected by validators

---

## 8. HANDOFF_JSON v6.1.1 Contract

### 8.1 Canonical Schema

Every inter-agent or runtime execution request must use HANDOFF_JSON v6.1.1.

Required fields:

- `schema_version`
- `timestamp`
- `nonce`
- `source_agent`
- `target_agent`
- `task_id`
- `payload.instruction`
- `payload.context`
- `payload.data`
- `payload.constraints`
- `governance.zte_cleared`
- `governance.spe_chain_passed`
- `governance.legal_cleared`
- `governance.budget_cleared`
- `DATA_STATUS`
- `phase`
- `sovereign_key`
- `signature`
- `hmac`

### 8.2 Rejection Rules

| Rule | Rejection Code |
|---|---|
| `schema_version !== "v6.1.1"` | `SCHEMA_VERSION_MISMATCH` |
| missing nonce | `NONCE_MISSING` |
| nonce format invalid | `NONCE_INVALID` |
| nonce already exists | `NONCE_REPLAY` |
| timestamp older than 300 seconds | `NONCE_STALE` |
| timestamp too far in future | `TIMESTAMP_INVALID` |
| ed25519 verification fails | `SIGNATURE_INVALID` |
| HMAC verification fails | `HMAC_INVALID` |
| missing `DATA_STATUS` | `DATA_STATUS_MISSING` |
| `DATA_STATUS` not in allowed enum | `DATA_STATUS_INVALID` |
| `pipeline_status` exists | `FORBIDDEN_FIELD` |
| `governance.zte_cleared !== true` | `ZTE_CLEARANCE_DENIED` |
| unknown target agent | `UNKNOWN_AGENT` |
| missing `sovereign_key` | `SOVEREIGN_KEY_MISSING` |
| `sovereign_key` not found in Supabase `api_keys` | `SOVEREIGN_KEY_INVALID` |
| Kill Switch active | `KILL_SWITCH_ACTIVE` |

### 8.3 Permanently Rejected Patterns

- `pipeline_status: ANALYSIS_ONLY`
- `schema_version: v6.1.0`
- `schema_version: v6.1.3`
- unsigned handoff
- self-certified security clearance
- CISO auto-approval without evaluation
- XML or prompt-only sandbox directives
- Redis-only nonce lock as the only replay defense

---

## 9. Nonce Registry v1.2

### 9.1 Purpose

Prevent replay attacks before any runtime processing occurs.

### 9.2 Storage Model

v1.2 uses two layers:

1. Local append-only registry: `config/spe-nonce-registry.jsonl`
2. Supabase table: `nonce_registry`

The file must be JSONL, not a mutable JSON array, because append-only JSONL reduces merge corruption and simplifies recovery.

**v1.2 Migration note:** The canonical filename migrates from `spe-nonce-registry.json` (v1.1) to `spe-nonce-registry.jsonl` (v1.2). During the transition window, the runtime must read both files and treat entries from either as valid nonce records. After migration is confirmed complete, the `.json` file becomes a read-only archive.

### 9.2.1 Nonce Format

A valid nonce must satisfy one of:

- UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Cryptographically random hex string: 32+ lowercase hex characters

`NONCE_INVALID` is returned if the nonce is empty, shorter than 32 characters, not a UUID v4, and not a 32+ hex string. Static strings (`anti_replay_nonce_001`, sequential integers, predictable patterns) are rejected as `NONCE_INVALID` if they do not satisfy either format above.

### 9.3 Atomic Validation Rule

A HANDOFF_JSON is valid only if nonce insertion succeeds.

The runtime must not perform:

```txt
check nonce → execute → write nonce
```

It must perform:

```txt
atomic insert nonce → verify insert success → continue
```

### 9.4 Local Atomic Write Protocol

For local mode:

1. acquire process-level lock
2. validate nonce format
3. scan recent registry or index
4. write nonce record to temp file/append buffer
5. fsync
6. append to JSONL registry
7. fsync parent directory if supported
8. release lock
9. continue execution

If any step fails, reject request.

### 9.5 Supabase Atomic Insert Protocol

For Supabase mode:

- `nonce` must have unique index
- insert must be single statement
- duplicate key = replay rejection
- no update/delete allowed by agent role
- TTL cleanup must archive, not mutate audit proof

### 9.6 Acceptance Criteria

- duplicate nonce test rejects
- restart replay test rejects old nonce
- concurrent duplicate insert test allows only one success
- stale timestamp test rejects
- future timestamp test rejects
- registry corruption test fails closed

---

## 10. Context Governor v1.2

### 10.1 Purpose

The Context Governor is not a prompt optimization module. It is a security firewall.

Agents must never receive full session history. They receive only task-scoped, relevance-filtered, TTL-valid, budget-bounded context.

### 10.2 Target File

`veda-os-v7-ts/packages/intent-engine/src/ContextGovernor.ts`

### 10.3 Inputs

```typescript
interface ContextGovernorInput {
  workflow_id: string;
  session_scope: string;
  task_intent: string;
  task_prompt: string;
  agent_tier: AgentTier;
  raw_memory: MemorySlice[];
  now: string;
}
```

### 10.4 Output

```typescript
interface ContextGovernorOutput extends GovernedContext {
  rejected_memory_ids: string[];
  reason_counts: {
    stale: number;
    wrong_scope: number;
    low_relevance: number;
    token_overflow: number;
  };
  vedatrace_span: string;
}
```

### 10.5 Budget Table

| Agent Tier | Max Tokens | Relevance Threshold | Recency Weight | TTL |
|---|---:|---:|---:|---:|
| CORE | 8192 | 0.68 | 0.70 | 30 days |
| EXECUTIVE | 4096 | 0.72 | 0.60 | 14 days |
| DEPT_LEAD | 3072 | 0.74 | 0.65 | 7 days |
| WORKER | 2048 | 0.78 | 0.80 | 72 hours |
| SECURITY | 4096 | 0.80 | 0.50 | 30 days |
| LEGAL | 4096 | 0.82 | 0.50 | 90 days |

### 10.6 Algorithm

1. Normalize current task intent.
2. Drop all memory outside `session_scope`, unless explicitly approved by governance.
3. Drop stale memory past TTL.
4. Score memory against task intent.
5. Drop memory below `task_relevance_threshold`.
6. Apply recency weighting.
7. Apply source trust weighting:
   - direct user instruction: high
   - verified tool output: high
   - previous agent reasoning: low
   - failed step output: very low
   - unverified memory: reject unless explicitly requested
8. Sort by final score.
9. Append memory slices until token budget is reached.
10. Hard truncate at ceiling.
11. Log token budget, filtered items, and ceiling-hit status.

### 10.7 Security Rules

- Previous failed tool outputs must not be injected into the next prompt as truth.
- Agent self-claims are not accepted as verified facts.
- Tool output must be labeled as verified/unverified.
- Memory from other workflows is denied unless governance explicitly grants cross-workflow read.
- Prompt injection patterns inside memory slices must be removed or quarantined.

### 10.8 Acceptance Criteria

- full session history never reaches model
- wrong-session memory rejected
- stale memory rejected
- low-relevance memory rejected
- prompt injection memory quarantined
- token cap never exceeded
- VedaTrace context span emitted
- Context Governor used before every agent call

---

## 11. Runtime API v1.2

### 11.1 Purpose

Runtime API is the only valid entry point for execution.

No agent, tool, or workflow may bypass it.

### 11.2 Required Responsibilities

- validate HANDOFF_JSON schema
- perform atomic nonce insertion
- verify timestamp bounds
- verify ed25519 signature
- verify HMAC
- reject forbidden fields
- enforce Kill Switch
- initialize workflow ID
- route through Context Governor
- call governance gates
- assign FSM state
- emit VedaTrace intake span

### 11.3 Runtime Response Contract

```typescript
interface RuntimeAPIResponse {
  accepted: boolean;
  workflow_id: string;
  execution_status: FSMState;
  rejection_reason?: string;
  vedatrace_span: string;
  next_step_id?: string;
  requires_human_approval?: boolean;
}
```

### 11.4 Acceptance Criteria

- malformed handoff rejected
- stale handoff rejected
- duplicate nonce rejected
- invalid signature rejected
- invalid HMAC rejected
- forbidden field rejected
- active Kill Switch blocks execution
- Context Governor is invoked before provider call
- VedaTrace span created for both accept and reject

---

## 12. Governance Injection Layer v1.2

### 12.1 Purpose

Governance is not a text instruction. Governance is a runtime decision gate.

### 12.2 Gates

Minimum gates:

1. ZTE clearance
2. SPE chain for build/security paths
3. Legal compliance gate for regulated data
4. Budget gate for provider/tool cost
5. Brand gate for public content
6. Manual approval gate for high-risk execution
7. CISO veto gate for security-sensitive workflows

### 12.3 Gate Output Contract

```typescript
interface GovernanceDecision {
  gate_name: string;
  passed: boolean;
  reason: string;
  risk_level: RiskLevel;
  required_action?: 'ALLOW' | 'BLOCK' | 'MANUAL_APPROVAL' | 'ROLLBACK' | 'KILL_SWITCH';
  vedatrace_span: string;
}
```

### 12.4 Fail Rules

- missing gate output = block
- contradictory gates = block
- CISO veto = block
- budget unknown = manual approval
- legal uncertainty = manual approval
- high-risk shell execution = block unless CISO-approved

---

## 13. Workflow Engine v1.2

### 13.1 Purpose

Workflow Engine turns intent into deterministic FSM-managed execution.

### 13.2 FSM States

Allowed states:

- `PENDING`
- `QUEUED`
- `RUNNING`
- `BLOCKED`
- `FAILED`
- `COMPLETED`

Allowed transitions:

```txt
PENDING  → QUEUED
QUEUED   → RUNNING
RUNNING  → COMPLETED
RUNNING  → BLOCKED
RUNNING  → FAILED
BLOCKED  → RUNNING
BLOCKED  → FAILED
FAILED   → PENDING   only if retry budget remains
FAILED   → BLOCKED   if rollback/manual approval required
```

No other transitions are valid.

### 13.3 Retry Rules

- max attempts per step: 3
- retry backoff: deterministic exponential with jitter disabled in local mode
- one retry authority only: Workflow Engine
- provider-level retries must be disabled or counted under the same budget
- after final failure, Rollback Engine must run before next step

### 13.4 Dead Execution Detection

If a step has no FSM state transition for 30 seconds:

1. mark as `FAILED`
2. trigger rollback if destructive action began
3. emit VedaTrace timeout span
4. require manual approval to resume

**Scope note:** The 30-second watchdog governs workflow-level FSM step transitions, not individual tool call timeouts. Shell commands are separately bounded by the 15-second sandbox hard timeout (§15.6). An inference call that hangs past provider timeout is handled by the Capability Router circuit breaker, which then causes the FSM step to transition to `FAILED`. The watchdog catches steps that stop transitioning entirely — for example, a provider that returns a partial stream and never completes.

### 13.5 Acceptance Criteria

- cycle detection works
- illegal transitions rejected
- retry cap enforced
- dead-step watchdog triggers
- workflow resumes from last completed checkpoint
- completed steps are not rerun after crash

---

## 14. Capability Router v1.2

### 14.1 Purpose

Route work to a healthy, appropriate provider without silent failures or cost explosions.

### 14.2 Provider Policy

Default chain:

1. Groq — fast, low-latency tasks
2. Gemini — general high-capability fallback
3. OpenAI — structured reasoning / tool-heavy tasks
4. Claude — architecture, long-form, security review, strategy
5. Local model — disabled by default unless hardware gate passes

### 14.3 Required Health Check

Before dispatch:

```typescript
const health = await verifyProviderHealth(provider);
if (!health.ok) fallbackToNextProvider();
```

Health check must verify:

- API key present
- provider reachable
- model available
- rate limit not exhausted
- last failure window not active
- estimated latency below threshold (default: 5000ms; configurable via `VEDA_PROVIDER_LATENCY_THRESHOLD_MS`)

### 14.4 Routing Decision Contract

```typescript
interface RoutingDecision {
  provider: string;
  model_tier: 'FAST' | 'HEAVY';
  complexity_score: number;
  health_verified: boolean;
  fallback_used: boolean;
  fallback_reason?: string;
  cost_estimate_tokens: number;
  vedatrace_span: string;
}
```

### 14.5 Acceptance Criteria

- unhealthy provider skipped
- fallback path works
- routing decision logged
- cost estimate logged
- no provider called if budget gate fails
- no local model used unless explicitly enabled

---

## 15. Execution Sandbox v1.2

### 15.1 Purpose

The sandbox makes unsafe tool execution structurally difficult.

### 15.2 Default Permission Model

Deny by default.

| Permission | Meaning |
|---|---|
| READ | read allowed paths only |
| LIST | list allowed directories only |
| WRITE | modify allowed workspace paths only |
| EXEC | run approved commands only |
| NET | external network access; denied by default |

### 15.3 Agent Defaults

- unknown agent: READ only
- content agents: READ/LIST only unless approved
- coding agents: READ/LIST/WRITE in sandbox workspace
- security agents: READ/LIST/WRITE/EXEC with strict command set
- CEO/Orchestrator: no direct shell execution

### 15.4 Shell Deny List

Always deny:

- `rm -rf`, `rm -r`, `rm /`
- `mkfs`, `dd`, disk tools
- `shutdown`, `reboot`, `systemctl poweroff`
- `killall`, broad process killers
- writes to `/dev`, `/etc`, `/boot`, `/var`, `/home`
- path traversal `..`
- fork bombs
- shell interpreters invoked directly: `sh`, `bash`, `zsh`, `fish`, `python -c`, `node -e` unless explicitly tool-wrapped
- package managers: `npm`, `yarn`, `pnpm`, `pip`, `curl | sh`, `wget | sh`
- `git` by default, because it can overwrite/merge/execute hooks

### 15.5 Pipe Handling v1.2

Do not block all pipes blindly.

Instead parse command structure and allow only safe read-only compositions such as:

- `cat file | head`
- `grep pattern file | head`
- `ls path | head`

Deny pipes into:

- shell interpreters
- package managers
- file writers
- network installers
- destructive commands
- privileged commands

### 15.6 Sandbox Execution Rules

- forced cwd: `runtime/sandbox/`
- forced PATH: `/usr/bin:/bin`
- timeout: 15 seconds
- max stdout/stderr: bounded
- no inherited secrets except explicit provider keys needed by approved runtime
- no unrestricted network
- content firewall before write
- rollback checkpoint before destructive write/exec

### 15.7 Acceptance Criteria

- unsafe commands blocked
- `git`/`npm` denied
- legitimate read-only pipes allowed
- pipe-to-shell denied
- path traversal denied
- writes outside sandbox denied
- timeout enforced
- command trace logged

---

## 16. Rollback Engine v1.2

### 16.1 Purpose

Rollback Engine guarantees that destructive AI execution has a recovery path before it happens.

No verified checkpoint, no destructive action.

### 16.2 Target File

`veda-os-v7-ts/packages/runtime/src/RollbackEngine.ts`

### 16.3 Destructive Action Definition

An action is destructive if it can modify:

- files
- configs
- workflow state
- memory records
- package state
- generated artifacts
- audit-adjacent local logs
- shell artifacts

### 16.4 Checkpoint Types

| Type | Scope |
|---|---|
| FILE | file before write/modify/delete |
| WORKFLOW | FSM state before step transition |
| SHELL_ARTIFACTS | files likely affected by approved command |

### 16.5 Checkpoint Protocol

1. identify target paths/state
2. verify permission to snapshot
3. create snapshot
4. hash snapshot
5. write checkpoint metadata
6. test restore path when safe
7. set `verified: true`
8. emit VedaTrace checkpoint span
9. allow destructive action

If any step fails, block execution.

### 16.6 Rollback Trigger Conditions

Rollback is triggered when:

- destructive step fails
- timeout occurs after partial write
- content firewall flags output after write attempt
- workflow enters final `FAILED`
- manual rollback requested
- Kill Switch requests state restore

### 16.7 Workflow Recovery Rule

On workflow failure:

1. find last `COMPLETED` checkpoint
2. restore destructive state if needed
3. mark failed step as `BLOCKED`
4. require manual approval to retry
5. do not rerun completed steps

### 16.8 Acceptance Criteria

- write action blocked without checkpoint
- checkpoint created before write
- restore test recorded
- failed write can be restored
- workflow resumes from last completed step
- checkpoint linked to VedaTrace span

---

## 17. Observability Engine v1.2

### 17.1 Purpose

No opaque execution.

VedaTrace records what happened, not what an agent claimed happened.

### 17.2 Required Event Types

- `HANDOFF_ACCEPTED`
- `HANDOFF_REJECTED`
- `NONCE_ACCEPTED`
- `NONCE_REJECTED`
- `SIGNATURE_VERIFIED`
- `SIGNATURE_REJECTED`
- `CONTEXT_GOVERNED`
- `GATE_PASS`
- `GATE_BLOCK`
- `RISK_SCORED`
- `WORKFLOW_STATE_CHANGE`
- `PROVIDER_SELECTED`
- `PROVIDER_HEALTH_FAILED`
- `ROLLBACK_CHECKPOINT_CREATED`
- `ROLLBACK_TRIGGERED`
- `TOOL_CALL_ALLOWED`
- `TOOL_CALL_BLOCKED`
- `AGENT_START`
- `AGENT_COMPLETE`
- `AGENT_FAILED`
- `KILL_SWITCH_ACTIVATED`
- `HUMAN_OVERRIDE`

### 17.3 HMAC Rule

All HMAC computations must use:

`process.env.VEDA_HMAC_KEY`

Never use:

- `jwtSecret`
- auth secrets
- provider API keys
- static fallback strings
- hardcoded development secrets

If `VEDA_HMAC_KEY` is missing, the runtime fails startup.

### 17.4 Span Contract

Use the canonical `VedaTraceSpan` type from `@veda/shared` (defined in Section 7.3). Do not redefine it locally.

```typescript
// import from canonical source — do not duplicate
import { VedaTraceSpan } from '@veda/shared';

// Required fields for every emission:
// span_id        — unique UUID v4 per span
// workflow_id    — links span to executing workflow
// step_id        — optional, present when tied to a specific FSM step
// agent_name     — emitting agent identifier
// agent_version  — emitting agent version string
// event_type     — one of the types listed in Section 17.2
// timestamp      — ISO 8601
// status         — SUCCESS | FAILURE | BLOCKED | TIMEOUT
// prev_hmac      — HMAC of the previous span in this workflow (enables chain verification)
// hmac           — HMAC of this span's canonical fields using VEDA_HMAC_KEY
// metadata       — structured key-value payload; avoid free-form strings
```

### 17.5 Acceptance Criteria

- HMAC key uses `VEDA_HMAC_KEY`
- missing HMAC key fails startup
- every accepted/rejected handoff logs a span
- every blocked tool call logs a span
- every rollback checkpoint logs a span
- chain verification detects tampering
- at least one local span and one Supabase span verified before release

---

## 18. Sovereign Audit Ledger v1.2

### 18.1 Purpose

The Audit Ledger is the permanent evidentiary record.

Logs help debugging. Ledger proves integrity.

### 18.2 Rules

- INSERT only
- no UPDATE
- no DELETE
- no agent direct write without approved ledger writer
- row HMAC includes `prev_hmac`
- future ed25519 row seal target remains required for full production
- local ledger is acceptable for local proof, but public launch requires at least one Supabase append proof

### 18.3 Required Tables

Deployment order:

1. `nonce_registry`
2. `pipeline_log`
3. `audit_ledger`
4. `execution_traces`
5. `active_breakers`
6. `pipeline_registry`
7. `kill_switch_audit_log`

### 18.4 Acceptance Criteria

- append works
- update denied
- delete denied
- duplicate idempotency key rejected or deduplicated safely
- chain verification passes
- tampered row detected
- VedaTrace span links to audit row

---

## 19. Compliance Scope v1.2

Compliance claims must remain conservative.

VEDA Runtime can provide compliance-supporting infrastructure, but v1.2 must not claim full legal compliance until gates are live and audited.

### 19.1 Status Language

Allowed:

- “supports auditability”
- “provides governance hooks”
- “logs compliance gate decisions”
- “can enforce data minimization through Context Governor”

Not allowed:

- “DPDP compliant” unless legal gate is live and tested
- “GDPR compliant” unless DSAR/erasure workflows are live and verified
- “CERT-In compliant” unless reporting classification and timing workflow is live
- “COPPA compliant” unless consent and child-data isolation are live

### 19.2 Compliance Proof Rule

A compliance gate exists only when:

1. it can block execution
2. it emits a VedaTrace span
3. it appends an audit row
4. it has a failing test proving it blocks invalid input

---

## 20. Live Status Dashboard v1.2

### 20.1 Purpose

Prevent spec/runtime drift.

### 20.2 Required File

`memory/runtime-status.json`

### 20.3 Example Shape

```json
{
  "runtime_version": "v1.2.0",
  "last_verified_at": "2026-05-09T00:00:00.000Z",
  "build": {
    "ts_compile": "BLOCKED",
    "shared_types": "BLOCKING"
  },
  "security": {
    "hmac_key_fixed": "BLOCKED",
    "nonce_atomic": "BLOCKED",
    "sandbox_git_npm_removed": "BLOCKED",
    "pipe_parser_refined": "BLOCKED"
  },
  "modules": {
    "context_governor": "SPEC_ONLY",
    "rollback_engine": "SPEC_ONLY",
    "provider_health_check": "BLOCKED",
    "supabase_pipeline_log": "NEEDS_WIRING",
    "audit_ledger": "NEEDS_WIRING"
  },
  "release": {
    "production_claim_allowed": false,
    "public_oss_launch_allowed": false
  }
}
```

### 20.4 Rule

README, PRD, and public claims must not exceed `runtime-status.json`.

---

## 21. MVP Scope v1.2

### 21.1 Included in v1.2 Foundation Release

- canonical shared contracts
- handoff validator
- atomic nonce registry
- HMAC fix using `VEDA_HMAC_KEY`
- Context Governor minimal implementation
- Rollback Engine minimal implementation
- provider health check
- sandbox command hardening
- deterministic local workflow queue
- VedaTrace local spans
- at least one Supabase `pipeline_log` write
- at least one audit ledger append
- one end-to-end recoverable demo workflow

### 21.2 Excluded from v1.2

- multi-tenant SaaS
- enterprise dashboard
- autonomous company workflows
- parallel swarms
- distributed rollback
- database row-level undo
- unrestricted live deployment agents
- live financial execution
- live legal/compliance execution without manual approval
- child-data live workflows
- local model activation without hardware gate

---

## 22. Implementation Roadmap

### Phase 0 — Build Unblock

Goal: TypeScript foundation compiles.

Tasks:

1. implement `@veda/shared/src/types.ts`
2. export types from package index
3. remove duplicate local interfaces
4. run compile
5. fix imports

Exit criteria:

- all TS packages compile
- no schema drift
- status dashboard updates build state

### Phase 1 — Security Fixes

Goal: Remove critical security blockers.

Tasks:

1. replace `jwtSecret` HMAC usage with `VEDA_HMAC_KEY`
2. fail startup if key missing
3. implement atomic nonce insert
4. persist nonce across restart
5. remove `git`, `npm`, `yarn`, `pnpm`, `pip` from shell allowlist
6. replace broad pipe regex with structured parser
7. remove legacy field bypass in `zte_policy.js`

Exit criteria:

- replay tests pass
- HMAC tamper test passes
- unsafe shell tests pass

### Phase 2 — Context and Rollback

Goal: Prevent poisoning and state corruption.

Tasks:

1. implement `ContextGovernor.ts`
2. enforce Context Governor before every agent call
3. implement `RollbackEngine.ts`
4. require checkpoint before destructive WRITE/EXEC
5. connect rollback to Workflow Engine failure state

Exit criteria:

- full-history injection test fails closed
- cross-session memory blocked
- destructive write blocked without checkpoint
- failed write restores correctly

### Phase 3 — Router and Workflow Proof

Goal: One deterministic workflow executes safely.

Tasks:

1. add provider health checks
2. add fallback proof
3. enforce one-agent-at-a-time queue
4. enforce retry budget
5. add dead-step watchdog

Exit criteria:

- unhealthy provider skipped
- workflow completes with trace
- failed provider falls back
- retry cap enforced

### Phase 4 — Observability and Audit Proof

Goal: Execution becomes evidentiary.

Tasks:

1. emit VedaTrace spans for all gates
2. deploy `pipeline_log`
3. deploy `audit_ledger`
4. append one live span
5. append one live audit row
6. verify HMAC chain

Exit criteria:

- span write verified
- audit write verified
- tamper detection test passes

### Phase 5 — Public Launch Lock

Goal: Release only verified claims.

Tasks:

1. update README with verified capabilities only
2. document known blocked features
3. create demo workflow
4. record rollback demo
5. tag release

Exit criteria:

- no README overclaim
- all release gates checked
- demo shows handoff → governance → execution → rollback → audit

---

## 23. Acceptance Test Suite

### 23.1 Build Tests

- `@veda/shared` compiles
- runtime imports compile
- no schema duplicate drift

### 23.2 Handoff Tests

- valid handoff accepted
- wrong schema rejected
- missing `DATA_STATUS` rejected
- forbidden `pipeline_status` rejected
- invalid signature rejected
- invalid HMAC rejected

### 23.3 Nonce Tests

- duplicate nonce rejected
- restart replay rejected
- concurrent nonce insert allows only one success
- stale timestamp rejected
- future timestamp rejected

### 23.4 Context Tests

- full history never passed
- stale memory filtered
- cross-workflow memory blocked
- low relevance filtered
- token budget enforced
- prompt injection memory quarantined

### 23.5 Sandbox Tests

- `git` blocked
- `npm` blocked
- `rm -rf` blocked
- path traversal blocked
- pipe-to-shell blocked
- safe read pipe allowed
- timeout enforced

### 23.6 Rollback Tests

- write without checkpoint blocked
- checkpoint created before write
- restore succeeds after failed write
- workflow resumes from last completed checkpoint

### 23.7 Router Tests

- healthy provider selected
- unhealthy provider skipped
- fallback used and logged
- budget failure blocks dispatch

### 23.8 Observability Tests

- accept span written
- reject span written
- gate block span written
- rollback span written
- HMAC chain validates
- tampered span detected

### 23.9 Audit Tests

- append succeeds
- update denied
- delete denied
- chain verification passes
- trace links to audit row

---

## 24. Success Metrics

### 24.1 Technical Metrics

| Metric | v1.2 Target |
|---|---:|
| HANDOFF validation accuracy | 100% |
| duplicate nonce rejection | 100% |
| invalid signature rejection | 100% |
| unsafe command rejection | 100% for deny-list tests |
| Context Governor usage before agent calls | 100% |
| rollback checkpoint before destructive actions | 100% |
| provider health check before dispatch | 100% |
| workflow completion for demo path | ≥ 95% |
| rollback recovery success for demo path | 100% |
| HMAC chain verification | 100% |
| audit append proof | ≥ 1 verified live write before release |

### 24.2 Product Metrics

These matter only after technical proof:

- GitHub stars
- developer installs
- CLI workflow runs
- demo completion rate
- issues opened by external developers
- repeat workflow usage
- integration requests

Do not optimize product metrics before runtime proof.

---

## 25. Release Gate Checklist

Public release is blocked until all boxes are complete.

```txt
□ @veda/shared canonical types implemented
□ TS packages compile
□ HANDOFF_JSON validator rejects malformed input
□ forbidden field rejection works
□ sovereign_key validation against Supabase api_keys works
□ SOVEREIGN_KEY_MISSING rejection works
□ VEDA_HMAC_KEY replaces jwtSecret for HMAC
□ startup fails if VEDA_HMAC_KEY missing
□ atomic nonce insert implemented
□ nonce replay after restart rejected
□ git/npm/yarn/pnpm/pip removed from shell allowlist
□ structured pipe parser implemented
□ provider health check implemented
□ Context Governor implemented
□ Context Governor enforced before model calls
□ Rollback Engine implemented
□ destructive actions blocked without verified checkpoint
□ local deterministic queue works
□ retry budget enforced
□ dead-step watchdog works
□ VedaTrace spans written locally
□ Supabase pipeline_log write verified
□ audit_ledger append verified
□ audit update/delete denied
□ HMAC chain verification passes
□ one end-to-end demo workflow passes
□ one rollback demo passes
□ runtime-status.json generated or updated
□ README claims match verified status
□ PRD v1.2 signed off
```

---

## 26. Launch Strategy

### 26.1 Correct Launch Demo

Do not demo 126+ agents.

Do not demo an autonomous company.

Do not demo large orchestration theater.

Demo one workflow:

```txt
User request
→ HANDOFF_JSON generated
→ nonce inserted
→ signature/HMAC verified
→ Context Governor trims context
→ ZTE/SPE gate passes
→ provider health verified
→ rollback checkpoint created
→ sandbox writes safe file
→ injected failure occurs
→ rollback restores file
→ VedaTrace span emitted
→ audit row appended
→ final report shows proof chain
```

This is the product.

### 26.2 Public Messaging

Use:

- “Production-safe execution runtime for governed AI workflows.”
- “Bounded execution, signed handoffs, rollback, and audit traces for AI agents.”
- “A deterministic runtime kernel for AI tool execution.”

Avoid:

- “AI employees”
- “autonomous company”
- “AGI OS”
- “self-improving agents”
- “enterprise compliant” unless proof exists

---

## 27. Risk Register

| Risk | Severity | v1.2 Mitigation |
|---|---:|---|
| Spec/runtime drift | CRITICAL | runtime-status.json + acceptance suite |
| Nonce replay | CRITICAL | atomic insert + durable registry |
| Invalid audit chain | CRITICAL | VEDA_HMAC_KEY only + startup failure if missing |
| Context poisoning | HIGH | Context Governor as mandatory pre-call gate |
| State corruption | HIGH | Rollback Engine preflight |
| Unsafe shell execution | HIGH | deny-by-default sandbox + parser |
| Provider silent failure | MEDIUM | health check + fallback |
| Compliance overclaim | HIGH | compliance-support language only until gates prove enforcement |
| Overbuilt launch | MEDIUM | single workflow demo only |
| Redis/BullMQ complexity | MEDIUM | local deterministic queue first |

---

## 28. Final v1.2 Verdict

VEDA Runtime is a strong product idea only if it stops trying to prove scale before it proves execution integrity.

v1.2 should not add more agents, more departments, more orchestration, or more compliance language.

v1.2 should do one thing extremely well:

**Take one AI workflow from signed handoff to governed execution to rollback-safe recovery to tamper-evident audit proof.**

Once that works, the product becomes real.

Until that works, everything else remains documentation.

The production-grade path is:

1. compile foundation
2. fix security bugs
3. enforce context boundary
4. enforce rollback boundary
5. prove one workflow end-to-end
6. launch with honest claims

That is the v1.2 lock.

