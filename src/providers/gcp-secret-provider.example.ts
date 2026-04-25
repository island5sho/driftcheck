/**
 * Example: Detect drift between staging and production using GCP Secret Manager.
 * This file is for documentation purposes and is not executed directly.
 */

import { GcpSecretProvider } from './gcp-secret-provider';
import { registerProvider, getProvider } from './provider-registry';
import { detectDrift } from '../drift/detector';
import { formatReport } from '../drift/formatter';

async function main() {
  const makeClient = () => {
    // In real usage: import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
    // const raw = new SecretManagerServiceClient();
    // return { listSecrets: (r: any) => raw.listSecrets(r), accessSecretVersion: (r: any) => raw.accessSecretVersion(r) };
    throw new Error('Replace with real SecretManagerServiceClient');
  };

  registerProvider(
    'staging',
    new GcpSecretProvider({
      projectId: process.env.GCP_STAGING_PROJECT ?? 'my-staging-project',
      prefix: 'APP_',
      client: makeClient(),
    })
  );

  registerProvider(
    'production',
    new GcpSecretProvider({
      projectId: process.env.GCP_PROD_PROJECT ?? 'my-prod-project',
      prefix: 'APP_',
      client: makeClient(),
    })
  );

  const staging = await getProvider('staging')!.load();
  const production = await getProvider('production')!.load();

  const report = detectDrift(staging, production);
  console.log(formatReport(report));

  if (report.driftCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
