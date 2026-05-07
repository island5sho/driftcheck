import type { EnvMap, Provider } from "./types";

export interface NomadClient {
  get(path: string): Promise<{ data: Record<string, string> }>;
}

export interface NomadProviderOptions {
  /** Nomad namespace, defaults to 'default' */
  namespace?: string;
  /** Path prefix for variables, e.g. 'nomad/jobs/myapp' */
  path: string;
  client?: NomadClient;
}

function defaultClient(address: string, token: string): NomadClient {
  return {
    async get(path: string) {
      const url = `${address}/v1/var/${encodeURIComponent(path)}`;
      const res = await fetch(url, {
        headers: {
          "X-Nomad-Token": token,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`Nomad request failed: ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as { Items: Record<string, string> };
      return { data: json.Items ?? {} };
    },
  };
}

export function createNomadProvider(options: NomadProviderOptions): Provider {
  const {
    namespace = "default",
    path,
    client = defaultClient(
      process.env.NOMAD_ADDR ?? "http://127.0.0.1:4646",
      process.env.NOMAD_TOKEN ?? ""
    ),
  } = options;

  return {
    name: `nomad:${namespace}:${path}`,
    async load(): Promise<EnvMap> {
      const fullPath = namespace !== "default" ? `${namespace}/${path}` : path;
      const { data } = await client.get(fullPath);
      const result: EnvMap = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
          result[key] = value;
        }
      }
      return result;
    },
  };
}
