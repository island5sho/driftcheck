import { describe, it, expect, vi } from "vitest";
import { DopplerProvider } from "./doppler-provider";
import type { DopplerClient } from "./doppler-provider";

function makeClient(secrets: Record<string, string>): DopplerClient {
  return {
    secrets: {
      list: vi.fn().mockResolvedValue({
        secrets: Object.fromEntries(
          Object.entries(secrets).map(([k, v]) => [k, { raw: v }])
        ),
      }),
    },
  };
}

describe("DopplerProvider", () => {
  it("returns name 'doppler'", () => {
    const provider = new DopplerProvider({
      project: "my-project",
      config: "production",
      client: makeClient({}),
    });
    expect(provider.name).toBe("doppler");
  });

  it("fetches and maps secrets to EnvMap", async () => {
    const client = makeClient({ API_KEY: "abc123", DB_URL: "postgres://localhost" });
    const provider = new DopplerProvider({
      project: "my-project",
      config: "production",
      client,
    });

    const env = await provider.getEnv();
    expect(env).toEqual({ API_KEY: "abc123", DB_URL: "postgres://localhost" });
  });

  it("calls list with correct project and config", async () => {
    const client = makeClient({ FOO: "bar" });
    const provider = new DopplerProvider({
      project: "test-project",
      config: "staging",
      client,
    });

    await provider.getEnv();
    expect(client.secrets.list).toHaveBeenCalledWith({
      project: "test-project",
      config: "staging",
    });
  });

  it("returns empty map when no secrets exist", async () => {
    const provider = new DopplerProvider({
      project: "empty-project",
      config: "staging",
      client: makeClient({}),
    });

    const env = await provider.getEnv();
    expect(env).toEqual({});
  });

  it("propagates errors from the client", async () => {
    const client: DopplerClient = {
      secrets: {
        list: vi.fn().mockRejectedValue(new Error("Unauthorized")),
      },
    };
    const provider = new DopplerProvider({
      project: "my-project",
      config: "production",
      client,
    });

    await expect(provider.getEnv()).rejects.toThrow("Unauthorized");
  });
});
