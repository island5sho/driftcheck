/**
 * Example: Compare staging vs production env vars on Render
 *
 * Prerequisites:
 *   export RENDER_API_KEY=rnd_xxxxxxxxxxxxxx
 *   export RENDER_STAGING_SERVICE_ID=srv-staging123
 *   export RENDER_PROD_SERVICE_ID=srv-prod456
 */

import { createRenderProvider } from "./render-provider";
import { detectDrift } from "../drift/detector";
import { formatReport } from "../drift/formatter";

async function main() {
  const apiKey = process.env.RENDER_API_KEY;
  const stagingServiceId = process.env.RENDER_STAGING_SERVICE_ID;
  const prodServiceId = process.env.RENDER_PROD_SERVICE_ID;

  if (!apiKey || !stagingServiceId || !prodServiceId) {
    console.error(
      "Required env vars: RENDER_API_KEY, RENDER_STAGING_SERVICE_ID, RENDER_PROD_SERVICE_ID"
    );
    process.exit(1);
  }

  const staging = createRenderProvider(stagingServiceId, apiKey);
  const production = createRenderProvider(prodServiceId, apiKey);

  console.log("Loading environment variables from Render...");
  const [stagingVars, productionVars] = await Promise.all([
    staging.load(),
    production.load(),
  ]);

  console.log(`Staging vars loaded: ${Object.keys(stagingVars).length}`);
  console.log(`Production vars loaded: ${Object.keys(productionVars).length}`);

  const report = detectDrift(stagingVars, productionVars);
  console.log(formatReport(report));

  if (report.drifted > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
