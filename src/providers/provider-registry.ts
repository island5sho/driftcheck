import { Provider } from './types';

const registry = new Map<string, Provider>();

/**
 * Register a provider instance under its name.
 * Throws if a provider with the same name is already registered.
 */
export function registerProvider(provider: Provider): void {
  if (registry.has(provider.name)) {
    throw new Error(`Provider "${provider.name}" is already registered.`);
  }
  registry.set(provider.name, provider);
}

/**
 * Retrieve a registered provider by name.
 * Throws if no provider is found with that name.
 */
export function getProvider(name: string): Provider {
  const provider = registry.get(name);
  if (!provider) {
    throw new Error(
      `Provider "${name}" is not registered. Available: ${listProviders().join(', ') || 'none'}`
    );
  }
  return provider;
}

/**
 * List all registered provider names.
 */
export function listProviders(): string[] {
  return Array.from(registry.keys());
}

/**
 * Remove all registered providers (useful for test isolation).
 */
export function clearProviders(): void {
  registry.clear();
}
