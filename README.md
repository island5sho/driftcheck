# driftcheck

Detects configuration drift between staging and production environment variables across cloud providers.

## Installation

```bash
npm install -g driftcheck
```

## Usage

Compare environment variables between staging and production:

```bash
driftcheck compare --staging aws:my-app-staging --prod aws:my-app-prod
```

Example output:

```
✔ Scanning environments...

  MISSING IN PROD    DATABASE_POOL_SIZE
  VALUE MISMATCH     LOG_LEVEL          (staging: "debug" / prod: "info")
  MISSING IN STAGING SENTRY_DSN

3 drift(s) detected.
```

You can also export a drift report:

```bash
driftcheck compare --staging aws:my-app-staging --prod aws:my-app-prod --output report.json
```

### Supported Providers

- AWS Secrets Manager / Parameter Store
- GCP Secret Manager
- Azure Key Vault
- `.env` files

## Configuration

Create a `driftcheck.config.ts` in your project root to define provider credentials and ignored keys:

```ts
export default {
  ignore: ["LAST_DEPLOY_AT", "BUILD_ID"],
};
```

## License

MIT