import type { EnvMap, Provider } from "./types";

export interface PulumiClient {
  getStackOutputs(org: string, project: string, stack: string): Promise<Record<string, unknown>>;
}

export interface PulumiProviderOptions {
  org: string;
  project: string;
  stack: string;
  client: PulumiClient;
  prefix?: string;
}

function flattenOutputs(
  outputs: Record<string, unknown>,
  prefix: string,
  result: EnvMap = {}
): EnvMap {
  for (const [key, value] of Object.entries(outputs)) {
    const fullKey = prefix ? `${prefix}_${key}`.toUpperCase() : key.toUpperCase();
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      flattenOutputs(value as Record<string, unknown>, fullKey, result);
    } else {
      result[fullKey] = String(value ?? "");
    }
  }
  return result;
}

export function createPulumiProvider(options: PulumiProviderOptions): Provider {
  const { org, project, stack, client, prefix = "" } = options;

  return {
    name: `pulumi:${org}/${project}/${stack}`,
    async load(): Promise<EnvMap> {
      const outputs = await client.getStackOutputs(org, project, stack);
      return flattenOutputs(outputs, prefix);
    },
  };
}
