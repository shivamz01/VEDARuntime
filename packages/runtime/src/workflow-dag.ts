import type { FSMState } from '@veda-runtime-v1/shared';

export interface WorkflowStep {
  id: string;
  name: string;
  dependencies: string[];
  state: FSMState;
  retryCount: number;
  maxRetries: number;
}

export class WorkflowDAG {
  private steps: Map<string, WorkflowStep> = new Map();
  private readonly workflowId: string;

  constructor(workflowId: string) {
    this.workflowId = workflowId;
  }

  addStep(step: Omit<WorkflowStep, 'state' | 'retryCount'>): void {
    if (this.steps.has(step.id)) throw new Error(`DUPLICATE_STEP_ID: ${step.id}`);
    
    // Verify dependencies exist (forward references allowed if added later, but validated on start)
    this.steps.set(step.id, {
      ...step,
      state: 'PENDING',
      retryCount: 0
    });
  }

  getExecutableSteps(limit: number = Infinity): WorkflowStep[] {
    const executable: WorkflowStep[] = [];
    
    for (const step of this.steps.values()) {
      if (executable.length >= limit) break;
      if (step.state !== 'PENDING' && step.state !== 'FAILED') continue;
      if (step.state === 'FAILED' && step.retryCount >= step.maxRetries) continue;

      const depsMet = step.dependencies.every(depId => {
        const dep = this.steps.get(depId);
        return dep && dep.state === 'COMPLETED';
      });

      if (depsMet) {
        executable.push(step);
      }
    }

    return executable;
  }

  updateStepState(stepId: string, state: FSMState): void {
    const step = this.steps.get(stepId);
    if (!step) throw new Error(`UNKNOWN_STEP_ID: ${stepId}`);

    if (state === 'FAILED') {
      step.retryCount++;
    }
    step.state = state;
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
}
