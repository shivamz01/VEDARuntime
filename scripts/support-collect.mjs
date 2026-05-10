import { execFile } from 'node:child_process';
import { readdir, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const DEFAULT_ENV_KEYS = [
  'VEDA_HMAC_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'VEDA_LICENSE_SECRET',
  'VEDA_LICENSE_KEY'
];

export function getEnvPresence(env = process.env, keys = DEFAULT_ENV_KEYS) {
  return Object.fromEntries(
    keys.map(key => [key, typeof env[key] === 'string' && env[key].trim().length > 0])
  );
}

export async function readLatestPipelineArtifacts(logsDir, limit = 5) {
  let entries;
  try {
    entries = await readdir(logsDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const candidates = await Promise.all(
    entries
      .filter(entry => entry.isFile() && /^pipeline-.+\.json$/i.test(entry.name))
      .map(async entry => {
        const artifactPath = join(logsDir, entry.name);
        const metadata = await stat(artifactPath);
        return { artifactPath, fileName: entry.name, modifiedAtMs: metadata.mtimeMs };
      })
  );

  const latest = candidates
    .sort((left, right) => right.modifiedAtMs - left.modifiedAtMs)
    .slice(0, limit);

  const summaries = [];
  for (const candidate of latest) {
    const artifact = await readJson(candidate.artifactPath);
    if (!artifact) {
      continue;
    }

    summaries.push({
      fileName: candidate.fileName,
      pipeline: artifact.pipeline ?? null,
      status: artifact.status ?? null,
      failedStep: artifact.failedStep ?? null,
      startedAt: artifact.startedAt ?? null,
      completedAt: artifact.completedAt ?? artifact.endedAt ?? null,
      steps: Array.isArray(artifact.steps)
        ? artifact.steps.map(step => ({
            id: step.id ?? null,
            name: step.name ?? null,
            status: step.status ?? null,
            exitCode: Number.isInteger(step.exitCode) ? step.exitCode : null
          }))
        : []
    });
  }

  return summaries;
}

export async function readLatestProVerificationArtifacts(logsDir, limit = 3) {
  let entries;
  try {
    entries = await readdir(logsDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const candidates = await Promise.all(
    entries
      .filter(entry =>
        entry.isFile() &&
        /^(pro-verify|paid-supabase-smoke|pro-smoke).+\.json$/i.test(entry.name)
      )
      .map(async entry => {
        const artifactPath = join(logsDir, entry.name);
        const metadata = await stat(artifactPath);
        return { artifactPath, fileName: entry.name, modifiedAtMs: metadata.mtimeMs };
      })
  );

  const latest = candidates
    .sort((left, right) => right.modifiedAtMs - left.modifiedAtMs)
    .slice(0, limit);

  const summaries = [];
  for (const candidate of latest) {
    const artifact = await readJson(candidate.artifactPath);
    if (!artifact) {
      continue;
    }

    summaries.push({
      fileName: candidate.fileName,
      status: artifact.status ?? null,
      supabase: artifact.supabase ?? null,
      workflowId: artifact.workflowId ?? null,
      nonceInserted: artifact.nonceInserted ?? null,
      auditSpanCount: Number.isInteger(artifact.auditSpanCount) ? artifact.auditSpanCount : null,
      pipelineLogWritten: artifact.pipelineLogWritten ?? null,
      auditBundleValid: artifact.auditBundleValid ?? null,
      rollbackVerified: artifact.rollbackVerified ?? null
    });
  }

  return summaries;
}

export async function collectSupportBundle(options = {}) {
  const cwd = resolve(options.cwd ?? REPO_ROOT);
  const artifactDir = resolve(options.artifactDir ?? join(cwd, 'logs'));
  const env = options.env ?? process.env;
  const commandRunner = options.commandRunner ?? defaultCommandRunner;
  const nowValue = typeof options.now === 'function' ? options.now() : options.now;
  const generatedAt = (nowValue instanceof Date ? nowValue : new Date()).toISOString();

  await mkdir(artifactDir, { recursive: true });

  const packageJson = (await readJson(join(cwd, 'package.json'))) ?? {};
  const logsDir = join(cwd, 'logs');

  const pipelineArtifacts = await readLatestPipelineArtifacts(logsDir);
  const proVerificationArtifacts = await readLatestProVerificationArtifacts(logsDir);

  const nodeVersion = await runOptional(commandRunner, 'node', ['--version'], cwd);
  const npmVersion = await runOptional(commandRunner, 'npm', ['--version'], cwd);
  const gitCommit = await runOptional(commandRunner, 'git', ['rev-parse', '--short', 'HEAD'], cwd);
  const gitBranch = await runOptional(commandRunner, 'git', ['rev-parse', '--abbrev-ref', 'HEAD'], cwd);

  const envPresence = getEnvPresence(env);
  const latestProArtifact = proVerificationArtifacts[0] ?? null;

  const bundle = {
    product: 'VEDA Runtime Version 1',
    generatedAt,
    project: {
      directory: basename(cwd),
      name: packageJson.name ?? null,
      version: packageJson.version ?? null,
      private: packageJson.private ?? null,
      license: packageJson.license ?? null
    },
    environment: {
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      nodeVersion,
      npmVersion,
      gitCommit,
      gitBranch,
      envPresence
    },
    scripts: packageJson.scripts ?? {},
    pipelineArtifacts,
    proVerificationArtifacts,
    proVerification: {
      evidenceLevel: latestProArtifact ? 'LOCAL_ARTIFACT_SUMMARY' : 'ENVIRONMENT_PRESENCE_ONLY',
      realSupabaseVerifiedByBundle: false,
      note: latestProArtifact
        ? 'This bundle found a local Pro verification artifact summary. It still does not query Supabase or expose secrets.'
        : 'This bundle does not run pro:verify and does not query Supabase. It records only whether Pro-related environment variables are present.',
      supabaseEnvConfigured: Boolean(envPresence.SUPABASE_URL && envPresence.SUPABASE_SERVICE_KEY),
      hmacWired: Boolean(envPresence.VEDA_HMAC_KEY),
      licenseSecretWired: Boolean(envPresence.VEDA_LICENSE_SECRET),
      licenseKeyWired: Boolean(envPresence.VEDA_LICENSE_KEY),
      latestLocalProArtifact: latestProArtifact
    },
    supportBoundary: {
      includesSecrets: false,
      includesCustomerData: false,
      note: 'This bundle intentionally records only environment key presence and artifact summaries, never environment values.'
    }
  };

  const artifactPath = join(artifactDir, `support-bundle-${safeTimestamp(generatedAt)}.json`);
  await writeFile(artifactPath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');

  return { bundle, artifactPath };
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    return null;
  }
}

async function runOptional(commandRunner, command, args, cwd) {
  try {
    const value = await commandRunner(command, args, cwd);
    return String(value ?? '').trim() || null;
  } catch {
    return null;
  }
}

function defaultCommandRunner(command, args, cwd) {
  return new Promise((resolveRunner, rejectRunner) => {
    execFile(
      command,
      args,
      {
        cwd,
        shell: false,
        windowsHide: true,
        timeout: 10_000
      },
      (error, stdout, stderr) => {
        if (error) {
          rejectRunner(new Error(stderr || error.message));
          return;
        }

        resolveRunner(stdout);
      }
    );
  });
}

function safeTimestamp(value) {
  return value.replace(/[:.]/g, '-');
}

function printUsage() {
  console.log('Usage: node scripts/support-collect.mjs');
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  collectSupportBundle()
    .then(({ bundle, artifactPath }) => {
      console.log(JSON.stringify({
        status: 'created',
        artifactPath,
        project: bundle.project,
        envPresence: bundle.environment.envPresence,
        proVerification: bundle.proVerification,
        pipelineArtifactCount: bundle.pipelineArtifacts.length,
        proVerificationArtifactCount: bundle.proVerificationArtifacts.length
      }, null, 2));
    })
    .catch(error => {
      console.error(error.stack ?? String(error));
      process.exit(1);
    });
}