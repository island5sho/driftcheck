import type { EnvMap, Provider } from "./types";

export interface ConsulProviderOptions {
  host?: string;
  port?: number;
  token?: string;
  prefix?: string;
  namespace?: string;
}

export interface ConsulKVClient {
  list(prefix: string): Promise<Array<{ Key: string; Value: string | null }>>;
}

function defaultClient(opts: ConsulProviderOptions): ConsulKVClient {
  const base = `http://${opts.host ?? "127.0.0.1"}:${opts.port ?? 8500}/v1`;
  const headers: Record<string, string> = {};
  if (opts.token) headers["X-Consul-Token"] = opts.token;
  if (opts.namespace) headers["X-Consul-Namespace"] = opts.namespace;

  return {
    async list(prefix: string) {
      const url = `${base}/kv/${encodeURIComponent(prefix)}?recurse=true`;
      const res = await fetch(url, { headers });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`Consul KV list failed: ${res.status} ${res.statusText}`);
      const data = (await res.json()) as Array<{ Key: string; Value: string | null }>;
      return data;
    },
  };
}

export function createConsulProvider(
  options: ConsulProviderOptions = {},
  client?: ConsulKVClient
): Provider {
  const kv = client ?? defaultClient(options);
  const prefix = options.prefix ?? "config/";

  return {
    name: "consul",
    async load(): Promise<EnvMap> {
      const entries = await kv.list(prefix);
      const result: EnvMap = {};
      for (const entry of entries) {
        const key = entry.Key.replace(prefix, "").replace(/\//g, "_").toUpperCase();
        const value = entry.Value
          ? Buffer.from(entry.Value, "base64").toString("utf-8")
          : "";
        result[key] = value;
      }
      return result;
    },
  };
}
