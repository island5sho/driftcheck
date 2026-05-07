import { EnvMap, Provider } from "./types";

export interface SSMParamStoreClient {
  getParametersByPath(params: {
    Path: string;
    Recursive: boolean;
    WithDecryption: boolean;
    NextToken?: string;
  }): Promise<{
    Parameters?: Array<{ Name?: string; Value?: string }>;
    NextToken?: string;
  }>;
}

export interface SSMParamStoreProviderOptions {
  path: string;
  client: SSMParamStoreClient;
  stripPath?: boolean;
}

export function createSSMParamStoreProvider(
  options: SSMParamStoreProviderOptions
): Provider {
  const { path, client, stripPath = true } = options;

  return {
    name: `ssm-param-store:${path}`,
    async load(): Promise<EnvMap> {
      const result: EnvMap = {};
      let nextToken: string | undefined;

      do {
        const response = await client.getParametersByPath({
          Path: path,
          Recursive: true,
          WithDecryption: true,
          ...(nextToken ? { NextToken: nextToken } : {}),
        });

        for (const param of response.Parameters ?? []) {
          if (!param.Name || param.Value === undefined) continue;
          const key = stripPath
            ? param.Name.replace(path.endsWith("/") ? path : `${path}/`, "")
            : param.Name;
          result[key] = param.Value;
        }

        nextToken = response.NextToken;
      } while (nextToken);

      return result;
    },
  };
}
