import { describe, it, expect, beforeAll } from "vitest";
import { createConsulProvider } from "./consul-provider";

const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_TOKEN = process.env.CONSUL_TOKEN;
const CONSUL_PREFIX = process.env.CONSUL_PREFIX ?? "driftcheck/";

const runIntegration = CONSUL_HOST ? describe : describe.skip;

runIntegration("ConsulProvider integration", () => {
  let provider: ReturnType<typeof createConsulProvider>;

  beforeAll(() => {
    provider = createConsulProvider({
      host: CONSUL_HOST,
      token: CONSUL_TOKEN,
      prefix: CONSUL_PREFIX,
    });
  });

  it("loads real keys from Consul KV", async () => {
    const result = await provider.load();
    expect(typeof result).toBe("object");
    expect(Object.keys(result).length).toBeGreaterThanOrEqual(0);
  });

  it("all values are strings", async () => {
    const result = await provider.load();
    for (const [, v] of Object.entries(result)) {
      expect(typeof v).toBe("string");
    }
  });
});
