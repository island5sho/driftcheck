import { AwsSsmProvider } from './aws-ssm-provider';

// Mock the AWS SDK module
jest.mock('@aws-sdk/client-ssm', () => {
  const mockSend = jest.fn();
  const MockSSMClient = jest.fn().mockImplementation(() => ({ send: mockSend }));
  const MockGetParametersByPathCommand = jest.fn().mockImplementation((input) => input);
  return {
    SSMClient: MockSSMClient,
    GetParametersByPathCommand: MockGetParametersByPathCommand,
    __mockSend: mockSend,
  };
});

async function getMockSend() {
  const mod = await import('@aws-sdk/client-ssm');
  return (mod as any).__mockSend as jest.Mock;
}

describe('AwsSsmProvider', () => {
  const baseOptions = { region: 'us-east-1', pathPrefix: '/myapp/staging' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads parameters and strips path prefix', async () => {
    const mockSend = await getMockSend();
    mockSend.mockResolvedValueOnce({
      Parameters: [
        { Name: '/myapp/staging/DB_HOST', Value: 'localhost' },
        { Name: '/myapp/staging/DB_PORT', Value: '5432' },
      ],
      NextToken: undefined,
    });

    const provider = new AwsSsmProvider(baseOptions);
    const result = await provider.load();

    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  it('handles pagination via NextToken', async () => {
    const mockSend = await getMockSend();
    mockSend
      .mockResolvedValueOnce({
        Parameters: [{ Name: '/myapp/staging/KEY_A', Value: 'alpha' }],
        NextToken: 'token-page-2',
      })
      .mockResolvedValueOnce({
        Parameters: [{ Name: '/myapp/staging/KEY_B', Value: 'beta' }],
        NextToken: undefined,
      });

    const provider = new AwsSsmProvider(baseOptions);
    const result = await provider.load();

    expect(result).toEqual({ KEY_A: 'alpha', KEY_B: 'beta' });
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('returns empty map when no parameters found', async () => {
    const mockSend = await getMockSend();
    mockSend.mockResolvedValueOnce({ Parameters: [], NextToken: undefined });

    const provider = new AwsSsmProvider(baseOptions);
    const result = await provider.load();

    expect(result).toEqual({});
  });

  it('has the correct provider name', () => {
    const provider = new AwsSsmProvider(baseOptions);
    expect(provider.name).toBe('aws-ssm');
  });
});
