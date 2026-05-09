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

  if (method === 'GET' && url.pathname === '/api/status') {
    writeJson(response, 200, createStatusPayload());
    return;
  }

  if (method === 'POST' && url.pathname === '/api/demo/free') {
    writeJson(response, 200, await createFreeDemoPayload());
    return;
  }

  if (method === 'GET' && url.pathname === '/health') {
    writeJson(response, 200, { ok: true });
    return;
  }

  writeJson(response, 404, { error: 'NOT_FOUND' });
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': resolveCorsOrigin()
  });
  response.end(JSON.stringify(body, null, 2));
}

export function resolveCorsOrigin(env = process.env): string {
  return env.VEDA_API_CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN;
}

export function resolveRuntimeHmacKey(env = process.env): string {
  const configured = env.VEDA_HMAC_KEY?.trim();
  if (configured) return configured;

  if (env.VEDA_RUNTIME_MODE === 'production' || env.NODE_ENV === 'production') {
    throw new Error('VEDA_HMAC_KEY_REQUIRED');
  }

  return DEMO_HMAC_KEY;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3100);
  createApiServer().listen(port, () => {
    console.log(`VEDA Runtime Version 1 API listening on http://localhost:${port}`);
  });
}
