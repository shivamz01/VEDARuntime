# Free vs Paid Boundary

## Free

The free edition is for local proof and developer adoption.

- Local runtime execution
- Local nonce registry
- Local audit ledger
- Context Governor
- Rollback Engine
- Sandbox shell policy
- Demo workflow
- CLI status output

## Paid

The paid edition is the Pro launch tier for builders and small teams that need shared infrastructure and audit proof.

Base price: **$20/month**

Founding offer: **$13/month** for the **first 3 months** for the **first 2000 paid users**.

- Supabase `nonce_registry`, `pipeline_log`, and `audit_ledger`
- API and web status surfaces
- Governance profiles
- Audit proof bundle export
- VEDA OS bridge adapter
- Hosted support for provider health/fallback configuration

Setup instructions: `docs/setup/supabase-pro-setup.md`  
SQL schema: `docs/setup/supabase-schema.sql`

## Rule

Free and paid features live in one monorepo. Paid features are separated by package boundaries and entitlement checks, not by duplicating the runtime.
