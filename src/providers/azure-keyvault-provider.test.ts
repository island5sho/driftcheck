import { AzureKeyVaultProvider, AzureKeyVaultClient } from './azure-keyvault-provider';

function makeClient(secrets: Record<string, string>): AzureKeyVaultClient {
  return {
    async *listPropertiesOfSecrets() {
      for (const name of Object.keys(secrets)) {
        yield { name };
      }
    },
    async getSecret(name: string) {
      return { value: secrets[name] };
    },
  };
}

describe('AzureKeyVaultProvider', () => {
  it('loads secrets and normalises key names', async () => {
    const client = makeClient({
      'my-secret-key': 'hello',
      'another-value': 'world',
    });
    const provider = new AzureKeyVaultProvider({
      vaultUrl: 'https://my-vault.vault.azure.net',
      client,
    });
    const result = await provider.load();
    expect(result).toEqual({
      MY_SECRET_KEY: 'hello',
      ANOTHER_VALUE: 'world',
    });
  });

  it('returns empty map when vault has no secrets', async () => {
    const client = makeClient({});
    const provider = new AzureKeyVaultProvider({
      vaultUrl: 'https://empty-vault.vault.azure.net',
      client,
    });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it('handles secrets with undefined value as empty string', async () => {
    const client: AzureKeyVaultClient = {
      async *listPropertiesOfSecrets() {
        yield { name: 'empty-secret' };
      },
      async getSecret(_name: string) {
        return { value: undefined };
      },
    };
    const provider = new AzureKeyVaultProvider({
      vaultUrl: 'https://my-vault.vault.azure.net',
      client,
    });
    const result = await provider.load();
    expect(result).toEqual({ EMPTY_SECRET: '' });
  });

  it('exposes the correct provider name', () => {
    const provider = new AzureKeyVaultProvider({
      vaultUrl: 'https://my-vault.vault.azure.net',
      client: makeClient({}),
    });
    expect(provider.name).toBe('azure-keyvault');
  });
});
