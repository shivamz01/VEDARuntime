# VEDA Runtime Version 1 Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first standalone VEDA Runtime Version 1 scaffold outside the VEDA OS infra repo, with a free local proof path and paid feature boundaries.

**Architecture:** The project is a Node 20 TypeScript monorepo. The free runtime path is local-first: JSONL nonce registry, JSONL audit ledger, Context Governor, Rollback Engine, sandbox policy, and a demo workflow. Paid capabilities are isolated behind `packages/pro` and `packages/bridge-veda` so the free proof can work without Supabase or VEDA repo edits.

**Tech Stack:** Node 20, TypeScript, npm workspaces, `node:test`, JSONL local persistence.

---

### Task 1: Create Monorepo Skeleton and Failing Tests

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `tests/free-proof.test.mjs`
- Create: `tests/shared-contracts.test.mjs`
- Create: `tests/sandbox-policy.test.mjs`
- Create: `tests/pro-entitlements.test.mjs`

- [ ] **Step 1: Write tests before implementation**

The tests must import the wished-for public APIs from built package outputs. Initial expected result is failure because the implementation does not exist yet.

- [ ] **Step 2: Run test to verify RED**

Run: `npm test`

Expected: FAIL because package implementation files are missing.

### Task 2: Implement Shared Contracts

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Implement Version 1 constants and HANDOFF_JSON v6.1.1 validation helpers**
- [ ] **Step 2: Run `npm test` and verify shared contract tests pass**

### Task 3: Implement Local Audit and Nonce Persistence

**Files:**
- Create: `packages/audit/package.json`
- Create: `packages/audit/tsconfig.json`
- Create: `packages/audit/src/index.ts`

- [ ] **Step 1: Implement JSONL nonce registry with duplicate rejection**
- [ ] **Step 2: Implement JSONL audit ledger with HMAC chain**
- [ ] **Step 3: Run `npm test`**

### Task 4: Implement Sandbox Policy

**Files:**
- Create: `packages/sandbox/package.json`
- Create: `packages/sandbox/tsconfig.json`
- Create: `packages/sandbox/src/index.ts`

- [ ] **Step 1: Implement deny-by-default shell policy**
- [ ] **Step 2: Allow only safe read-only pipe forms**
- [ ] **Step 3: Run `npm test`**

### Task 5: Implement Runtime Free Proof Path

**Files:**
- Create: `packages/runtime/package.json`
- Create: `packages/runtime/tsconfig.json`
- Create: `packages/runtime/src/index.ts`
- Create: `examples/free-demo.mjs`

- [ ] **Step 1: Implement Context Governor**
- [ ] **Step 2: Implement Rollback Engine**
- [ ] **Step 3: Implement `RuntimeKernel.createFree()` and `executeDemo()`**
- [ ] **Step 4: Run `npm test`**
- [ ] **Step 5: Run `npm run demo:free`**

### Task 6: Implement Paid Boundary and VEDA Bridge Placeholders

**Files:**
- Create: `packages/pro/package.json`
- Create: `packages/pro/tsconfig.json`
- Create: `packages/pro/src/index.ts`
- Create: `packages/bridge-veda/package.json`
- Create: `packages/bridge-veda/tsconfig.json`
- Create: `packages/bridge-veda/src/index.ts`

- [ ] **Step 1: Implement entitlement checks for free/pro features**
- [ ] **Step 2: Implement a non-mutating VEDA bridge manifest**
- [ ] **Step 3: Run `npm test`**

### Task 7: Add Status Script

**Files:**
- Create: `scripts/status.mjs`

- [ ] **Step 1: Print product version, schema version, and feature boundary**
- [ ] **Step 2: Run `npm run status`**

### Task 8: Final Verification

- [ ] **Step 1: Run `npm test`**
- [ ] **Step 2: Run `npm run demo:free`**
- [ ] **Step 3: Run `npm run status`**
