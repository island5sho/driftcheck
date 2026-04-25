import { InfisicalProvider, InfisicalClient } from './infisical-provider';

function makeClient(
  secrets: Array<{ secretKey: string; secretValue: string }>
): InfisicalClient {
  return {
    listSecrets: jest.fn().mockResolvedValue(secrets),
  };
}

describe('InfisicalProvider', () => {
  it('loads secrets into an EnvMap', async () => {
    const client = makeClient([
      { secretKey: 'API_KEY', secretValue: 'abc123' },
      { secretKey: 'DB_URL', secretValue: 'postgres://localhost/db' },
    ]);

    const provider = new InfisicalProvider({
      client,
      projectId: 'proj-1',
      environment: 'production',
    });

    const result = await provider.load();

    expect(result).toEqual({
      API_KEY: 'abc123',
      DB_URL: 'postgres://localhost/db',
    });
  });

  it('passes correct options to client', async () => {
    const client = makeClient([]);

    const provider = new InfisicalProvider({
      client,
      projectId: 'proj-42',
      environment: 'staging',
      path: '/backend',
    });

    await provider.load();

    expect(client.listSecrets).toHaveBeenCalledWith({
      projectId: 'proj-42',
      environment: 'staging',
      path: '/backend',
    });
  });

  it('defaults path to "/" when not provided', async () => {
    const client = makeClient([]);

    const provider = new InfisicalProvider({
      client,
      projectId: 'proj-1',
      environment: 'production',
    });

    await provider.load();

    expect(client.listSecrets).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/' })
    );
  });

  it('returns empty map when no secrets exist', async () => {
    const client = makeClient([]);

    const provider = new InfisicalProvider({
      client,
      projectId: 'proj-1',
      environment: 'production',
    });

    const result = await provider.load();
    expect(result).toEqual({});
  });

  it('has correct provider name', () => {
    const provider = new InfisicalProvider({
      client: makeClient([]),
      projectId: 'proj-1',
      environment: 'production',
    });
    expect(provider.name).toBe('infisical');
  });
});
