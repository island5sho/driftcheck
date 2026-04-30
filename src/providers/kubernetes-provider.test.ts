import { describe, it, expect, vi } from "vitest";
import { createKubernetesProvider, type KubernetesClient } from "./kubernetes-provider";

function makeClient(overrides: Partial<KubernetesClient> = {}): KubernetesClient {
  return {
    readNamespacedSecret: vi.fn().mockResolvedValue({ body: { data: {} } }),
    readNamespacedConfigMap: vi.fn().mockResolvedValue({ body: { data: {} } }),
    ...overrides,
  };
}

describe("createKubernetesProvider", () => {
  it("returns provider with name 'kubernetes'", () => {
    const provider = createKubernetesProvider({ client: makeClient() });
    expect(provider.name).toBe("kubernetes");
  });

  it("loads and decodes base64 secret values", async () => {
    const client = makeClient({
      readNamespacedSecret: vi.fn().mockResolvedValue({
        body: {
          data: {
            DB_PASSWORD: Buffer.from("s3cr3t").toString("base64"),
            API_KEY: Buffer.from("abc123").toString("base64"),
          },
        },
      }),
    });
    const provider = createKubernetesProvider({ client, secretName: "my-secret" });
    const result = await provider.load();
    expect(result).toEqual({ DB_PASSWORD: "s3cr3t", API_KEY: "abc123" });
  });

  it("loads configmap values as plain strings", async () => {
    const client = makeClient({
      readNamespacedConfigMap: vi.fn().mockResolvedValue({
        body: { data: { LOG_LEVEL: "info", REGION: "us-east-1" } },
      }),
    });
    const provider = createKubernetesProvider({ client, configMapName: "my-config" });
    const result = await provider.load();
    expect(result).toEqual({ LOG_LEVEL: "info", REGION: "us-east-1" });
  });

  it("merges secret and configmap values", async () => {
    const client = makeClient({
      readNamespacedSecret: vi.fn().mockResolvedValue({
        body: { data: { DB_PASSWORD: Buffer.from("pass").toString("base64") } },
      }),
      readNamespacedConfigMap: vi.fn().mockResolvedValue({
        body: { data: { LOG_LEVEL: "debug" } },
      }),
    });
    const provider = createKubernetesProvider({
      client,
      secretName: "app-secret",
      configMapName: "app-config",
      namespace: "production",
    });
    const result = await provider.load();
    expect(result).toEqual({ DB_PASSWORD: "pass", LOG_LEVEL: "debug" });
  });

  it("uses default namespace when not specified", async () => {
    const client = makeClient();
    const provider = createKubernetesProvider({ client, secretName: "my-secret" });
    await provider.load();
    expect(client.readNamespacedSecret).toHaveBeenCalledWith("my-secret", "default");
  });

  it("handles missing data fields gracefully", async () => {
    const client = makeClient({
      readNamespacedSecret: vi.fn().mockResolvedValue({ body: {} }),
      readNamespacedConfigMap: vi.fn().mockResolvedValue({ body: {} }),
    });
    const provider = createKubernetesProvider({
      client,
      secretName: "empty-secret",
      configMapName: "empty-config",
    });
    const result = await provider.load();
    expect(result).toEqual({});
  });
});
