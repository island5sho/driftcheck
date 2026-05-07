import { describe, it, expect, vi } from "vitest";
import {
  createSSMParamStoreProvider,
  SSMParamStoreClient,
} from "./ssm-param-store-provider";

function makeClient(
  pages: Array<Array<{ Name: string; Value: string }>>
): SSMParamStoreClient {
  let call = 0;
  return {
    getParametersByPath: vi.fn(async () => {
      const page = pages[call++] ?? [];
      return {
        Parameters: page,
        NextToken: call < pages.length ? `token-${call}` : undefined,
      };
    }),
  };
}

describe("createSSMParamStoreProvider", () => {
  it("loads parameters from a single page", async () => {
    const client = makeClient([
      [
        { Name: "/app/prod/DB_HOST", Value: "db.prod.example.com" },
        { Name: "/app/prod/DB_PORT", Value: "5432" },
      ],
    ]);
    const provider = createSSMParamStoreProvider({
      path: "/app/prod",
      client,
    });
    const env = await provider.load();
    expect(env).toEqual({ DB_HOST: "db.prod.example.com", DB_PORT: "5432" });
  });

  it("paginates through multiple pages", async () => {
    const client = makeClient([
      [{ Name: "/svc/staging/KEY_A", Value: "alpha" }],
      [{ Name: "/svc/staging/KEY_B", Value: "beta" }],
    ]);
    const provider = createSSMParamStoreProvider({
      path: "/svc/staging",
      client,
    });
    const env = await provider.load();
    expect(env).toEqual({ KEY_A: "alpha", KEY_B: "beta" });
    expect(client.getParametersByPath).toHaveBeenCalledTimes(2);
  });

  it("preserves full path when stripPath is false", async () => {
    const client = makeClient([
      [{ Name: "/app/prod/SECRET", Value: "s3cr3t" }],
    ]);
    const provider = createSSMParamStoreProvider({
      path: "/app/prod",
      client,
      stripPath: false,
    });
    const env = await provider.load();
    expect(env["/app/prod/SECRET"]).toBe("s3cr3t");
  });

  it("skips parameters with missing name or value", async () => {
    const client = makeClient([
      [
        { Name: "/app/prod/VALID", Value: "ok" },
        { Name: "", Value: "ignored" },
      ],
    ]);
    const provider = createSSMParamStoreProvider({
      path: "/app/prod",
      client,
    });
    const env = await provider.load();
    expect(Object.keys(env)).toEqual(["VALID"]);
  });

  it("sets provider name based on path", () => {
    const client = makeClient([]);
    const provider = createSSMParamStoreProvider({
      path: "/my/path",
      client,
    });
    expect(provider.name).toBe("ssm-param-store:/my/path");
  });
});
