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

The paid edition is for teams that need shared infrastructure and audit proof.

- Supabase `nonce_registry`, `pipeline_log`, and `audit_ledger`
- Dashboard/API status surfaces
- Governance profiles
- Audit proof bundle export
- VEDA OS bridge adapter
- Hosted support for provider health/fallback configuration

## Rule

Free and paid features live in one monorepo. Paid features are separated by package boundaries and entitlement checks, not by duplicating the runtime.
