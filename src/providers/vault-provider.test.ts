import { describe, it, expect, vi } from "vitest";
import { createVaultProvider, VaultClientLike } from "./vault-provider";

function makeClient(data: Record<string, unknown> | null): VaultClientLike {
  return {
    read: vi.fn().mockResolvedValue(
      data === null ? null : { data: { data: data } }
    ),
  };
}

describe("createVaultProvider", () => {
  it("loads key/value pairs from vault path", async () => {
    const client = makeClient({ API_KEY: "abc123", DB_URL: "postgres://localhost/db" });
    const provider = createVaultProvider({ client, path: "secret/data/myapp" });

    const result = await provider.load();

    expect(result).toEqual({
      API_KEY: "abc123",
      DB_URL: "postgres://localhost/db",
    });
    expect(client.read).toHaveBeenCalledWith("secret/data/myapp");
  });

  it("returns empty map when path not found", async () => {
    const client = makeClient(null);
    const provider = createVaultProvider({ client, path: "secret/data/missing" });

    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("coerces non-string values to strings", async () => {
    const client = makeClient({ PORT: 8080, ENABLED: true });
    const provider = createVaultProvider({ client, path: "secret/data/myapp" });

    const result = await provider.load();
    expect(result).toEqual({ PORT: "8080", ENABLED: "true" });
  });

  it("skips null and undefined values", async () => {
    const client = makeClient({ KEY: "value", NULLED: null, UNDEF: undefined });
    const provider = createVaultProvider({ client, path: "secret/data/myapp" });

    const result = await provider.load();
    expect(result).toEqual({ KEY: "value" });
  });

  it("exposes provider name as 'vault'", () => {
    const client = makeClient({});
    const provider = createVaultProvider({ client, path: "secret/data/myapp" });
    expect(provider.name).toBe("vault");
  });

  it("propagates errors thrown by the client", async () => {
    const client: VaultClientLike = {
      read: vi.fn().mockRejectedValue(new Error("Vault read failed: 403 Forbidden")),
    };
    const provider = createVaultProvider({ client, path: "secret/data/myapp" });
    await expect(provider.load()).rejects.toThrow("403 Forbidden");
  });
});
