import type { RiskLevel } from '@veda-runtime-v1/shared';

export interface RiskAnalysis {
  level: RiskLevel;
  flags: string[];
  score: number; // 0-100
}

export class RiskEngine {
  private readonly highRiskPatterns = [
    /delete\s+from/i,
    /drop\s+table/i,
    /rm\s+-rf/i,
    /killall/i,
    /chmod\s+777/i,
    /grant\s+all\s+privileges/i
  ];

  private readonly mediumRiskPatterns = [
    /update\s+/i,
    /insert\s+into/i,
    /write\s+file/i,
    /fetch\s+/i,
    /curl\s+/i
  ];

  analyze(instruction: string, data: Record<string, unknown> = {}): RiskAnalysis {
    const flags: string[] = [];
    let score = 0;

    for (const pattern of this.highRiskPatterns) {
      if (pattern.test(instruction)) {
        flags.push(`HIGH_RISK_PATTERN: ${pattern.source}`);
        score += 40;
      }
    }

    for (const pattern of this.mediumRiskPatterns) {
      if (pattern.test(instruction)) {
        flags.push(`MEDIUM_RISK_PATTERN: ${pattern.source}`);
        score += 15;
      }
    }

    // Heuristics based on data payload
    if (Object.keys(data).length > 50) {
      flags.push('LARGE_DATA_PAYLOAD');
      score += 10;
    }

    let level: RiskLevel = 'LOW';
    if (score >= 80) level = 'CRITICAL';
    else if (score >= 40) level = 'HIGH';
    else if (score >= 15) level = 'MEDIUM';

    return { level, flags, score: Math.min(100, score) };
  }
}
