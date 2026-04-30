# Kubernetes Provider

Loads configuration from Kubernetes **Secrets** and/or **ConfigMaps** using the Kubernetes API.

## Installation

Install the official Kubernetes client:

```bash
npm install @kubernetes/client-node
```

## Usage

```typescript
import * as k8s from "@kubernetes/client-node";
import { createKubernetesProvider } from "./kubernetes-provider";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreApi = kc.makeApiClient(k8s.CoreV1Api);

const provider = createKubernetesProvider({
  client: coreApi,
  namespace: "production",
  secretName: "app-secrets",
  configMapName: "app-config",
});

const env = await provider.load();
```

## Options

| Option          | Type     | Default       | Description                                 |
|-----------------|----------|---------------|---------------------------------------------|
| `client`        | object   | **required**  | A Kubernetes `CoreV1Api`-compatible client  |
| `namespace`     | string   | `"default"`   | Kubernetes namespace to read from           |
| `secretName`    | string   | `undefined`   | Name of the Secret to load                  |
| `configMapName` | string   | `undefined`   | Name of the ConfigMap to load               |

## Notes

- Secret values are automatically **base64-decoded**.
- ConfigMap values are loaded as plain strings.
- At least one of `secretName` or `configMapName` must be provided to load any values.
- If both are provided, their keys are merged (ConfigMap values will overwrite Secret values on conflict).
