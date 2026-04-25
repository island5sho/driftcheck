/**
 * Integration tests for GcpSecretProvider.
 * Requires GCP credentials and a real project.
 * Set GCP_PROJECT_ID and GCP_SECRET_PREFIX env vars before running.
 *
 * Run with: GCP_PROJECT_ID=my-proj npx jest --testPathPattern=gcp-secret-provider.integration
 */

const RUN_INTEGRATION = process.env.GCP_PROJECT_ID !== undefined;

// eslint-disable-next-line jest/no-conditional-describe
const describeIntegration = RUN_INTEGRATION ? describe : describe.skip;

describeIntegration('GcpSecretProvider (integration)', () => {
  it('loads secrets from GCP Secret Manager', async () => {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    const { GcpSecretProvider } = await import('./gcp-secret-provider');

    const projectId = process.env.GCP_PROJECT_ID!;
    const prefix = process.env.GCP_SECRET_PREFIX ?? '';
    const client = new SecretManagerServiceClient();

    const provider = new GcpSecretProvider({
      projectId,
      prefix,
      client: {
        listSecrets: (req) => client.listSecrets(req) as any,
        accessSecretVersion: (req) => client.accessSecretVersion(req) as any,
      },
    });

    const result = await provider.load();
    expect(typeof result).toBe('object');
    console.log(`Loaded ${Object.keys(result).length} secrets from GCP project ${projectId}`);
  }, 30000);
});
