# Heroku Provider

Loads environment variables from a [Heroku](https://www.heroku.com/) application's config vars using the Heroku Platform API.

## Setup

1. Generate a Heroku API token:
   ```bash
   heroku auth:token
   ```
2. Note your app name from the Heroku dashboard or `heroku apps`.

## Usage

```typescript
import { createHerokuProvider } from "driftcheck/providers/heroku-provider";

const staging = createHerokuProvider({
  appName: "my-app-staging",
  apiToken: process.env.HEROKU_API_TOKEN,
});

const production = createHerokuProvider({
  appName: "my-app-production",
  apiToken: process.env.HEROKU_API_TOKEN,
});
```

## Options

| Option     | Type     | Required | Description                                      |
|------------|----------|----------|--------------------------------------------------|
| `appName`  | `string` | Yes      | The name of the Heroku application               |
| `apiToken` | `string` | No       | Heroku API token (falls back to `HEROKU_API_TOKEN` env var) |
| `client`   | `HerokuClient` | No | Custom HTTP client (useful for testing)        |

## Environment Variables

| Variable            | Description                  |
|---------------------|------------------------------|
| `HEROKU_API_TOKEN`  | Default Heroku API token     |

## Permissions

The API token must have at least **read** access to the target application's config vars.
