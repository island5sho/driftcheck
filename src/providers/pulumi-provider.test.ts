import { describe, it, expect, vi } from "vitest";
import { createPulumiProvider, type PulumiClient } from "./pulumi-provider";

function makeClient(outputs: Record<string, unknown>): PulumiClient {
  return {
    getStackOutputs: vi.fn().mockResolvedValue(outputs),
  };
}

describe("createPulumiProvider", () => {
  it("returns provider with correct name", () => {
    const client = makeClient({});
    const provider = createPulumiProvider({ org: "acme", project: "api", stack: "prod", client });
    expect(provider.name).toBe("pulumi:acme/api/prod");
  });

  it("loads flat outputs as uppercased keys", async () => {
    const client = makeClient({ dbUrl: "postgres://localhost", port: 5432 });
    const provider = createPulumiProvider({ org: "acme", project: "api", stack: "prod", client });
    const env = await provider.load();
    expect(env).toEqual({ DBURL: "postgres://localhost", PORT: "5432" });
  });

  it("flattens nested outputs with underscore separator", async () => {
    const client = makeClient({ database: { host: "localhost", port: 5432 } });
    const provider = createPulumiProvider({ org: "acme", project: "api", stack: "prod", client });
    const env = await provider.load();
    expect(env).toEqual({ DATABASE_HOST: "localhost", DATABASE_PORT: "5432" });
  });

  it("applies prefix to top-level keys", async () => {
    const client = makeClient({ region: "us-east-1" });
    const provider = createPulumiProvider({
      org: "acme", project: "api", stack: "prod", client, prefix: "AWS",
    });
    const env = await provider.load();
    expect(env).toEqual({ AWS_REGION: "us-east-1" });
  });

  it("handles null values as empty string", async () => {
    const client = makeClient({ secret: null });
    const provider = createPulumiProvider({ org: "acme", project: "api", stack: "prod", client });
    const env = await provider.load();
    expect(env).toEqual({ SECRET: "" });
  });

  it("calls getStackOutputs with correct arguments", async () => {
    const client = makeClient({});
    const provider = createPulumiProvider({ org: "myorg", project: "myproj", stack: "staging", client });
    await provider.load();
    expect(client.getStackOutputs).toHaveBeenCalledWith("myorg", "myproj", "staging");
  });

  it("propagates errors from client", async () => {
    const client: PulumiClient = {
      getStackOutputs: vi.fn().mockRejectedValue(new Error("unauthorized")),
    };
    const provider = createPulumiProvider({ org: "acme", project: "api", stack: "prod", client });
    await expect(provider.load()).rejects.toThrow("unauthorized");
  });
});
