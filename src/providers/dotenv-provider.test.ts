import * as fs from 'fs';
import * as path from 'path';
import { DotenvProvider } from './dotenv-provider';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('DotenvProvider', () => {
  const provider = new DotenvProvider();
  const config = { provider: 'dotenv' as const, filePath: '.env.staging' };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should parse valid env file', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      'DB_HOST=localhost\nDB_PORT=5432\n# comment\nAPI_KEY="secret"\n'
    );

    const vars = await provider.fetchVariables('staging', config);

    expect(vars).toHaveLength(3);
    expect(vars[0]).toEqual({ key: 'DB_HOST', value: 'localhost', source: 'dotenv', environment: 'staging' });
    expect(vars[1]).toEqual({ key: 'DB_PORT', value: '5432', source: 'dotenv', environment: 'staging' });
    expect(vars[2]).toEqual({ key: 'API_KEY', value: 'secret', source: 'dotenv', environment: 'staging' });
  });

  it('should throw if file does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);
    await expect(provider.fetchVariables('staging', config)).rejects.toThrow('Env file not found');
  });

  it('should skip blank lines and comments', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('\n# just a comment\n\nFOO=bar\n');

    const vars = await provider.fetchVariables('production', config);
    expect(vars).toHaveLength(1);
    expect(vars[0].key).toBe('FOO');
  });

  it('should handle values containing equals signs', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('CONNECTION_STRING=host=localhost;port=5432\n');

    const vars = await provider.fetchVariables('staging', config);
    expect(vars).toHaveLength(1);
    expect(vars[0]).toEqual({
      key: 'CONNECTION_STRING',
      value: 'host=localhost;port=5432',
      source: 'dotenv',
      environment: 'staging',
    });
  });
});
