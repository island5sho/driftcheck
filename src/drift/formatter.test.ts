import { formatReport, formatReportJson } from './formatter';
import { DriftReport } from './detector';

function makeReport(overrides: Partial<DriftReport> = {}): DriftReport {
  return {
    hasDrift: false,
    totalKeys: 2,
    driftCount: 0,
    entries: [],
    generatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('formatReport', () => {
  it('shows no-drift message when envs are in sync', () => {
    const output = formatReport(makeReport());
    expect(output).toContain('No drift detected');
    expect(output).toContain('Total keys: 2');
  });

  it('includes the generated timestamp', () => {
    const output = formatReport(makeReport());
    expect(output).toContain('2024-01-01T00:00:00.000Z');
  });

  it('shows mismatch entry with both values', () => {
    const report = makeReport({
      hasDrift: true,
      driftCount: 1,
      entries: [{
        key: 'API_URL',
        severity: 'mismatch',
        stagingValue: 'https://staging.example.com',
        productionValue: 'https://api.example.com',
        message: 'mismatch',
      }],
    });
    const output = formatReport(report);
    expect(output).toContain('VALUE MISMATCH');
    expect(output).toContain('https://staging.example.com');
    expect(output).toContain('https://api.example.com');
  });

  it('shows extra entry for staging-only key', () => {
    const report = makeReport({
      hasDrift: true,
      driftCount: 1,
      entries: [{ key: 'DEBUG', severity: 'extra', stagingValue: 'true', message: '' }],
    });
    const output = formatReport(report);
    expect(output).toContain('MISSING IN PRODUCTION');
    expect(output).toContain('DEBUG');
  });

  it('shows missing entry for production-only key', () => {
    const report = makeReport({
      hasDrift: true,
      driftCount: 1,
      entries: [{ key: 'SECRET_KEY', severity: 'missing', productionValue: 'abc123', message: '' }],
    });
    const output = formatReport(report);
    expect(output).toContain('MISSING IN STAGING');
    expect(output).toContain('SECRET_KEY');
  });

  it('formatReportJson returns valid JSON', () => {
    const report = makeReport();
    const json = formatReportJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toHaveProperty('hasDrift', false);
  });

  it('formatReportJson includes driftCount and totalKeys', () => {
    const report = makeReport({ driftCount: 3, totalKeys: 10 });
    const parsed = JSON.parse(formatReportJson(report));
    expect(parsed).toHaveProperty('driftCount', 3);
    expect(parsed).toHaveProperty('totalKeys', 10);
  });
});
