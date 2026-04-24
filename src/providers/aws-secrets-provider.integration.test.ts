/**
 * Integration smoke test for AwsSecretsProvider.
 * Requires AWS credentials and sets up a real secret via the SDK.
 * Skipped unless the INTEGRATION_TEST env var is set.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  SecretsManagerClient,
  CreateSecretCommand,
  DeleteSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { AwsSecretsProvider } from "./aws-secrets-provider";

const RUN = process.env["INTEGRATION_TEST"] === "true";
const REGION = process.env["AWS_REGION"] ?? "us-east-1";
const SECRET_NAME = `driftcheck-test-${Date.now()}`;

describe.skipIf(!RUN)("AwsSecretsProvider (integration)", () => {
  const client = new SecretsManagerClient({ region: REGION });

  beforeAll(async () => {
    await client.send(
      new CreateSecretCommand({
        Name: SECRET_NAME,
        SecretString: "integration-value",
      })
    );
  });

  afterAll(async () => {
    await client.send(
      new DeleteSecretCommand({
        SecretId: SECRET_NAME,
        ForceDeleteWithoutRecovery: true,
      })
    );
  });

  it("loads a real secret from AWS Secrets Manager", async () => {
    const provider = new AwsSecretsProvider({ region: REGION });
    const result = await provider.load();
    expect(result[SECRET_NAME]).toBe("integration-value");
  });
});
