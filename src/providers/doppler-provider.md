# Doppler Provider

The `DopplerProvider` fetches secrets from [Doppler](https://www.doppler.com/), a universal secrets manager.

## Usage

```ts
import { DopplerProvider } from "./doppler-provider";

const client = new DopplerSDK({ accessToken: process.env.DOPPLER_TOKEN });

const staging = new DopplerProvider({
  project: "my-app",
  config: "staging",
  client,
});

const production = new DopplerProvider({
  project: "my-app",
  config: "production",
  client,
});
```

## Options

| Option    | Type             | Description                                |
|-----------|------------------|--------------------------------------------|
| `project` | `string`         | The Doppler project name                   |
| `config`  | `string`         | The Doppler config (e.g. `staging`, `prd`) |
| `client`  | `DopplerClient`  | A Doppler SDK client instance              |

## Authentication

Set the `DOPPLER_TOKEN` environment variable with a **Service Token** scoped to the project and config you want to read.

```bash
export DOPPLER_TOKEN="dp.st.staging.xxxx"
```

## Notes

- Only `raw` secret values are returned (not computed values).
- Secrets are returned as a flat key/value `EnvMap`.
