import { describe, it, expect, vi } from "vitest";
import type { GitLabClient } from "./gitlab-provider";
import { createGitLabProvider } from "./gitlab-provider";

function makeClient(vars: { key: string; value: string }[]): GitLabClient {
  return {
    listVariables: vi.fn().mockResolvedValue(vars),
  };
}

describe("createGitLabProvider", () => {
  it("returns a provider with the correct name", () => {
    const client = makeClient([]);
    const provider = createGitLabProvider({
      projectId: "myorg/myrepo",
      environment: "production",
      client,
    });
    expect(provider.name).toBe("gitlab:myorg/myrepo:production");
  });

  it("loads variables into an EnvMap", async () => {
    const client = makeClient([
      { key: "DB_URL", value: "postgres://prod" },
      { key: "API_KEY", value: "secret-prod" },
    ]);
    const provider = createGitLabProvider({
      projectId: "myorg/myrepo",
      environment: "production",
      client,
    });
    const result = await provider.load();
    expect(result).toEqual({
      DB_URL: "postgres://prod",
      API_KEY: "secret-prod",
    });
  });

  it("returns an empty map when no variables exist", async () => {
    const client = makeClient([]);
    const provider = createGitLabProvider({
      projectId: "myorg/myrepo",
      environment: "staging",
      client,
    });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("calls listVariables with the correct project and environment", async () => {
    const client = makeClient([{ key: "FOO", value: "bar" }]);
    const provider = createGitLabProvider({
      projectId: "ns/proj",
      environment: "staging",
      client,
    });
    await provider.load();
    expect(client.listVariables).toHaveBeenCalledWith("ns/proj", "staging");
  });

  it("throws when the client rejects", async () => {
    const client: GitLabClient = {
      listVariables: vi.fn().mockRejectedValue(new Error("GitLab API error: 401 Unauthorized")),
    };
    const provider = createGitLabProvider({
      projectId: "ns/proj",
      environment: "production",
      client,
    });
    await expect(provider.load()).rejects.toThrow("401 Unauthorized");
  });
});
