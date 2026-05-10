import type { FSMState } from '@veda-runtime-v1/shared';

export interface WorkflowStep {
  id: string;
  name: string;
  dependencies: string[];
  state: FSMState;
  retryCount: number;
  maxRetries: number;
}

export interface WorkflowDAGValidationResult {
  valid: boolean;
  errors: string[];
}

const TERMINAL_STATES: ReadonlySet<FSMState> = new Set(['COMPLETED']);

const ALLOWED_TRANSITIONS: ReadonlyMap<FSMState, ReadonlySet<FSMState>> = new Map<FSMState, ReadonlySet<FSMState>>([
  ['PENDING', new Set(['QUEUED', 'RUNNING', 'BLOCKED', 'FAILED'])],
  ['QUEUED', new Set(['RUNNING', 'BLOCKED', 'FAILED'])],
  ['RUNNING', new Set(['COMPLETED', 'BLOCKED', 'FAILED'])],
  ['BLOCKED', new Set(['QUEUED', 'RUNNING', 'FAILED'])],
  ['FAILED', new Set(['QUEUED', 'RUNNING', 'BLOCKED'])],
  ['COMPLETED', new Set([])]
]);

export class WorkflowDAG {
  private steps: Map<string, WorkflowStep> = new Map();
  private readonly workflowId: string;

  constructor(workflowId: string) {
    if (!workflowId || workflowId.trim() === '') {
      throw new Error('WORKFLOW_ID_INVALID');
    }

    this.workflowId = workflowId;
  }

  getWorkflowId(): string {
    return this.workflowId;
  }

  addStep(step: Omit<WorkflowStep, 'state' | 'retryCount'>): void {
    if (!step.id || step.id.trim() === '') {
      throw new Error('STEP_ID_INVALID');
    }

    if (!step.name || step.name.trim() === '') {
      throw new Error(`STEP_NAME_INVALID: ${step.id}`);
    }

    if (this.steps.has(step.id)) {
      throw new Error(`DUPLICATE_STEP_ID: ${step.id}`);
    }

    if (!Array.isArray(step.dependencies)) {
      throw new Error(`STEP_DEPENDENCIES_INVALID: ${step.id}`);
    }

    if (!Number.isInteger(step.maxRetries) || step.maxRetries < 0) {
      throw new Error(`INVALID_MAX_RETRIES: ${step.id}`);
    }

    if (step.dependencies.includes(step.id)) {
      throw new Error(`SELF_DEPENDENCY: ${step.id}`);
    }

    this.steps.set(step.id, {
      id: step.id,
      name: step.name,
      dependencies: [...step.dependencies],
      maxRetries: step.maxRetries,
      state: 'PENDING',
      retryCount: 0
    });
  }

  validate(): WorkflowDAGValidationResult {
    const errors: string[] = [];

    for (const step of this.steps.values()) {
      if (!step.id || step.id.trim() === '') {
        errors.push('STEP_ID_INVALID');
      }

      if (!step.name || step.name.trim() === '') {
        errors.push(`STEP_NAME_INVALID: ${step.id}`);
      }

      if (!Number.isInteger(step.maxRetries) || step.maxRetries < 0) {
        errors.push(`INVALID_MAX_RETRIES: ${step.id}`);
      }

      for (const dependencyId of step.dependencies) {
        if (dependencyId === step.id) {
          errors.push(`SELF_DEPENDENCY: ${step.id}`);
        }

        if (!this.steps.has(dependencyId)) {
          errors.push(`UNKNOWN_DEPENDENCY: ${step.id}->${dependencyId}`);
        }
      }
    }

    const cycle = this.detectCycle();

    if (cycle.length > 0) {
      errors.push(`CYCLE_DETECTED: ${cycle.join('->')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  assertValid(): void {
    const result = this.validate();

    if (!result.valid) {
      throw new Error(`WORKFLOW_DAG_INVALID: ${result.errors.join(',')}`);
    }
  }

  getExecutableSteps(limit: number = Number.MAX_SAFE_INTEGER): WorkflowStep[] {
    const safeLimit = normalizeLimit(limit);

    if (safeLimit === 0) {
      return [];
    }

    const executable: WorkflowStep[] = [];

    for (const step of this.steps.values()) {
      if (executable.length >= safeLimit) break;

      if (TERMINAL_STATES.has(step.state)) continue;
      if (step.state !== 'PENDING' && step.state !== 'FAILED') continue;
      if (step.state === 'FAILED' && step.retryCount >= step.maxRetries) continue;

      const depsMet = step.dependencies.every(depId => {
        const dep = this.steps.get(depId);
        return dep && dep.state === 'COMPLETED';
      });

      if (depsMet) {
        executable.push(cloneStep(step));
      }
    }

    return executable;
  }

  updateStepState(stepId: string, nextState: FSMState): void {
    const step = this.steps.get(stepId);

    if (!step) {
      throw new Error(`UNKNOWN_STEP_ID: ${stepId}`);
    }

    const currentState = step.state;

    if (currentState === nextState) {
      return;
    }

    if (!this.isTransitionAllowed(step, nextState)) {
      throw new Error(`INVALID_STATE_TRANSITION: ${stepId}:${currentState}->${nextState}`);
    }

    if (nextState === 'FAILED' && currentState !== 'FAILED') {
      step.retryCount += 1;
    }

    step.state = nextState;
  }

  getStep(stepId: string): WorkflowStep {
    const step = this.steps.get(stepId);

    if (!step) {
      throw new Error(`UNKNOWN_STEP_ID: ${stepId}`);
    }

    return cloneStep(step);
  }

  listSteps(): WorkflowStep[] {
    return [...this.steps.values()].map(cloneStep);
  }

  isComplete(): boolean {
    if (this.steps.size === 0) return true;

    for (const step of this.steps.values()) {
      if (step.state !== 'COMPLETED') return false;
    }

    return true;
  }

  hasFailedIrrecoverably(): boolean {
    for (const step of this.steps.values()) {
      if (step.state === 'FAILED' && step.retryCount >= step.maxRetries) {
        return true;
      }
    }

    return false;
  }

  private isTransitionAllowed(step: WorkflowStep, nextState: FSMState): boolean {
    const allowed = ALLOWED_TRANSITIONS.get(step.state);

    if (!allowed || !allowed.has(nextState)) {
      return false;
    }

    if (
      step.state === 'FAILED' &&
      (nextState === 'QUEUED' || nextState === 'RUNNING') &&
      step.retryCount >= step.maxRetries
    ) {
      return false;
    }

    return true;
  }

  private detectCycle(): string[] {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (stepId: string): string[] => {
      if (visiting.has(stepId)) {
        const cycleStartIndex = stack.indexOf(stepId);
        return [...stack.slice(cycleStartIndex), stepId];
      }

      if (visited.has(stepId)) {
        return [];
      }

      const step = this.steps.get(stepId);

      if (!step) {
        return [];
      }

      visiting.add(stepId);
      stack.push(stepId);

      for (const dependencyId of step.dependencies) {
        const cycle = visit(dependencyId);

        if (cycle.length > 0) {
          return cycle;
        }
      }

      stack.pop();
      visiting.delete(stepId);
      visited.add(stepId);

      return [];
    };

    for (const stepId of this.steps.keys()) {
      const cycle = visit(stepId);

      if (cycle.length > 0) {
        return cycle;
      }
    }

    return [];
  }
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.max(0, Math.floor(limit));
}

function cloneStep(step: WorkflowStep): WorkflowStep {
  return {
    ...step,
    dependencies: [...step.dependencies]
  };
}