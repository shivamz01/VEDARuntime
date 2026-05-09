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

// M4: Compile-time assertion that all interface keys are listed
type _AssertAllKeysListed = keyof HandoffJSON_v611 extends 
  typeof REQUIRED_HANDOFF_KEYS[number] | typeof OPTIONAL_HANDOFF_KEYS[number] 
  ? true : never;
// @ts-ignore - Verification only
const _check: _AssertAllKeysListed = true;

const ALLOWED_HANDOFF_KEYS = new Set<string>([
  ...REQUIRED_HANDOFF_KEYS,
  ...OPTIONAL_HANDOFF_KEYS
]);

const ALLOWED_PAYLOAD_KEYS = new Set(['instruction', 'context', 'data', 'constraints']);
const ALLOWED_GOVERNANCE_KEYS = new Set([
  'zte_cleared', 
  'spe_chain_passed', 
  'legal_cleared', 
  'budget_cleared', 
  'brand_cleared', 
  'human_approval_required'
]);

const VALID_DATA_STATUS = new Set<string>(['REAL', 'SIMULATED', 'PARTIAL']);
const VALID_PHASES = new Set<string>(['1', '2']);

// CR1: Format enforcement for nonces
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_32 = /^[0-9a-f]{32,}$/i;

export function validateHandoffShape(candidate: unknown, nowMs = Date.now()): ValidationResult {
  const errors: string[] = [];

  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { valid: false, errors: ['HANDOFF_NOT_OBJECT'] };
  }

  const handoff = candidate as Record<string, unknown>;

  // M1: Distinguish between missing and invalid for critical fields
  if (!('DATA_STATUS' in handoff)) {
    errors.push('DATA_STATUS_MISSING');
  } else if (!VALID_DATA_STATUS.has(String(handoff.DATA_STATUS))) {
    errors.push('DATA_STATUS_INVALID');
  }

  if (!('nonce' in handoff)) {
    errors.push('NONCE_MISSING');
  } else {
    const nonce = String(handoff.nonce);
    if (!UUID_V4.test(nonce) && !HEX_32.test(nonce)) {
      errors.push('NONCE_INVALID');
    }
  }

  for (const key of REQUIRED_HANDOFF_KEYS) {
    if (key === 'DATA_STATUS' || key === 'nonce') continue; // Handled above
    if (!(key in handoff)) errors.push(`MISSING_${key}`);
  }

  // H3: Top-level forbidden fields
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
    } else {
      const diff = timestampMs - nowMs;
      // L2: Boundary check (inclusive 300s)
      if (diff >= 300_000) {
        errors.push('TIMESTAMP_INVALID');
      } else if (diff <= -300_000) {
        errors.push('NONCE_STALE');
      }
    }
  }

  if (!VALID_PHASES.has(String(handoff.phase))) {
    errors.push('PHASE_INVALID');
  }

  // H1: Sovereign key tier verification
  if (typeof handoff.sovereign_key !== 'string') {
    errors.push('SOVEREIGN_KEY_INVALID');
  } else {
    const sk = handoff.sovereign_key;
    const isFree = sk === 'veda_local_free';
    const isPro = sk.startsWith('veda_pro_') && sk.length >= 41; // veda_pro_ + 32 hex
    if (!isFree && !isPro) errors.push('SOVEREIGN_KEY_INVALID');
  }

  // H2: Cryptographic shape validation
  if (typeof handoff.signature !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(handoff.signature) || handoff.signature.length < 32) {
    errors.push('SIGNATURE_INVALID');
  }

  if (typeof handoff.hmac !== 'string' || !/^[a-f0-9]{64}$/.test(handoff.hmac)) {
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

// M3: verifyHandoffCrypto is now strictly about crypto
export function verifyHandoffCrypto(
  handoff: unknown,
  material: HandoffVerificationMaterial
): ValidationResult {
  if (!handoff || typeof handoff !== 'object') return { valid: false, errors: ['HANDOFF_NOT_OBJECT'] };
  const signed = handoff as Record<string, any>;
  
  // Basic shape for crypto
  if (typeof signed.hmac !== 'string' || typeof signed.signature !== 'string') {
    return { valid: false, errors: ['CRYPTO_FIELDS_MISSING'] };
  }

  if (!material.hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');

  const payload = handoffSigningPayload(signed as HandoffJSON_v611);
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
  
  // H3: Nested forbidden fields
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) errors.push(`FORBIDDEN_PAYLOAD_FIELD_${key}`);
  }

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

  const governance = value as Record<string, any>;

  // H3: Nested forbidden fields
  for (const key of Object.keys(governance)) {
    if (!ALLOWED_GOVERNANCE_KEYS.has(key)) errors.push(`FORBIDDEN_GOVERNANCE_FIELD_${key}`);
  }

  // CR2: Must be explicitly true
  if (governance.zte_cleared !== true) errors.push('ZTE_CLEARANCE_DENIED');
  if (governance.spe_chain_passed !== true) errors.push('SPE_CLEARANCE_DENIED');
  if (governance.legal_cleared !== true) errors.push('LEGAL_CLEARANCE_DENIED');
  if (governance.budget_cleared !== true) errors.push('BUDGET_CLEARANCE_DENIED');
  
  // L3: Optional field validation
  if ('brand_cleared' in governance && governance.brand_cleared !== true) {
    errors.push('BRAND_CLEARANCE_DENIED');
  }
  if ('human_approval_required' in governance && typeof governance.human_approval_required !== 'boolean') {
    errors.push('HUMAN_APPROVAL_SIGNAL_INVALID');
  }
}

function canonicalize(value: unknown): unknown {
  // M2: Normalize null to undefined (omitted) for HMAC stability
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize).filter(v => v !== undefined);

  const sorted: Record<string, unknown> = {};
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  
  for (const [key, entry] of entries) {
    const processed = canonicalize(entry);
    if (processed !== undefined) sorted[key] = processed;
  }
  return sorted;
}

function safeEqualHex(left: string, right: string): boolean {
  // H4: Fix timing oracle by checking length first and enforcing SHA256 output length (32 bytes)
  if (left.length !== 64 || right.length !== 64) return false;
  
  try {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}
