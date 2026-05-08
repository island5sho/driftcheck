# GitLab CI/CD Variables Provider

Loads environment variables from [GitLab CI/CD project variables](https://docs.gitlab.com/ee/ci/variables/) for a specific project and environment scope.

## Authentication

A GitLab personal access token or project access token with at least `read_api` scope is required.

Set the token via the `GITLAB_TOKEN` environment variable or pass it directly via the `token` option.

## Usage

```typescript
import { createGitLabProvider } from "./gitlab-provider";
import { detectDrift } from "../drift/detector";
import { formatReport } from "../drift/formatter";

const staging = createGitLabProvider({
  projectId: "myorg/myrepo",
  environment: "staging",
  token: process.env.GITLAB_TOKEN,
});

const production = createGitLabProvider({
  projectId: "myorg/myrepo",
  environment: "production",
  token: process.env.GITLAB_TOKEN,
});

const report = await detectDrift(staging, production);
console.log(formatReport(report));
```

## Options

| Option        | Type            | Required | Description                                              |
|---------------|-----------------|----------|----------------------------------------------------------|
| `projectId`   | `string`        | Yes      | GitLab project path (e.g. `"myorg/myrepo"`) or numeric ID |
| `environment` | `string`        | Yes      | CI/CD environment scope (e.g. `"production"`, `"staging"`) |
| `token`       | `string`        | No       | GitLab API token. Falls back to `GITLAB_TOKEN` env var   |
| `client`      | `GitLabClient`  | No       | Custom client for testing or proxying                    |

## Notes

- Variables scoped to `*` (all environments) are **not** returned when filtering by a specific environment scope. Use `"*"` as the `environment` option to retrieve them.
- Masked variable values are returned as-is by the API and will appear in the drift report.
