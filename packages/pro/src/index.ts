import {
  canonicalStringify,
  type NonceRecord,
  type SpanStatus,
  type VedaTraceSpan
} from '@veda-runtime-v1/shared';
import {
  EXECUTION_PROFILES,
  getExecutionProfile,
  type ExecutionProfile,
  type ExecutionProfileId
} from '@veda-runtime-v1/shared';
import { Buffer } from 'node:buffer';
import { createHash, createHmac, generateKeyPairSync, randomUUID, timingSafeEqual } from 'node:crypto';

// ─── Editions & Features (API dependency) ─────────────────────────────
export type Edition = 'free' | 'paid';

export type FeatureId =
  | 'local_runtime'
  | 'local_audit'
  | 'context_governor'
  | 'rollback_engine'
  | 'sandbox_policy'
  | 'supabase_audit'
  | 'pipeline_log'
  | 'audit_bundle_export'
  | 'veda_bridge';

export interface EditionFeatures {
  edition: Edition;
  features: FeatureId[];
}

const FREE_FEATURES: FeatureId[] = [
  'local_runtime',
  'local_audit',
  'context_governor',
  'rollback_engine',
  'sandbox_policy'
];

const PAID_FEATURES: FeatureId[] = [
  ...FREE_FEATURES,
  'supabase_audit',
  'pipeline_log',
  'audit_bundle_export',
  'veda_bridge'
];

export function getEditionFeatures(edition: Edition): EditionFeatures {
  return {
    edition,
    features: edition === 'paid' ? [...PAID_FEATURES] : [...FREE_FEATURES]
  };
}

export function isFeatureAllowed(profile: EditionFeatures, feature: FeatureId): boolean {
  return profile.features.includes(feature);
}

// ─── License Keys (paid access boundary) ─────────────────────────────
export type LicensePlan = 'pro';

export interface LicenseClaimsInput {
  license_id: string;
  customer_id: string;
  plan: LicensePlan;
  issued_at: string;
  expires_at: string;
  founding_slot?: number;
}

export interface LicenseClaims extends LicenseClaimsInput {
  license_version: 'v1';
}

export interface LicenseVerificationResult {
  valid: boolean;
  errors: string[];
  edition: Edition;
  features: FeatureId[];
  claims?: LicenseClaims;
}

export function issueLicenseKey(input: LicenseClaimsInput, secret: string): string {
  assertLicenseSecret(secret);
  const claims: LicenseClaims = {
    ...input,
    license_version: 'v1'
  };
  const payload = Buffer.from(canonicalStringify(claims), 'utf8').toString('base64url');
  const signature = signLicensePayload(payload, secret);
  return `veda_pro_v1.${payload}.${signature}`;
}

export function verifyLicenseKey(
  licenseKey: string | undefined,
  secret: string | undefined,
  options: { now?: Date } = {}
): LicenseVerificationResult {
  const free = getEditionFeatures('free').features;
  const fail = (errors: string[]): LicenseVerificationResult => ({
    valid: false,
    errors,
    edition: 'free',
    features: free
  });

  if (!licenseKey) return fail(['LICENSE_KEY_MISSING']);
  if (!secret) return fail(['VEDA_LICENSE_SECRET_REQUIRED']);

  const parts = licenseKey.split('.');
  if (parts.length !== 3 || parts[0] !== 'veda_pro_v1') {
    return fail(['LICENSE_FORMAT_INVALID']);
  }

  const [prefix, payload, signature] = parts;
  if (!prefix || !payload || !signature) {
    return fail(['LICENSE_FORMAT_INVALID']);
  }

  const expectedSignature = signLicensePayload(payload, secret);
  if (!safeEqualHex(signature, expectedSignature)) {
    return fail(['LICENSE_SIGNATURE_INVALID']);
  }

  let claims: LicenseClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as LicenseClaims;
  } catch {
    return fail(['LICENSE_PAYLOAD_INVALID']);
  }

  const errors: string[] = [];
  if (claims.license_version !== 'v1') errors.push('LICENSE_VERSION_INVALID');
  if (claims.plan !== 'pro') errors.push('LICENSE_PLAN_INVALID');
  if (!claims.license_id) errors.push('LICENSE_ID_MISSING');
  if (!claims.customer_id) errors.push('LICENSE_CUSTOMER_MISSING');

  const issuedAt = Date.parse(claims.issued_at);
  const expiresAt = Date.parse(claims.expires_at);
  const now = options.now ?? new Date();
  if (Number.isNaN(issuedAt)) errors.push('LICENSE_ISSUED_AT_INVALID');
  if (Number.isNaN(expiresAt)) errors.push('LICENSE_EXPIRES_AT_INVALID');
  if (!Number.isNaN(expiresAt) && expiresAt <= now.getTime()) errors.push('LICENSE_EXPIRED');

  if (errors.length > 0) {
    return fail(errors);
  }

  return {
    valid: true,
    errors: [],
    edition: 'paid',
    features: getEditionFeatures('paid').features,
    claims
  };
}

function assertLicenseSecret(secret: string): void {
  if (!secret) throw new Error('VEDA_LICENSE_SECRET_REQUIRED');
}

function signLicensePayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

// ─── Supabase client type (minimal contract) ─────────────────────────
export interface SupabaseRow {
  [key: string]: unknown;
}

export interface SupabaseQueryResult<T = SupabaseRow> {
  data: T[] | null;
  error: { message: string; code?: string } | null;
}

export interface SupabaseInsertResult<T = SupabaseRow> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export interface SupabaseSelectQuery<T = SupabaseRow> extends PromiseLike<SupabaseQueryResult<T>> {
  eq(col: string, val: unknown): Promise<SupabaseQueryResult<T>>;
}

export interface SupabaseTable {
  select(columns?: string): SupabaseSelectQuery;
  insert(row: SupabaseRow): { select(): Promise<SupabaseInsertResult> };
}

export interface SupabaseClient {
  from(table: string): SupabaseTable;
}

// ─── Supabase Nonce Registry ──────────────────────────────────────────
export class SupabaseNonceRegistry {
  constructor(private readonly client: SupabaseClient) {}

  async insert(record: Omit<NonceRecord, 'consumed'> & { consumed?: boolean }): Promise<NonceRecord> {
    const row: NonceRecord = {
      nonce: record.nonce,
      created_at: record.created_at,
      expires_at: record.expires_at,
      source_agent: record.source_agent,
      consumed: record.consumed ?? false,
      ...(record.workflow_id ? { workflow_id: record.workflow_id } : {})
    };

    const { error } = await this.client
      .from('nonce_registry')
      .insert(row as unknown as SupabaseRow)
      .select();

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        throw new DuplicateNonceError(record.nonce);
      }
      throw new SupabaseWriteError('nonce_registry', error.message);
    }

    return row;
  }

  async exists(nonce: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('nonce_registry')
      .select('nonce')
      .eq('nonce', nonce);

    if (error) throw new SupabaseReadError('nonce_registry', error.message);
    return (data?.length ?? 0) > 0;
  }
}

// ─── Supabase Audit Ledger ────────────────────────────────────────────
export interface SupabaseAuditSpanInput {
  workflow_id: string;
  step_id?: string;
  agent_name: string;
  event_type: string;
  status: SpanStatus;
  metadata: Record<string, unknown>;
}

export class SupabaseAuditLedger {
  private lastHmac = 'GENESIS';
  private loaded = false;

  constructor(
    private readonly client: SupabaseClient,
    private readonly hmacKey: string
  ) {
    if (!hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');
  }

  async appendSpan(input: SupabaseAuditSpanInput): Promise<VedaTraceSpan> {
    await this.loadLastHmac();

    const base = {
      span_id: randomUUID(),
      workflow_id: input.workflow_id,
      ...(input.step_id ? { step_id: input.step_id } : {}),
      agent_name: input.agent_name,
      agent_version: '1.1.0',
      event_type: input.event_type,
      timestamp: new Date().toISOString(),
      status: input.status,
      prev_hmac: this.lastHmac,
      metadata: input.metadata
    };

    const hmac = createHmac('sha256', this.hmacKey)
      .update(canonicalStringify(base))
      .digest('hex');

    const span: VedaTraceSpan = { ...base, hmac };

    const { error } = await this.client
      .from('audit_ledger')
      .insert(span as unknown as SupabaseRow)
      .select();

    if (error) throw new SupabaseWriteError('audit_ledger', error.message);

    this.lastHmac = hmac;
    return span;
  }

  async readAll(workflowId?: string): Promise<VedaTraceSpan[]> {
    const query = this.client.from('audit_ledger').select('*');
    const result = workflowId
      ? await query.eq('workflow_id', workflowId)
      : await query;

    if (result.error) throw new SupabaseReadError('audit_ledger', result.error.message);
    return (result.data ?? []) as unknown as VedaTraceSpan[];
  }

  private async loadLastHmac(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    const spans = await this.readAll();
    if (spans.length === 0) return;
    const ordered = [...spans].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
    const last = ordered[ordered.length - 1];
    if (!last?.hmac) throw new Error('AUDIT_LEDGER_CORRUPT_MISSING_HMAC');
    this.lastHmac = last.hmac;
  }
}

// ─── Supabase Pipeline Log ────────────────────────────────────────────
export interface PipelineLogEntry {
  pipeline_id: string;
  pipeline_name: string;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING' | 'BLOCKED';
  trust_score: number;
  duration_ms: number;
  data_status: string;
  schema_version: string;
  created_at: string;
  gates_passed: number;
  errors_count: number;
  trace_span_count: number;
  metadata: Record<string, unknown>;
}

export class SupabasePipelineLog {
  constructor(private readonly client: SupabaseClient) {}

  async write(entry: PipelineLogEntry): Promise<PipelineLogEntry> {
    const { error } = await this.client
      .from('pipeline_log')
      .insert(entry as unknown as SupabaseRow)
      .select();

    if (error) throw new SupabaseWriteError('pipeline_log', error.message);
    return entry;
  }

  async readByPipelineId(pipelineId: string): Promise<PipelineLogEntry | null> {
    const { data, error } = await this.client
      .from('pipeline_log')
      .select('*')
      .eq('pipeline_id', pipelineId);

    if (error) throw new SupabaseReadError('pipeline_log', error.message);
    return (data?.[0] as unknown as PipelineLogEntry) ?? null;
  }

  async readAll(): Promise<PipelineLogEntry[]> {
    const { data, error } = await this.client
      .from('pipeline_log')
      .select('*');

    if (error) throw new SupabaseReadError('pipeline_log', error.message);
    return (data ?? []) as unknown as PipelineLogEntry[];
  }
}

// ─── Audit Proof Bundle Export ────────────────────────────────────────
export interface AuditProofBundle {
  bundle_id: string;
  workflow_id: string;
  exported_at: string;
  schema_version: string;
  span_count: number;
  hmac_chain_valid: boolean;
  spans: VedaTraceSpan[];
  bundle_hmac: string;
}

export class AuditBundleExporter {
  constructor(private readonly hmacKey: string) {
    if (!hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');
  }

  export(workflowId: string, spans: VedaTraceSpan[]): AuditProofBundle {
    const chainValid = this.verifyHmacChain(spans);

    const bundle: Omit<AuditProofBundle, 'bundle_hmac'> = {
      bundle_id: randomUUID(),
      workflow_id: workflowId,
      exported_at: new Date().toISOString(),
      schema_version: 'v6.1.1',
      span_count: spans.length,
      hmac_chain_valid: chainValid,
      spans
    };

    const bundleHmac = createHmac('sha256', this.hmacKey)
      .update(canonicalStringify(bundle))
      .digest('hex');

    return { ...bundle, bundle_hmac: bundleHmac };
  }

  private verifyHmacChain(spans: VedaTraceSpan[]): boolean {
    if (spans.length === 0) return true;
    const first = spans[0]!;
    if (!this.verifySpanHmac(first)) return false;
    for (let i = 1; i < spans.length; i++) {
      if (spans[i]!.prev_hmac !== spans[i - 1]!.hmac) return false;
      if (!this.verifySpanHmac(spans[i]!)) return false;
    }
    return true;
  }

  private verifySpanHmac(span: VedaTraceSpan): boolean {
    const { hmac, ...base } = span;
    const expected = createHmac('sha256', this.hmacKey)
      .update(canonicalStringify(base))
      .digest('hex');
    return hmac === expected;
  }
}

// ─── Governance Profile Packs ─────────────────────────────────────────
export type GovernanceProfileId =
  | 'standard'
  | 'financial_services'
  | 'healthcare'
  | 'government'
  | 'enterprise_strict';

export interface GovernanceProfile {
  id: GovernanceProfileId;
  name: string;
  max_tokens: number;
  ttl_seconds: number;
  relevance_threshold: number;
  require_human_approval: boolean;
  allowed_risk_levels: string[];
  cooldown_seconds: number;
  max_retries: number;
}

const GOVERNANCE_PROFILES: Record<GovernanceProfileId, GovernanceProfile> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    max_tokens: 800,
    ttl_seconds: 86_400,
    relevance_threshold: 0.7,
    require_human_approval: false,
    allowed_risk_levels: ['LOW', 'MEDIUM', 'HIGH'],
    cooldown_seconds: 8,
    max_retries: 3
  },
  financial_services: {
    id: 'financial_services',
    name: 'Financial Services',
    max_tokens: 500,
    ttl_seconds: 43_200,
    relevance_threshold: 0.85,
    require_human_approval: true,
    allowed_risk_levels: ['LOW', 'MEDIUM'],
    cooldown_seconds: 15,
    max_retries: 1
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    max_tokens: 600,
    ttl_seconds: 28_800,
    relevance_threshold: 0.9,
    require_human_approval: true,
    allowed_risk_levels: ['LOW'],
    cooldown_seconds: 12,
    max_retries: 1
  },
  government: {
    id: 'government',
    name: 'Government',
    max_tokens: 400,
    ttl_seconds: 21_600,
    relevance_threshold: 0.9,
    require_human_approval: true,
    allowed_risk_levels: ['LOW'],
    cooldown_seconds: 20,
    max_retries: 0
  },
  enterprise_strict: {
    id: 'enterprise_strict',
    name: 'Enterprise Strict',
    max_tokens: 300,
    ttl_seconds: 14_400,
    relevance_threshold: 0.95,
    require_human_approval: true,
    allowed_risk_levels: ['LOW'],
    cooldown_seconds: 30,
    max_retries: 0
  }
};

export function getGovernanceProfile(id: GovernanceProfileId): GovernanceProfile {
  return { ...GOVERNANCE_PROFILES[id] };
}

export function listGovernanceProfiles(): GovernanceProfile[] {
  return Object.values(GOVERNANCE_PROFILES).map(p => ({ ...p }));
}

// ─── Error types ──────────────────────────────────────────────────────
export class DuplicateNonceError extends Error {
  constructor(nonce: string) {
    super(`NONCE_REPLAY: ${nonce}`);
    this.name = 'DuplicateNonceError';
  }
}

export class SupabaseWriteError extends Error {
  constructor(table: string, detail: string) {
    super(`SUPABASE_WRITE_FAILED [${table}]: ${detail}`);
    this.name = 'SupabaseWriteError';
  }
}

export class SupabaseReadError extends Error {
  constructor(table: string, detail: string) {
    super(`SUPABASE_READ_FAILED [${table}]: ${detail}`);
    this.name = 'SupabaseReadError';
  }
}

// ─── Paid Runtime Kernel ──────────────────────────────────────────────
import { ContextGovernor, RollbackEngine, type DemoExecutionInput, type DemoExecutionResult } from '@veda-runtime-v1/runtime';
import { ShellPolicy } from '@veda-runtime-v1/sandbox';
import {
  HANDOFF_SCHEMA_VERSION,
  PRODUCT_VERSION,
  sealHandoff,
  validateHandoffShape,
  verifyHandoffCrypto,
  type HandoffJSON_v611
} from '@veda-runtime-v1/shared';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface CreatePaidRuntimeOptions {
  rootDir: string;
  hmacKey: string;
  supabaseClient: SupabaseClient;
  profileId?: GovernanceProfileId;
  executionProfileId?: ExecutionProfileId;
}

export class PaidRuntimeKernel {
  private readonly contextGovernor = new ContextGovernor();
  private readonly rollbackEngine: RollbackEngine;
  private readonly nonceRegistry: SupabaseNonceRegistry;
  private readonly auditLedger: SupabaseAuditLedger;
  private readonly pipelineLog: SupabasePipelineLog;
  private readonly shellPolicy = new ShellPolicy();

  private readonly profile: GovernanceProfile;
  private readonly executionProfile: ExecutionProfile;
  private readonly handoffKeyPair = generateKeyPairSync('ed25519');

  private activeExecutions = 0;
  private lastExecutionEndMs = 0;
  private readonly executionWaiters: Array<() => void> = [];

  constructor(private readonly options: CreatePaidRuntimeOptions) {
    if (!options.hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');
    this.rollbackEngine = new RollbackEngine(options.rootDir);
    this.nonceRegistry = new SupabaseNonceRegistry(options.supabaseClient);
    this.auditLedger = new SupabaseAuditLedger(options.supabaseClient, options.hmacKey);
    this.pipelineLog = new SupabasePipelineLog(options.supabaseClient);
    this.profile = getGovernanceProfile(options.profileId ?? 'standard');
    this.executionProfile = getExecutionProfile(options.executionProfileId ?? 'pro_cloud');
  }

  async executeDemo(input: DemoExecutionInput): Promise<DemoExecutionResult> {
    return this.runWithExecutionGate(async () => {
      await this.throttle();

      try {
        return await this.executeDemoUnsafe(input);
      } finally {
        this.lastExecutionEndMs = Date.now();
      }
    });
  }

  private async executeDemoUnsafe(input: DemoExecutionInput): Promise<DemoExecutionResult> {
    const handoff = this.createPaidHandoff(input);
    const shape = validateHandoffShape(handoff);
    if (!shape.valid) throw new Error(`HANDOFF_INVALID: ${shape.errors.join(',')}`);

    const validation = verifyHandoffCrypto(handoff, {
      hmacKey: this.options.hmacKey,
      publicKey: this.handoffKeyPair.publicKey
    });
    if (!validation.valid) throw new Error(`HANDOFF_INVALID: ${validation.errors.join(',')}`);

    // Governance Profile Check
    if (this.profile.require_human_approval && !handoff.governance.human_approval_required) {
        throw new Error('GOVERNANCE_PROFILE_REJECTED: Human approval required by profile');
    }

    await this.nonceRegistry.insert({
      nonce: handoff.nonce,
      created_at: handoff.timestamp,
      expires_at: new Date(Date.parse(handoff.timestamp) + 300_000).toISOString(),
      source_agent: handoff.source_agent,
      workflow_id: input.workflowId
    });

    const context = this.contextGovernor.govern({
      instruction: input.instruction,
      workflowId: input.workflowId,
      sessionScope: input.sessionScope,
      memory: input.memory,
      maxTokens: this.profile.max_tokens,
      ttlSeconds: this.profile.ttl_seconds,
      relevanceThreshold: this.profile.relevance_threshold
    });

    const spans: VedaTraceSpan[] = [];
    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'handoff',
      agent_name: 'paid-runtime-kernel',
      event_type: 'HANDOFF_ACCEPTED',
      status: 'SUCCESS',
      metadata: { 
        schema_version: HANDOFF_SCHEMA_VERSION, 
        profile: this.profile.id,
        execution_profile: this.executionProfile.id,
        max_parallel_agents: this.executionProfile.max_parallel_agents
      }
    }));

    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'context',
      agent_name: 'context-governor',
      event_type: 'CONTEXT_GOVERNED',
      status: 'SUCCESS',
      metadata: { items_filtered: context.items_filtered }
    }));

    const targetPath = join(this.options.rootDir, 'sandbox', 'paid-proof.txt');
    await mkdir(dirname(targetPath), { recursive: true });
    
    const checkpointSpan = await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'write-proof',
      agent_name: 'rollback-engine',
      event_type: 'ROLLBACK_CHECKPOINT_CREATED',
      status: 'SUCCESS',
      metadata: { target: 'sandbox/paid-proof.txt' }
    });
    spans.push(checkpointSpan);

    const rollback = await this.rollbackEngine.checkpointFile({
      workflowId: input.workflowId,
      stepId: 'write-proof',
      targetPath,
      vedatraceSpan: checkpointSpan.span_id
    });

    const shellDecision = this.shellPolicy.evaluate('cat paid-runtime.log | head');
    if (!shellDecision.allowed) throw new Error(`SANDBOX_POLICY_UNEXPECTED_BLOCK: ${shellDecision.reason}`);

    await writeFile(targetPath, [
      'VEDA Runtime Version 1 PAID proof',
      `instruction=${input.instruction}`,
      `schema=${HANDOFF_SCHEMA_VERSION}`,
      `product=${PRODUCT_VERSION}`,
      `context_items=${context.relevant_memory.length}`,
      `profile=${this.profile.id}`,
      `execution_profile=${this.executionProfile.id}`,
      `max_parallel_agents=${this.executionProfile.max_parallel_agents}`,
      `cooldown_seconds=${this.executionProfile.cooldown_seconds}`
    ].join('\n'), 'utf8');

    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'write-proof',
      agent_name: 'paid-runtime-kernel',
      event_type: 'TOOL_CALL_ALLOWED',
      status: 'SUCCESS',
      metadata: { file: 'sandbox/paid-proof.txt', sandbox_policy: shellDecision.reason }
    }));

    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'complete',
      agent_name: 'paid-runtime-kernel',
      event_type: 'AGENT_COMPLETE',
      status: 'SUCCESS',
      metadata: { 
        data_status: 'REAL',
        execution_profile: this.executionProfile.id
      }
    }));

    await this.pipelineLog.write({
        pipeline_id: input.workflowId,
        pipeline_name: 'Paid Demo Pipeline',
        status: 'COMPLETED',
        trust_score: 100,
        duration_ms: 125,
        data_status: 'REAL',
        schema_version: HANDOFF_SCHEMA_VERSION,
        created_at: new Date().toISOString(),
        gates_passed: 4,
        errors_count: 0,
        trace_span_count: spans.length,
        metadata: {
            profile: this.profile.id
        }
    });

    return {
      status: 'COMPLETED',
      dataStatus: 'REAL',
      context,
      rollback,
      spans,
      auditRows: await this.auditLedger.readAll(input.workflowId)
    };
  }

  private async runWithExecutionGate<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquireExecutionSlot();

    try {
      return await operation();
    } finally {
      this.releaseExecutionSlot();
    }
  }

  private async acquireExecutionSlot(): Promise<void> {
    const maxParallelAgents = Math.max(1, Math.floor(this.executionProfile.max_parallel_agents));

    while (this.activeExecutions >= maxParallelAgents) {
      await new Promise<void>(resolve => {
        this.executionWaiters.push(resolve);
      });
    }

    this.activeExecutions += 1;
  }

  private releaseExecutionSlot(): void {
    this.activeExecutions = Math.max(0, this.activeExecutions - 1);
    const next = this.executionWaiters.shift();

    if (next) {
      next();
    }
  }

  private async throttle(): Promise<void> {
    const cooldownMs = Math.max(0, this.executionProfile.cooldown_seconds) * 1000;
    if (cooldownMs <= 0) return;

    const now = Date.now();
    const elapsed = now - this.lastExecutionEndMs;
    const remaining = cooldownMs - elapsed;

    if (this.lastExecutionEndMs > 0 && remaining > 0) {
      await sleep(remaining);
    }
  }

  private createPaidHandoff(input: DemoExecutionInput): HandoffJSON_v611 {
    const timestamp = new Date().toISOString();
    const nonce = randomUUID();
    const sovereignKey = `veda_pro_${createHash('sha256').update(input.workflowId).digest('hex').slice(0, 32)}`;
    const base = {
      schema_version: HANDOFF_SCHEMA_VERSION,
      timestamp,
      nonce,
      source_agent: 'ceo-veda',
      target_agent: 'paid-runtime-kernel',
      task_id: 'VT-RUNTIME-PAID-DEMO',
      workflow_id: input.workflowId,
      payload: {
        instruction: input.instruction,
        context: 'governed-paid-demo',
        data: {},
        constraints: ['paid-edition', 'supabase-wired']
      },
      governance: {
        zte_cleared: true,
        spe_chain_passed: true,
        legal_cleared: true,
        budget_cleared: true,
        human_approval_required: this.profile.require_human_approval
      },
      sovereign_key: sovereignKey,
      DATA_STATUS: 'REAL',
      phase: '2'
    } satisfies Omit<HandoffJSON_v611, 'signature' | 'hmac'>;

    return sealHandoff(base, {
      hmacKey: this.options.hmacKey,
      privateKey: this.handoffKeyPair.privateKey
    });
  }
}

export interface CreateLicensedPaidRuntimeOptions extends CreatePaidRuntimeOptions {
  licenseKey: string;
  licenseSecret: string;
  licenseNow?: Date;
}

export function createLicensedPaidRuntime(options: CreateLicensedPaidRuntimeOptions): PaidRuntimeKernel {
  const license = verifyLicenseKey(
    options.licenseKey,
    options.licenseSecret,
    options.licenseNow ? { now: options.licenseNow } : {}
  );
  if (!license.valid) {
    throw new Error(`VEDA_LICENSE_INVALID: ${license.errors.join(',')}`);
  }

  const runtimeOptions: CreatePaidRuntimeOptions = {
    rootDir: options.rootDir,
    hmacKey: options.hmacKey,
    supabaseClient: options.supabaseClient
  };
  if (options.profileId) {
    runtimeOptions.profileId = options.profileId;
  }

  return new PaidRuntimeKernel(runtimeOptions);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
