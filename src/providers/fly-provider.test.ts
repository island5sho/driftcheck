import { describe, it, expect, vi } from "vitest";
import { createFlyProvider } from "./fly-provider";

function makeClient(secrets: { name: string; digest: string; created_at: string }[]) {
  return {
    get: vi.fn().mockResolvedValue({
      data: { secrets },
    }),
  };
}

describe("createFlyProvider", () => {
  it("returns provider with correct name", () => {
    const client = makeClient([]);
    const provider = createFlyProvider({ appName: "my-app", apiToken: "tok", client });
    expect(provider.name).toBe("fly:my-app");
  });

  it("loads secrets as name->digest map", async () => {
    const client = makeClient([
      { name: "DATABASE_URL", digest: "abc123", created_at: "2024-01-01T00:00:00Z" },
      { name: "API_KEY", digest: "def456", created_at: "2024-01-02T00:00:00Z" },
    ]);
    const provider = createFlyProvider({ appName: "my-app", apiToken: "tok", client });
    const result = await provider.load();
    expect(result).toEqual({
      DATABASE_URL: "abc123",
      API_KEY: "def456",
    });
  });

  it("calls the correct API endpoint with auth header", async () => {
    const client = makeClient([]);
    const provider = createFlyProvider({ appName: "test-app", apiToken: "my-token", client });
    await provider.load();
    expect(client.get).toHaveBeenCalledWith(
      "https://api.fly.io/v1/apps/test-app/secrets",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-token",
        }),
      })
    );
  });

  it("returns empty map when secrets list is empty", async () => {
    const client = makeClient([]);
    const provider = createFlyProvider({ appName: "empty-app", apiToken: "tok", client });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("throws when API returns an error", async () => {
    const client = {
      get: vi.fn().mockRejectedValue(new Error("Fly.io API error: 401 Unauthorized")),
    };
    const provider = createFlyProvider({ appName: "my-app", apiToken: "bad-token", client });
    await expect(provider.load()).rejects.toThrow("Fly.io API error: 401 Unauthorized");
  });
});
