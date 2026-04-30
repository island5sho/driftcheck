import type { EnvMap, Provider } from "./types";

export interface EtcdClient {
  getAll(prefix: string): Promise<{ kvs: Array<{ key: string; value: string }> }>;
}

export interface EtcdProviderOptions {
  prefix?: string;
  stripPrefix?: boolean;
}

function defaultClient(): EtcdClient {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Etcd3 } = require("etcd3");
  return new Etcd3();
}

export function createEtcdProvider(
  client: EtcdClient = defaultClient(),
  options: EtcdProviderOptions = {}
): Provider {
  const prefix = options.prefix ?? "/config/";
  const stripPrefix = options.stripPrefix ?? true;

  return {
    name: "etcd",
    async load(): Promise<EnvMap> {
      const result = await client.getAll(prefix);
      const env: EnvMap = {};

      for (const kv of result.kvs) {
        let key = kv.key;
        if (stripPrefix && key.startsWith(prefix)) {
          key = key.slice(prefix.length);
        }
        // Normalize slashes to underscores for env var naming
        const normalized = key.replace(/\//g, "_").toUpperCase();
        env[normalized] = kv.value;
      }

      return env;
    },
  };
}
