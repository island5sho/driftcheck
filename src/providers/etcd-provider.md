# Etcd Provider

The `etcd` provider loads configuration from a running [etcd](https://etcd.io/) cluster using a key prefix.

## Usage

```typescript
import { createEtcdProvider } from "./etcd-provider";
import { Etcd3 } from "etcd3";

const client = new Etcd3({ hosts: "http://localhost:2379" });

const provider = createEtcdProvider(client, {
  prefix: "/myapp/config/",
  stripPrefix: true, // default: true
});

const env = await provider.load();
```

## Options

| Option        | Type      | Default        | Description                                      |
|---------------|-----------|----------------|--------------------------------------------------|
| `prefix`      | `string`  | `/config/`     | Key prefix to filter and load from etcd          |
| `stripPrefix` | `boolean` | `true`         | Remove the prefix from keys in the returned map  |

## Key Normalization

Keys are normalized to uppercase environment variable names. Path separators (`/`) are replaced with underscores (`_`).

For example, `/myapp/config/database/host` with prefix `/myapp/config/` becomes `DATABASE_HOST`.

## Integration Test

Set `ETCD_ENDPOINT` to run the integration test against a real etcd instance:

```bash
ETCD_ENDPOINT=http://localhost:2379 npx jest etcd-provider.integration
```
