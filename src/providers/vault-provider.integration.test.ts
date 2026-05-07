/**
 * Integration test for the Vault provider.
 *
 * Requires a running Vault instance (e.g. via Docker):
 *   docker run --rm -e VAULT_DEV_ROOT_TOKEN_ID=root -p 8200:8200 hashicorp/vault
 *
 * Then seed data:
 *   vault kv put secret/myapp API_KEY=abc DB_URL=postgres://localhost/db
 *
 * Run with:
 *   VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN=root \
 *     vitest run src/providers/vault-provider.integration.test.ts
 */
import { describe, it, expect } from "vitest";
import { createVaultProvider } from "./vault-provider";

const VAULT_ADDR = process.env.VAULT_ADDR;
const VAULT_TOKEN = process.env.VAULT_TOKEN;

const runIntegration = VAULT_ADDR && VAULT_TOKEN ? describe : describe.skip;

runIntegration("vault-provider integration", () => {
  it("loads secrets from a live Vault KV v2 path", async () => {
    const provider = createVaultProvider({ path: "secret/data/myapp" });
    const result = await provider.load();

    expect(typeof result).toBe("object");
    // At least one key should be present if secrets were seeded
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it("returns empty map for a non-existent path", async () => {
    const provider = createVaultProvider({ path: "secret/data/does-not-exist-xyz" });
    const result = await provider.load();
    expect(result).toEqual({});
  });
});
