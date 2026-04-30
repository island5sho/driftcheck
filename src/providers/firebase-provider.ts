import type { EnvProvider, EnvMap } from "./types";

export interface FirebaseRemoteConfigClient {
  getTemplate(): Promise<{ parameters: Record<string, { defaultValue?: { value?: string } }> }>;
}

export interface FirebaseProviderOptions {
  client: FirebaseRemoteConfigClient;
  prefix?: string;
}

export function createFirebaseProvider(options: FirebaseProviderOptions): EnvProvider {
  const { client, prefix = "" } = options;

  return {
    name: "firebase-remote-config",
    async load(): Promise<EnvMap> {
      const template = await client.getTemplate();
      const result: EnvMap = {};

      for (const [key, param] of Object.entries(template.parameters)) {
        if (prefix && !key.startsWith(prefix)) continue;

        const normalizedKey = prefix ? key.slice(prefix.length) : key;
        const value = param.defaultValue?.value;

        if (value !== undefined) {
          result[normalizedKey] = value;
        }
      }

      return result;
    },
  };
}
