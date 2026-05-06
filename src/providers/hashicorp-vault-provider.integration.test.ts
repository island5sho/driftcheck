import { HashiCorpVaultProvider } from './hashicorp-vault-provider';

/**
 * Integration tests for HashiCorpVaultProvider.
 * Requires a running Vault instance:
 *   docker run --rm -e VAULT_DEV_ROOT_TOKEN_ID=test-token -p 8200:8200 vault
 *
 * Set env vars:
 *   VAULT_ADDR=http://127.0.0.1:8200
 *   VAULT_TOKEN=test-token
 *   RUN_INTEGRATION_TESTS=true
 */

const RUN = process.env.RUN_INTEGRATION_TESTS === 'true';

(RUN ? describe : describe.skip)('HashiCorpVaultProvider integration', () => {
  const addr = process.env.VAULT_ADDR ?? 'http://127.0.0.1:8200';
  const token = process.env.VAULT_TOKEN ?? 'test-token';
  const mount = 'secret';
  const path = 'driftcheck/integration';

  let provider: HashiCorpVaultProvider;

  /**
   * Seeds a key/value map into Vault at the configured mount and path.
   */
  async function seedVaultSecret(data: Record<string, string>): Promise<void> {
    const res = await fetch(`${addr}/v1/${mount}/data/${path}`, {
      method: 'POST',
      headers: {
        'X-Vault-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      throw new Error(`Failed to seed Vault secret: ${res.status} ${res.statusText}`);
    }
  }

  beforeAll(async () => {
    provider = new HashiCorpVaultProvider({ addr, token, mount, path });
    await seedVaultSecret({ API_KEY: 'integration-value', TIMEOUT: '30' });
  });

  it('fetches secrets and returns a config map', async () => {
    const config = await provider.load();
    expect(config['API_KEY']).toBe('integration-value');
    expect(config['TIMEOUT']).toBe('30');
  });
});
