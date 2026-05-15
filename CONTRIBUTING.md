# Contributing to VEDA Runtime

Thank you for your interest in contributing to VEDA Runtime! We welcome contributions from developers, security researchers, and users who want to help make deterministic AI execution more accessible and robust.

---

## What is VEDA Runtime?

VEDA Runtime is an **enterprise-grade AI execution kernel** for safe, deterministic, and auditable LLM agent workflows. It provides:

- **Deterministic orchestration** — predictable execution paths
- **Cryptographic audit ledgers** — tamper-evident execution records
- **Rollback checkpoints** — recovery from failures
- **Strict governance** — Zero Trust, Security Policy, Budget, and Legal gates

Before contributing, please read:
- [README.md](README.md) — Full project overview
- [docs/setup/supabase-pro-setup.md](docs/setup/supabase-pro-setup.md) — Pro tier setup

---

## Ways to Contribute

### 1. **Report Bugs** 🐛

Found an issue? Help us fix it:

1. **Check existing issues** — Search [Issues](https://github.com/shivamz01/VEDARuntime/issues) to avoid duplicates
2. **Provide details:**
   - VEDA Runtime version (`npm run status`)
   - Node.js version (`node --version`)
   - Execution profile (local_safe, standard, pro_cloud)
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Error message or stack trace
   - Environment variables (redacted)

3. **Example:**
   ```
   Title: NONCE_REPLAY error on retry with same handoff
   
   Version: v1.1.0
   Node.js: 20.11.0
   Profile: standard
   
   Reproduction:
   1. Send valid handoff with nonce X
   2. Receive 200 response
   3. Retry same handoff with nonce X
   4. Receive NONCE_REPLAY error
   
   Expected: Should either accept or reject cleanly
   Actual: Replay detection blocks valid retry
   ```

### 2. **Suggest Features** 💡

Have an idea? We'd love to hear it:

1. **Check open issues** — Look for existing feature requests
2. **Describe the use case:**
   - What problem does it solve?
   - Who benefits? (security team, developers, auditors, etc.)
   - How would it work?
   - Any alternatives you considered?

3. **Example:**
   ```
   Title: Add webhook notifications for audit ledger changes
   
   Use case: Security teams need real-time alerts when execution logs are written
   
   Implementation idea:
   - Add optional webhook URL to governance config
   - POST to webhook on every audit span write
   - Include span hash for verification
   - Retry with exponential backoff if webhook fails
   
   Why useful: Enables real-time threat detection without polling
   ```

### 3. **Improve Documentation** 📖

Documentation is critical for safety. Contributions include:

- **Fix typos or grammar** in README, docs, or comments
- **Clarify confusing sections** with examples
- **Add troubleshooting guides** for common issues
- **Write setup tutorials** for different platforms
- **Create examples** for Pro tier features
- **Translate docs** to other languages

**Documentation structure:**
```
docs/
├── setup/              — Installation & configuration
├── guides/             — How-to guides
├── architecture/       — Design & internals
├── security/           — Security policies
└── examples/           — Worked examples
```

### 4. **Write Code** 💻

Code contributions should follow our **Proof Bar**:

Every feature claim must pass the full chain:
```
input → validation → nonce → signature → context governance 
→ governance gates → rollback checkpoint → sandbox execution 
→ audit span → ledger append → readback verification → output
```

**Before coding:**
- Comment on the issue: "I'd like to work on this"
- Wait for maintainer approval
- Discuss approach if it's a major change

**Feature types:**

| Type | Example | Proof Requirement |
|------|---------|-------------------|
| **Free Tier** | New sandbox rule, Context Governor enhancement | Must pass `npm run demo:free` |
| **Pro Tier** | New Supabase adapter, license gate enhancement | Must pass `npm run pro:verify` |
| **Documentation** | Examples, guides, API docs | N/A |
| **Tests** | New contract tests, edge cases | Must pass `npm run test` |

### 5. **Security Research** 🔐

Found a security issue? Please report responsibly:

1. **Do NOT open a public issue** for security vulnerabilities
2. **Email us** at `security@vedaruntime.dev` (or the maintainer's email) with:
   - Vulnerability description
   - Impact assessment
   - Proof of concept (if applicable)
   - Suggested fix (optional)
3. **Allow 90 days** for patch development and disclosure coordination

Thank you for helping us keep VEDA Runtime secure!

---

## Development Setup

### Prerequisites

```bash
node --version  # >= 20
npm --version   # >= 9
```

### Clone & Install

```bash
git clone https://github.com/shivamz01/VEDARuntime.git
cd VEDARuntime
npm install
```

### Build & Test

```bash
# Build all workspaces
npm run build

# Run contract tests
npm run test

# Run Free proof demo
npm run demo:free

# Run release gate (comprehensive check)
npm run release:check
```

### Project Structure

```
VEDARuntime/
├── packages/
│   ├── shared/        — Canonical types & constants
│   ├── audit/         — Audit ledger & nonce registry
│   ├── sandbox/       — Shell policy engine
│   ├── runtime/       — Core execution kernel
│   ├── pro/           — Pro tier features
│   └── bridge-veda/   — Ecosystem bridge
├── apps/
│   ├── api/           — HTTP API surface
│   └── web/           — Status dashboard
├── tests/             — Deterministic acceptance tests
├── examples/          — Demo workflows
└── docs/              — Documentation
```

### Key Scripts

| Command | Purpose |
|---------|---------|
| `npm run build` | Build all workspaces |
| `npm run test` | Run contract tests |
| `npm run demo:free` | Free proof workflow |
| `npm run demo:paid` | Paid proof workflow (mock) |
| `npm run pro:verify` | Real Supabase verification |
| `npm run pipeline:proof` | Full release check |
| `npm run status` | Runtime status |

---

## Coding Guidelines

### TypeScript Standards

```typescript
// ✅ Good: Clear, typed, documented
/**
 * Validates a HANDOFF_JSON v6.1.1 payload.
 * @throws HandoffValidationError if validation fails
 * @returns Validated and normalized handoff
 */
export function validateHandoff(
  payload: unknown,
  options: ValidationOptions = {}
): ValidatedHandoff {
  // Implementation
}

// ❌ Bad: Unclear, any types, no docs
function validate(x: any): any {
  // Implementation
}
```

### Commit Messages

Follow conventional commits:

```bash
git commit -m "feat(audit): add HMAC-chained span verification

- Implement HMAC-SHA256 chain validation on audit ledger read
- Add readback verification to proof pipeline
- Adds 2 new contract tests

Closes #123"
```

**Format:**
```
<type>(<scope>): <subject>

<body>

Closes #<issue-number>
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

**Scopes:** `audit`, `sandbox`, `runtime`, `governance`, `api`, `pro`

### Error Handling

VEDA uses structured error codes. When adding errors:

```typescript
// In src/errors.ts
export enum VedaErrorCode {
  // Existing codes...
  NEW_ERROR = "NEW_ERROR_NAME",
}

// Usage
throw new VedaError(
  VedaErrorCode.NEW_ERROR,
  "Descriptive message with context"
);
```

### Testing

Every new feature needs tests:

```typescript
// tests/my-feature.test.ts
import { expect } from "chai";
import { myNewFeature } from "../src";

describe("my-feature", () => {
  it("should do X when given Y input", () => {
    const result = myNewFeature({ /* ... */ });
    expect(result).to.equal(expected);
  });

  it("should throw error when validation fails", () => {
    expect(() => myNewFeature(invalid)).to.throw();
  });
});
```

Run tests:
```bash
npm run test
```

### Security Checklist

Before submitting code:

- [ ] No hardcoded secrets or API keys
- [ ] No `eval()` or dynamic code execution
- [ ] Input validation on all external data
- [ ] Error messages don't leak sensitive info
- [ ] Cryptographic functions use standard libraries
- [ ] No shell command injection vectors
- [ ] All dependencies checked: `npm audit`

---

## Pull Request Process

### 1. Fork & Branch

```bash
git checkout -b feat/your-feature-name
```

**Branch naming:**
- `feat/description` — New feature
- `fix/description` — Bug fix
- `docs/description` — Documentation
- `test/description` — Test improvements

### 2. Develop & Commit

```bash
npm run build
npm run test

git commit -m "feat(scope): description"
```

### 3. Keep Up to Date

```bash
git fetch origin
git rebase origin/main
```

### 4. Push & Open PR

```bash
git push origin feat/your-feature-name
```

Then open a PR on GitHub with:

**PR Title:**
```
feat(scope): short description
```

**PR Description:**
```markdown
## What does this PR do?
Brief explanation of the change.

## Why?
What problem does it solve? Why now?

## How to test?
Steps to verify the change works.

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security issues
- [ ] Follows coding guidelines
- [ ] Builds successfully (`npm run build`)
- [ ] All tests pass (`npm run test`)

Closes #<issue-number>
```

### 5. Review & Feedback

- Maintainers will review within 5 business days
- Address feedback in follow-up commits (don't squash)
- Push changes to same branch
- Request re-review when ready

### 6. Merge

Once approved:
- Maintainers will squash & merge to `main`
- Your changes deploy in the next release

---

## Release Process

You don't need to do this, but here's how releases work:

1. **Maintainers run:**
   ```bash
   npm run release:check
   ```

2. **If everything passes:**
   - Bump version in `package.json`
   - Create GitHub release with changelog
   - Publish to npm

3. **You'll be credited in:**
   - GitHub release notes
   - Changelog
   - CREDITS.md (if applicable)

---

## Code of Conduct

We're committed to a welcoming, inclusive community:

- **Be respectful** — Disagreements are healthy; attacks are not
- **Be helpful** — New contributors are always welcome
- **Be honest** — Admit mistakes; learn from feedback
- **Be secure-minded** — Security is a shared responsibility

Unacceptable behavior:
- Harassment, discrimination, or abuse
- Spam or self-promotion
- Sharing others' code without credit
- Endangering security intentionally

**If someone violates this:** Email maintainers with details.

---

## Getting Help

### Questions?

- **Usage questions** → Open an issue with `[question]` tag
- **Technical help** → Discussions → Q&A category
- **How-to questions** → Check docs/ first, then ask

### Resources

- [VEDA Runtime README](README.md)
- [Architecture Docs](docs/architecture/)
- [Security Policy](SECURITY.md)
- [Troubleshooting](TROUBLESHOOTING.md) (if available)
- [Issues](https://github.com/shivamz01/VEDARuntime/issues)
- [Discussions](https://github.com/shivamz01/VEDARuntime/discussions)

---

## Credit & Recognition

Contributors are recognized in:

1. **GitHub** — Your PR shows your contributions
2. **Changelog** — Major contributions mentioned in release notes
3. **CREDITS.md** — Option to be listed in credits file

For major contributions (features, security fixes, large docs):
- You can request credit
- We'll add you to maintainers or list your GitHub profile

---

## Questions Before You Start?

**Ask in these places:**

1. **GitHub Issues** — For feature/bug discussion
2. **GitHub Discussions** — For questions & ideas
3. **Email** — For security issues only

**Don't:**
- Open a PR without discussing first (for major changes)
- Submit code with hardcoded secrets
- Report security issues publicly

---

## Thank You! 🙏

Every contribution makes VEDA Runtime safer and more accessible. Whether you're fixing typos, writing docs, reporting bugs, or building features — **you matter**.

Welcome to the community! 🚀

---

**Need to reach us?**
- **Issues/Features:** [GitHub Issues](https://github.com/shivamz01/VEDARuntime/issues)
- **Questions:** [GitHub Discussions](https://github.com/shivamz01/VEDARuntime/discussions)
- **Security:** security@vedaruntime.dev (or maintainer email)

**Follow us:** [GitHub](https://github.com/shivamz01) | Twitter | Blog

---

_Last updated: 2026-05-15_
_Maintainer: Shivam Shrivastav_
