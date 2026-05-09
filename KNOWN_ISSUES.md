# Known Issues

This file tracks open bugs, confirmed limitations, and deferred fixes in VEDA Runtime v1.0.

---

## Open Issues

### KI-001 — Supabase writes not yet wired in all layers
**Severity:** Medium  
**Status:** Open  
**Affected:** Pro Edition — audit ledger, pipeline log  
**Detail:** Supabase persistence adapters exist but are not connected end-to-end in all execution paths. The local JSONL ledger is the verified proof layer for v1.0. Supabase writes are a Pro extension and will be fully wired before the Pro Edition launch.  
**Workaround:** Use `npm run demo:free` for local proof. Supabase setup docs are in `docs/setup/supabase-pro-setup.md`.

---

### KI-002 — Wildcard CORS in API surface (fixed in current build)
**Severity:** High  
**Status:** Resolved — 2026-05-10  
**Affected:** `apps/api/src/server.ts`  
**Detail:** Earlier build used `*` as the CORS origin, creating a security risk in production environments.  
**Fix:** Set `VEDA_API_CORS_ORIGIN` environment variable to your allowed origin. See `.env.example`.

---

### KI-003 — Web dashboard hardcoded API URL (fixed in current build)
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
