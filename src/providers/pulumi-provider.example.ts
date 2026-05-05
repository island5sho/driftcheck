/**
 * Example: compare Pulumi stack outputs between staging and production
 * using driftcheck.
 *
 * Run with:
 *   PULUMI_ACCESS_TOKEN=... npx ts-node src/providers/pulumi-provider.example.ts
 */

import { createPulumiProvider, type PulumiClient } from "./pulumi-provider";
import { detectDrift } from "../drift/detector";
import { formatReport } from "../drift/formatter";

const ORG = process.env.PULUMI_ORG ?? "acme";
const PROJECT = process.env.PULUMI_PROJECT ?? "backend";
const ACCESS_TOKEN = process.env.PULUMI_ACCESS_TOKEN ?? "";

async function fetchOutputs(
  org: string,
  project: string,
  stack: string
): Promise<Record<string, unknown>> {
  const url = `https://api.pulumi.com/api/stacks/${org}/${project}/${stack}/export`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Pulumi API responded with ${res.status} for stack ${stack}`);
  }
  const body = (await res.json()) as { deployment?: { resources?: Array<{ outputs?: Record<string, unknown> }> } };
  return body?.deployment?.resources?.[0]?.outputs ?? {};
}

const client: PulumiClient = {
  getStackOutputs: fetchOutputs,
};

const staging = createPulumiProvider({
  org: ORG,
  project: PROJECT,
  stack: "staging",
  client,
});

const production = createPulumiProvider({
  org: ORG,
  project: PROJECT,
  stack: "production",
  client,
});

async function main() {
  const [stagingEnv, productionEnv] = await Promise.all([
    staging.load(),
    production.load(),
  ]);

  const report = detectDrift(stagingEnv, productionEnv);
  console.log(formatReport(report));

  if (report.drifted > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
