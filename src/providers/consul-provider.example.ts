/**
 * Example: detect drift between staging and production configs stored in Consul KV.
 *
 * Prerequisites:
 *   - Two Consul clusters (or namespaces) with keys under a shared prefix.
 *   - ACL tokens with read access to the respective prefixes.
 *
 * Run:
 *   CONSUL_STAGING_HOST=consul.staging.internal \
 *   CONSUL_PROD_HOST=consul.prod.internal \
 *   CONSUL_TOKEN_STAGING=... \
 *   CONSUL_TOKEN_PROD=... \
 *   npx ts-node src/providers/consul-provider.example.ts
 */

import { createConsulProvider } from "./consul-provider";
import { detectDrift } from "../drift/detector";
import { formatReport } from "../drift/formatter";

async function main() {
  const staging = createConsulProvider({
    host: process.env.CONSUL_STAGING_HOST ?? "127.0.0.1",
    token: process.env.CONSUL_TOKEN_STAGING,
    prefix: "app/staging/",
  });

  const production = createConsulProvider({
    host: process.env.CONSUL_PROD_HOST ?? "127.0.0.1",
    token: process.env.CONSUL_TOKEN_PROD,
    prefix: "app/production/",
  });

  console.log("Loading staging config from Consul…");
  const stagingEnv = await staging.load();

  console.log("Loading production config from Consul…");
  const prodEnv = await production.load();

  const report = detectDrift(stagingEnv, prodEnv);

  if (report.driftCount === 0) {
    console.log("✅  No drift detected.");
  } else {
    console.log(formatReport(report));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
