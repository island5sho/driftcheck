import { HashiCorpVaultProvider } from './hashicorp-vault-provider';

function makeClient(data: Record<string, string>) {
  return {
    fetch: jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data } }),
    }),
  };
}

describe('HashiCorpVaultProvider', () => {
  const baseOptions = {
    addr: 'http://vault.local:8200',
    token: 'test-token',
    mount: 'secret',
    path: 'myapp/staging',
  };

  it('loads secrets from KV v2 response', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: { DB_HOST: 'localhost', PORT: '5432' } } }),
    });

    const provider = new HashiCorpVaultProvider(baseOptions, mockFetch as any);
    const config = await provider.load();

    expect(config).toEqual({ DB_HOST: 'localhost', PORT: '5432' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://vault.local:8200/v1/secret/data/myapp/staging',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Vault-Token': 'test-token' }),
      })
    );
  });

  it('defaults mount to "secret" and addr to localhost', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: {} } }),
    });

    const provider = new HashiCorpVaultProvider(
      { token: 'tok', path: 'app/prod' },
      mockFetch as any
    );
    await provider.load();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8200/v1/secret/data/app/prod',
      expect.anything()
    );
  });

  it('throws when the HTTP response is not ok', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const provider = new HashiCorpVaultProvider(baseOptions, mockFetch as any);
    await expect(provider.load()).rejects.toThrow('403');
  });

  it('returns empty config for empty secret data', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { data: {} } }),
    });

    const provider = new HashiCorpVaultProvider(baseOptions, mockFetch as any);
    const config = await provider.load();
    expect(config).toEqual({});
  });

  it('exposes the provider name', () => {
    const mockFetch = jest.fn();
    const provider = new HashiCorpVaultProvider(baseOptions, mockFetch as any);
    expect(provider.name).toBe('hashicorp-vault');
  });
});
