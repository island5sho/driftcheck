import { describe, it, expect, vi } from "vitest";
import { createConsulProvider } from "./consul-provider";
import type { ConsulKVClient } from "./consul-provider";

function makeClient(entries: Array<{ Key: string; Value: string | null }>): ConsulKVClient {
  return {
    list: vi.fn().mockResolvedValue(entries),
  };
}

function b64(s: string) {
  return Buffer.from(s).toString("base64");
}

describe("ConsulProvider", () => {
  it("loads and normalises keys from KV store", async () => {
    const client = makeClient([
      { Key: "config/database/host", Value: b64("localhost") },
      { Key: "config/database/port", Value: b64("5432") },
      { Key: "config/app/debug", Value: b64("true") },
    ]);
    const provider = createConsulProvider({ prefix: "config/" }, client);
    const result = await provider.load();
    expect(result).toEqual({
      DATABASE_HOST: "localhost",
      DATABASE_PORT: "5432",
      APP_DEBUG: "true",
    });
  });

  it("returns empty map when prefix not found (404)", async () => {
    const client = makeClient([]);
    const provider = createConsulProvider({ prefix: "missing/" }, client);
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("handles null values as empty string", async () => {
    const client = makeClient([{ Key: "config/empty", Value: null }]);
    const provider = createConsulProvider({ prefix: "config/" }, client);
    const result = await provider.load();
    expect(result).toEqual({ EMPTY: "" });
  });

  it("throws when client rejects", async () => {
    const client: ConsulKVClient = {
      list: vi.fn().mockRejectedValue(new Error("connection refused")),
    };
    const provider = createConsulProvider({}, client);
    await expect(provider.load()).rejects.toThrow("connection refused");
  });

  it("exposes name as 'consul'", () => {
    const provider = createConsulProvider({}, makeClient([]));
    expect(provider.name).toBe("consul");
  });
});
