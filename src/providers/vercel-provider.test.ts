import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VercelProvider } from './vercel-provider';

const mockFetch = vi.fn();

function makeEnvVars(overrides: Partial<{ key: string; value: string; target: string[] }>[] = []) {
  const defaults = [
    { key: 'API_URL', value: 'https://api.example.com', target: ['production'] },
    { key: 'DEBUG', value: 'false', target: ['production', 'preview'] },
    { key: 'DEV_ONLY', value: 'local', target: ['development'] },
  ];
  return [...defaults, ...overrides];
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VercelProvider', () => {
  it('loads production env vars by default', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ envs: makeEnvVars() }),
    });

    const provider = new VercelProvider({ token: 'tok_123', projectId: 'proj_abc' });
    const result = await provider.load();

    expect(result).toEqual({
      API_URL: 'https://api.example.com',
      DEBUG: 'false',
    });
  });

  it('filters by specified target', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ envs: makeEnvVars() }),
    });

    const provider = new VercelProvider({
      token: 'tok_123',
      projectId: 'proj_abc',
      target: 'development',
    });
    const result = await provider.load();

    expect(result).toEqual({ DEV_ONLY: 'local' });
  });

  it('includes teamId in request when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ envs: [] }),
    });

    const provider = new VercelProvider({
      token: 'tok_123',
      projectId: 'proj_abc',
      teamId: 'team_xyz',
    });
    await provider.load();

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('teamId=team_xyz');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const provider = new VercelProvider({ token: 'bad_token', projectId: 'proj_abc' });
    await expect(provider.load()).rejects.toThrow('Vercel API error: 403 Forbidden');
  });

  it('has correct provider name', () => {
    const provider = new VercelProvider({ token: 'tok', projectId: 'proj' });
    expect(provider.name).toBe('vercel');
  });
});
