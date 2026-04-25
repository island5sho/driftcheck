# GCP Secret Manager Provider

The `GcpSecretProvider` loads environment variables from [Google Cloud Secret Manager](https://cloud.google.com/secret-manager).

## Usage

```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { GcpSecretProvider } from './providers/gcp-secret-provider';
import { registerProvider } from './providers/provider-registry';

const rawClient = new SecretManagerServiceClient();

const provider = new GcpSecretProvider({
  projectId: 'my-gcp-project',
  prefix: 'APP_',          // optional: only load secrets starting with this prefix
  client: {
    listSecrets: (req) => rawClient.listSecrets(req) as any,
    accessSecretVersion: (req) => rawClient.accessSecretVersion(req) as any,
  },
});

registerProvider('production', provider);
```

## Options

| Option      | Type     | Required | Description                                              |
|-------------|----------|----------|----------------------------------------------------------|
| `projectId` | `string` | Yes      | GCP project ID                                           |
| `prefix`    | `string` | No       | Only load secrets whose names start with this prefix     |
| `client`    | `object` | Yes*     | GCP Secret Manager client (injectable for testing)       |

## Authentication

Uses [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials). Set `GOOGLE_APPLICATION_CREDENTIALS` or use `gcloud auth application-default login`.

## Integration Tests

```bash
GCP_PROJECT_ID=my-proj GCP_SECRET_PREFIX=APP_ npx jest --testPathPattern=gcp-secret-provider.integration
```
