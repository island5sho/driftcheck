import { describe, it, expect, vi } from "vitest";
import { createFirebaseProvider, FirebaseRemoteConfigClient } from "./firebase-provider";

function makeClient(parameters: Record<string, { defaultValue?: { value?: string } }>): FirebaseRemoteConfigClient {
  return {
    getTemplate: vi.fn().mockResolvedValue({ parameters }),
  };
}

describe("FirebaseProvider", () => {
  it("loads all parameters without prefix", async () => {
    const client = makeClient({
      API_URL: { defaultValue: { value: "https://api.example.com" } },
      DEBUG: { defaultValue: { value: "false" } },
    });
    const provider = createFirebaseProvider({ client });
    const result = await provider.load();
    expect(result).toEqual({
      API_URL: "https://api.example.com",
      DEBUG: "false",
    });
  });

  it("filters and strips prefix when provided", async () => {
    const client = makeClient({
      APP_API_URL: { defaultValue: { value: "https://api.example.com" } },
      APP_TIMEOUT: { defaultValue: { value: "30" } },
      OTHER_KEY: { defaultValue: { value: "ignored" } },
    });
    const provider = createFirebaseProvider({ client, prefix: "APP_" });
    const result = await provider.load();
    expect(result).toEqual({
      API_URL: "https://api.example.com",
      TIMEOUT: "30",
    });
    expect(result["OTHER_KEY"]).toBeUndefined();
  });

  it("skips parameters without a defaultValue", async () => {
    const client = makeClient({
      PRESENT: { defaultValue: { value: "yes" } },
      MISSING: {},
    });
    const provider = createFirebaseProvider({ client });
    const result = await provider.load();
    expect(result).toEqual({ PRESENT: "yes" });
    expect(result["MISSING"]).toBeUndefined();
  });

  it("returns empty map when template has no parameters", async () => {
    const client = makeClient({});
    const provider = createFirebaseProvider({ client });
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("exposes correct provider name", () => {
    const client = makeClient({});
    const provider = createFirebaseProvider({ client });
    expect(provider.name).toBe("firebase-remote-config");
  });
});
