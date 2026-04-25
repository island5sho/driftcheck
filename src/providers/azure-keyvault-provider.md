# Azure Key Vault Provider

The `AzureKeyVaultProvider` loads secrets from an [Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault/) and exposes them as an `EnvMap` for drift detection.

## Setup

Install the required Azure SDK packages:

```bash
npm install @azure/keyvault-secrets @azure/identity
```

## Usage

```typescript
import { AzureKeyVaultProvider } from './providers/azure-keyvault-provider';
import { registerProvider } from './providers/provider-registry';

const stagingProvider = new AzureKeyVaultProvider({
  vaultUrl: 'https://my-staging-vault.vault.azure.net',
});

const productionProvider = new AzureKeyVaultProvider({
  vaultUrl: 'https://my-production-vault.vault.azure.net',
});

registerProvider('staging', stagingProvider);
registerProvider('production', productionProvider);
```

## Authentication

The provider uses `DefaultAzureCredential` from `@azure/identity`, which supports:

- Environment variables (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`)
- Managed Identity (when running in Azure)
- Azure CLI credentials (local development)

## Key Name Normalisation

Azure Key Vault secret names use hyphens (`my-secret-key`). The provider automatically converts them to uppercase with underscores (`MY_SECRET_KEY`) to match typical environment variable conventions.
