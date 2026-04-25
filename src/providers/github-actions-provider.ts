import { EnvMap, Provider } from "./types";

export interface GitHubActionsProviderOptions {
  /**
   * A record of variable names to their values, typically sourced from
   * GitHub Actions environment variables or secrets exposed at runtime.
   * Defaults to `process.env` if not provided.
   */
  vars?: Record<string, string | undefined>;

  /**
   * Optional prefix filter — only variables whose keys start with this
   * prefix will be included. The prefix is stripped from the returned keys.
   */
  prefix?: string;
}

/**
 * Provider that reads environment variables from GitHub Actions.
 *
 * In a GitHub Actions workflow, secrets and variables are injected into the
 * runner environment via `env:` blocks or the `secrets` context. This provider
 * reads them from `process.env` (or a supplied map) and optionally filters by
 * a key prefix.
 */
export class GitHubActionsProvider implements Provider {
  readonly name = "github-actions";

  private readonly vars: Record<string, string | undefined>;
  private readonly prefix: string;

  constructor(options: GitHubActionsProviderOptions = {}) {
    this.vars = options.vars ?? process.env;
    this.prefix = options.prefix ?? "";
  }

  async load(): Promise<EnvMap> {
    const result: EnvMap = {};

    for (const [key, value] of Object.entries(this.vars)) {
      if (value === undefined) continue;

      if (this.prefix) {
        if (key.startsWith(this.prefix)) {
          const strippedKey = key.slice(this.prefix.length);
          result[strippedKey] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
