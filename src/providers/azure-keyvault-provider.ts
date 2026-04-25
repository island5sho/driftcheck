import { EnvProvider, EnvMap } from './types';

export interface AzureKeyVaultClient {
  listPropertiesOfSecrets(): AsyncIterable<{ name?: string }>;
  getSecret(name: string): Promise<{ value?: string }>;
}

export interface AzureKeyVaultProviderOptions {
  vaultUrl: string;
  client?: AzureKeyVaultClient;
}

export class AzureKeyVaultProvider implements EnvProvider {
  readonly name = 'azure-keyvault';
  private client: AzureKeyVaultClient;
  private vaultUrl: string;

  constructor(options: AzureKeyVaultProviderOptions) {
    this.vaultUrl = options.vaultUrl;
    if (options.client) {
      this.client = options.client;
    } else {
      // Lazy import to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SecretClient } = require('@azure/keyvault-secrets');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DefaultAzureCredential } = require('@azure/identity');
      this.client = new SecretClient(this.vaultUrl, new DefaultAzureCredential());
    }
  }

  async load(): Promise<EnvMap> {
    const result: EnvMap = {};
    for await (const secretProps of this.client.listPropertiesOfSecrets()) {
      if (!secretProps.name) continue;
      const secret = await this.client.getSecret(secretProps.name);
      const key = secretProps.name.replace(/-/g, '_').toUpperCase();
      result[key] = secret.value ?? '';
    }
    return result;
  }
}
