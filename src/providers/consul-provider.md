# Consul Provider

The Consul provider reads configuration from [HashiCorp Consul's KV store](https://developer.hashicorp.com/consul/docs/dynamic-app-config/kv).

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `host` | `string` | `127.0.0.1` | Consul agent host |
| `port` | `number` | `8500` | Consul agent HTTP port |
| `token` | `string` | — | ACL token for authentication |
| `prefix` | `string` | `config/` | KV path prefix to recurse under |
| `namespace` | `string` | — | Consul Enterprise namespace |

## Key normalisation

KV paths are converted to environment-variable style keys:

- The `prefix` is stripped from the path.
- Remaining `/` separators are replaced with `_`.
- The result is uppercased.

Example: `config/database/host` with prefix `config/` → `DATABASE_HOST`.

## Usage

```ts
import { createConsulProvider } from "driftcheck/providers/consul";
import { registerProvider } from "driftcheck/providers/provider-registry";

registerProvider("staging", createConsulProvider({
  host: "consul.staging.internal",
  token: process.env.CONSUL_TOKEN_STAGING,
  prefix: "app/staging/",
}));

registerProvider("production", createConsulProvider({
  host: "consul.prod.internal",
  token: process.env.CONSUL_TOKEN_PROD,
  prefix: "app/production/",
}));
```

## Authentication

Set the `token` option to a Consul ACL token that has `key:read` capability on the chosen prefix. For Consul Enterprise, supply the `namespace` option.
