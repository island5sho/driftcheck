import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/cli/index.js');
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');

function runCli(args: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`ts-node ${path.resolve(__dirname, 'index.ts')} ${args}`, {
      encoding: 'utf-8',
      env: { ...process.env },
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      code: err.status ?? 1,
    };
  }
}

function writeTempEnv(vars: Record<string, string>): string {
  const tmpFile = path.join(os.tmpdir(), `driftcheck-test-${Date.now()}.env`);
  const content = Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  fs.writeFileSync(tmpFile, content, 'utf-8');
  return tmpFile;
}

describe('CLI: check command', () => {
  let stagingFile: string;
  let productionFile: string;

  afterEach(() => {
    [stagingFile, productionFile].forEach((f) => {
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('exits with code 0 when no drift is detected', () => {
    stagingFile = writeTempEnv({ API_URL: 'https://api.example.com', DEBUG: 'false' });
    productionFile = writeTempEnv({ API_URL: 'https://api.example.com', DEBUG: 'false' });
    const result = runCli(`check --staging dotenv://${stagingFile} --production dotenv://${productionFile}`);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('No drift detected');
  });

  it('exits with code 1 when drift is detected', () => {
    stagingFile = writeTempEnv({ API_URL: 'https://staging.example.com', DEBUG: 'true' });
    productionFile = writeTempEnv({ API_URL: 'https://api.example.com', DEBUG: 'false' });
    const result = runCli(`check --staging dotenv://${stagingFile} --production dotenv://${productionFile}`);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('API_URL');
  });

  it('outputs JSON when --format json is specified', () => {
    stagingFile = writeTempEnv({ KEY: 'staging-val' });
    productionFile = writeTempEnv({ KEY: 'prod-val' });
    const result = runCli(`check --staging dotenv://${stagingFile} --production dotenv://${productionFile} --format json`);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveProperty('driftEntries');
    expect(parsed.driftEntries.length).toBeGreaterThan(0);
  });

  it('ignores specified keys', () => {
    stagingFile = writeTempEnv({ API_URL: 'https://staging.example.com', IGNORED_KEY: 'a' });
    productionFile = writeTempEnv({ API_URL: 'https://staging.example.com', IGNORED_KEY: 'b' });
    const result = runCli(`check --staging dotenv://${stagingFile} --production dotenv://${productionFile} --ignore IGNORED_KEY`);
    expect(result.code).toBe(0);
  });
});
