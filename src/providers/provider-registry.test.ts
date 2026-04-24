import { registerProvider, getProvider, listProviders } from './provider-registry';
import { DotenvProvider } from './dotenv-provider';
import { EnvProvider, EnvVariable, ProviderConfig } from './types';

describe('provider-registry', () => {
  it('should have dotenv provider registered by default', () => {
    const providers = listProviders();
    expect(providers).toContain('dotenv');
  });

  it('should retrieve the dotenv provider by name', () => {
    const provider = getProvider('dotenv');
    expect(provider).toBeInstanceOf(DotenvProvider);
    expect(provider.name).toBe('dotenv');
  });

  it('should throw when requesting an unregistered provider', () => {
    expect(() => getProvider('aws')).toThrow(/not registered/);
  });

  it('should register and retrieve a custom provider', () => {
    const mockProvider: EnvProvider = {
      name: 'gcp',
      fetchVariables: async (): Promise<EnvVariable[]> => [],
    };

    registerProvider(mockProvider);
    const retrieved = getProvider('gcp');
    expect(retrieved).toBe(mockProvider);
    expect(listProviders()).toContain('gcp');
  });
});
