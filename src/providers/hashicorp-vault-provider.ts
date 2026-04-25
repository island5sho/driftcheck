import { EnvMap, Provider } from "./types";

export interface VaultClientLike {
  read(path: string): Promise<{ data: Record<string, unknown> } | null>;
}

export interface HashiCorpVaultProviderOptions {
  client: VaultClientLike;
  secretPaths: string[];
  /**
   * Optional key prefix to strip from the secret path when building env var names.
   * e.g. secretPath = "secret/data/myapp", prefix = "secret/data/" → key base = "myapp"
   */
  pathPrefix?: string;
}

/**
 * Reads secrets from one or more HashiCorp Vault KV paths and merges them
 * into a flat EnvMap.  Each key in the KV secret becomes an entry.
 */
export class HashiCorpVaultProvider implements Provider {
  readonly name = "hashicorp-vault";

  constructor(private readonly options: HashiCorpVaultProviderOptions) {}

  async load(): Promise<EnvMap> {
    const result: EnvMap = {};

    for (const secretPath of this.options.secretPaths) {
      let response: { data: Record<string, unknown> } | null;

      try {
        response = await this.options.client.read(secretPath);
      } catch (err) {
        throw new Error(
          `HashiCorpVaultProvider: failed to read path "${secretPath}": ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }

      if (!response) {
        continue;
      }

      for (const [key, value] of Object.entries(response.data)) {
        if (typeof value === "string") {
          result[key] = value;
        } else if (value !== null && value !== undefined) {
          result[key] = String(value);
        }
      }
    }

    return result;
  }
}
