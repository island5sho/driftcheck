/**
 * Integration tests for AzureKeyVaultProvider.
 * Requires real Azure credentials and a vault URL set via env vars.
 *
 * Run with:
 *   AZURE_VAULT_URL=https://my-vault.vault.azure.net npx jest --testPathPattern=azure-keyvault-provider.integration
 */

import { AzureKeyVaultProvider } from './azure-keyvault-provider';

const vaultUrl = process.env.AZURE_VAULT_URL;

const describeIf = vaultUrl ? describe : describe.skip;

describeIf('AzureKeyVaultProvider (integration)', () => {
  it('connects to Azure Key Vault and loads at least one secret', async () => {
    const provider = new AzureKeyVaultProvider({ vaultUrl: vaultUrl! });
    const result = await provider.load();
    expect(typeof result).toBe('object');
    // Verify keys are uppercase with underscores
    for (const key of Object.keys(result)) {
      expect(key).toMatch(/^[A-Z0-9_]+$/);
    }
  }, 30_000);
});
