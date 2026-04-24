export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'dotenv';

export interface EnvVariable {
  key: string;
  value: string;
  source: CloudProvider;
  environment: 'staging' | 'production';
}

export interface ProviderConfig {
  provider: CloudProvider;
  region?: string;
  projectId?: string;
  secretPrefix?: string;
  filePath?: string;
}

export interface EnvProvider {
  name: CloudProvider;
  fetchVariables(
    environment: 'staging' | 'production',
    config: ProviderConfig
  ): Promise<EnvVariable[]>;
}
