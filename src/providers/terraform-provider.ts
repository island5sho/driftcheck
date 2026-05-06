import { EnvProvider } from "./types";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface TerraformProviderOptions {
  /** Path to the Terraform workspace directory */
  workspaceDir: string;
  /** Terraform state file path (default: terraform.tfstate) */
  stateFile?: string;
  /** Output variable prefix filter (optional) */
  outputPrefix?: string;
}

interface TerraformState {
  outputs?: Record<string, { value: unknown; type: string }>;
}

function flattenValue(value: unknown, prefix = ""): Record<string, string> {
  if (value === null || value === undefined) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return Object.entries(obj).reduce((acc, [k, v]) => {
      return { ...acc, ...flattenValue(v, prefix ? `${prefix}_${k}` : k) };
    }, {} as Record<string, string>);
  }
  if (Array.isArray(value)) {
    return value.reduce((acc, v, i) => {
      return { ...acc, ...flattenValue(v, prefix ? `${prefix}_${i}` : String(i)) };
    }, {} as Record<string, string>);
  }
  return { [prefix]: String(value) };
}

export function createTerraformProvider(
  options: TerraformProviderOptions
): EnvProvider {
  return {
    name: "terraform",
    async load(): Promise<Record<string, string>> {
      const stateFilePath = path.resolve(
        options.workspaceDir,
        options.stateFile ?? "terraform.tfstate"
      );

      let state: TerraformState;

      if (fs.existsSync(stateFilePath)) {
        const raw = fs.readFileSync(stateFilePath, "utf-8");
        state = JSON.parse(raw) as TerraformState;
      } else {
        // Fall back to `terraform output -json`
        const raw = execSync("terraform output -json", {
          cwd: options.workspaceDir,
          encoding: "utf-8",
        });
        const outputs = JSON.parse(raw) as Record<string, { value: unknown }>;
        state = { outputs: Object.fromEntries(
          Object.entries(outputs).map(([k, v]) => [k, { value: v.value, type: "string" }])
        ) };
      }

      const outputs = state.outputs ?? {};
      const result: Record<string, string> = {};

      for (const [key, entry] of Object.entries(outputs)) {
        if (options.outputPrefix && !key.startsWith(options.outputPrefix)) continue;
        const flat = flattenValue(entry.value, key.toUpperCase());
        Object.assign(result, flat);
      }

      return result;
    },
  };
}
