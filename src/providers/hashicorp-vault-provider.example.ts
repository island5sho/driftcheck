/**
 * Example: compare staging vs production secrets stored in HashiCorp Vault.
 *
 * Run:
 *   VAULT_TOKEN=<token> ts-node src/providers/hashicorp-vault-provider.example.ts
 */

import { HashiCorpVaultProvider } from './hashicorp-vault-provider';
import { registerProvider, getProvider } from './provider-registry';
import { detectDrift } from '../drift/detector';
import { formatReport } from '../drift/formatter';

async function main() {
  const addr = process.env.VAULT_ADDR ?? 'http://127.0.0.1:8200';
  const token = process.env.VAULT_TOKEN;

  if (!token) {
    console.error('VAULT_TOKEN environment variable is required.');
    process.exit(1);
  }

  registerProvider(
    'staging',
    new HashiCorpVaultProvider({ addr, token, mount: 'secret', path: 'myapp/staging' })
  );

  registerProvider(
    'production',
    new HashiCorpVaultProvider({ addr, token, mount: 'secret', path: 'myapp/production' })
  );

  const stagingProvider = getProvider('staging');
  const productionProvider = getProvider('production');

  if (!stagingProvider || !productionProvider) {
    console.error('Providers not registered correctly.');
    process.exit(1);
  }

  const [stagingConfig, productionConfig] = await Promise.all([
    stagingProvider.load(),
    productionProvider.load(),
  ]);

  const report = detectDrift(stagingConfig, productionConfig);
  console.log(formatReport(report));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
