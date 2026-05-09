import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const OUTPUT_TAIL_LIMIT = 4000;

const PIPELINES = {
  audit: {
    id: 'audit',
    name: 'Audit Proof Pipeline',
    description: 'Verifies handoff crypto, local audit continuity, paid audit bundles, and paid demo evidence.',
    externalWorkspaceRequired: false,
    steps: [
      step('build', 'Build all workspaces', ['npm', 'run', 'build']),
      step('audit-tests', 'Run audit and handoff contract tests', [
        'node',
        '--test',
        'tests/shared-contracts.test.mjs',
        'tests/audit-ledger.test.mjs',
        'tests/pro-audit.test.mjs'
      ]),
      step('paid-demo', 'Run paid proof demo', ['node', 'examples/paid-demo.mjs']),
      step('status', 'Print runtime status payload', ['node', 'scripts/status.mjs'])
    ]
  },
  proof: {
    id: 'proof',
    name: 'Local Proof Pipeline',
    description: 'Builds the runtime, runs the full contract suite, executes the free proof demo, and prints status.',
    externalWorkspaceRequired: false,
    steps: [
      step('build', 'Build all workspaces', ['npm', 'run', 'build']),
      step('contracts', 'Run all runtime contract tests', ['node', '--test', 'tests/*.test.mjs']),
      step('free-demo', 'Run free local proof demo', ['node', 'examples/free-demo.mjs']),
      step('status', 'Print runtime status payload', ['node', 'scripts/status.mjs'])
    ]
  },
  ship: {
    id: 'ship',
    name: 'Release Candidate Pipeline',
    description: 'Runs the full public release gate for build, contracts, free demo, paid demo, and status.',
    externalWorkspaceRequired: false,
    steps: [
      step('build', 'Build all workspaces', ['npm', 'run', 'build']),
      step('contracts', 'Run all runtime contract tests', ['node', '--test', 'tests/*.test.mjs']),
      step('free-demo', 'Run free local proof demo', ['node', 'examples/free-demo.mjs']),
      step('paid-demo', 'Run paid proof demo', ['node', 'examples/paid-demo.mjs']),
      step('status', 'Print runtime status payload', ['node', 'scripts/status.mjs'])
    ]
  }
};

function step(id, name, command) {
  return { id, name, command };
}

export function listPipelineNames() {
  return Object.keys(PIPELINES).sort();
}

export function getPipelineDefinition(name) {
  const pipeline = PIPELINES[name];
  if (!pipeline) {
    throw new Error(`Unknown pipeline "${name}". Known pipelines: ${listPipelineNames().join(', ')}`);
  }
  return pipeline;
}

export function resolveStepCommand(commandParts, options = {}) {
  const platform = options.platform ?? process.platform;
  const comspec = options.comspec ?? process.env.ComSpec ?? 'cmd.exe';
  const [rawCommand, ...args] = commandParts;

  if (platform === 'win32' && rawCommand === 'npm') {
    return {
      command: comspec,
      args: ['/d', '/s', '/c', 'npm', ...args]
    };
  }

  return { command: rawCommand, args };
}

export async function runPipeline(name, options = {}) {
  const pipeline = getPipelineDefinition(name);
  const cwd = options.cwd ?? REPO_ROOT;
  const artifactDir = options.artifactDir ?? join(cwd, 'logs');
  const now = options.now ?? (() => new Date());
  const executor = options.executor ?? ((pipelineStep) => executeStep(pipelineStep, cwd));
  const startedAt = now().toISOString();
  const stepResults = [];
  let status = 'COMPLETED';
  let failedStep = null;

  await mkdir(artifactDir, { recursive: true });

  for (const pipelineStep of pipeline.steps) {
    const result = await runStep(pipelineStep, executor);
    stepResults.push(result);

    if (result.exitCode !== 0) {
      status = 'FAILED';
      failedStep = pipelineStep.id;
      break;
    }
  }

  const completedAt = now().toISOString();
  const artifactPath = join(artifactDir, `pipeline-${pipeline.id}-${safeTimestamp(startedAt)}.json`);
  const summary = {
    product: 'VEDA Runtime Version 1',
    pipeline: pipeline.id,
    pipelineName: pipeline.name,
    status,
    failedStep,
    startedAt,
    completedAt,
    externalWorkspaceRequired: pipeline.externalWorkspaceRequired,
    steps: stepResults
  };

  await writeFile(artifactPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  return { ...summary, artifactPath };
}

async function runStep(pipelineStep, executor) {
  const result = await executor(pipelineStep);
  const exitCode = Number.isInteger(result.exitCode) ? result.exitCode : 1;

  return {
    id: pipelineStep.id,
    name: pipelineStep.name,
    command: pipelineStep.command,
    status: exitCode === 0 ? 'PASSED' : 'FAILED',
    exitCode,
    durationMs: result.durationMs ?? 0,
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr)
  };
}

function executeStep(pipelineStep, cwd) {
  const startedAt = Date.now();
  const { command, args } = resolveStepCommand(pipelineStep.command);

  return new Promise((resolveResult) => {
    let child;
    let stdout = '';
    let stderr = '';

    try {
      child = spawn(command, args, {
        cwd,
        env: process.env,
        shell: false,
        windowsHide: true
      });
    } catch (error) {
      resolveResult({
        exitCode: 1,
        stdout,
        stderr: error.stack ?? String(error),
        durationMs: Date.now() - startedAt
      });
      return;
    }

    child.stdout.on('data', chunk => {
      process.stdout.write(chunk);
      stdout += chunk;
    });
    child.stderr.on('data', chunk => {
      process.stderr.write(chunk);
      stderr += chunk;
    });
    child.on('error', error => {
      resolveResult({
        exitCode: 1,
        stdout,
        stderr: `${stderr}${stderr ? '\n' : ''}${error.stack ?? String(error)}`,
        durationMs: Date.now() - startedAt
      });
    });
    child.on('close', code => {
      resolveResult({
        exitCode: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt
      });
    });
  });
}

function safeTimestamp(value) {
  return value.replace(/[:.]/g, '-');
}

function tail(value) {
  const text = String(value ?? '');
  return text.length > OUTPUT_TAIL_LIMIT ? text.slice(-OUTPUT_TAIL_LIMIT) : text;
}

function printUsage() {
  console.log(`Usage: node scripts/pipeline.mjs <${listPipelineNames().join('|')}>`);
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const pipelineName = process.argv[2];

  if (!pipelineName || pipelineName === '--help' || pipelineName === '-h') {
    printUsage();
    process.exit(pipelineName ? 0 : 1);
  }

  runPipeline(pipelineName)
    .then(result => {
      console.log(JSON.stringify({
        pipeline: result.pipeline,
        status: result.status,
        failedStep: result.failedStep,
        artifactPath: result.artifactPath
      }, null, 2));
      process.exit(result.status === 'COMPLETED' ? 0 : 1);
    })
    .catch(error => {
      console.error(error.stack ?? String(error));
      process.exit(1);
    });
}
