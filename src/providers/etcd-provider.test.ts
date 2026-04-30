import { createEtcdProvider, EtcdClient } from "./etcd-provider";

function makeClient(kvs: Array<{ key: string; value: string }>): EtcdClient {
  return {
    getAll: async (_prefix: string) => ({ kvs }),
  };
}

describe("EtcdProvider", () => {
  it("loads key-value pairs from etcd", async () => {
    const client = makeClient([
      { key: "/config/DB_HOST", value: "localhost" },
      { key: "/config/DB_PORT", value: "5432" },
    ]);
    const provider = createEtcdProvider(client, { prefix: "/config/" });
    const result = await provider.load();
    expect(result).toEqual({ DB_HOST: "localhost", DB_PORT: "5432" });
  });

  it("strips prefix by default", async () => {
    const client = makeClient([{ key: "/config/API_KEY", value: "secret" }]);
    const provider = createEtcdProvider(client, { prefix: "/config/" });
    const result = await provider.load();
    expect(result["API_KEY"]).toBe("secret");
    expect(Object.keys(result)).not.toContain("/config/API_KEY");
  });

  it("does not strip prefix when stripPrefix is false", async () => {
    const client = makeClient([{ key: "/config/API_KEY", value: "secret" }]);
    const provider = createEtcdProvider(client, {
      prefix: "/config/",
      stripPrefix: false,
    });
    const result = await provider.load();
    expect(result["/CONFIG/API_KEY"]).toBe("secret");
  });

  it("normalizes slashes to underscores", async () => {
    const client = makeClient([
      { key: "/config/database/host", value: "db.internal" },
    ]);
    const provider = createEtcdProvider(client, { prefix: "/config/" });
    const result = await provider.load();
    expect(result["DATABASE_HOST"]).toBe("db.internal");
  });

  it("returns empty map when no keys exist", async () => {
    const client = makeClient([]);
    const provider = createEtcdProvider(client);
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("has correct provider name", () => {
    const client = makeClient([]);
    const provider = createEtcdProvider(client);
    expect(provider.name).toBe("etcd");
  });
});
