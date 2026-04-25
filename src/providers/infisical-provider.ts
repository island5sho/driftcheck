import { EnvMap, Provider } from './types';

export interface InfisicalClient {
  listSecrets(options: {
    projectId: string;
    environment: string;
    path?: string;
  }): Promise<Array<{ secretKey: string; secretValue: string }>>;
}

export interface InfisicalProviderOptions {
  client: InfisicalClient;
  projectId: string;
  environment: string;
  path?: string;
}

export class InfisicalProvider implements Provider {
  readonly name = 'infisical';
  private client: InfisicalClient;
  private projectId: string;
  private environment: string;
  private path: string;

  constructor(options: InfisicalProviderOptions) {
    this.client = options.client;
    this.projectId = options.projectId;
    this.environment = options.environment;
    this.path = options.path ?? '/';
  }

  async load(): Promise<EnvMap> {
    const secrets = await this.client.listSecrets({
      projectId: this.projectId,
      environment: this.environment,
      path: this.path,
    });

    const result: EnvMap = {};
    for (const secret of secrets) {
      result[secret.secretKey] = secret.secretValue;
    }
    return result;
  }
}
