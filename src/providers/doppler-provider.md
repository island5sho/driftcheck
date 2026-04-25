# Doppler Provider

The `DopplerProvider` fetches environment variables from a [Doppler](https://doppler.com) project config using the Doppler API.

## Configuration

| Option    | Type     | Required | Description                              |
|-----------|----------|----------|------------------------------------------|
| `token`   | `string` | Yes      | Doppler service token or personal token  |
| `project` | `string` | Yes      | Doppler project name                     |
| `config`  | `string` | Yes      | Doppler config name (e.g. `prd`, `stg`)  |

## Usage

```typescript
import { DopplerProvider } from './doppler-provider';

const staging = new DopplerProvider({
  token: process.env.DOPPLER_STG_TOKEN!,
  project: 'my-app',
  config: 'stg',
});

const production = new DopplerProvider({
  token: process.env.DOPPLER_PRD_TOKEN!,
  project: 'my-app',
  config: 'prd',
});

const stagingVars = await staging.getVariables();
const productionVars = await production.getVariables();
```

## Integration Tests

Set the following environment variables to run integration tests:

```bash
export DOPPLER_TEST_TOKEN=dp.st.xxxx
export DOPPLER_TEST_PROJECT=my-app
export DOPPLER_TEST_CONFIG=stg

npx jest doppler-provider.integration
```

## Notes

- Uses the Doppler REST API (`https://api.doppler.com/v3/configs/config/secrets`).
- Only secret values (not metadata) are returned.
- Doppler injects some built-in keys (e.g. `DOPPLER_PROJECT`, `DOPPLER_CONFIG`, `DOPPLER_ENVIRONMENT`). These are included in the output.
