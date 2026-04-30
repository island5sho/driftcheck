import type { EnvMap, Provider } from "./types";

export interface KubernetesClient {
  readNamespacedSecret(name: string, namespace: string): Promise<{
    body: { data?: Record<string, string> }
  }>;
  readNamespacedConfigMap(name: string, namespace: string): Promise<{
    body: { data?: Record<string, string> }
  }>;
}

export interface KubernetesProviderOptions {
  client: KubernetesClient;
  namespace?: string;
  secretName?: string;
  configMapName?: string;
}

export function createKubernetesProvider(options: KubernetesProviderOptions): Provider {
  const {
    client,
    namespace = "default",
    secretName,
    configMapName,
  } = options;

  return {
    name: "kubernetes",
    async load(): Promise<EnvMap> {
      const result: EnvMap = {};

      if (secretName) {
        const res = await client.readNamespacedSecret(secretName, namespace);
        const data = res.body.data ?? {};
        for (const [key, value] of Object.entries(data)) {
          // Kubernetes secrets are base64-encoded
          result[key] = Buffer.from(value, "base64").toString("utf-8");
        }
      }

      if (configMapName) {
        const res = await client.readNamespacedConfigMap(configMapName, namespace);
        const data = res.body.data ?? {};
        for (const [key, value] of Object.entries(data)) {
          result[key] = value;
        }
      }

      return result;
    },
  };
}
