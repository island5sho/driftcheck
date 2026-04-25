import { HashiCorpVaultProvider, VaultClientLike } from "./hashicorp-vault-provider";

function makeClient(data: Record<string, Record<string, unknown>>): VaultClientLike {
  return {
    async read(path: string) {
      const secret = data[path];
      return secret ? { data: secret } : null;
    },
  };
}

describe("HashiCorpVaultProvider", () => {
  it("loads secrets from a single path", async () => {
    const client = makeClient({
      "secret/data/myapp": { DB_HOST: "localhost", DB_PORT: "5432" },
    });
    const provider = new HashiCorpVaultProvider({
      client,
      secretPaths: ["secret/data/myapp"],
    });

    const result = await provider.load();
    expect(result).toEqual({ DB_HOST: "localhost", DB_PORT: "5432" });
  });

  it("merges secrets from multiple paths", async () => {
    const client = makeClient({
      "secret/data/app": { APP_KEY: "abc" },
      "secret/data/db": { DB_PASS: "secret" },
    });
    const provider = new HashiCorpVaultProvider({
      client,
      secretPaths: ["secret/data/app", "secret/data/db"],
    });

    const result = await provider.load();
    expect(result).toEqual({ APP_KEY: "abc", DB_PASS: "secret" });
  });

  it("skips paths that return null", async () => {
    const client = makeClient({
      "secret/data/existing": { FOO: "bar" },
    });
    const provider = new HashiCorpVaultProvider({
      client,
      secretPaths: ["secret/data/existing", "secret/data/missing"],
    });

    const result = await provider.load();
    expect(result).toEqual({ FOO: "bar" });
  });

  it("coerces non-string values to strings", async () => {
    const client = makeClient({
      "secret/data/mixed": { PORT: 3000, ENABLED: true },
    });
    const provider = new HashiCorpVaultProvider({
      client,
      secretPaths: ["secret/data/mixed"],
    });

    const result = await provider.load();
    expect(result).toEqual({ PORT: "3000", ENABLED: "true" });
  });

  it("throws a descriptive error when the client rejects", async () => {
    const client: VaultClientLike = {
      async read() {
        throw new Error("permission denied");
      },
    };
    const provider = new HashiCorpVaultProvider({
      client,
      secretPaths: ["secret/data/protected"],
    });

    await expect(provider.load()).rejects.toThrow(
      /HashiCorpVaultProvider.*secret\/data\/protected.*permission denied/
    );
  });

  it("has the correct provider name", () => {
    const provider = new HashiCorpVaultProvider({
      client: makeClient({}),
      secretPaths: [],
    });
    expect(provider.name).toBe("hashicorp-vault");
  });
});
