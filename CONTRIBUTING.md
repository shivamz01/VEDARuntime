````md
# Contributing to VEDA Runtime

Thank you for your interest in contributing to VEDA Runtime.

VEDA Runtime is a security-focused AI execution runtime designed for constrained orchestration, auditable workflows, and governance-aware execution pipelines.

Before contributing, read:
- [README.md](README.md)
- [docs/setup/supabase-pro-setup.md](docs/setup/supabase-pro-setup.md)

---

# Project Scope

VEDA Runtime focuses on:

- Constrained orchestration for LLM workflows
- Audit-oriented execution tracing
- Governance-aware execution pipelines
- Rollback and recovery primitives
- Sandbox-based execution boundaries

VEDA Runtime is currently NOT:

- A general AGI framework
- A self-modifying autonomous system
- A replacement for Kubernetes or workflow schedulers
- Guaranteed deterministic at model-token level
- Certified for regulated production environments

Some subsystems are experimental and may change without notice.

---

# Stability Matrix

| Component | Status |
|---|---|
| Runtime Kernel | Beta |
| Audit Ledger | Beta |
| Rollback Engine | Experimental |
| Context Governance | Experimental |
| Sandbox Engine | Beta |
| Supabase Pro Features | Experimental |
| Local LLM Support | Experimental |

---

# Compatibility Matrix

| Component | Status |
|---|---|
| Node.js 20+ | Supported |
| Linux | Tested |
| Windows | Partial |
| macOS | Limited Testing |
| SQLite | Supported |
| Supabase | Supported |
| Local LLM Providers | Experimental |

---

# Ways to Contribute

## 1. Report Bugs

Before opening an issue:

1. Search existing issues
2. Verify the issue on the latest version
3. Collect reproducible steps

Please include:

- Runtime version (`npm run status`)
- Node.js version
- Execution profile
- Expected behavior
- Actual behavior
- Logs or stack traces
- Redacted environment details

Example:

```text
Title: NONCE_REPLAY error during retry

Version: v1.1.0
Node.js: 20.11.0
Profile: standard

Reproduction:
1. Send valid handoff with nonce X
2. Receive 200 response
3. Retry same handoff
4. Receive NONCE_REPLAY

Expected:
Replay handling should fail consistently and predictably.

Actual:
Replay detection blocks retry path unexpectedly.
````

---

## 2. Suggest Features

Feature requests should describe:

* Problem being solved
* Operational benefit
* Proposed implementation
* Security considerations
* Alternative approaches considered

Example:

```text
Title: Webhook notifications for audit ledger events

Use case:
Security teams need near real-time visibility into execution ledger writes.

Implementation:
- Optional webhook configuration
- Signed event payloads
- Retry with exponential backoff
- Failure isolation from runtime execution
```

---

## 3. Improve Documentation

Documentation contributions are highly valuable.

Examples:

* Clarify setup steps
* Improve troubleshooting
* Add architecture explanations
* Add operational examples
* Fix inaccuracies or outdated instructions

Documentation structure:

```text
docs/
├── setup/
├── guides/
├── architecture/
├── security/
└── examples/
```

---

## 4. Write Code

All code contributions should align with the runtime proof pipeline.

Proof pipeline:

```text
input
→ schema validation
→ nonce replay check
→ signature verification
→ governance policy enforcement
→ execution budget validation
→ rollback checkpoint creation
→ sandbox execution
→ audit span creation
→ ledger append
→ integrity verification
→ output emission
```

Before major work:

* Open or reference an issue
* Discuss architecture-impacting changes
* Wait for maintainer approval

---

# Contribution Categories

| Type          | Example                             | Required Validation     |
| ------------- | ----------------------------------- | ----------------------- |
| Runtime       | Scheduler, sandbox, orchestration   | `npm run test`          |
| Security      | Governance, validation, nonce logic | `npm run release:check` |
| Pro Features  | Supabase integrations               | `npm run pro:verify`    |
| Documentation | Guides, API docs                    | Documentation review    |
| Tests         | Edge cases, contract tests          | `npm run test`          |

---

# Development Setup

## Requirements

```bash
node --version  # >= 20
npm --version   # >= 9
```

## Clone Repository

```bash
git clone https://github.com/shivamz01/VEDARuntime.git
cd VEDARuntime
npm install
```

## Validation Commands

```bash
npm run build
npm run test
npm run demo:free
npm run release:check
```

---

# Repository Structure

```text
VEDARuntime/
├── packages/
│   ├── shared/
│   ├── audit/
│   ├── sandbox/
│   ├── runtime/
│   ├── pro/
│   └── bridge-veda/
├── apps/
│   ├── api/
│   └── web/
├── tests/
├── examples/
└── docs/
```

---

# Coding Standards

## TypeScript

Prefer:

* Explicit typing
* Documented public APIs
* Structured errors
* Small composable modules

Example:

```typescript
export function validateHandoff(
  payload: unknown,
  options: ValidationOptions = {}
): ValidatedHandoff {
  // implementation
}
```

Avoid:

```typescript
function validate(x: any): any {
  // implementation
}
```

---

# Commit Format

Use conventional commits:

```bash
feat(runtime): add rollback integrity verification
fix(audit): repair ledger replay validation
docs(security): clarify nonce lifecycle
```

Types:

* feat
* fix
* docs
* test
* refactor
* chore

Scopes:

* runtime
* audit
* governance
* sandbox
* api
* pro

---

# Error Handling

Use structured runtime errors.

Example:

```typescript
export enum VedaErrorCode {
  NONCE_REPLAY = "NONCE_REPLAY",
}
```

Avoid:

* Generic thrown strings
* Unstructured runtime exceptions
* Leaking sensitive information in logs

---

# Testing Requirements

New features should include:

* Success-path validation
* Failure-path validation
* Edge-case coverage
* Governance-path coverage where applicable

Run:

```bash
npm run test
```

---

# Security Checklist

Before submitting:

* No hardcoded secrets
* No unsafe dynamic execution
* Input validation enforced
* No sensitive data leakage
* Standard cryptographic libraries only
* No shell injection vectors
* `npm audit` reviewed

---

# Pull Request Process

## Branch Naming

```text
feat/description
fix/description
docs/description
test/description
```

## Before Opening a PR

Run:

```bash
npm run build
npm run test
```

Rebase on latest main:

```bash
git fetch origin
git rebase origin/main
```

---

# PR Expectations

PRs should include:

* Problem description
* Why the change is needed
* Validation steps
* Security considerations
* Test evidence

Large architectural changes may require design discussion before merge.

---

# Release Process

Release validation includes:

```bash
npm run release:check
```

Typical release flow:

1. Validation passes
2. Version updated
3. Changelog generated
4. GitHub release published
5. npm package published

---

# Security Reporting

Do NOT report security vulnerabilities publicly.

Preferred channels:

* GitHub Security Advisories
* Maintainer contact email

Include:

* Description
* Reproduction steps
* Impact assessment
* Suggested remediation if available

---

# Code of Conduct

Expected behavior:

* Professional communication
* Respectful technical disagreement
* Honest reporting
* Security-conscious development

Unacceptable behavior:

* Harassment
* Abuse
* Deliberate security harm
* Spam
* Credential exposure

---

# Getting Help

Resources:

* [README.md](README.md)
* [Architecture Docs](docs/architecture/)
* [Issues](https://github.com/shivamz01/VEDARuntime/issues)
* [Discussions](https://github.com/shivamz01/VEDARuntime/discussions)

Use:

* Issues → bugs/features
* Discussions → questions/design ideas

---

# Recognition

Contributors may be recognized through:

* GitHub history
* Release notes
* Changelog references
* CREDITS.md

---

# Maintainer Notes

The project prioritizes:

* Runtime safety
* Auditability
* Operational clarity
* Governance enforcement
* Reproducible execution behavior

Contributors should prefer incremental, verifiable improvements over large speculative rewrites.

---

Last updated: 2026-05-15
Maintainer: Shivam Shrivastav

```
```
