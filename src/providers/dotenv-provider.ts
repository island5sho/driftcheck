import * as fs from 'fs';
import * as path from 'path';
import { EnvProvider, EnvVariable, ProviderConfig } from './types';

export class DotenvProvider implements EnvProvider {
  readonly name = 'dotenv' as const;

  async fetchVariables(
    environment: 'staging' | 'production',
    config: ProviderConfig
  ): Promise<EnvVariable[]> {
    const filePath = config.filePath ?? `.env.${environment}`;
    const resolvedPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Env file not found: ${resolvedPath}`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const variables: EnvVariable[] = [];

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');

      variables.push({ key, value, source: 'dotenv', environment });
    }

    return variables;
  }
}
