# Supabase Pro Setup

This is how VEDA Runtime Pro uses Supabase.

| Table | Runtime class | Purpose |
|---|---|---|
| `nonce_registry` | `SupabaseNonceRegistry` | Rejects replayed handoff nonces |
| `audit_ledger` | `SupabaseAuditLedger` | Stores HMAC-chained trace spans |
| `pipeline_log` | `SupabasePipelineLog` | Stores high-level pipeline execution records |

---

## 1. Create the Tables

Open your private Supabase project SQL Editor, paste the full contents of:

```text
docs/setup/supabase-schema.sql
```

Then click **Run**.

The schema enables Row Level Security on all three tables, blocks `anon` and `authenticated` table access, grants server-side `service_role` access, and makes `audit_ledger` append-only with update/delete rejection triggers.

After running the schema, verify the tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
and table_name in ('nonce_registry', 'audit_ledger', 'pipeline_log')
order by table_name;
```

Expected result:

```text
audit_ledger
nonce_registry
pipeline_log
```

---

## 2. Set Environment Variables

Set these only on your server or local backend environment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
VEDA_HMAC_KEY=your-long-random-hmac-key
VEDA_LICENSE_SECRET=your-private-license-secret
VEDA_LICENSE_KEY=your-issued-pro-license-key
```

`VEDA_LICENSE_KEY` is required for deployments that verify an externally issued Pro license key.

For the repository smoke test, `examples/paid-supabase-smoke.mjs` may generate a temporary Pro license using `VEDA_LICENSE_SECRET`, so a separate `VEDA_LICENSE_KEY` is not required unless your deployment path explicitly uses one.

Do not put `SUPABASE_SERVICE_KEY`, `VEDA_HMAC_KEY`, `VEDA_LICENSE_SECRET`, or `VEDA_LICENSE_KEY` in browser code, public GitHub issues, screenshots, frontend bundles, or customer-facing logs.

---

## 3. GitHub Actions Secrets

For the manual Pro Supabase smoke workflow, add these to:

**GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

Required secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
VEDA_HMAC_KEY
VEDA_LICENSE_SECRET
```

Optional deployment secret:

```text
VEDA_LICENSE_KEY
```

`VEDA_LICENSE_KEY` is only required for workflows or deployments that verify a pre-issued Pro license. The manual smoke workflow can generate a temporary license from `VEDA_LICENSE_SECRET`.

---

## 4. Install the Official Supabase Client

In the app that wires the Pro runtime, install:

```bash
npm install @supabase/supabase-js
```

The correct package is:

```text
@supabase/supabase-js
```

Do not use unofficial Supabase package names from generated answers or forum posts.

---

## 5. Wire the Pro Runtime

```js
import { createClient } from '@supabase/supabase-js';
import { createLicensedPaidRuntime } from '@veda-runtime-v1/pro';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const kernel = createLicensedPaidRuntime({
  rootDir: './storage',
  hmacKey: process.env.VEDA_HMAC_KEY,
  supabaseClient: supabase,
  licenseKey: process.env.VEDA_LICENSE_KEY,
  licenseSecret: process.env.VEDA_LICENSE_SECRET,
  profileId: 'standard'
});
```

For this repository checkout, build first:

```bash
npm run build
```

Package consumers can import from `@veda-runtime-v1/pro` when the package is installed from your distribution channel.

---

## 6. Local Pro Smoke Test

Run:

```bash
npm run pro:verify
```

This builds the workspaces and runs:

```text
examples/paid-supabase-smoke.mjs
```

The smoke test verifies real Supabase persistence:

- `nonce_registry` insert
- `audit_ledger` span writes
- `pipeline_log` write
- audit bundle validation
- rollback verification

Expected successful output:

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

If the output does not show `supabase: "REAL"`, the test is not proving real Pro persistence.

---

## 7. GitHub Manual Smoke Test

After configuring GitHub Secrets, run the manual workflow from:

**GitHub Repository → Actions → Pro Supabase Smoke Test → Run workflow**

This verifies the Pro Supabase integration in a clean CI environment.

The workflow must be manual-only because it uses private Supabase credentials.

Expected result:

```text
status: COMPLETED
supabase: REAL
nonceInserted: true
auditSpanCount: 5
pipelineLogWritten: true
auditBundleValid: true
rollbackVerified: true
```

---

## 8. Production Security Rules

For Pro deployments:

- Keep `SUPABASE_SERVICE_KEY` server-side only.
- Never expose service-role credentials in browser code.
- Never commit `.env`, `.env.local`, or production secrets.
- Use a long random `VEDA_HMAC_KEY`.
- Use a different long random `VEDA_LICENSE_SECRET`.
- Rotate secrets immediately if exposed.
- Run `npm run pro:verify` before claiming Pro persistence is working.
- Run the GitHub manual smoke workflow before tagging a Pro release.

---

## 9. Pro Release Acceptance Criteria

Pro persistence is considered verified only when both pass:

```bash
npm run pro:verify
```

and the manual GitHub Actions workflow:

```text
Pro Supabase Smoke Test
```

Required proof:

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

If this proof fails, Pro persistence is not release-ready.