import { EnvVars } from '../providers/types';

export type DriftSeverity = 'missing' | 'extra' | 'mismatch';

export interface DriftEntry {
  key: string;
  severity: DriftSeverity;
  stagingValue?: string;
  productionValue?: string;
  message: string;
}

export interface DriftReport {
  hasDrift: boolean;
  totalKeys: number;
  driftCount: number;
  entries: DriftEntry[];
  generatedAt: Date;
}

export function detectDrift(staging: EnvVars, production: EnvVars): DriftReport {
  const entries: DriftEntry[] = [];
  const allKeys = new Set([...Object.keys(staging), ...Object.keys(production)]);

  for (const key of allKeys) {
    const inStaging = key in staging;
    const inProduction = key in production;

    if (inStaging && !inProduction) {
      entries.push({
        key,
        severity: 'extra',
        stagingValue: staging[key],
        message: `Key "${key}" exists in staging but is missing in production`,
      });
    } else if (!inStaging && inProduction) {
      entries.push({
        key,
        severity: 'missing',
        productionValue: production[key],
        message: `Key "${key}" exists in production but is missing in staging`,
      });
    } else if (staging[key] !== production[key]) {
      entries.push({
        key,
        severity: 'mismatch',
        stagingValue: staging[key],
        productionValue: production[key],
        message: `Key "${key}" has different values between staging and production`,
      });
    }
  }

  return {
    hasDrift: entries.length > 0,
    totalKeys: allKeys.size,
    driftCount: entries.length,
    entries,
    generatedAt: new Date(),
  };
}
