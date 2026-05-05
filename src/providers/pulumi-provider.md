# Pulumi Provider

Loads configuration from [Pulumi](https://www.pulumi.com/) stack outputs and exposes them as a flat `EnvMap` for drift detection.

## Usage

```ts
import { createPulumiProvider } from "./pulumi-provider";

const client = {
  async getStackOutputs(org, project, stack) {
    const res = await fetch(
      `https://api.pulumi.com/api/stacks/${org}/${project}/${stack}/export`,
      { headers: { Authorization: `token ${process.env.PULUMI_ACCESS_TOKEN}` } }
    );
    const body = await res.json();
    return body?.deployment?.resources?.[0]?.outputs ?? {};
  },
};

const staging = createPulumiProvider({
  org: "acme",
  project: "backend",
  stack: "staging",
  client,
});

const production = createPulumiProvider({
  org: "acme",
  project: "backend",
  stack: "production",
  client,
});
```

## Options

| Option    | Type           | Required | Description                                      |
|-----------|----------------|----------|--------------------------------------------------|
| `org`     | `string`       | ✅       | Pulumi organisation slug                         |
| `project` | `string`       | ✅       | Pulumi project name                              |
| `stack`   | `string`       | ✅       | Stack name (e.g. `staging`, `production`)        |
| `client`  | `PulumiClient` | ✅       | Object implementing `getStackOutputs`            |
| `prefix`  | `string`       | ❌       | Optional prefix prepended to all output keys     |

## Key Normalisation

Stack output keys are uppercased. Nested objects are flattened using `_` as a separator:

```
{ database: { host: "localhost" } }  →  DATABASE_HOST=localhost
```

## Environment Variables

| Variable              | Description                        |
|-----------------------|------------------------------------|
| `PULUMI_ACCESS_TOKEN` | Pulumi Cloud personal access token |
