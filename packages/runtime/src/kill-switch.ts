export interface KillSwitchState {
  active: boolean;
  reason?: string;
  activatedAt?: string;
  activatedBy?: string;
}

export class KillSwitch {
  private state: KillSwitchState = { active: false };

  // In a real system, this would read from Redis, etcd, or a locked local file.
  // For the runtime, we provide an immediate memory halt mechanism.
  
  activate(reason: string, activatedBy: string = 'SYSTEM'): void {
    this.state = {
      active: true,
      reason,
      activatedAt: new Date().toISOString(),
      activatedBy
    };
  }

  deactivate(): void {
    this.state = { active: false };
  }

  check(): void {
    if (this.state.active) {
      throw new Error(`KILL_SWITCH_ACTIVE: Execution halted. Reason: ${this.state.reason}`);
    }
  }

  isActive(): boolean {
    return this.state.active;
  }
}
