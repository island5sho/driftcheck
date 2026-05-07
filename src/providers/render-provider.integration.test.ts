import { describe, it, expect } from "vitest";
import { createRenderProvider } from "./render-provider";

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID;

const runIntegration = RENDER_API_KEY && RENDER_SERVICE_ID ? describe : describe.skip;

runIntegration("render-provider integration", () => {
  it("loads env vars from real Render service", async () => {
    const provider = createRenderProvider(
      RENDER_SERVICE_ID!,
      RENDER_API_KEY!
    );
    const vars = await provider.load();
    expect(typeof vars).toBe("object");
    expect(Object.keys(vars).length).toBeGreaterThan(0);
    for (const [key, value] of Object.entries(vars)) {
      expect(typeof key).toBe("string");
      expect(typeof value).toBe("string");
    }
  });
});
