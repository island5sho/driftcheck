import type { EnvMap, Provider } from "./types";

interface CloudflareSecret {
  name: string;
  type: string;
  created_on: string;
  modified_on: string;
}

interface CloudflareClient {
  listSecrets(accountId: string, scriptName: string): Promise<CloudflareSecret[]>;
  getSecret(accountId: string, scriptName: string, name: string): Promise<{ value: string }>;
}

function defaultClient(apiToken: string): CloudflareClient {
  const baseUrl = "https://api.cloudflare.com/client/v4";
  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  return {
    async listSecrets(accountId, scriptName) {
      const res = await fetch(
        `${baseUrl}/accounts/${accountId}/workers/scripts/${scriptName}/secrets`,
        { headers }
      );
      if (!res.ok) throw new Error(`Cloudflare API error: ${res.status} ${res.statusText}`);
      const json = (await res.json()) as { result: CloudflareSecret[] };
      return json.result ?? [];
    },
    async getSecret(accountId, scriptName, name) {
      const res = await fetch(
        `${baseUrl}/accounts/${accountId}/workers/scripts/${scriptName}/secrets/${name}`,
        { headers }
      );
      if (!res.ok) throw new Error(`Cloudflare API error: ${res.status} ${res.statusText}`);
      const json = (await res.json()) as { result: { value: string } };
      return json.result;
    },
  };
}

export interface CloudflareProviderOptions {
  accountId: string;
  scriptName: string;
  apiToken?: string;
  client?: CloudflareClient;
}

export function createCloudflareProvider(options: CloudflareProviderOptions): Provider {
  const { accountId, scriptName } = options;
  const client =
    options.client ??
    defaultClient(options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN ?? "");

  return {
    name: "cloudflare",
    async load(): Promise<EnvMap> {
      const secrets = await client.listSecrets(accountId, scriptName);
      const entries = await Promise.all(
        secrets.map(async (s) => {
          const detail = await client.getSecret(accountId, scriptName, s.name);
          return [s.name, detail.value] as [string, string];
        })
      );
      return Object.fromEntries(entries);
    },
  };
}
