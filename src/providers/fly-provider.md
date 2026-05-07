# Fly.io Provider

The `fly-provider` loads secrets from a [Fly.io](https://fly.io) application using the Fly.io REST API.

## Limitations

> **Note:** The Fly.io secrets API does **not** expose secret values — only their names and SHA-256 digests. Drift detection therefore compares digests rather than plaintext values. A digest change signals that a secret was rotated.

## Usage

```typescript
import { createFlyProvider } from "./fly-provider";

const staging = createFlyProvider({
  appName: "my-app-staging",
  apiToken: process.env.FLY_API_TOKEN!,
});

const production = createFlyProvider({
  appName: "my-app-production",
  apiToken: process.env.FLY_API_TOKEN!,
});
```

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `appName` | `string` | ✅ | The Fly.io application name |
| `apiToken` | `string` | ✅ | Fly.io personal access token (`flyctl auth token`) |
| `client` | `FlyClient` | ❌ | Custom HTTP client (useful for testing) |

## Authentication

Generate a token with the Fly CLI:

```bash
flyctl auth token
```

Set it as an environment variable:

```bash
export FLY_API_TOKEN=fo1_xxxxxxxxxxxx
```

## What drift looks like

Because only digests are available, drift is reported as:

- **missing** — a secret present in staging is absent in production
- **extra** — a secret present in production is absent in staging  
- **changed** — both environments have the secret but with different digests (i.e. different values)
