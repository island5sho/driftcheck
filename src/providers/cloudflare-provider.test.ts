import { describe, it, expect, vi } from "vitest";
import { createCloudflareProvider } from "./cloudflare-provider";

function makeClient(secrets: Record<string, string>) {
  return {
    listSecrets: vi.fn().mockResolvedValue(
      Object.keys(secrets).map((name) => ({
        name,
        type: "secret_text",
        created_on: "2024-01-01T00:00:00Z",
        modified_on: "2024-01-01T00:00:00Z",
      }))
    ),
    getSecret: vi.fn().mockImplementation((_accountId, _scriptName, name: string) =>
      Promise.resolve({ value: secrets[name] ?? "" })
    ),
  };
}

describe("createCloudflareProvider", () => {
  it("loads secrets from a Cloudflare Worker script", async () => {
    const client = makeClient({ DB_URL: "postgres://prod", API_KEY: "abc123" });
    const provider = createCloudflareProvider({
      accountId: "acct-1",
      scriptName: "my-worker",
      client,
    });

    expect(provider.name).toBe("cloudflare");
    const result = await provider.load();
    expect(result).toEqual({ DB_URL: "postgres://prod", API_KEY: "abc123" });
    expect(client.listSecrets).toHaveBeenCalledWith("acct-1", "my-worker");
    expect(client.getSecret).toHaveBeenCalledWith("acct-1", "my-worker", "DB_URL");
    expect(client.getSecret).toHaveBeenCalledWith("acct-1", "my-worker", "API_KEY");
  });

  it("returns an empty map when there are no secrets", async () => {
    const client = makeClient({});
    const provider = createCloudflareProvider({
      accountId: "acct-1",
      scriptName: "empty-worker",
      client,
    });

    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("throws when the API returns an error", async () => {
    const client = {
      listSecrets: vi.fn().mockRejectedValue(new Error("Cloudflare API error: 403 Forbidden")),
      getSecret: vi.fn(),
    };
    const provider = createCloudflareProvider({
      accountId: "acct-bad",
      scriptName: "my-worker",
      client,
    });

    await expect(provider.load()).rejects.toThrow("Cloudflare API error: 403 Forbidden");
  });
});
