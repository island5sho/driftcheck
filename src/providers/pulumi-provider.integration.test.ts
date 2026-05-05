import { describe, it, expect, beforeAll } from "vitest";
import { createPulumiProvider } from "./pulumi-provider";

/**
 * Integration test for the Pulumi provider.
 *
 * Requires:
 *   PULUMI_ACCESS_TOKEN  – Pulumi Cloud access token
 *   PULUMI_ORG           – Pulumi organisation slug
 *   PULUMI_PROJECT       – Pulumi project name
 *   PULUMI_STACK         – Pulumi stack name
 */

const REQUIRED_VARS = ["PULUMI_ACCESS_TOKEN", "PULUMI_ORG", "PULUMI_PROJECT", "PULUMI_STACK"];

describe.skipIf(REQUIRED_VARS.some((v) => !process.env[v]))(
  "PulumiProvider (integration)",
  () => {
    let token: string;
    let org: string;
    let project: string;
    let stack: string;

    beforeAll(() => {
      token = process.env.PULUMI_ACCESS_TOKEN!;
      org = process.env.PULUMI_ORG!;
      project = process.env.PULUMI_PROJECT!;
      stack = process.env.PULUMI_STACK!;
    });

    it("loads stack outputs from Pulumi Cloud", async () => {
      const { PulumiAutomationClient } = await import("@pulumi/pulumi/automation");
      // Use a minimal HTTP client wrapping the Pulumi REST API
      const client = {
        async getStackOutputs(o: string, p: string, s: string) {
          const url = `https://api.pulumi.com/api/stacks/${o}/${p}/${s}/export`;
          const res = await fetch(url, {
            headers: { Authorization: `token ${token}`, Accept: "application/json" },
          });
          if (!res.ok) throw new Error(`Pulumi API error: ${res.status}`);
          const body = await res.json();
          return body?.deployment?.resources?.[0]?.outputs ?? {};
        },
      };
      const provider = createPulumiProvider({ org, project, stack, client });
      const env = await provider.load();
      expect(typeof env).toBe("object");
    });
  }
);
