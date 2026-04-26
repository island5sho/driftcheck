/**
 * Example: Using the Infisical provider with driftcheck
 *
 * This example demonstrates how to detect configuration drift
 * between staging and production environments using Infisical.
 *
 * Prerequisites:
 *   - An Infisical account with a project set up
 *   - A service token with read access to both environments
 *   - `@infisical/sdk` installed (or HTTP client configured)
 */

import { detectDrift } from '../drift/detector';
import { formatReport } from '../drift/formatter';
import { InfisicalProvider } from './infisical-provider';

async function main() {
  // Initialize the Infisical provider for staging
  const stagingProvider = new InfisicalProvider({
    siteUrl: process.env.INFISICAL_SITE_URL ?? 'https://app.infisical.com',
    serviceToken: process.env.INFISICAL_STAGING_TOKEN ?? '',
    projectId: process.env.INFISICAL_PROJECT_ID ?? '',
    environment: 'staging',
    secretPath: '/',
  });

  // Initialize the Infisical provider for production
  const productionProvider = new InfisicalProvider({
    siteUrl: process.env.INFISICAL_SITE_URL ?? 'https://app.infisical.com',
    serviceToken: process.env.INFISICAL_PROD_TOKEN ?? '',
    projectId: process.env.INFISICAL_PROJECT_ID ?? '',
    environment: 'production',
    secretPath: '/',
  });

  console.log('Fetching secrets from Infisical...');

  // Load secrets from both environments
  const [stagingVars, productionVars] = await Promise.all([
    stagingProvider.load(),
    productionProvider.load(),
  ]);

  console.log(`Staging secrets loaded:    ${Object.keys(stagingVars).length}`);
  console.log(`Production secrets loaded: ${Object.keys(productionVars).length}`);

  // Detect drift between the two environments
  const report = detectDrift(stagingVars, productionVars);

  // Print a human-readable report
  console.log('\n' + formatReport(report));

  // Exit with a non-zero code if drift is detected
  if (report.driftCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error running driftcheck with Infisical:', err);
  process.exit(1);
});
