import { createHmac, randomUUID } from 'node:crypto';
import { mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  canonicalStringify,
  type NonceRecord,
  type SpanStatus,
  type VedaTraceSpan
} from '@veda-runtime-v1/shared';

export class DuplicateNonceError extends Error {
  constructor(nonce: string) {
    super(`NONCE_REPLAY: ${nonce}`);
    this.name = 'DuplicateNonceError';
  }
}

export class LocalNonceRegistry {
  private readonly seen = new Set<string>();
  private loaded = false;

  constructor(private readonly filePath: string) {}

  static inRoot(rootDir: string): LocalNonceRegistry {
    return new LocalNonceRegistry(join(rootDir, '.veda-runtime', 'nonce_registry.jsonl'));
  }

  async insert(record: Omit<NonceRecord, 'consumed'> & { consumed?: boolean }): Promise<NonceRecord> {
    await this.load();
    if (this.seen.has(record.nonce)) throw new DuplicateNonceError(record.nonce);

    const stored: NonceRecord = {
      nonce: record.nonce,
      created_at: record.created_at,
      expires_at: record.expires_at,
      source_agent: record.source_agent,
      consumed: record.consumed ?? false,
      ...(record.workflow_id ? { workflow_id: record.workflow_id } : {})
    };

    await appendJsonLine(this.filePath, stored);
    this.seen.add(stored.nonce);
    return stored;
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const raw = await readFile(this.filePath, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line) as NonceRecord;
        this.seen.add(parsed.nonce);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

export interface AppendSpanInput {
  workflow_id: string;
  step_id?: string;
  agent_name: string;
  event_type: string;
  status: SpanStatus;
  metadata: Record<string, unknown>;
}

export class LocalAuditLedger {
  private lastHmac = 'GENESIS';
  private loaded = false;

  constructor(
    private readonly filePath: string,
    private readonly hmacKey: string
  ) {
    if (!hmacKey) throw new Error('VEDA_HMAC_KEY_REQUIRED');
  }

  static inRoot(rootDir: string, hmacKey: string): LocalAuditLedger {
    return new LocalAuditLedger(join(rootDir, '.veda-runtime', 'audit_ledger.jsonl'), hmacKey);
  }

  async appendSpan(input: AppendSpanInput): Promise<VedaTraceSpan> {
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
    await appendJsonLine(this.filePath, span);
    this.lastHmac = hmac;
    return span;
  }

  async readAll(): Promise<VedaTraceSpan[]> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      return raw
        .split(/\r?\n/)
        .filter(Boolean)
        .map(line => JSON.parse(line) as VedaTraceSpan);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  private async loadLastHmac(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const raw = await readFile(this.filePath, 'utf8');
      let last = 'GENESIS';
      for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line) as Partial<VedaTraceSpan>;
        if (typeof parsed.hmac !== 'string' || parsed.hmac.length === 0) {
          throw new Error('AUDIT_LEDGER_CORRUPT_MISSING_HMAC');
        }
        last = parsed.hmac;
      }
      this.lastHmac = last;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
}

async function appendJsonLine(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const handle = await open(filePath, 'a');
  try {
    await handle.write(`${JSON.stringify(value)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
}
