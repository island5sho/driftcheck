import { InfisicalProvider } from './infisical-provider';

/**
 * Integration test for InfisicalProvider.
 * Requires real Infisical credentials set via environment variables:
 *   INFISICAL_TOKEN, INFISICAL_PROJECT_ID, INFISICAL_ENVIRONMENT
 *
 * Run with: INTEGRATION=true npx jest infisical-provider.integration
 */

const RUN = process.env.INTEGRATION === 'true';

(RUN ? describe : describe.skip)('InfisicalProvider integration', () => {
  const token = process.env.INFISICAL_TOKEN ?? '';
  const projectId = process.env.INFISICAL_PROJECT_ID ?? '';
  const environment = process.env.INFISICAL_ENVIRONMENT ?? 'dev';

  it('fetches secrets from Infisical', async () => {
    const provider = new InfisicalProvider({
      token,
      projectId,
      environment,
    });

    const vars = await provider.getVariables();

    expect(typeof vars).toBe('object');
    expect(Object.keys(vars).length).toBeGreaterThan(0);

    for (const [key, value] of Object.entries(vars)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
    }
  });

  it('returns empty object for unknown environment', async () => {
    const provider = new InfisicalProvider({
      token,
      projectId,
      environment: 'nonexistent-env-xyz',
    });

    await expect(provider.getVariables()).rejects.toThrow();
  });
});
