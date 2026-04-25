import { DopplerProvider } from './doppler-provider';

const DOPPLER_TOKEN = process.env.DOPPLER_TEST_TOKEN;
const DOPPLER_PROJECT = process.env.DOPPLER_TEST_PROJECT;
const DOPPLER_CONFIG = process.env.DOPPLER_TEST_CONFIG;

const runIntegration =
  DOPPLER_TOKEN && DOPPLER_PROJECT && DOPPLER_CONFIG ? describe : describe.skip;

runIntegration('DopplerProvider integration', () => {
  let provider: DopplerProvider;

  beforeEach(() => {
    provider = new DopplerProvider({
      token: DOPPLER_TOKEN!,
      project: DOPPLER_PROJECT!,
      config: DOPPLER_CONFIG!,
    });
  });

  it('fetches secrets from Doppler', async () => {
    const vars = await provider.getVariables();
    expect(typeof vars).toBe('object');
    expect(Object.keys(vars).length).toBeGreaterThan(0);
  });

  it('returns string values for all keys', async () => {
    const vars = await provider.getVariables();
    for (const [key, value] of Object.entries(vars)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
    }
  });

  it('name returns descriptive label', () => {
    expect(provider.name).toContain(DOPPLER_PROJECT!);
    expect(provider.name).toContain(DOPPLER_CONFIG!);
  });
});
