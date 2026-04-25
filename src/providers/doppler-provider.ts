import type { EnvMap, Provider } from "./types";

export interface DopplerClient {
  secrets: {
    list: (params: {
      project: string;
      config: string;
    }) => Promise<{ secrets: Record<string, { raw: string }> }>;
  };
}

export interface DopplerProviderOptions {
  project: string;
  config: string;
  client: DopplerClient;
}

export class DopplerProvider implements Provider {
  readonly name = "doppler";
  private project: string;
  private config: string;
  private client: DopplerClient;

  constructor(options: DopplerProviderOptions) {
    this.project = options.project;
    this.config = options.config;
    this.client = options.client;
  }

  async getEnv(): Promise<EnvMap> {
    const response = await this.client.secrets.list({
      project: this.project,
      config: this.config,
    });

    const result: EnvMap = {};
    for (const [key, value] of Object.entries(response.secrets)) {
      result[key] = value.raw;
    }
    return result;
  }
}
