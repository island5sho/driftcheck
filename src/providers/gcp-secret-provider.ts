import { EnvProvider, EnvMap } from './types';

export interface GcpSecretProviderOptions {
  projectId: string;
  prefix?: string;
  client?: {
    accessSecretVersion: (req: { name: string }) => Promise<[{ payload: { data: string | Buffer } }]>;
    listSecrets: (req: { parent: string }) => Promise<[Array<{ name: string }>]>;
  };
}

export class GcpSecretProvider implements EnvProvider {
  readonly name = 'gcp-secret';
  private options: GcpSecretProviderOptions;

  constructor(options: GcpSecretProviderOptions) {
    this.options = options;
  }

  async load(): Promise<EnvMap> {
    const { projectId, prefix = '', client } = this.options;

    if (!client) {
      throw new Error('GcpSecretProvider requires a client instance');
    }

    const parent = `projects/${projectId}`;
    const [secrets] = await client.listSecrets({ parent });

    const result: EnvMap = {};

    for (const secret of secrets) {
      const secretName = secret.name.split('/').pop() ?? '';
      if (prefix && !secretName.startsWith(prefix)) continue;

      const key = prefix ? secretName.slice(prefix.length) : secretName;
      const versionName = `${secret.name}/versions/latest`;

      try {
        const [version] = await client.accessSecretVersion({ name: versionName });
        const value = version.payload.data.toString();
        result[key] = value;
      } catch {
        // skip inaccessible secrets
      }
    }

    return result;
  }
}
