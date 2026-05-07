import { describe, it, expect, vi } from "vitest";
import { createRailwayProvider } from "./railway-provider";

function makeClient(vars: Record<string, string>) {
  return {
    getVariables: vi.fn().mockResolvedValue(
      Object.entries(vars).map(([name, value]) => ({ name, value }))
    ),
  };
}

describe("createRailwayProvider", () => {
  it("returns provider with name 'railway'", () => {
    const client = makeClient({});
    const provider = createRailwayProvider({
      apiToken: "tok",
      projectId: "proj-1",
      environmentId: "env-1",
      client,
    });
    expect(provider.name).toBe("railway");
  });

  it("loads variables from client and returns flat record", async () => {
    const client = makeClient({ DB_URL: "postgres://localhost", PORT: "3000" });
    const provider = createRailwayProvider({
      apiToken: "tok",
      projectId: "proj-1",
      environmentId: "env-staging",
      client,
    });
    const result = await provider.load();
    expect(result).toEqual({ DB_URL: "postgres://localhost", PORT: "3000" });
    expect(client.getVariables).toHaveBeenCalledWith("proj-1", "env-staging");
  });

  it("returns empty record when no variables exist", async () => {
    const client = makeClient({});
    const provider = createRailwayProvider({
      apiToken: "tok",
      projectId: "proj-2",
      environmentId: "env-prod",
      client,
    });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("propagates errors from the client", async () => {
    const client = {
      getVariables: vi.fn().mockRejectedValue(new Error("Railway API error: 401 Unauthorized")),
    };
    const provider = createRailwayProvider({
      apiToken: "bad-token",
      projectId: "proj-1",
      environmentId: "env-1",
      client,
    });
    await expect(provider.load()).rejects.toThrow("Railway API error: 401 Unauthorized");
  });
});
