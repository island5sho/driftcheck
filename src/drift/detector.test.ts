import { detectDrift } from './detector';

describe('detectDrift', () => {
  it('returns no drift when envs are identical', () => {
    const env = { API_URL: 'https://api.example.com', PORT: '3000' };
    const report = detectDrift(env, env);
    expect(report.hasDrift).toBe(false);
    expect(report.driftCount).toBe(0);
    expect(report.entries).toHaveLength(0);
    expect(report.totalKeys).toBe(2);
  });

  it('detects a key missing in production', () => {
    const staging = { API_URL: 'https://api.example.com', DEBUG: 'true' };
    const production = { API_URL: 'https://api.example.com' };
    const report = detectDrift(staging, production);
    expect(report.hasDrift).toBe(true);
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].key).toBe('DEBUG');
    expect(report.entries[0].severity).toBe('extra');
  });

  it('detects a key missing in staging', () => {
    const staging = { API_URL: 'https://api.example.com' };
    const production = { API_URL: 'https://api.example.com', SECRET: 'xyz' };
    const report = detectDrift(staging, production);
    expect(report.hasDrift).toBe(true);
    expect(report.entries[0].key).toBe('SECRET');
    expect(report.entries[0].severity).toBe('missing');
  });

  it('detects value mismatches', () => {
    const staging = { API_URL: 'https://staging.example.com' };
    const production = { API_URL: 'https://api.example.com' };
    const report = detectDrift(staging, production);
    expect(report.hasDrift).toBe(true);
    expect(report.entries[0].severity).toBe('mismatch');
    expect(report.entries[0].stagingValue).toBe('https://staging.example.com');
    expect(report.entries[0].productionValue).toBe('https://api.example.com');
  });

  it('includes a generatedAt timestamp', () => {
    const report = detectDrift({}, {});
    expect(report.generatedAt).toBeInstanceOf(Date);
  });

  it('counts total unique keys across both envs', () => {
    const staging = { A: '1', B: '2' };
    const production = { B: '2', C: '3' };
    const report = detectDrift(staging, production);
    expect(report.totalKeys).toBe(3);
  });
});
