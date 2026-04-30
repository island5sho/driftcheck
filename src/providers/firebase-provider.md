# Firebase Remote Config Provider

The `firebase-remote-config` provider loads environment variables from [Firebase Remote Config](https://firebase.google.com/docs/remote-config) parameters.

## Setup

Install the Firebase Admin SDK:

```bash
npm install firebase-admin
```

## Usage

```typescript
import * as admin from "firebase-admin";
import { createFirebaseProvider } from "./firebase-provider";
import { registerProvider } from "./provider-registry";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const remoteConfig = admin.remoteConfig();

registerProvider(
  createFirebaseProvider({
    client: remoteConfig,
    prefix: "APP_", // optional: only load keys with this prefix
  })
);
```

## Options

| Option   | Type     | Required | Description                                           |
|----------|----------|----------|-------------------------------------------------------|
| `client` | object   | Yes      | A Firebase Remote Config client with `getTemplate()`  |
| `prefix` | string   | No       | Only include parameters whose keys start with prefix  |

## Notes

- Only parameters with a `defaultValue` are included in the output.
- When a `prefix` is specified, it is stripped from the resulting key names.
- Condition-based values are not considered; only `defaultValue` is used.
