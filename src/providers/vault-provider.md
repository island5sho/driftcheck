# Vault Provider

Loads environment variables from a [HashiCorp Vault](https://www.vaultproject.io/) KV v2 secret path using the HTTP API.

## Configuration

| Environment Variable | Description                          | Default                       |
|----------------------|--------------------------------------|-------------------------------|
| `VAULT_ADDR`         | Vault server address                 | `http://127.0.0.1:8200`       |
| `VAULT_TOKEN`        | Vault authentication token           | *(required)*                  |

## Usage

```typescript
import { createVaultProvider } from "./vault-provider";
import { detectDrift } from "../drift/detector";

const staging = createVaultProvider({ path: "secret/data/myapp-staging" });
const production = createVaultProvider({ path: "secret/data/myapp-production" });

const report = await detectDrift(await staging.load(), await production.load());
console.log(report);
```

## Custom Client

You can inject a custom client that implements `VaultClientLike` for testing or alternative auth strategies:

```typescript
import { createVaultProvider, VaultClientLike } from "./vault-provider";

const myClient: VaultClientLike = {
  async read(path) {
    // custom implementation
    return { data: { data: { KEY: "value" } } };
  },
};

const provider = createVaultProvider({ client: myClient, path: "secret/data/myapp" });
```

## Notes

- Only KV v2 paths are supported (`secret/data/<name>`).
- All secret values are coerced to strings.
- `null` and `undefined` values are omitted from the result.
- A 404 response returns an empty map rather than throwing.
