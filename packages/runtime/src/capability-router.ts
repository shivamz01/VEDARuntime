export interface ProviderConfig {
  id: string;
  name: string;
  costPer1kTokens: number;
  maxLatencyMs: number;
  healthy: boolean;
}

export interface RoutingDecision {
  providerId: string;
  fallbackChain: string[];
  estimatedCost: number;
  latencyBudgetMs: number;
}

export class CapabilityRouter {
  private providers: Map<string, ProviderConfig> = new Map();

  registerProvider(config: ProviderConfig): void {
    this.providers.set(config.id, config);
  }

  setHealth(providerId: string, healthy: boolean): void {
    const p = this.providers.get(providerId);
    if (p) p.healthy = healthy;
  }

  routeRequest(estimatedTokens: number): RoutingDecision {
    const available = Array.from(this.providers.values()).filter(p => p.healthy);
    
    if (available.length === 0) {
      throw new Error('NO_HEALTHY_PROVIDERS: Capability routing failed. All providers are down.');
    }

    // Sort by cost ascending
    available.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);

    const primary = available[0]!;
    const fallbacks = available.slice(1).map(p => p.id);

    return {
      providerId: primary.id,
      fallbackChain: fallbacks,
      estimatedCost: (estimatedTokens / 1000) * primary.costPer1kTokens,
      latencyBudgetMs: primary.maxLatencyMs
    };
  }
}
