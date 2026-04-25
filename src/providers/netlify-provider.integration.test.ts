import { NetlifyProvider } from './netlify-provider';

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;

(NETLIFY_TOKEN && NETLIFY_SITE_ID ? describe : describe.skip)(
  'NetlifyProvider integration',
  () => {
    let provider: NetlifyProvider;

    beforeEach(() => {
      provider = new NetlifyProvider({
        token: NETLIFY_TOKEN!,
        siteId: NETLIFY_SITE_ID!,
      });
    });

    it('fetches env vars from Netlify site', async () => {
      const vars = await provider.getVariables();
      expect(typeof vars).toBe('object');
      expect(vars).not.toBeNull();
    });

    it('returns string values for all keys', async () => {
      const vars = await provider.getVariables();
      for (const [key, value] of Object.entries(vars)) {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
      }
    });
  }
);
