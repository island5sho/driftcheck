# Netlify Provider

The `NetlifyProvider` fetches environment variables from a [Netlify](https://www.netlify.com/) site using the Netlify API.

## Configuration

| Option    | Type     | Required | Description                          |
|-----------|----------|----------|--------------------------------------|
| `token`   | `string` | Yes      | Netlify personal access token        |
| `siteId`  | `string` | Yes      | The Netlify site ID to fetch vars for |
| `context` | `string` | No       | Deployment context (default: `dev`)  |

## Usage

```typescript
import { NetlifyProvider } from './netlify-provider';

const provider = new NetlifyProvider({
  token: process.env.NETLIFY_TOKEN!,
  siteId: 'your-site-id',
  context: 'production',
});

const variables = await provider.getVariables();
console.log(variables);
```

## Authentication

Generate a personal access token from your [Netlify user settings](https://app.netlify.com/user/applications#personal-access-tokens) and pass it via the `token` option or set `NETLIFY_TOKEN` in your environment.

## Notes

- Variables are scoped per deployment context (`dev`, `branch-deploy`, `deploy-preview`, `production`).
- If no context is specified, `dev` is used as the default.
- The Netlify API endpoint used is: `https://api.netlify.com/api/v1/sites/{siteId}/env`
