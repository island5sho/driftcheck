import { describe, it, expect, vi, beforeEach } from "vitest";
import { AwsSecretsProvider } from "./aws-secrets-provider";
import {
  SecretsManagerClient,
  ListSecretsCommand,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { mockClient } from "aws-sdk-client-mock";

const smMock = mockClient(SecretsManagerClient);

beforeEach(() => {
  smMock.reset();
});

describe("AwsSecretsProvider", () => {
  it("returns empty map when no secrets exist", async () => {
    smMock.on(ListSecretsCommand).resolves({ SecretList: [] });
    const provider = new AwsSecretsProvider();
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("loads secrets into env map", async () => {
    smMock.on(ListSecretsCommand).resolves({
      SecretList: [{ Name: "DB_PASSWORD" }, { Name: "API_KEY" }],
    });
    smMock
      .on(GetSecretValueCommand, { SecretId: "DB_PASSWORD" })
      .resolves({ SecretString: "supersecret" });
    smMock
      .on(GetSecretValueCommand, { SecretId: "API_KEY" })
      .resolves({ SecretString: "myapikey" });

    const provider = new AwsSecretsProvider();
    const result = await provider.load();
    expect(result).toEqual({ DB_PASSWORD: "supersecret", API_KEY: "myapikey" });
  });

  it("strips pathPrefix from keys", async () => {
    smMock.on(ListSecretsCommand).resolves({
      SecretList: [{ Name: "/prod/DB_PASSWORD" }],
    });
    smMock
      .on(GetSecretValueCommand, { SecretId: "/prod/DB_PASSWORD" })
      .resolves({ SecretString: "secret" });

    const provider = new AwsSecretsProvider({ pathPrefix: "/prod" });
    const result = await provider.load();
    expect(result).toEqual({ DB_PASSWORD: "secret" });
  });

  it("skips secrets with no SecretString", async () => {
    smMock.on(ListSecretsCommand).resolves({
      SecretList: [{ Name: "BINARY_SECRET" }],
    });
    smMock
      .on(GetSecretValueCommand, { SecretId: "BINARY_SECRET" })
      .resolves({ SecretBinary: Buffer.from("binary") });

    const provider = new AwsSecretsProvider();
    const result = await provider.load();
    expect(result).toEqual({});
  });

  it("has correct provider name", () => {
    const provider = new AwsSecretsProvider();
    expect(provider.name).toBe("aws-secrets");
  });
});
