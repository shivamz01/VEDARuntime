# Security Policy

## Reporting Security Vulnerabilities

**⚠️ DO NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in VEDA Runtime, please report it **privately** to help us fix it before public disclosure.

---

## How to Report

### Email

**Send to:** shivam.shrivastave05@gmail.com

**Subject line:** `[SECURITY] VEDA Runtime Vulnerability Report`

### What to Include

```
VULNERABILITY REPORT
====================

1. TITLE
   Brief, descriptive title (e.g., "HMAC Validation Bypass in Audit Ledger")

2. SEVERITY
   - Critical (system-wide breach, no workaround)
   - High (major feature broken, significant data at risk)
   - Medium (limited impact, workaround available)
   - Low (minor issue, theoretical risk)

3. AFFECTED VERSIONS
   - Which versions of VEDA Runtime are vulnerable?
   - Example: "v1.0.0 and v1.1.0, but not v1.2.0+"

4. AFFECTED COMPONENTS
   - audit/
   - sandbox/
   - runtime/
   - pro/
   - api/
   - Other: ___

5. DESCRIPTION
   What is the vulnerability? Explain:
   - What the issue is
   - How it could be exploited
   - What an attacker could do
   - What a user could accidentally do

6. IMPACT
   - Who is affected? (Free tier? Pro tier? Both?)
   - What data/systems are at risk?
   - Can it affect multiple users? How?
   - Are there privacy implications?

7. REPRODUCTION
   Step-by-step to reproduce (if safe):
   
   1. [Step 1]
   2. [Step 2]
   3. [Result]
   
   OR
   
   "Code of Conduct requires I don't publish reproduction steps
    but I can discuss privately via video call if needed"

8. PROOF OF CONCEPT
   - Minimal code example (if applicable)
   - Or describe conceptually
   - Do NOT include actual exploit code unless necessary

9. SUGGESTED FIX (OPTIONAL)
   - If you have ideas for fixing it, share them
   - We may or may not use your suggestion
   - Not required to report

10. YOUR CONTACT INFO
    - Name (can be anonymous)
    - Email
    - GitHub username (optional)
    - Preferred contact method

11. TIMELINE EXPECTATIONS
    - When did you discover this?
    - Do you plan to disclose publicly? When?
    - Are you working with other researchers?
    - Do you want public credit?
```

---

## Our Commitment

### Timeline

| When | What We Do |
|------|-----------|
| **Within 24 hours** | Acknowledge receipt of report |
| **Within 48 hours** | Initial assessment of severity |
| **Within 7 days** | Plan for fix or workaround |
| **Within 30 days** | Release patch (if possible) |
| **After patch** | Coordinated public disclosure |

### Confidentiality

✅ **We will:**
- Keep your report confidential
- Not share details publicly until you agree
- Protect your identity if requested
- Credit you in security advisory (if you want)

❌ **We won't:**
- Publicly shame the researcher
- Demand exclusive access to vulnerabilities
- Ignore your report
- Sit on fixes indefinitely

### Scope of Vulnerability Handling

**We take seriously:**
- ✅ Authentication/authorization bypasses
- ✅ Cryptographic weaknesses
- ✅ Data exposure or leakage
- ✅ Code execution vulnerabilities
- ✅ Denial of service attacks
- ✅ Privilege escalation
- ✅ Audit log tampering

**We may consider out of scope:**
- ❌ Social engineering attacks (not a code vulnerability)
- ❌ Physical security issues
- ❌ Vulnerabilities in dependencies (report to those projects)
- ❌ Vulnerabilities that require admin access you shouldn't have
- ❌ Theoretical vulnerabilities with no proof of concept

---

## Responsible Disclosure

### What We Ask Of You

**DO:**
- ✅ Give us reasonable time to fix (30-90 days)
- ✅ Communicate professionally
- ✅ Report only to us (not public, not other projects)
- ✅ Keep details confidential during embargo
- ✅ Help us understand the issue
- ✅ Suggest a fix if you have one

**DON'T:**
- ❌ Publicly disclose before patch released
- ❌ Test on systems you don't own/control
- ❌ Access data you shouldn't have
- ❌ Demand payment or threats
- ❌ Sell vulnerability to others
- ❌ Report the same vulnerability to multiple projects

### Embargo Period

**Default:** 90 days from report submission

**We may request extension if:**
- Major patch in progress
- Coordination with other projects needed
- Release cycle timing

**You can request shorter period if:**
- Vulnerability is already public
- You have proof others know
- 30 days minimum

---

## Supported Versions

| Version | Status | Security Updates |
|---------|--------|------------------|
| **1.x (current)** | Active | Yes, within 30 days |
| **0.x** | End of Life | No updates |

---

## Security Best Practices for Users

### Free Tier

- ✅ Run `npm audit` regularly
- ✅ Keep Node.js updated
- ✅ Use `VEDA_HMAC_KEY` in production
- ✅ Don't hardcode secrets in code
- ✅ Run behind firewall/reverse proxy
- ✅ Review audit ledger regularly

### Pro Tier

- ✅ All Free practices
- ✅ Use Supabase Row Level Security
- ✅ Rotate `VEDA_LICENSE_KEY` regularly
- ✅ Monitor `audit_ledger` table for tampering
- ✅ Enable Supabase backups
- ✅ Use strong Supabase passwords
- ✅ Restrict service role key access

### General

- ✅ Keep dependencies updated
- ✅ Monitor GitHub security advisories
- ✅ Subscribe to release notifications
- ✅ Report suspicious behavior
- ✅ Use security headers in API calls
- ✅ Enable GitHub's security scanning

---

## Known Vulnerabilities

Currently **no known unpatched vulnerabilities**.

Check [GitHub Security Advisories](https://github.com/shivamz01/VEDARuntime/security/advisories) for details.

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

### Audit & Observability
- Immutable ledger with HMAC chains
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
- ✅ HMAC collision
- ✅ Nonce reuse
- ✅ Shell injection
- ✅ Path traversal
- ✅ Audit log tampering
- ✅ Rollback circumvention
- ✅ Governance gate bypass

We don't:
- ❌ Run continuous automated testing (yet)
- ❌ Have 3rd party security audits (yet)
- ❌ Have bug bounty program (yet)

---

## Patch Release Process

When a security patch is released:

1. **Security Advisory** posted to GitHub
2. **Email notification** sent to users (if applicable)
3. **Changelog entry** documents the fix
4. **Version bump** indicates patch level
5. **Public announcement** after embargo ends

---

## Dependency Security

### npm Audit

```bash
npm audit
```

Checks for known vulnerabilities in dependencies.

### Report Dependency Vulnerabilities

If you find a vulnerability in a dependency:
1. Check if it's already reported to that project
2. Report to the dependency maintainers
3. Optionally CC us for context

### Policy

- ✅ We update dependencies monthly (minimum)
- ✅ We apply critical patches immediately
- ✅ We monitor security advisories
- ✅ We test before updating major versions

---

## Third-Party Security Tools

We recommend:
- **npm audit** — Check dependencies
- **OWASP ZAP** — Web vulnerability scanner
- **Snyk** — Continuous vulnerability monitoring
- **GitHub security scanning** — Code scanning

---

## Security Contacts

### Primary Contact

**Email:** shivam.shrivastave05@gmail.com

**Response time:** Best effort within 24-48 hours

### Escalation

For urgent issues:
- Email with `[URGENT]` in subject
- Include contact number for callback (optional)

---

## Transparency & Disclosure

### What We Publish

- ✅ Security advisories (after patch released)
- ✅ CVE IDs (for critical issues)
- ✅ Vulnerability descriptions
- ✅ Affected versions
- ✅ Fix details
- ✅ Researcher credit (if authorized)

### Timeline Example

```
Monday 9am    — Vulnerability reported
Monday 6pm    — Initial assessment
Tuesday       — Fix in progress
Thursday      — Patch released (v1.1.1)
Thursday pm   — Security advisory published
Friday        — Public disclosure on blog
```

---

## FAQ

**Q: Should I report to GitHub security team?**
A: No, report directly to us via email first. If we don't respond, then contact GitHub.

**Q: Can I test the vulnerability on a live server?**
A: No. Only test on systems you control. If you need a test instance, ask us.

**Q: What if I don't trust you to fix it?**
A: We can offer:
- Weekly updates on progress
- Video call explanation of fix
- Review of patch before release
- Other accommodations

**Q: Do you have a bug bounty program?**
A: Not yet, but we credit researchers in advisories. Plan to launch bounty program in 2026.

**Q: What if someone else finds the same vulnerability?**
A: We credit all independent discoverers unless explicitly requested otherwise.

**Q: Can I publish about the vulnerability after patch?**
A: Yes, after public disclosure. We ask you coordinate with us for timing.

**Q: What about vulnerabilities in older versions?**
A: We backport critical patches to recent versions only. Upgrade to latest version.

---

## Support & Questions

- **Security questions:** shivam.shrivastave05@gmail.com
- **General questions:** [GitHub Discussions](https://github.com/shivamz01/VEDARuntime/discussions)
- **Bug reports:** [GitHub Issues](https://github.com/shivamz01/VEDARuntime/issues)

---

## Security Advisory Format

When we publish advisories, they include:

```markdown
# Security Advisory: [Issue Title]

**CVSS Score:** 7.5 (High)
**Affected Versions:** 1.0.0 - 1.1.0
**Fixed In:** v1.1.1
**Published:** 2026-05-15

## Summary
[What is the vulnerability]

## Impact
[Who is affected and how]

## Remediation
[How to fix / upgrade]

## Credits
[Researcher names if authorized]
```

---

## Related Resources

- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Community standards
- [README.md](README.md) — Product overview
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)

---

**Thank you for helping keep VEDA Runtime secure.** 🛡️

We appreciate your responsible disclosure and partnership in building trustworthy AI execution infrastructure.

---

_Last updated: 2026-05-15_
_Version: 1.0_
_Maintainer: Shivam Shrivastav_
