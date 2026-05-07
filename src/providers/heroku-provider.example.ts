/**
 * Example: Compare staging vs production config vars on Heroku
 *
 * Run with:
 *   HEROKU_API_TOKEN=<token> npx ts-node src/providers/heroku-provider.example.ts
 */

import { createHerokuProvider } from "./heroku-provider";
import { detectDrift } from "../drift/detector";
import { formatReport } from "../drift/formatter";

async function main() {
  const apiToken = process.env.HEROKU_API_TOKEN;
  if (!apiToken) {
    console.error("HEROKU_API_TOKEN environment variable is required");
    process.exit(1);
  }

  const stagingApp = process.env.HEROKU_STAGING_APP ?? "my-app-staging";
  const productionApp = process.env.HEROKU_PRODUCTION_APP ?? "my-app-production";

  const staging = createHerokuProvider({ appName: stagingApp, apiToken });
  const production = createHerokuProvider({ appName: productionApp, apiToken });

  console.log(`Comparing Heroku apps: ${stagingApp} → ${productionApp}`);

  const [stagingVars, productionVars] = await Promise.all([
    staging.load(),
    production.load(),
  ]);

  const report = detectDrift(stagingVars, productionVars);
  const output = formatReport(report);

  console.log(output);

  if (report.drifted > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
