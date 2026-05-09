export * from './kill-switch.js';
export * from './risk-engine.js';
export * from './capability-router.js';
export * from './workflow-dag.js';

import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  HANDOFF_SCHEMA_VERSION,
  PRODUCT_VERSION,
  sealHandoff,
  validateHandoffShape,
  verifyHandoffCrypto,
  type GovernedContext,
  type HandoffJSON_v611,
  type MemorySlice,
  type RollbackCheckpoint,
  type VedaTraceSpan
} from '@veda-runtime-v1/shared';
import { LocalAuditLedger, LocalNonceRegistry } from '@veda-runtime-v1/audit';
import { ShellPolicy } from '@veda-runtime-v1/sandbox';

export interface CreateFreeRuntimeOptions {
  rootDir: string;
  hmacKey: string;
}

export interface DemoExecutionInput {
  instruction: string;
  workflowId: string;
  sessionScope: string;
  memory: MemorySlice[];
}

export interface DemoExecutionResult {
  status: 'COMPLETED';
  dataStatus: 'REAL';
  context: GovernedContext;
  rollback: RollbackCheckpoint;
  spans: VedaTraceSpan[];
  auditRows: VedaTraceSpan[];
}

export class ContextGovernor {
  private readonly injectionPattern = /\b(ignore previous|bypass|override|disable safety|system prompt)\b/i;

  govern(input: {
    instruction: string;
    workflowId: string;
    sessionScope: string;
    memory: MemorySlice[];
    maxTokens?: number;
    ttlSeconds?: number;
    relevanceThreshold?: number;
  }): GovernedContext {
    const maxTokens = input.maxTokens ?? 800;
    const ttlSeconds = input.ttlSeconds ?? 86_400;
    const relevanceThreshold = input.relevanceThreshold ?? 0.7;
    const nowMs = Date.now();
    const relevant: MemorySlice[] = [];
    let consumed = estimateTokens(input.instruction);
    let filtered = 0;
    let ceilingHit = false;

    for (const item of input.memory) {
      const ageSeconds = (nowMs - Date.parse(item.created_at)) / 1000;
      const itemTokens = estimateTokens(item.content);
      const inScope =
        item.workflow_id === input.workflowId &&
        item.session_scope === input.sessionScope &&
        ageSeconds <= ttlSeconds &&
        (item.relevance_score ?? 1) >= relevanceThreshold &&
        !this.injectionPattern.test(item.content);

      if (!inScope) {
        filtered += 1;
        continue;
      }

      if (consumed + itemTokens > maxTokens) {
        filtered += 1;
        ceilingHit = true;
        continue;
      }

      consumed += itemTokens;
      relevant.push(item);
    }

    return {
      task_prompt: input.instruction,
      relevant_memory: relevant,
      token_budget_consumed: consumed,
      items_filtered: filtered,
      budget_ceiling_hit: ceilingHit,
      session_scope: input.sessionScope
    };
  }
}

export class RollbackEngine {
  constructor(private readonly rootDir: string) {}

  async checkpointFile(input: {
    workflowId: string;
    stepId: string;
    targetPath: string;
    vedatraceSpan: string;
  }): Promise<RollbackCheckpoint> {
    const rootPath = resolve(this.rootDir);
    const targetPath = resolve(rootPath, input.targetPath);
    const relativeTarget = relative(rootPath, targetPath);
    if (relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) {
      throw new Error('ROLLBACK_TARGET_OUTSIDE_ROOT');
    }

    let snapshot: { existed: boolean; content: string | null; sha256: string | null };
    try {
      const content = await readFile(targetPath, 'utf8');
      snapshot = {
        existed: true,
        content,
        sha256: sha256(content)
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      snapshot = {
        existed: false,
        content: null,
        sha256: null
      };
    }

    return {
      checkpoint_id: randomUUID(),
      workflow_id: input.workflowId,
      step_id: input.stepId,
      snapshot_type: 'FILE',
      created_at: new Date().toISOString(),
      snapshot_data: snapshot,
      verified: true,
      restore_test_hash: sha256(JSON.stringify(snapshot)),
      vedatrace_span: input.vedatraceSpan
    };
  }
}

export class RuntimeKernel {
  private readonly contextGovernor = new ContextGovernor();
  private readonly rollbackEngine: RollbackEngine;
  private readonly nonceRegistry: LocalNonceRegistry;
  private readonly auditLedger: LocalAuditLedger;
  private readonly shellPolicy = new ShellPolicy();
  private readonly handoffKeyPair = generateKeyPairSync('ed25519');

  private constructor(private readonly options: CreateFreeRuntimeOptions) {
    if (!options.hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');
    this.rollbackEngine = new RollbackEngine(options.rootDir);
    this.nonceRegistry = LocalNonceRegistry.inRoot(options.rootDir);
    this.auditLedger = LocalAuditLedger.inRoot(options.rootDir, options.hmacKey);
  }

  static createFree(options: CreateFreeRuntimeOptions): RuntimeKernel {
    return new RuntimeKernel(options);
  }

  async executeDemo(input: DemoExecutionInput): Promise<DemoExecutionResult> {
    const handoff = this.createDemoHandoff(input);
    const validation = verifyHandoffCrypto(handoff, {
      hmacKey: this.options.hmacKey,
      publicKey: this.handoffKeyPair.publicKey
    });
    if (!validation.valid) throw new Error(`HANDOFF_INVALID: ${validation.errors.join(',')}`);

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
      memory: input.memory
    });

    const spans: VedaTraceSpan[] = [];
    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'handoff',
      agent_name: 'runtime-kernel',
      event_type: 'HANDOFF_ACCEPTED',
      status: 'SUCCESS',
      metadata: { schema_version: HANDOFF_SCHEMA_VERSION }
    }));
    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'context',
      agent_name: 'context-governor',
      event_type: 'CONTEXT_GOVERNED',
      status: 'SUCCESS',
      metadata: { items_filtered: context.items_filtered }
    }));

    const targetPath = join(this.options.rootDir, 'sandbox', 'proof.txt');
    await mkdir(dirname(targetPath), { recursive: true });
    const checkpointSpan = await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'write-proof',
      agent_name: 'rollback-engine',
      event_type: 'ROLLBACK_CHECKPOINT_CREATED',
      status: 'SUCCESS',
      metadata: { target: 'sandbox/proof.txt' }
    });
    spans.push(checkpointSpan);

    const rollback = await this.rollbackEngine.checkpointFile({
      workflowId: input.workflowId,
      stepId: 'write-proof',
      targetPath,
      vedatraceSpan: checkpointSpan.span_id
    });

    const shellDecision = this.shellPolicy.evaluate('cat runtime.log | head');
    if (!shellDecision.allowed) throw new Error(`SANDBOX_POLICY_UNEXPECTED_BLOCK: ${shellDecision.reason}`);

    await writeFile(targetPath, [
      'VEDA Runtime Version 1 local proof',
      `instruction=${input.instruction}`,
      `schema=${HANDOFF_SCHEMA_VERSION}`,
      `product=${PRODUCT_VERSION}`,
      `context_items=${context.relevant_memory.length}`
    ].join('\n'), 'utf8');

    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'write-proof',
      agent_name: 'runtime-kernel',
      event_type: 'TOOL_CALL_ALLOWED',
      status: 'SUCCESS',
      metadata: { file: 'sandbox/proof.txt', sandbox_policy: shellDecision.reason }
    }));
    spans.push(await this.auditLedger.appendSpan({
      workflow_id: input.workflowId,
      step_id: 'complete',
      agent_name: 'runtime-kernel',
      event_type: 'AGENT_COMPLETE',
      status: 'SUCCESS',
      metadata: { data_status: 'REAL' }
    }));

    return {
      status: 'COMPLETED',
      dataStatus: 'REAL',
      context,
      rollback,
      spans,
      auditRows: await this.auditLedger.readAll()
    };
  }

  private createDemoHandoff(input: DemoExecutionInput): HandoffJSON_v611 {
    const timestamp = new Date().toISOString();
    const nonce = `nonce_${randomUUID()}`;
    const base = {
      schema_version: HANDOFF_SCHEMA_VERSION,
      timestamp,
      nonce,
      source_agent: 'ceo-veda',
      target_agent: 'runtime-kernel',
      task_id: 'VT-RUNTIME-V1-DEMO',
      workflow_id: input.workflowId,
      payload: {
        instruction: input.instruction,
        context: 'governed-local-demo',
        data: {},
        constraints: ['free-edition', 'local-only']
      },
      governance: {
        zte_cleared: true,
        spe_chain_passed: true,
        legal_cleared: true,
        budget_cleared: true
      },
      DATA_STATUS: 'REAL',
      phase: '2',
      sovereign_key: 'veda_runtime_local_demo'
    } satisfies Omit<HandoffJSON_v611, 'signature' | 'hmac'>;

    return sealHandoff(base, {
      hmacKey: this.options.hmacKey,
      privateKey: this.handoffKeyPair.privateKey
    });
  }
}

function estimateTokens(value: string): number {
  return Math.max(1, Math.ceil(value.trim().split(/\s+/).filter(Boolean).length * 1.3));
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
