-- VEDA Runtime Pro Supabase schema
-- Run this in the Supabase SQL Editor or through your private migration runner.
-- Keep SUPABASE_SERVICE_KEY server-side only. Never expose it in a browser app.

create extension if not exists pgcrypto;

create table if not exists public.nonce_registry (
  nonce text primary key,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  source_agent text not null,
  workflow_id text,
  consumed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  constraint nonce_registry_expiry_check check (expires_at > created_at)
);

create index if not exists nonce_registry_workflow_id_idx
  on public.nonce_registry (workflow_id);

create index if not exists nonce_registry_expires_at_idx
  on public.nonce_registry (expires_at);

create table if not exists public.audit_ledger (
  span_id uuid primary key default gen_random_uuid(),
  workflow_id text not null,
  step_id text,
  agent_name text not null,
  agent_version text not null,
  event_type text not null,
  timestamp timestamptz not null default now(),
  status text not null,
  prev_hmac text not null,
  hmac text not null,
  metadata jsonb not null default '{}'::jsonb,
  constraint audit_ledger_status_check check (status in ('SUCCESS', 'FAILURE', 'BLOCKED', 'TIMEOUT')),
  constraint audit_ledger_hmac_present_check check (length(prev_hmac) > 0 and length(hmac) > 0)
);

create index if not exists audit_ledger_workflow_timestamp_idx
  on public.audit_ledger (workflow_id, timestamp);

create table if not exists public.pipeline_log (
  pipeline_id text primary key,
  pipeline_name text not null,
  status text not null,
  trust_score numeric not null,
  duration_ms integer not null,
  data_status text not null,
  schema_version text not null,
  created_at timestamptz not null default now(),
  gates_passed integer not null default 0,
  errors_count integer not null default 0,
  trace_span_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  constraint pipeline_log_status_check check (status in ('COMPLETED', 'FAILED', 'RUNNING', 'BLOCKED')),
  constraint pipeline_log_trust_score_check check (trust_score >= 0 and trust_score <= 100),
  constraint pipeline_log_duration_check check (duration_ms >= 0),
  constraint pipeline_log_data_status_check check (data_status in ('REAL', 'SIMULATED', 'PARTIAL')),
  constraint pipeline_log_schema_version_check check (schema_version = 'v6.1.1')
);

create index if not exists pipeline_log_created_at_idx
  on public.pipeline_log (created_at);

alter table public.nonce_registry enable row level security;
alter table public.audit_ledger enable row level security;
alter table public.pipeline_log enable row level security;

revoke all on table public.nonce_registry from anon, authenticated;
revoke all on table public.audit_ledger from anon, authenticated;
revoke all on table public.pipeline_log from anon, authenticated;

grant select, insert on table public.nonce_registry to service_role;
grant select, insert on table public.audit_ledger to service_role;
grant select, insert on table public.pipeline_log to service_role;

create or replace function public.veda_reject_audit_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_ledger is append-only';
end;
$$;

drop trigger if exists audit_ledger_no_update on public.audit_ledger;
create trigger audit_ledger_no_update
  before update on public.audit_ledger
  for each row execute function public.veda_reject_audit_ledger_mutation();

drop trigger if exists audit_ledger_no_delete on public.audit_ledger;
create trigger audit_ledger_no_delete
  before delete on public.audit_ledger
  for each row execute function public.veda_reject_audit_ledger_mutation();
