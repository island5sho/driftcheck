import { describe, it, expect, vi } from "vitest";
import { createRenderProvider } from "./render-provider";

function makeClient(vars: Record<string, string>) {
  return {
    listEnvVars: vi.fn().mockResolvedValue(
      Object.entries(vars).map(([key, value]) => ({ key, value }))
    ),
  };
}

describe("createRenderProvider", () => {
  it("returns provider with name 'render'", () => {
    const client = makeClient({});
    const provider = createRenderProvider("svc-123", "key", client);
    expect(provider.name).toBe("render");
  });

  it("loads env vars from client", async () => {
    const client = makeClient({ NODE_ENV: "production", PORT: "3000" });
    const provider = createRenderProvider("svc-123", "key", client);
    const result = await provider.load();
    expect(result).toEqual({ NODE_ENV: "production", PORT: "3000" });
  });

  it("returns empty object when no vars", async () => {
    const client = makeClient({});
    const provider = createRenderProvider("svc-abc", "key", client);
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("calls listEnvVars with the correct serviceId", async () => {
    const client = makeClient({ FOO: "bar" });
    const provider = createRenderProvider("svc-xyz", "key", client);
    await provider.load();
    expect(client.listEnvVars).toHaveBeenCalledWith("svc-xyz");
  });

  it("propagates errors from client", async () => {
    const client = {
      listEnvVars: vi.fn().mockRejectedValue(new Error("Render API error: 401 Unauthorized")),
    };
    const provider = createRenderProvider("svc-fail", "bad-key", client);
    await expect(provider.load()).rejects.toThrow("Render API error: 401 Unauthorized");
  });
});
