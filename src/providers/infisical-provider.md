# Infisical Provider

The `InfisicalProvider` fetches secrets from [Infisical](https://infisical.com/), an open-source secret management platform.

## Configuration

| Option        | Type     | Required | Description                                      |
|---------------|----------|----------|--------------------------------------------------|
| `token`       | `string` | Yes      | Infisical service token or machine identity token |
| `projectId`   | `string` | Yes      | The Infisical project (workspace) ID             |
| `environment` | `string` | Yes      | Environment slug (e.g. `dev`, `staging`, `prod`) |
| `baseUrl`     | `string` | No       | Self-hosted Infisical base URL (default: `https://app.infisical.com`) |
| `path`        | `string` | No       | Secret path (default: `/`)                       |

## Usage

```typescript
import { InfisicalProvider } from './infisical-provider';
import { registerProvider } from './provider-registry';

registerProvider('staging', new InfisicalProvider({
  token: process.env.INFISICAL_STAGING_TOKEN!,
  projectId: 'your-project-id',
  environment: 'staging',
}));

registerProvider('production', new InfisicalProvider({
  token: process.env.INFISICAL_PROD_TOKEN!,
  projectId: 'your-project-id',
  environment: 'prod',
}));
```

## Integration Tests

Set the following environment variables and run:

```bash
export INFISICAL_TOKEN=st.your-service-token
export INFISICAL_PROJECT_ID=your-project-id
export INFISICAL_ENVIRONMENT=dev
INTEGRATION=true npx jest infisical-provider.integration
```

## Notes

- Secrets are returned as a flat `Record<string, string>` keyed by secret name.
- The provider uses Infisical's REST API (`/api/v3/secrets/raw`).
- For self-hosted instances, set `baseUrl` to your Infisical server URL.
