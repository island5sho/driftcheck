import { DriftReport, DriftEntry, DriftSeverity } from './detector';

const SEVERITY_ICONS: Record<DriftSeverity, string> = {
  missing: '✖',
  extra: '➕',
  mismatch: '⚠',
};

const SEVERITY_LABELS: Record<DriftSeverity, string> = {
  missing: 'MISSING IN STAGING',
  extra: 'MISSING IN PRODUCTION',
  mismatch: 'VALUE MISMATCH',
};

function formatEntry(entry: DriftEntry): string {
  const icon = SEVERITY_ICONS[entry.severity];
  const label = SEVERITY_LABELS[entry.severity];
  const lines = [`  ${icon} [${label}] ${entry.key}`];

  if (entry.severity === 'mismatch') {
    lines.push(`      staging:    ${entry.stagingValue}`);
    lines.push(`      production: ${entry.productionValue}`);
  } else if (entry.severity === 'extra') {
    lines.push(`      staging value: ${entry.stagingValue}`);
  } else if (entry.severity === 'missing') {
    lines.push(`      production value: ${entry.productionValue}`);
  }

  return lines.join('\n');
}

export function formatReport(report: DriftReport): string {
  const lines: string[] = [];
  lines.push('=== DriftCheck Report ===');
  lines.push(`Generated: ${report.generatedAt.toISOString()}`);
  lines.push(`Total keys: ${report.totalKeys} | Drift detected: ${report.driftCount}`);
  lines.push('');

  if (!report.hasDrift) {
    lines.push('✔ No drift detected. Staging and production are in sync.');
    return lines.join('\n');
  }

  lines.push('Drift entries:');
  for (const entry of report.entries) {
    lines.push(formatEntry(entry));
  }

  return lines.join('\n');
}

export function formatReportJson(report: DriftReport): string {
  return JSON.stringify(report, null, 2);
}
