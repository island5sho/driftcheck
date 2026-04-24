import {
  SecretsManagerClient,
  ListSecretsCommand,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import type { EnvMap, Provider, ProviderOptions } from "./types";

export interface AwsSecretsOptions extends ProviderOptions {
  region?: string;
  pathPrefix?: string;
  client?: SecretsManagerClient;
}

export class AwsSecretsProvider implements Provider {
  readonly name = "aws-secrets";
  private client: SecretsManagerClient;
  private pathPrefix: string;

  constructor(private options: AwsSecretsOptions = {}) {
    this.client =
      options.client ??
      new SecretsManagerClient({ region: options.region ?? "us-east-1" });
    this.pathPrefix = options.pathPrefix ?? "";
  }

  async load(): Promise<EnvMap> {
    const envMap: EnvMap = {};

    const listResponse = await this.client.send(
      new ListSecretsCommand({
        Filters: this.pathPrefix
          ? [{ Key: "name", Values: [this.pathPrefix] }]
          : undefined,
      })
    );

    const secrets = listResponse.SecretList ?? [];

    await Promise.all(
      secrets.map(async (secret) => {
        if (!secret.Name) return;
        try {
          const valueResponse = await this.client.send(
            new GetSecretValueCommand({ SecretId: secret.Name })
          );
          const raw = valueResponse.SecretString;
          if (!raw) return;
          const key = this.pathPrefix
            ? secret.Name.replace(this.pathPrefix, "").replace(/^\//, "")
            : secret.Name;
          envMap[key] = raw;
        } catch {
          // skip inaccessible secrets
        }
      })
    );

    return envMap;
  }
}
