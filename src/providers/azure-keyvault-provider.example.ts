/**
 * Example: Detect drift between staging and production Azure Key Vaults.
 *
 * Usage:
 *   STAGING_VAULT_URL=https://staging.vault.azure.net \
 *   PROD_VAULT_URL=https://prod.vault.azure.net \
 *   npx ts-node src/providers/azure-keyvault-provider.example.ts
 */

import { AzureKeyVaultProvider } from './azure-keyvault-provider';
import { detectDrift } from '../drift/detector';
import { formatReport } from '../drift/formatter';

async function main() {
  const stagingVaultUrl = process.env.STAGING_VAULT_URL;
  const prodVaultUrl = process.env.PROD_VAULT_URL;

  if (!stagingVaultUrl || !prodVaultUrl) {
    console.error('Error: STAGING_VAULT_URL and PROD_VAULT_URL must be set.');
    process.exit(1);
  }

  const staging = new AzureKeyVaultProvider({ vaultUrl: stagingVaultUrl });
  const production = new AzureKeyVaultProvider({ vaultUrl: prodVaultUrl });

  console.log('Loading secrets from Azure Key Vaults...');
  const [stagingEnv, productionEnv] = await Promise.all([
    staging.load(),
    production.load(),
  ]);

  const report = detectDrift(stagingEnv, productionEnv);
  console.log(formatReport(report));

  if (report.driftCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
