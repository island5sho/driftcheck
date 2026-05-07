/**
 * Environment Variable Provider
 *
 * Reads configuration from the current process environment variables.
 * Useful for comparing live process env against other providers, or
 * for testing drift between injected runtime config and a source of truth.
 */

import type { EnvMap, Provider } from "./types";

export interface EnvProviderOptions {
  /**
   * Optional prefix filter — only keys starting with this prefix will be included.
   * The prefix is stripped from the key names in the resulting map.
   * e.g. prefix "APP_" turns "APP_PORT" into "PORT".
   */
  prefix?: string;

  /**
   * Optional explicit list of keys to include. If provided, only these keys
   * (after prefix stripping) are returned. Keys not found in the environment
   * will be omitted.
   */
  keys?: string[];

  /**
   * Source object to read from. Defaults to `process.env`.
   * Override in tests to inject a controlled environment.
   */
  source?: NodeJS.ProcessEnv;
}

/**
 * Creates a provider that reads from `process.env` (or a supplied source).
 *
 * @example
 * ```ts
 * const provider = createEnvProvider({ prefix: "APP_" });
 * const vars = await provider.getVars();
 * ```
 */
export function createEnvProvider(options: EnvProviderOptions = {}): Provider {
  const { prefix = "", keys, source = process.env } = options;

  return {
    name: "env",

    async getVars(): Promise<EnvMap> {
      const result: EnvMap = {};

      if (keys && keys.length > 0) {
        // Return only explicitly requested keys
        for (const key of keys) {
          const envKey = prefix ? `${prefix}${key}` : key;
          const value = source[envKey];
          if (value !== undefined) {
            result[key] = value;
          }
        }
        return result;
      }

      for (const [rawKey, value] of Object.entries(source)) {
        if (value === undefined) continue;

        if (prefix) {
          if (rawKey.startsWith(prefix)) {
            const stripped = rawKey.slice(prefix.length);
            result[stripped] = value;
          }
        } else {
          result[rawKey] = value;
        }
      }

      return result;
    },
  };
}
