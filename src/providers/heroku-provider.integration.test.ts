import { describe, it, expect } from "vitest";
import { createHerokuProvider } from "./heroku-provider";

const HEROKU_API_TOKEN = process.env.HEROKU_API_TOKEN;
const HEROKU_APP_NAME = process.env.HEROKU_APP_NAME;

const runIntegration =
  HEROKU_API_TOKEN && HEROKU_APP_NAME ? describe : describe.skip;

runIntegration("HerokuProvider integration", () => {
  it("loads real config vars from Heroku", async () => {
    const provider = createHerokuProvider({
      appName: HEROKU_APP_NAME!,
      apiToken: HEROKU_API_TOKEN!,
    });
    const result = await provider.load();
    expect(typeof result).toBe("object");
    expect(result).not.toBeNull();
    // All values should be strings
    for (const value of Object.values(result)) {
      expect(typeof value).toBe("string");
    }
  });
});
