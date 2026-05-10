# Known Issues

This file tracks open bugs, confirmed limitations, and deferred fixes in VEDA Runtime v1.0.

---

## Open Issues

### KI-001 — Supabase writes not yet wired in all layers
**Severity:** Medium  
**Status:** Resolved — 2026-05-10  
**Affected:** Pro Edition — audit ledger, pipeline log  
**Detail:** Supabase persistence is now wired and verified through the Pro Supabase smoke test. The smoke test proves real nonce_registry insert, audit_ledger span writes, pipeline_log write, rollback verification, and audit bundle validation.  
**Workaround:** None required. Pro persistence is verified.

---

### KI-002 — Wildcard CORS in API surface (fixed in current build)
**Severity:** High  
**Status:** Resolved — 2026-05-10  
**Affected:** `apps/api/src/server.ts`  
**Detail:** Earlier build used `*` as the CORS origin, creating a security risk in production environments.  
**Fix:** API responses now default to `http://localhost:3101` instead of `*`. Set `VEDA_API_CORS_ORIGIN` to your deployed web origin in production. See `.env.example`.

---

### KI-003 — Web status page hardcoded API URL (fixed in current build)
**Severity:** Medium  
**Status:** Resolved — 2026-05-10  
**Affected:** `apps/web/src/server.ts`  
**Detail:** Web UI failed when accessed via IP address or custom domain due to a hardcoded `localhost` API URL.  
**Fix:** API routing now uses dynamic `window.location` resolution.

---

## Deferred / Out of Scope for v1.0

The following are intentional non-goals for this release:

- Multi-tenant SaaS isolation
- Distributed rollback across nodes
- Parallel agent dispatch
- Redis/BullMQ distributed queue (local sequential queue used instead)
- Local model inference (disabled unless hardware gate passes)
- Autonomous compliance enforcement (governance hooks exist; enforcement proof is v1.2 scope)

---

## Reporting a Bug

Run the support bundle collector first:

```bash
npm run support:collect
```

This creates a redacted `logs/support-bundle-<timestamp>.json` with environment info, version, and latest pipeline output — no secrets or customer data included.

Then open a GitHub Issue with:
- The support bundle output
- Steps to reproduce
- Expected vs actual behaviour
- Node.js version (`node --version`)
