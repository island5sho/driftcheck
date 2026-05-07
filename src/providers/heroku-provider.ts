import type { EnvMap, Provider } from "./types";

interface HerokuClient {
  get(path: string): Promise<{ body: unknown }>;
}

interface HerokuConfigVar {
  [key: string]: string;
}

function defaultClient(apiToken: string): HerokuClient {
  return {
    async get(path: string) {
      const res = await fetch(`https://api.heroku.com${path}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/vnd.heroku+json; version=3",
        },
      });
      if (!res.ok) {
        throw new Error(`Heroku API error: ${res.status} ${res.statusText}`);
      }
      const body = await res.json();
      return { body };
    },
  };
}

export interface HerokuProviderOptions {
  appName: string;
  apiToken?: string;
  client?: HerokuClient;
}

export function createHerokuProvider(options: HerokuProviderOptions): Provider {
  const { appName, apiToken, client } = options;
  const httpClient =
    client ??
    defaultClient(apiToken ?? process.env.HEROKU_API_TOKEN ?? "");

  return {
    name: "heroku",
    async load(): Promise<EnvMap> {
      const { body } = await httpClient.get(
        `/apps/${encodeURIComponent(appName)}/config-vars`
      );
      const vars = body as HerokuConfigVar;
      const result: EnvMap = {};
      for (const [key, value] of Object.entries(vars)) {
        result[key] = String(value);
      }
      return result;
    },
  };
}
