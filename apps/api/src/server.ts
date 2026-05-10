import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getEditionFeatures, type FeatureId } from '@veda-runtime-v1/pro';
import { RuntimeKernel } from '@veda-runtime-v1/runtime';
import { HANDOFF_SCHEMA_VERSION, PRODUCT_VERSION } from '@veda-runtime-v1/shared';

export const DEFAULT_CORS_ORIGIN = 'http://localhost:3101';

const DEMO_HMAC_KEY = 'local_api_demo_hmac_key';
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
let lastRateLimitCleanupAt = 0;

export interface StatusPayload {
  product: 'VEDA Runtime Version 1';
  productVersion: typeof PRODUCT_VERSION;
  handoffSchemaVersion: typeof HANDOFF_SCHEMA_VERSION;
  freeFeatures: FeatureId[];
  paidFeatures: FeatureId[];
  sourceRepoMutated: false;
}

export function createStatusPayload(): StatusPayload {
  return {
    product: 'VEDA Runtime Version 1',
    productVersion: PRODUCT_VERSION,
    handoffSchemaVersion: HANDOFF_SCHEMA_VERSION,
    freeFeatures: getEditionFeatures('free').features,
    paidFeatures: getEditionFeatures('paid').features,
    sourceRepoMutated: false
  };
}

export async function createFreeDemoPayload(): Promise<Record<string, unknown>> {
  const rootDir = await mkdtemp(join(tmpdir(), 'veda-runtime-v1-api-'));
  const kernel = RuntimeKernel.createFree({
    rootDir,
    hmacKey: resolveRuntimeHmacKey()
  });

  const result = await kernel.executeDemo({
    instruction: 'Create a local API proof file.',
    workflowId: 'api-demo-workflow',
    sessionScope: 'api-demo-session',
    memory: [
      {
        id: 'api-demo-memory',
        workflow_id: 'api-demo-workflow',
        session_scope: 'api-demo-session',
        content: 'Run the free edition local proof path.',
        created_at: new Date().toISOString(),
        relevance_score: 0.95,
        source_type: 'USER'
      }
    ]
  });

  return {
    status: result.status,
    dataStatus: result.dataStatus,
    rootDir,
    spans: result.spans.length,
    auditRows: result.auditRows.length,
    rollbackVerified: result.rollback.verified
  };
}

export function createApiServer() {
  return createServer(async (request, response) => {
    try {
      await route(request, response);
    } catch (error) {
      writeJson(response, 500, {
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method ?? 'GET';
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (method === 'GET' && url.pathname === '/health') {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (method === 'OPTIONS') {
    const originDecision = validateProductionOrigin(request, url.pathname);
    if (!originDecision.allowed) {
      writeJson(response, 403, {
        error: originDecision.error,
        message: originDecision.message
      });
      return;
    }

    writeCorsPreflight(response);
    return;
  }

  const originDecision = validateProductionOrigin(request, url.pathname);
  if (!originDecision.allowed) {
    writeJson(response, 403, {
      error: originDecision.error,
      message: originDecision.message
    });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/status') {
    if (!checkRateLimit(getRateLimitKey(request, 'status'), 60, 60 * 1000)) {
      writeJson(response, 429, {
        error: 'TOO_MANY_REQUESTS',
        message: 'Status rate limit exceeded'
      });
      return;
    }

    writeJson(response, 200, createStatusPayload());
    return;
  }

  if (method === 'POST' && url.pathname === '/api/demo/free') {
    if (!checkRateLimit(getRateLimitKey(request, 'demo-free'), 5, 60 * 1000)) {
      writeJson(response, 429, {
        error: 'TOO_MANY_REQUESTS',
        message: 'Execution rate limit exceeded'
      });
      return;
    }

    writeJson(response, 200, await createFreeDemoPayload());
    return;
  }

  writeJson(response, 404, { error: 'NOT_FOUND' });
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  cleanupExpiredRateLimits(now);

  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

function cleanupExpiredRateLimits(now: number): void {
  if (now - lastRateLimitCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS) {
    return;
  }

  lastRateLimitCleanupAt = now;

  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key);
    }
  }
}

function getRateLimitKey(request: IncomingMessage, bucket: string): string {
  const ip = request.socket.remoteAddress || 'unknown';
  return `${bucket}:${ip}`;
}

function validateProductionOrigin(
  request: IncomingMessage,
  pathname: string
): { allowed: true } | { allowed: false; error: string; message: string } {
  if (!isProductionMode() || !requiresBrowserOrigin(pathname)) {
    return { allowed: true };
  }

  const origin = getSingleHeaderValue(request.headers.origin);
  const allowedOrigin = resolveCorsOrigin();

  if (!origin) {
    return {
      allowed: false,
      error: 'ORIGIN_REQUIRED',
      message: 'Missing Origin header in production'
    };
  }

  if (origin !== allowedOrigin) {
    return {
      allowed: false,
      error: 'ORIGIN_DENIED',
      message: 'Origin is not allowed'
    };
  }

  return { allowed: true };
}

function requiresBrowserOrigin(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function getSingleHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': resolveCorsOrigin(),
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'vary': 'Origin'
  });

  response.end(JSON.stringify(body, null, 2));
}

function writeCorsPreflight(response: ServerResponse): void {
  response.writeHead(204, {
    'access-control-allow-origin': resolveCorsOrigin(),
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '600',
    'vary': 'Origin'
  });

  response.end();
}

export function resolveCorsOrigin(env = process.env): string {
  const configured = env.VEDA_API_CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN;

  if (configured === '*') {
    throw new Error('VEDA_API_CORS_ORIGIN_WILDCARD_DENIED');
  }

  return configured;
}

export function resolveRuntimeHmacKey(env = process.env): string {
  const configured = env.VEDA_HMAC_KEY?.trim();
  if (configured) return configured;

  if (isProductionMode(env)) {
    throw new Error('VEDA_HMAC_KEY_REQUIRED');
  }

  return DEMO_HMAC_KEY;
}

function isProductionMode(env = process.env): boolean {
  return env.VEDA_RUNTIME_MODE === 'production' || env.NODE_ENV === 'production';
}

function validateStartupConfiguration(): void {
  resolveRuntimeHmacKey();
  resolveCorsOrigin();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3100);

  try {
    validateStartupConfiguration();
  } catch (error) {
    console.error(
      `FATAL: Startup validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  createApiServer().listen(port, () => {
    console.log(`VEDA Runtime Version 1 API listening on http://localhost:${port}`);
  });
}