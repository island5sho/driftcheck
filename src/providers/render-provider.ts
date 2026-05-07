import type { EnvProvider } from "./types";

interface RenderEnvVar {
  key: string;
  value: string;
}

interface RenderClient {
  listEnvVars(serviceId: string): Promise<RenderEnvVar[]>;
}

function defaultClient(apiKey: string): RenderClient {
  return {
    async listEnvVars(serviceId: string): Promise<RenderEnvVar[]> {
      const url = `https://api.render.com/v1/services/${serviceId}/env-vars`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`Render API error: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as Array<{ envVar: RenderEnvVar }>;
      return data.map((item) => item.envVar);
    },
  };
}

export function createRenderProvider(
  serviceId: string,
  apiKey: string,
  client?: RenderClient
): EnvProvider {
  const c = client ?? defaultClient(apiKey);
  return {
    name: "render",
    async load(): Promise<Record<string, string>> {
      const vars = await c.listEnvVars(serviceId);
      return Object.fromEntries(vars.map((v) => [v.key, v.value]));
    },
  };
}
