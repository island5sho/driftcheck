import { describe, it, expect } from 'vitest';
import { VercelProvider } from './vercel-provider';

/**
 * Integration tests for VercelProvider.
 * Requires environment variables:
 *   VERCEL_TOKEN       - Vercel API token
 *   VERCEL_PROJECT_ID  - Target project ID
 *   VERCEL_TEAM_ID     - (optional) Team ID
 *
 * Run with:
 *   VERCEL_TOKEN=... VERCEL_PROJECT_ID=... npx vitest run vercel-provider.integration
 */

const SKIP = !process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID;

/** Creates a VercelProvider using environment variables for the given target. */
function createProvider(target: 'production' | 'preview' | 'development') {
  return new VercelProvider({
    token: process.env.VERCEL_TOKEN!,
    projectId: process.env.VERCEL_PROJECT_ID!,
    teamId: process.env.VERCEL_TEAM_ID,
    target,
  });
}

describe.skipIf(SKIP)('VercelProvider integration', () => {
  it('loads production environment variables', async () => {
    const provider = createProvider('production');

    const vars = await provider.load();

    expect(typeof vars).toBe('object');
    expect(Object.keys(vars).length).toBeGreaterThan(0);
    for (const [key, value] of Object.entries(vars)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
    }
  });

  it('loads preview environment variables', async () => {
    const provider = createProvider('preview');

    const vars = await provider.load();
    expect(typeof vars).toBe('object');
  });
});
