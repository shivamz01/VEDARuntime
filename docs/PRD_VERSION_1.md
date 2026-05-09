# VEDA Runtime Version 1 PRD

**Version:** 1.0.0  
**Status:** Implementation scaffold  
**Source PRD:** `D:\EXTR\veda_runtime_prd_v1.2_fixed.md`  
**Schema:** HANDOFF_JSON v6.1.1  
**Owner:** Shivam Shrivastav  
**Last Updated:** 2026-05-09

## Normalization Note

The imported PRD used `v1.2` as a hardening-release label. This new standalone product uses **Version 1** for product-facing versioning. Schema strings such as `HANDOFF_JSON v6.1.1` remain unchanged because they are protocol locks, not product version labels.

## Mandate

VEDA Runtime Version 1 is a production-safe execution runtime for governed AI workflows. It must prove bounded execution, scoped context, rollback checkpoints, structured traces, and tamper-evident audit records before any production claim.

## Release Boundary

The first release proves a single local workflow before expanding into paid cloud/Supabase capabilities.

Accepted status labels:
- `SPEC_ONLY`
- `CODE_SURFACE`
- `PARTIAL`
- `LIVE_SIMULATION`
- `BLOCKED`
- `BLOCKING`
- `NEEDS_WIRING`
- `LIVE_VERIFIED`

## Free Edition

Free edition runs without Supabase:
- local JSONL nonce registry
- local JSONL audit ledger
- Context Governor
- Rollback Engine
- shell policy
- one local demo workflow

## Paid Edition

Paid edition adds:
- Supabase persistence adapters
- hosted dashboard/API status
- governance profile packs
- exportable audit bundles
- VEDA OS bridge adapter

## Non-Negotiables

1. Product version is Version 1 / `1.0.0`.
2. HANDOFF schema remains exactly `v6.1.1`.
3. Unknown or malformed handoffs fail closed.
4. No full context history reaches a worker.
5. Destructive actions require rollback checkpoint first.
6. Audit HMAC uses `VEDA_HMAC_KEY` or an explicit local proof key.
7. Free edition cannot depend on paid Supabase wiring.
8. Paid features must be entitlement-gated.
