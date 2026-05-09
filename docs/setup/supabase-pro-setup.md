# Supabase Pro Setup

This is how VEDA Runtime Pro uses Supabase:

| Table | Runtime class | Purpose |
|---|---|---|
| `nonce_registry` | `SupabaseNonceRegistry` | Rejects replayed handoff nonces |
| `audit_ledger` | `SupabaseAuditLedger` | Stores HMAC-chained trace spans |
| `pipeline_log` | `SupabasePipelineLog` | Stores high-level pipeline execution records |

## 1. Create The Tables

Open your private Supabase project SQL editor and run:

```bash
docs/setup/supabase-schema.sql
```

The schema enables Row Level Security on all three tables, blocks `anon` and `authenticated` table access, grants server-side `service_role` access, and makes `audit_ledger` append-only with update/delete rejection triggers.

## 2. Set Environment Variables

Set these only on your server or local backend environment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
VEDA_HMAC_KEY=your-long-random-hmac-key
```

Do not put `SUPABASE_SERVICE_KEY` in browser code, public GitHub issues, screenshots, or customer-facing logs.

## 3. Install The Official Supabase Client

In the app that wires the Pro runtime:

```bash
npm install @supabase/supabase-js
```

The correct package is `@supabase/supabase-js`. Do not use unofficial package names from generated answers or forum posts.

## 4. Wire The Pro Runtime

```js
import { createClient } from '@supabase/supabase-js';
import { createLicensedPaidRuntime } from '@veda-runtime-v1/pro';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const kernel = createLicensedPaidRuntime({
  rootDir: './storage',
  hmacKey: process.env.VEDA_HMAC_KEY,
  supabaseClient: supabase,
  licenseKey: process.env.VEDA_LICENSE_KEY,
  licenseSecret: process.env.VEDA_LICENSE_SECRET,
  profileId: 'standard',
});
```

For this repository checkout, build first with `npm run build`. Package consumers can import from `@veda-runtime-v1/pro` when the package is installed from your distribution channel.

## 5. Verify

Run:

```bash
npm run pipeline:audit
```

This verifies the paid adapter contracts against the local test client and runs the paid proof demo. A real Supabase project still requires the SQL schema above and your private environment keys.
