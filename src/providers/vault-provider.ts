import type { EnvMap, Provider } from "./types";

export interface VaultClientLike {
  read(path: string): Promise<{ data: Record<string, unknown> } | null>;
}

export interface VaultProviderOptions {
  client: VaultClientLike;
  /** KV path to read, e.g. "secret/data/myapp" */
  path: string;
  /** Optional sub-key inside the data object (default: reads all keys) */
  dataKey?: string;
}

function defaultClient(): VaultClientLike {
  const addr = process.env.VAULT_ADDR ?? "http://127.0.0.1:8200";
  const token = process.env.VAULT_TOKEN ?? "";

  return {
    async read(path: string) {
      const res = await fetch(`${addr}/v1/${path}`, {
        headers: { "X-Vault-Token": token },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Vault read failed: ${res.status} ${res.statusText}`);
      const json = (await res.json()) as { data: Record<string, unknown> };
      return json;
    },
  };
}

export function createVaultProvider(options?: Partial<VaultProviderOptions> & { path: string }): Provider {
  const client = options?.client ?? defaultClient();
  const path = options.path;
  const dataKey = options?.dataKey ?? "data";

  return {
    name: "vault",
    async load(): Promise<EnvMap> {
      const result = await client.read(path);
      if (!result) return {};

      const raw = dataKey ? (result.data[dataKey] as Record<string, unknown> | undefined) ?? result.data : result.data;

      const env: EnvMap = {};
      for (const [key, value] of Object.entries(raw)) {
        if (value !== null && value !== undefined) {
          env[key] = String(value);
        }
      }
      return env;
    },
  };
}
