import type { EnvMap, Provider } from "./types";

interface FlyClient {
  get(url: string, opts: { headers: Record<string, string> }): Promise<{ data: unknown }>;
}

interface FlySecret {
  name: string;
  digest: string;
  created_at: string;
}

interface FlySecretsResponse {
  secrets: FlySecret[];
}

const defaultClient: FlyClient = {
  async get(url, opts) {
    const res = await fetch(url, { headers: opts.headers });
    if (!res.ok) {
      throw new Error(`Fly.io API error: ${res.status} ${res.statusText}`);
    }
    return { data: await res.json() };
  },
};

export interface FlyProviderOptions {
  appName: string;
  apiToken: string;
  client?: FlyClient;
}

export function createFlyProvider(options: FlyProviderOptions): Provider {
  const { appName, apiToken, client = defaultClient } = options;
  const baseUrl = "https://api.fly.io/v1";
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  return {
    name: `fly:${appName}`,
    async load(): Promise<EnvMap> {
      const url = `${baseUrl}/apps/${appName}/secrets`;
      const { data } = await client.get(url, { headers });
      const response = data as FlySecretsResponse;
      const result: EnvMap = {};
      for (const secret of response.secrets ?? []) {
        // Fly.io secrets API only exposes name + digest, not values.
        // Store the digest as a placeholder to detect additions/removals.
        result[secret.name] = secret.digest;
      }
      return result;
    },
  };
}
