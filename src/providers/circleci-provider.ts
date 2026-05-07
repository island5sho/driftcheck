import type { EnvMap, Provider } from "./types";

interface CircleCIClient {
  getProjectEnvVars(projectSlug: string): Promise<Array<{ name: string; value: string }>>;
}

interface CircleCIEnvVar {
  name: string;
  value: string;
}

function defaultClient(token: string): CircleCIClient {
  return {
    async getProjectEnvVars(projectSlug: string) {
      const url = `https://circleci.com/api/v2/project/${projectSlug}/envvar`;
      const res = await fetch(url, {
        headers: {
          "Circle-Token": token,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`CircleCI API error: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as { items: CircleCIEnvVar[] };
      return data.items;
    },
  };
}

export interface CircleCIProviderOptions {
  projectSlug: string;
  token?: string;
  client?: CircleCIClient;
}

export function createCircleCIProvider(options: CircleCIProviderOptions): Provider {
  const { projectSlug, token, client } = options;
  const resolvedClient =
    client ??
    defaultClient(token ?? process.env.CIRCLECI_TOKEN ?? "");

  return {
    name: "circleci",
    async load(): Promise<EnvMap> {
      const vars = await resolvedClient.getProjectEnvVars(projectSlug);
      const result: EnvMap = {};
      for (const { name, value } of vars) {
        // CircleCI masks secret values with "xxxx"; we store as-is
        result[name] = value;
      }
      return result;
    },
  };
}
