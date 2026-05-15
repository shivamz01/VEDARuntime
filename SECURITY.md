# Security Policy

## Reporting Security Vulnerabilities

**⚠️ DO NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in VEDA Runtime, please report it **privately** so it can be investigated and mitigated before public disclosure.

---

## How to Report

### Email

**Send to:** shivam.shrivastave05@gmail.com

**Subject line:** `[SECURITY] VEDA Runtime Vulnerability Report`

### What to Include

Please provide as much relevant information as possible:

```
1. TITLE
   Brief, descriptive title
   (e.g., "HMAC Validation Bypass in Audit Ledger")

2. SEVERITY
   - Critical: Remote execution, system-wide breach, no workaround
   - High: Major security boundary bypass or significant data exposure
   - Medium: Limited impact or constrained exploitation
   - Low: Minor weakness or theoretical issue

3. AFFECTED VERSIONS
   Which versions are vulnerable?
   (e.g., "v1.0.0 and v1.1.0, but not v1.2.0+")

4. AFFECTED COMPONENTS
   - audit/
   - sandbox/
   - runtime/
   - pro/
   - api/
   - Other: ___

5. DESCRIPTION
   What is the vulnerability and how could it be exploited?

6. IMPACT
   - Who is affected? (Free tier? Pro tier? Both?)
   - What data/systems are at risk?
   - Can it affect multiple users?

7. REPRODUCTION STEPS
   Step-by-step to reproduce (if safe to disclose):
   1. [Step 1]
   2. [Step 2]
   3. [Expected result vs actual]

8. PROOF OF CONCEPT
   Minimal safe example, or describe conceptually
   (Do NOT include full exploit code unless necessary)

9. SUGGESTED FIX (Optional)
   If you have remediation ideas, share them

10. YOUR CONTACT INFO
    - Name (can be anonymous)
    - Email
    - GitHub username (optional)
    - Preferred contact method
```

---

## Severity Guidelines

| Severity | Description |
|----------|-------------|
| **Critical** | Remote code execution, system-wide compromise, widespread exposure, no workaround |
| **High** | Significant security boundary bypass, major data exposure, significant functionality compromise |
| **Medium** | Limited scope, constrained exploitation, workaround available |
| **Low** | Minor weakness, theoretical issue, minimal real-world impact |

Severity may be reassessed during investigation.

---

## Our Commitment

### Response Timeline

| When | What We Do |
|------|-----------|
| **24-48 hours** | Acknowledge receipt of report |
| **7 days** | Initial assessment and severity confirmation |
| **As feasible** | Develop mitigation or remediation plan |
| **After patch released** | Coordinated public disclosure if appropriate |

**Note:** These are best-effort targets, not guarantees. Complex issues may require additional time.

### Confidentiality

✅ **We will:**
- Keep your report confidential
- Protect your identity if requested
- Not share details publicly until fix is released
- Credit you in security advisory (if you authorize)

❌ **We won't:**
- Publicly shame researchers
- Demand exclusive access to vulnerabilities
- Ignore reports
- Delay patches indefinitely

---

## Responsible Disclosure

### What We Expect

**DO:**
- ✅ Give us reasonable time to fix (30-90 days default)
- ✅ Communicate professionally
- ✅ Report only to us initially
- ✅ Keep details confidential during embargo
- ✅ Help us understand the issue

**DON'T:**
- ❌ Publicly disclose before patch released
- ❌ Test on systems you don't own/control
- ❌ Access data you shouldn't have
- ❌ Demand payment or threaten disclosure
- ❌ Sell vulnerability to other parties
- ❌ Report to multiple projects simultaneously

### Embargo Period

**Default:** 90 days from report submission

**Researcher can request shorter period if:**
- Vulnerability is already public
- You have proof others know
- 30 days minimum

**We may request extension if:**
- Major patch in progress
- Coordination with other projects needed
- Release cycle timing

---

## Security Scope

### In Scope

- Authentication/authorization bypass
- Cryptographic weaknesses
- Signature validation flaws
- Replay protection bypass
- Code injection (command, shell, SQL)
- Path traversal attacks
- Sandbox escape
- Audit integrity violations
- Data exposure or leakage
- Governance boundary bypass

### Out of Scope

- Social engineering attacks
- Physical security issues
- Vulnerabilities requiring privileged access already granted
- Issues in unsupported third-party dependencies
- Purely theoretical issues with no realistic impact
- Missing HTTP security headers
- Clickjacking or UI-based attacks

**Scope decisions may vary based on context and severity.**

---

## Supported Versions

| Version | Status | Security Updates |
|---------|--------|------------------|
| **1.x (current)** | Active | Yes, within 30 days when feasible |
| **0.x** | End of Life | Best-effort only |

Users are strongly encouraged to upgrade to the latest stable release.

---

## Security Features

VEDA Runtime includes:

### Cryptographic Protection
- ED25519 signatures on all handoffs
- HMAC-SHA256 on audit ledger chains
- Nonce-based replay prevention
- Deterministic proof chains

### Sandbox Isolation
- Deny-by-default shell policy
- Path traversal prevention
- Command injection blocking
- Filesystem boundary enforcement

### Governance Gates
- Zero Trust Enforcement (ZTE)
- Security Policy Enforcement (SPE)
- Legal compliance gates
- Budget controls

### Audit & Traceability
- HMAC-chained append-only audit ledger
- Tamper-evident trace spans
- Readback verification
- Rollback checkpoints

### Production Hardening
- VEDA_HMAC_KEY requirement in production
- Wildcard CORS rejection
- Origin validation on /api/* endpoints
- Rate limiting on sensitive endpoints

---

## Security Testing

We test for:
- ✅ Input validation bypass
- ✅ Authentication bypass
- ✅ Signature forgery
- ✅ HMAC collision and tampering
- ✅ Nonce replay attacks
- ✅ Shell injection
- ✅ Path traversal
- ✅ Audit log tampering
- ✅ Rollback circumvention
- ✅ Governance gate bypass

We currently do NOT claim:
- ❌ Formal verification
- ❌ Continuous external auditing
- ❌ Third-party penetration testing
- ❌ Bug bounty program (yet)

---

## Security Best Practices for Users

### Free Tier
- Run `npm audit` regularly
- Keep Node.js updated to latest stable
- Use `VEDA_HMAC_KEY` in production
- Don't hardcode secrets in code
- Run behind firewall/reverse proxy
- Review audit ledger regularly

### Pro Tier
- All Free practices above
- Use Supabase Row Level Security
- Rotate `VEDA_LICENSE_KEY` regularly
- Monitor `audit_ledger` table for tampering
- Enable Supabase automated backups
- Use strong Supabase passwords
- Restrict service role key access
- Enable Supabase audit logs

### General
- Keep all dependencies updated
- Monitor GitHub security advisories
- Subscribe to release notifications
- Run `npm audit` before deployments
- Use security headers in API calls
- Enable GitHub's security scanning

---

## Dependency Security

### npm Audit

```bash
npm audit
```

### Policy
- ✅ We update dependencies monthly (minimum)
- ✅ We apply critical patches immediately
- ✅ We monitor GitHub security advisories
- ✅ We test before updating major versions

### If You Find a Dependency Vulnerability
1. Check if already reported to that project
2. Report to the dependency maintainers
3. Optionally CC us for context

---

## Patch & Advisory Process

When vulnerabilities are confirmed:

1. **Investigate** and validate the report
2. **Develop** mitigation or remediation
3. **Release** patched version
4. **Publish** security advisory (if appropriate)

### Public Advisory includes:
- Affected versions
- Severity rating
- Vulnerability description
- Impact assessment
- Upgrade/remediation guidance
- Researcher attribution (if approved)

### Disclosure Timeline Example
```
Monday 9am    — Vulnerability reported
Monday 6pm    — Initial assessment complete
Wednesday     — Fix in progress
Friday        — Patch released (v1.1.1)
Friday pm     — Security advisory published
Monday        — Public disclosure/blog post
```

---

## Researcher Recognition

Researchers who disclose responsibly may be credited in:
- Security advisories
- Release notes
- Changelog
- GitHub security page

Recognition is optional and can be declined.

---

## FAQ

**Q: How quickly will you respond?**
A: Within 24-48 hours typically, but during busy periods may take longer. We'll acknowledge receipt and provide initial assessment within 7 days.

**Q: What if you don't respond?**
A: Email again or contact via GitHub with context. If still no response after 14 days, you may contact GitHub Security directly.

**Q: Can I test on a live server?**
A: No. Only test on systems you control. If you need a test environment, ask us.

**Q: Will you patch old versions?**
A: We patch current releases. Older unsupported versions: best-effort only. We strongly recommend upgrading to the latest version.

**Q: Do you have a bug bounty program?**
A: Not currently. We credit all responsible researchers in advisories. A formal bug bounty program may launch in the future.

**Q: Can I publish about the vulnerability after the fix?**
A: Yes, after we release a patch and publicly announce it. Please coordinate timing with us.

**Q: What if someone else finds the same vulnerability?**
A: We credit all independent discoverers in the advisory unless explicitly requested otherwise.

**Q: Is there a specific disclosure timeline I should follow?**
A: Default is 90 days. If vulnerability becomes public or urgent, we can accelerate (minimum 30 days). Discuss with us.

---

## Known Vulnerabilities

Currently **no known unpatched vulnerabilities**.

Check [GitHub Security Advisories](https://github.com/shivamz01/VEDARuntime/security/advisories) for details.

---

## Third-Party Security Tools

We recommend:
- **npm audit** — Check dependencies for known vulnerabilities
- **GitHub security scanning** — Code scanning and secret detection
- **Snyk** — Continuous vulnerability monitoring (optional)
- **OWASP ZAP** — Web vulnerability scanner (optional)

---

## Security Contacts

### Primary Contact

**Email:** shivam.shrivastave05@gmail.com

**Response time:** Best-effort 24-48 hours

### For Different Issues

| Type | Where |
|------|-------|
| **Security vulnerability** | Email (private) |
| **Security questions** | Email (private) |
| **General questions** | [GitHub Discussions](https://github.com/shivamz01/VEDARuntime/discussions) |
| **Bug reports (non-security)** | [GitHub Issues](https://github.com/shivamz01/VEDARuntime/issues) |

---

## Transparency & Disclosure

### What We Publish After Patch

- ✅ Security advisories
- ✅ CVE IDs (for critical issues)
- ✅ Vulnerability descriptions
- ✅ Affected versions
- ✅ Fix details
- ✅ Researcher credit (if authorized)

### What We Keep Confidential Until Patch

- ✅ Detailed reproduction steps
- ✅ Proof of concept code
- ✅ Reporter identity (if requested)
- ✅ Patch details (until release)

---

## Related Resources

- [README.md](README.md) — Product overview and features
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute code
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Community standards
- [GitHub Security Advisories](https://github.com/shivamz01/VEDARuntime/security/advisories)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## Summary

VEDA Runtime prioritizes:
- **Responsible disclosure** — Private, coordinated vulnerability handling
- **Transparent communication** — Clear timelines and process
- **User security** — Practical guidance and best practices
- **Researcher respect** — Professional, confidential handling with proper attribution

---

**Thank you for helping keep VEDA Runtime secure.** 🛡️

We appreciate responsible disclosure and your partnership in building trustworthy AI execution infrastructure.

---

_Last updated: 2026-05-15_
_Version: 1.1_
_Maintainer: Shivam Shrivastav_
