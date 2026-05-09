export interface ShellPolicyDecision {
  allowed: boolean;
  reason: string;
}

const DENIED_COMMANDS = new Set([
  'git',
  'npm',
  'yarn',
  'pnpm',
  'pip',
  'curl',
  'wget',
  'sh',
  'bash',
  'zsh',
  'fish',
  'python',
  'node',
  'rm',
  'del',
  'erase',
  'mkfs',
  'dd',
  'shutdown',
  'reboot',
  'killall',
  'sudo',
  'env',
  'chmod',
  'chown',
  'ln'
]);

const SAFE_READ_COMMANDS = new Set(['cat', 'grep', 'ls', 'head']);
const SAFE_PIPE_SINKS = new Set(['head', 'grep']); // H3: added grep for usability

const SENSITIVE_PATTERNS = [
  '/etc/',
  '/var/',
  '/root/',
  '.ssh/',
  '.env',
  'config/vault',
  'SOVEREIGN_MASTER_KEYS'
];

export class ShellPolicy {
  evaluate(command: string): ShellPolicyDecision {
    const normalized = command.trim();
    if (!normalized) return deny('EMPTY_COMMAND');
    
    // CR1: Added \n to chain detection
    if (/[;&\n]/.test(normalized)) return deny('SHELL_CHAIN_DENIED');
    
    // CR2: Block command substitution
    if (/[`$]\(/.test(normalized)) return deny('COMMAND_SUBSTITUTION_DENIED');
    
    // Basic redirection check
    if (/>/.test(normalized)) return deny('SHELL_WRITE_REDIRECT_DENIED');
    
    // CR3: Path traversal and sensitive path check
    if (/\.\./.test(normalized)) return deny('PATH_TRAVERSAL_DENIED');
    for (const pattern of SENSITIVE_PATTERNS) {
      if (normalized.includes(pattern)) return deny(`SENSITIVE_PATH_DENIED_${pattern}`);
    }

    const pipeParts = normalized.split('|').map(part => part.trim());
    if (pipeParts.length > 1) return this.evaluatePipe(pipeParts);

    const commandName = getCommandName(normalized);
    if (DENIED_COMMANDS.has(commandName)) return deny(`COMMAND_DENIED_${commandName}`);
    if (!SAFE_READ_COMMANDS.has(commandName)) return deny(`COMMAND_NOT_ALLOWLISTED_${commandName}`);

    // M1: Runtime contract assertion (logic-only, execution layer must enforce)
    return allow('SAFE_READ_COMMAND_CONTRACT_CWD_PATH_ENFORCED');
  }

  private evaluatePipe(parts: string[]): ShellPolicyDecision {
    if (parts.length !== 2) return deny('PIPE_COMPLEXITY_DENIED');

    const source = getCommandName(parts[0] ?? '');
    const sink = getCommandName(parts[1] ?? '');

    // L2: Distinguish between source and sink issues
    if (DENIED_COMMANDS.has(source)) return deny(`PIPE_SOURCE_COMMAND_DENIED_${source}`);
    if (DENIED_COMMANDS.has(sink)) return deny(`PIPE_SINK_COMMAND_DENIED_${sink}`);

    if (!SAFE_READ_COMMANDS.has(source)) return deny(`PIPE_SOURCE_NOT_ALLOWLISTED_${source}`);
    if (!SAFE_PIPE_SINKS.has(sink)) return deny(`PIPE_SINK_NOT_ALLOWLISTED_${sink}`);

    return allow('SAFE_READ_ONLY_PIPE');
  }
}

function getCommandName(command: string): string {
  const firstPart = command.trim().split(/\s+/)[0] ?? '';
  // H1: Extract basename to handle absolute paths correctly
  const pathParts = firstPart.split(/[\\/]/);
  return (pathParts[pathParts.length - 1] ?? '').toLowerCase();
}

function allow(reason: string): ShellPolicyDecision {
  return { allowed: true, reason };
}

function deny(reason: string): ShellPolicyDecision {
  return { allowed: false, reason };
}
