# Terraform Provider

The Terraform provider reads environment variables from a Terraform workspace by inspecting `terraform output` values. It supports both local state files and live `terraform output -json` execution.

## Usage

```typescript
import { createTerraformProvider } from "./terraform-provider";
import { registerProvider } from "./provider-registry";

const stagingProvider = createTerraformProvider({
  workspaceDir: "./infra/staging",
});

const productionProvider = createTerraformProvider({
  workspaceDir: "./infra/production",
  stateFile: "terraform.tfstate",
});

registerProvider("staging", stagingProvider);
registerProvider("production", productionProvider);
```

## Options

| Option          | Type     | Required | Description                                                   |
|-----------------|----------|----------|---------------------------------------------------------------|
| `workspaceDir`  | `string` | Yes      | Path to the Terraform workspace directory                     |
| `stateFile`     | `string` | No       | State file name relative to `workspaceDir` (default: `terraform.tfstate`) |
| `outputPrefix`  | `string` | No       | Only include outputs whose names start with this prefix       |

## How It Works

1. If a state file exists at `workspaceDir/stateFile`, it is read and parsed directly.
2. Otherwise, `terraform output -json` is executed in `workspaceDir`.
3. Output keys are uppercased and used as environment variable names.
4. Nested object outputs are flattened with `_` as a separator (e.g., `feature_flags.dark_mode` → `FEATURE_FLAGS_DARK_MODE`).

## Notes

- The Terraform CLI must be installed and authenticated if falling back to `terraform output -json`.
- Sensitive outputs marked with `sensitive = true` in Terraform will appear as `(sensitive value)` unless you have sufficient permissions.
- Array values are flattened with numeric indices: `items[0]` → `ITEMS_0`.
