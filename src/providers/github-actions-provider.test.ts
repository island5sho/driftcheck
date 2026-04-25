import { GitHubActionsProvider } from "./github-actions-provider";

describe("GitHubActionsProvider", () => {
  const sampleVars = {
    APP_ENV: "staging",
    APP_PORT: "3000",
    DATABASE_URL: "postgres://localhost/db",
    GITHUB_ACTIONS: "true",
    RUNNER_OS: "Linux",
  };

  it("loads all variables when no prefix is specified", async () => {
    const provider = new GitHubActionsProvider({ vars: sampleVars });
    const result = await provider.load();

    expect(result).toEqual({
      APP_ENV: "staging",
      APP_PORT: "3000",
      DATABASE_URL: "postgres://localhost/db",
      GITHUB_ACTIONS: "true",
      RUNNER_OS: "Linux",
    });
  });

  it("filters and strips variables by prefix", async () => {
    const provider = new GitHubActionsProvider({
      vars: sampleVars,
      prefix: "APP_",
    });
    const result = await provider.load();

    expect(result).toEqual({
      ENV: "staging",
      PORT: "3000",
    });
  });

  it("returns empty map when no variables match the prefix", async () => {
    const provider = new GitHubActionsProvider({
      vars: sampleVars,
      prefix: "NONEXISTENT_",
    });
    const result = await provider.load();

    expect(result).toEqual({});
  });

  it("skips variables with undefined values", async () => {
    const provider = new GitHubActionsProvider({
      vars: { DEFINED: "yes", MISSING: undefined },
    });
    const result = await provider.load();

    expect(result).toEqual({ DEFINED: "yes" });
  });

  it("has the correct provider name", () => {
    const provider = new GitHubActionsProvider();
    expect(provider.name).toBe("github-actions");
  });

  it("defaults to process.env when no vars are supplied", async () => {
    process.env.__DRIFTCHECK_TEST__ = "hello";
    const provider = new GitHubActionsProvider({ prefix: "__DRIFTCHECK_" });
    const result = await provider.load();
    expect(result["TEST__"]).toBe("hello");
    delete process.env.__DRIFTCHECK_TEST__;
  });
});
