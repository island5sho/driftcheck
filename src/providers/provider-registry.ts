import { CloudProvider, EnvProvider } from './types';
import { DotenvProvider } from './dotenv-provider';

const registry = new Map<CloudProvider, EnvProvider>();

export function registerProvider(provider: EnvProvider): void {
  registry.set(provider.name, provider);
}

export function getProvider(name: CloudProvider): EnvProvider {
  const provider = registry.get(name);
  if (!provider) {
    throw new Error(
      `Provider "${name}" is not registered. Available: ${[...registry.keys()].join(', ')}`
    );
  }
  return provider;
}

export function listProviders(): CloudProvider[] {
  return [...registry.keys()];
}

// Register built-in providers
registerProvider(new DotenvProvider());
