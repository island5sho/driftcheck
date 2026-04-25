# HashiCorp Vault Provider

Loads configuration from a [HashiCorp Vault](https://www.vaultproject.io/) KV v2 secret path.

## Prerequisites

- A running Vault instance reachable from your environment.
- A Vault token with `read` permission on the target path.

## Configuration

| Option  | Type   | Required | Default                     | Description                         |
|---------|--------|----------|-----------------------------|-------------------------------------|
| `addr`  | string | No       | `http://127.0.0.1:8200`     | Vault server address                |
| `token` | string | Yes      | —                           | Vault token for authentication      |
| `mount` | string | No       | `secret`                    | KV v2 mount path                    |
| `path`  | string | Yes      | —                           | Secret path inside the mount        |

## Usage

```typescript
import { HashiCorpVaultProvider } from './hashicorp-vault-provider';
import { registerProvider } from './provider-registry';

registerProvider('staging', new HashiCorpVaultProvider({
  addr: 'https://vault.example.com',
  token: process.env.VAULT_TOKEN!,
  mount: 'secret',
  path: 'myapp/staging',
}));

registerProvider('production', new HashiCorpVaultProvider({
  addr: 'https://vault.example.com',
  token: process.env.VAULT_TOKEN!,
  mount: 'secret',
  path: 'myapp/production',
}));
```

## Running Integration Tests

```bash
docker run --rm -e VAULT_DEV_ROOT_TOKEN_ID=test-token -p 8200:8200 vault
RUN_INTEGRATION_TESTS=true VAULT_TOKEN=test-token npx jest hashicorp-vault-provider.integration
```
