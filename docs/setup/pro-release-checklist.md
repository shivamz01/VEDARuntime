# Pro Release Hardening Checklist

This checklist must be completed before VEDA Runtime `v1.1.0-pro-persistence` is released.

---

## 1. Persistence Verification

- [x] Local Pro smoke test passes (`npm run pro:verify`)
- [x] GitHub Actions manual Pro smoke test passes with repository secrets
- [x] Real Supabase `nonce_registry` insert verified
- [x] Real Supabase `audit_ledger` writes verified
- [x] Real Supabase `pipeline_log` write verified
- [x] Audit proof bundle validates HMAC chain
- [x] Rollback verification passes during Pro smoke test
- [x] Replay attack test verified against real Supabase duplicate nonce path

### Required Pro proof output:

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

## 2. GitHub Actions Pro Smoke

- [x] `.github/workflows/pro-smoke.yml` added
- [x] Workflow is manual-only (`workflow_dispatch`)
- [x] Workflow permissions restricted to `contents: read`
- [x] Workflow has timeout protection
- [x] Required secrets configured (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `VEDA_HMAC_KEY`, `VEDA_LICENSE_SECRET`)
- [x] Manual workflow passes in GitHub Actions
- [x] No secrets printed in logs

---

## 3. API Hardening

- [x] Rate limiting implemented for `/api/status`
- [x] Rate limiting implemented for `/api/demo/free`
- [x] Missing `Origin` header rejected in production
- [x] `/health` remains available for uptime checks
- [x] Startup failure if `VEDA_HMAC_KEY` is missing in production
- [x] Wildcard CORS rejected in production

---

## 4. Documentation & Governance

- [x] Supabase Pro setup guide updated
- [x] `KNOWN_ISSUES.md` updated with KI-001 resolved
- [x] Pro smoke test documented in setup guides
- [x] `README.md` updated with Pro hardening details
- [x] `README.md` updated with Pro persistence verification details
- [x] `README.md` clearly separates Free v1.0 from Pro v1.1 capabilities
- [x] Support bundle collector includes latest Pro verification artifact or clearly states Pro state is not verified

---

## 5. Final Release

- [x] GitHub Actions build green on `main`
- [x] Pro persistence proof passed
- [x] `npm run release:check` passes locally
- [x] `npm run pro:verify` passes locally
- [x] GitHub Actions release check passes on `main`
- [x] GitHub manual Pro smoke workflow passes
- [x] KI-001 marked resolved after GitHub Pro smoke pass
- [x] Release tag `v1.1.0-pro-persistence` pushed
