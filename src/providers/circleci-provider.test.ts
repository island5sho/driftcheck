import { describe, it, expect, vi } from "vitest";
import { createCircleCIProvider } from "./circleci-provider";
import type { EnvMap } from "./types";

function makeClient(vars: Array<{ name: string; value: string }>) {
  return {
    getProjectEnvVars: vi.fn().mockResolvedValue(vars),
  };
}

describe("createCircleCIProvider", () => {
  it("returns a provider named 'circleci'", () => {
    const client = makeClient([]);
    const provider = createCircleCIProvider({ projectSlug: "gh/org/repo", client });
    expect(provider.name).toBe("circleci");
  });

  it("loads env vars into an EnvMap", async () => {
    const client = makeClient([
      { name: "API_KEY", value: "abc123" },
      { name: "DB_URL", value: "postgres://localhost/db" },
    ]);
    const provider = createCircleCIProvider({ projectSlug: "gh/org/repo", client });
    const result: EnvMap = await provider.load();
    expect(result).toEqual({
      API_KEY: "abc123",
      DB_URL: "postgres://localhost/db",
    });
  });

  it("returns empty map when no env vars exist", async () => {
    const client = makeClient([]);
    const provider = createCircleCIProvider({ projectSlug: "gh/org/repo", client });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("passes the correct projectSlug to the client", async () => {
    const client = makeClient([{ name: "FOO", value: "bar" }]);
    const provider = createCircleCIProvider({ projectSlug: "gh/myorg/myrepo", client });
    await provider.load();
    expect(client.getProjectEnvVars).toHaveBeenCalledWith("gh/myorg/myrepo");
  });

  it("preserves masked values (xxxx) from CircleCI", async () => {
    const client = makeClient([
      { name: "SECRET", value: "xxxx" },
      { name: "VISIBLE", value: "plain-value" },
    ]);
    const provider = createCircleCIProvider({ projectSlug: "gh/org/repo", client });
    const result = await provider.load();
    expect(result["SECRET"]).toBe("xxxx");
    expect(result["VISIBLE"]).toBe("plain-value");
  });

  it("propagates errors from the client", async () => {
    const client = {
      getProjectEnvVars: vi.fn().mockRejectedValue(new Error("CircleCI API error: 401 Unauthorized")),
    };
    const provider = createCircleCIProvider({ projectSlug: "gh/org/repo", client });
    await expect(provider.load()).rejects.toThrow("CircleCI API error: 401 Unauthorized");
  });
});
