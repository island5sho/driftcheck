import { describe, it, expect, vi } from "vitest";
import { createNomadProvider, type NomadClient } from "./nomad-provider";

function makeClient(data: Record<string, string>): NomadClient {
  return {
    get: vi.fn().mockResolvedValue({ data }),
  };
}

describe("createNomadProvider", () => {
  it("loads variables from the given path", async () => {
    const client = makeClient({ DB_HOST: "localhost", DB_PORT: "5432" });
    const provider = createNomadProvider({ path: "nomad/jobs/myapp", client });

    const result = await provider.load();

    expect(result).toEqual({ DB_HOST: "localhost", DB_PORT: "5432" });
    expect(client.get).toHaveBeenCalledWith("nomad/jobs/myapp");
  });

  it("prefixes path with namespace when namespace is not 'default'", async () => {
    const client = makeClient({ API_KEY: "secret" });
    const provider = createNomadProvider({
      path: "jobs/api",
      namespace: "production",
      client,
    });

    await provider.load();

    expect(client.get).toHaveBeenCalledWith("production/jobs/api");
  });

  it("does not prefix path when namespace is 'default'", async () => {
    const client = makeClient({});
    const provider = createNomadProvider({
      path: "jobs/api",
      namespace: "default",
      client,
    });

    await provider.load();

    expect(client.get).toHaveBeenCalledWith("jobs/api");
  });

  it("sets provider name including namespace and path", () => {
    const client = makeClient({});
    const provider = createNomadProvider({
      path: "jobs/myapp",
      namespace: "staging",
      client,
    });

    expect(provider.name).toBe("nomad:staging:jobs/myapp");
  });

  it("returns empty map when no variables exist", async () => {
    const client = makeClient({});
    const provider = createNomadProvider({ path: "jobs/empty", client });

    const result = await provider.load();

    expect(result).toEqual({});
  });

  it("throws when client request fails", async () => {
    const client: NomadClient = {
      get: vi.fn().mockRejectedValue(new Error("Nomad request failed: 403 Forbidden")),
    };
    const provider = createNomadProvider({ path: "jobs/restricted", client });

    await expect(provider.load()).rejects.toThrow("403 Forbidden");
  });
});
