import { GcpSecretProvider } from './gcp-secret-provider';

function makeClient(secrets: Record<string, string>) {
  const secretList = Object.keys(secrets).map((k) => ({
    name: `projects/my-project/secrets/${k}`,
  }));

  return {
    listSecrets: jest.fn().mockResolvedValue([secretList]),
    accessSecretVersion: jest.fn().mockImplementation(({ name }: { name: string }) => {
      const key = name.split('/secrets/')[1].replace('/versions/latest', '');
      const value = secrets[key];
      if (!value) throw new Error('Not found');
      return Promise.resolve([{ payload: { data: Buffer.from(value) } }]);
    }),
  };
}

describe('GcpSecretProvider', () => {
  it('loads all secrets when no prefix is set', async () => {
    const client = makeClient({ DB_HOST: 'localhost', API_KEY: 'abc123' });
    const provider = new GcpSecretProvider({ projectId: 'my-project', client });
    const result = await provider.load();
    expect(result).toEqual({ DB_HOST: 'localhost', API_KEY: 'abc123' });
  });

  it('filters secrets by prefix and strips prefix from key', async () => {
    const client = makeClient({ 'APP_DB_HOST': 'db.local', 'APP_API_KEY': 'key1', 'OTHER_VAR': 'skip' });
    const provider = new GcpSecretProvider({ projectId: 'my-project', prefix: 'APP_', client });
    const result = await provider.load();
    expect(result).toEqual({ DB_HOST: 'db.local', API_KEY: 'key1' });
    expect(result['OTHER_VAR']).toBeUndefined();
  });

  it('skips inaccessible secrets gracefully', async () => {
    const client = makeClient({ GOOD_KEY: 'value' });
    client.listSecrets.mockResolvedValue([[{ name: 'projects/my-project/secrets/GOOD_KEY' }, { name: 'projects/my-project/secrets/BAD_KEY' }]]);
    const provider = new GcpSecretProvider({ projectId: 'my-project', client });
    const result = await provider.load();
    expect(result['GOOD_KEY']).toBe('value');
    expect(result['BAD_KEY']).toBeUndefined();
  });

  it('throws if no client is provided', async () => {
    const provider = new GcpSecretProvider({ projectId: 'my-project' });
    await expect(provider.load()).rejects.toThrow('requires a client instance');
  });

  it('has the correct provider name', () => {
    const provider = new GcpSecretProvider({ projectId: 'my-project' });
    expect(provider.name).toBe('gcp-secret');
  });
});
