import {
  createHmac,
  sign as ed25519Sign,
  timingSafeEqual,
  verify as ed25519Verify,
  type KeyLike
} from 'node:crypto';

export const PRODUCT_VERSION = '1.0.0' as const;
export const PRODUCT_NAME = 'VEDA Runtime Version 1' as const;
export const HANDOFF_SCHEMA_VERSION = 'v6.1.1' as const;

export type DataStatus = 'REAL' | 'SIMULATED' | 'PARTIAL';
export type FSMState = 'PENDING' | 'QUEUED' | 'RUNNING' | 'BLOCKED' | 'FAILED' | 'COMPLETED';
export type AgentTier = 'CORE' | 'EXECUTIVE' | 'DEPT_LEAD' | 'WORKER' | 'SECURITY' | 'LEGAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SpanStatus = 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'TIMEOUT';
export type SourceType = 'USER' | 'AGENT' | 'TOOL' | 'MEMORY' | 'DOC';

export interface HandoffJSON_v611 {
  schema_version: typeof HANDOFF_SCHEMA_VERSION;
  timestamp: string;
  nonce: string;
  source_agent: string;
  target_agent: string;
  task_id: string;
  workflow_id?: string;
  payload: {
    instruction: string;
    context: string;
    data: Record<string, unknown>;
    constraints: string[];
  };
  governance: {
    zte_cleared: boolean;
    spe_chain_passed: boolean;
    legal_cleared: boolean;
    budget_cleared: boolean;
    brand_cleared?: boolean;
    human_approval_required?: boolean;
  };
  DATA_STATUS: DataStatus;
  phase: '1' | '2';
  sovereign_key: string;
  signature: string;
  hmac: string;
}

export interface NonceRecord {
  nonce: string;
  created_at: string;
  expires_at: string;
  source_agent: string;
  workflow_id?: string;
  consumed: boolean;
}

export interface ContextBudget {
  max_tokens: number;
  recency_weight: number;
  task_relevance_threshold: number;
  session_scope: string;
  ttl_seconds: number;
}

export interface MemorySlice {
  id: string;
  workflow_id: string;
  session_scope: string;
  content: string;
  created_at: string;
  relevance_score?: number;
  source_type: SourceType;
}

export interface GovernedContext {
  task_prompt: string;
  relevant_memory: MemorySlice[];
  token_budget_consumed: number;
  items_filtered: number;
  budget_ceiling_hit: boolean;
  session_scope: string;
}

export interface RollbackCheckpoint {
  checkpoint_id: string;
  workflow_id: string;
  step_id: string;
  snapshot_type: 'FILE' | 'WORKFLOW' | 'SHELL_ARTIFACTS';
  created_at: string;
  snapshot_data: unknown;
  verified: boolean;
  restore_test_hash?: string;
  vedatrace_span: string;
}

export interface VedaTraceSpan {
  span_id: string;
  workflow_id: string;
  step_id?: string;
  agent_name: string;
  agent_version: string;
  event_type: string;
  timestamp: string;
  status: SpanStatus;
  prev_hmac: string;
  hmac: string;
  metadata: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const REQUIRED_HANDOFF_KEYS = [
  'schema_version',
  'timestamp',
  'nonce',
  'source_agent',
  'target_agent',
  'task_id',
  'payload',
  'governance',
  'DATA_STATUS',
  'phase',
  'sovereign_key',
  'signature',
  'hmac'
] as const;

const OPTIONAL_HANDOFF_KEYS = ['workflow_id'] as const;
const ALLOWED_HANDOFF_KEYS = new Set<string>([
  ...REQUIRED_HANDOFF_KEYS,
  ...OPTIONAL_HANDOFF_KEYS
]);

const VALID_DATA_STATUS = new Set<string>(['REAL', 'SIMULATED', 'PARTIAL']);
const VALID_PHASES = new Set<string>(['1', '2']);

export function validateHandoffShape(candidate: unknown, nowMs = Date.now()): ValidationResult {
  const errors: string[] = [];

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { valid: false, errors: ['HANDOFF_NOT_OBJECT'] };
  }

  const handoff = candidate as Record<string, unknown>;

  for (const key of REQUIRED_HANDOFF_KEYS) {
    if (!(key in handoff)) errors.push(`MISSING_${key}`);
  }

  for (const key of Object.keys(handoff)) {
    if (!ALLOWED_HANDOFF_KEYS.has(key)) errors.push(`FORBIDDEN_FIELD_${key}`);
  }

  if (handoff.schema_version !== HANDOFF_SCHEMA_VERSION) {
    errors.push('SCHEMA_VERSION_MISMATCH');
  }

  if (typeof handoff.timestamp !== 'string') {
    errors.push('TIMESTAMP_INVALID');
  } else {
    const timestampMs = Date.parse(handoff.timestamp);
    if (!Number.isFinite(timestampMs)) {
      errors.push('TIMESTAMP_INVALID');
    } else if (timestampMs - nowMs > 300_000) {
      errors.push('TIMESTAMP_INVALID');
    } else if (nowMs - timestampMs > 300_000) {
      errors.push('NONCE_STALE');
    }
  }

  if (typeof handoff.nonce !== 'string' || handoff.nonce.trim().length < 8) {
    errors.push('NONCE_INVALID');
  }

  if (!VALID_DATA_STATUS.has(String(handoff.DATA_STATUS))) {
    errors.push('DATA_STATUS_INVALID');
  }

  if (!VALID_PHASES.has(String(handoff.phase))) {
    errors.push('PHASE_INVALID');
  }

  if (typeof handoff.sovereign_key !== 'string' || !handoff.sovereign_key.startsWith('veda_')) {
    errors.push('SOVEREIGN_KEY_INVALID');
  }

  if (typeof handoff.signature !== 'string' || handoff.signature.length === 0) {
    errors.push('SIGNATURE_INVALID');
  }

  if (typeof handoff.hmac !== 'string' || handoff.hmac.length === 0) {
    errors.push('HMAC_INVALID');
  }

  validatePayload(handoff.payload, errors);
  validateGovernance(handoff.governance, errors);

  return { valid: errors.length === 0, errors };
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export interface HandoffSigningMaterial {
  hmacKey: string;
  privateKey: KeyLike;
}

export interface HandoffVerificationMaterial {
  hmacKey: string;
  publicKey: KeyLike;
}

export function handoffSigningPayload(
  handoff: Omit<HandoffJSON_v611, 'signature' | 'hmac'> | HandoffJSON_v611
): string {
  const { signature: _signature, hmac: _hmac, ...unsigned } = handoff as Record<string, unknown>;
  return canonicalStringify(unsigned);
}

export function sealHandoff(
  handoff: Omit<HandoffJSON_v611, 'signature' | 'hmac'>,
  material: HandoffSigningMaterial
): HandoffJSON_v611 {
  if (!material.hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');
  const payload = handoffSigningPayload(handoff);
  const hmac = createHmac('sha256', material.hmacKey).update(payload).digest('hex');
  const signature = ed25519Sign(null, Buffer.from(payload, 'utf8'), material.privateKey).toString('base64');
  return { ...handoff, signature, hmac };
}

export function verifyHandoffCrypto(
  handoff: unknown,
  material: HandoffVerificationMaterial,
  nowMs = Date.now()
): ValidationResult {
  const shape = validateHandoffShape(handoff, nowMs);
  if (!shape.valid) return shape;
  if (!material.hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');

  const signed = handoff as HandoffJSON_v611;
  const payload = handoffSigningPayload(signed);
  const expectedHmac = createHmac('sha256', material.hmacKey).update(payload).digest('hex');
  const errors: string[] = [];

  if (!safeEqualHex(signed.hmac, expectedHmac)) {
    errors.push('HMAC_INVALID');
  }

  try {
    const signatureValid = ed25519Verify(
      null,
      Buffer.from(payload, 'utf8'),
      material.publicKey,
      Buffer.from(signed.signature, 'base64')
    );
    if (!signatureValid) errors.push('SIGNATURE_INVALID');
  } catch {
    errors.push('SIGNATURE_INVALID');
  }

  return { valid: errors.length === 0, errors };
}

function validatePayload(value: unknown, errors: string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push('PAYLOAD_INVALID');
    return;
  }

  const payload = value as Record<string, unknown>;
  if (typeof payload.instruction !== 'string') errors.push('PAYLOAD_INSTRUCTION_INVALID');
  if (typeof payload.context !== 'string') errors.push('PAYLOAD_CONTEXT_INVALID');
  if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    errors.push('PAYLOAD_DATA_INVALID');
  }
  if (!Array.isArray(payload.constraints)) errors.push('PAYLOAD_CONSTRAINTS_INVALID');
}

function validateGovernance(value: unknown, errors: string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push('GOVERNANCE_INVALID');
    return;
  }

  const governance = value as Record<string, unknown>;
  if (governance.zte_cleared !== true) errors.push('ZTE_CLEARANCE_DENIED');
  for (const key of ['spe_chain_passed', 'legal_cleared', 'budget_cleared']) {
    if (typeof governance[key] !== 'boolean') errors.push(`GOVERNANCE_${key}_INVALID`);
  }
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const entry = (value as Record<string, unknown>)[key];
    if (entry !== undefined) sorted[key] = canonicalize(entry);
  }
  return sorted;
}

function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) return false;
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
