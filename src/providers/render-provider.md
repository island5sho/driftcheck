# Render Provider

Loads environment variables from a [Render](https://render.com) service using the Render API.

## Configuration

| Parameter   | Description                              | Required |
|-------------|------------------------------------------|----------|
| `serviceId` | The Render service ID (e.g. `srv-abc123`) | Yes      |
| `apiKey`    | Your Render API key                      | Yes      |

## Usage

```typescript
import { createRenderProvider } from "./render-provider";

const staging = createRenderProvider(
  process.env.RENDER_STAGING_SERVICE_ID!,
  process.env.RENDER_API_KEY!
);

const production = createRenderProvider(
  process.env.RENDER_PROD_SERVICE_ID!,
  process.env.RENDER_API_KEY!
);
```

## Authentication

Generate an API key from your [Render Dashboard](https://dashboard.render.com/u/settings#api-keys).

Set it as an environment variable:

```bash
export RENDER_API_KEY=rnd_xxxxxxxxxxxxxx
```

## Finding Your Service ID

The service ID appears in your Render dashboard URL when viewing a service:
`https://dashboard.render.com/web/srv-abc123`

The service ID is `srv-abc123`.

## Integration Tests

Set the following environment variables to run integration tests:

```bash
export RENDER_API_KEY=rnd_xxxxxxxxxxxxxx
export RENDER_SERVICE_ID=srv-abc123
```
