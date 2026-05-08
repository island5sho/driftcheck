import type { EnvMap, Provider } from "./types";

export interface GitLabClient {
  listVariables(projectId: string, environment: string): Promise<{ key: string; value: string }[]>;
}

function defaultClient(token: string): GitLabClient {
  return {
    async listVariables(projectId: string, environment: string) {
      const url = `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/variables?filter[environment_scope]=${encodeURIComponent(environment)}`;
      const res = await fetch(url, {
        headers: { "PRIVATE-TOKEN": token },
      });
      if (!res.ok) {
        throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as { key: string; value: string }[];
      return data;
    },
  };
}

export interface GitLabProviderOptions {
  projectId: string;
  environment: string;
  token?: string;
  client?: GitLabClient;
}

export function createGitLabProvider(options: GitLabProviderOptions): Provider {
  const { projectId, environment } = options;
  const client =
    options.client ??
    defaultClient(options.token ?? process.env.GITLAB_TOKEN ?? "");

  return {
    name: `gitlab:${projectId}:${environment}`,
    async load(): Promise<EnvMap> {
      const vars = await client.listVariables(projectId, environment);
      const map: EnvMap = {};
      for (const v of vars) {
        map[v.key] = v.value;
      }
      return map;
    },
  };
}
