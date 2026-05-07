import type { EnvProvider } from "./types";

interface RailwayVariable {
  name: string;
  value: string;
}

interface RailwayClient {
  getVariables(projectId: string, environmentId: string): Promise<RailwayVariable[]>;
}

function defaultClient(apiToken: string): RailwayClient {
  return {
    async getVariables(projectId: string, environmentId: string): Promise<RailwayVariable[]> {
      const query = `
        query Variables($projectId: String!, $environmentId: String!) {
          variables(projectId: $projectId, environmentId: $environmentId) {
            edges { node { name value } }
          }
        }
      `;
      const res = await fetch("https://backboard.railway.app/graphql/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ query, variables: { projectId, environmentId } }),
      });
      if (!res.ok) {
        throw new Error(`Railway API error: ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as {
        data: { variables: { edges: { node: RailwayVariable }[] } };
      };
      return json.data.variables.edges.map((e) => e.node);
    },
  };
}

export interface RailwayProviderOptions {
  apiToken: string;
  projectId: string;
  environmentId: string;
  client?: RailwayClient;
}

export function createRailwayProvider(options: RailwayProviderOptions): EnvProvider {
  const client = options.client ?? defaultClient(options.apiToken);

  return {
    name: "railway",
    async load(): Promise<Record<string, string>> {
      const variables = await client.getVariables(
        options.projectId,
        options.environmentId
      );
      return Object.fromEntries(variables.map((v) => [v.name, v.value]));
    },
  };
}
