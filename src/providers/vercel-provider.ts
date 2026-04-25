import type { EnvProvider, EnvMap } from './types';

export interface VercelProviderOptions {
  token: string;
  projectId: string;
  teamId?: string;
  target?: 'production' | 'preview' | 'development';
}

interface VercelEnvVar {
  key: string;
  value: string;
  target: string[];
}

export class VercelProvider implements EnvProvider {
  readonly name = 'vercel';
  private options: VercelProviderOptions;

  constructor(options: VercelProviderOptions) {
    this.options = options;
  }

  async load(): Promise<EnvMap> {
    const { token, projectId, teamId, target = 'production' } = this.options;

    const params = new URLSearchParams();
    if (teamId) params.set('teamId', teamId);

    const url = `https://api.vercel.com/v9/projects/${projectId}/env?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Vercel API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as { envs: VercelEnvVar[] };

    const result: EnvMap = {};
    for (const env of data.envs) {
      if (env.target.includes(target)) {
        result[env.key] = env.value;
      }
    }

    return result;
  }
}
