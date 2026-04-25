# Vercel Provider

The `VercelProvider` fetches environment variables from a [Vercel](https://vercel.com) project using the Vercel REST API.

## Prerequisites

- A Vercel account with at least one project.
- A Vercel API token (create one at https://vercel.com/account/tokens).
- The **Project ID** from your project's Settings page.

## Usage

```typescript
import { VercelProvider } from 'driftcheck/providers/vercel-provider';
import { detectDrift } from 'driftcheck/drift/detector';

const staging = new VercelProvider({
  token: process.env.VERCEL_TOKEN!,
  projectId: 'prj_staging123',
  target: 'preview',
});

const production = new VercelProvider({
  token: process.env.VERCEL_TOKEN!,
  projectId: 'prj_production456',
  target: 'production',
});

const report = detectDrift(await staging.load(), await production.load());
console.log(report);
```

## Options

| Option      | Type                                        | Required | Default        | Description                          |
|-------------|---------------------------------------------|----------|----------------|--------------------------------------|
| `token`     | `string`                                    | ✅       | —              | Vercel API token                     |
| `projectId` | `string`                                    | ✅       | —              | Vercel project ID                    |
| `teamId`    | `string`                                    | ❌       | `undefined`    | Team ID for team-owned projects      |
| `target`    | `'production' \| 'preview' \| 'development'` | ❌       | `'production'` | Deployment target to filter vars for |

## Notes

- Only environment variables assigned to the specified `target` are returned.
- The Vercel API requires the token to have **read** access to the project.
- For team projects, always supply `teamId` to avoid 404 errors.
