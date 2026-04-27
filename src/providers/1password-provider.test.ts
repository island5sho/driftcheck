import { OnePasswordProvider, OnePasswordClient } from "./1password-provider";

function makeClient(items: Record<string, Array<{ label: string; value: string }>>): OnePasswordClient {
  return {
    async listItems(vault: string) {
      return Object.keys(items).map((title) => ({ title }));
    },
    async getItem(vault: string, itemTitle: string) {
      const fields = items[itemTitle] ?? [];
      return { fields };
    },
  };
}

describe("OnePasswordProvider", () => {
  it("loads fields from a specific item", async () => {
    const client = makeClient({
      "env-config": [
        { label: "DATABASE_URL", value: "postgres://localhost/db" },
        { label: "API_KEY", value: "secret123" },
      ],
    });

    const provider = new OnePasswordProvider({ client, vault: "my-vault", itemTitle: "env-config" });
    const result = await provider.load();

    expect(result).toEqual({
      DATABASE_URL: "postgres://localhost/db",
      API_KEY: "secret123",
    });
  });

  it("merges fields from all items when no itemTitle is given", async () => {
    const client = makeClient({
      staging: [{ label: "STAGE", value: "staging" }],
      shared: [{ label: "REGION", value: "us-east-1" }],
    });

    const provider = new OnePasswordProvider({ client, vault: "my-vault" });
    const result = await provider.load();

    expect(result).toEqual({
      STAGE: "staging",
      REGION: "us-east-1",
    });
  });

  it("skips fields with empty labels", async () => {
    const client = makeClient({
      "env-config": [
        { label: "", value: "should-be-skipped" },
        { label: "VALID_KEY", value: "valid" },
      ],
    });

    const provider = new OnePasswordProvider({ client, vault: "my-vault", itemTitle: "env-config" });
    const result = await provider.load();

    expect(result).toEqual({ VALID_KEY: "valid" });
  });

  it("returns empty map when vault has no items", async () => {
    const client = makeClient({});
    const provider = new OnePasswordProvider({ client, vault: "empty-vault" });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("has correct provider name", () => {
    const client = makeClient({});
    const provider = new OnePasswordProvider({ client, vault: "v" });
    expect(provider.name).toBe("1password");
  });
});
