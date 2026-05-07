import { describe, it, expect, vi } from "vitest";
import { createHerokuProvider } from "./heroku-provider";

function makeClient(vars: Record<string, string>) {
  return {
    get: vi.fn().mockResolvedValue({ body: vars }),
  };
}

describe("createHerokuProvider", () => {
  it("loads config vars from Heroku API", async () => {
    const client = makeClient({
      DATABASE_URL: "postgres://localhost/mydb",
      SECRET_KEY: "abc123",
    });
    const provider = createHerokuProvider({ appName: "my-app", client });
    const result = await provider.load();
    expect(result).toEqual({
      DATABASE_URL: "postgres://localhost/mydb",
      SECRET_KEY: "abc123",
    });
    expect(client.get).toHaveBeenCalledWith("/apps/my-app/config-vars");
  });

  it("returns empty map when no config vars exist", async () => {
    const client = makeClient({});
    const provider = createHerokuProvider({ appName: "empty-app", client });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("encodes special characters in app name", async () => {
    const client = makeClient({ FOO: "bar" });
    const provider = createHerokuProvider({
      appName: "my app/test",
      client,
    });
    await provider.load();
    expect(client.get).toHaveBeenCalledWith(
      `/apps/${encodeURIComponent("my app/test")}/config-vars`
    );
  });

  it("throws when API returns an error", async () => {
    const client = {
      get: vi.fn().mockRejectedValue(new Error("Heroku API error: 401 Unauthorized")),
    };
    const provider = createHerokuProvider({ appName: "my-app", client });
    await expect(provider.load()).rejects.toThrow("Heroku API error: 401");
  });

  it("has correct provider name", () => {
    const client = makeClient({});
    const provider = createHerokuProvider({ appName: "my-app", client });
    expect(provider.name).toBe("heroku");
  });
});
