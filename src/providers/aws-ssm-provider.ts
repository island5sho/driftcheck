import { EnvMap, Provider } from './types';

export interface AwsSsmProviderOptions {
  region: string;
  pathPrefix: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * AWS SSM Parameter Store provider.
 * Fetches parameters under a given path prefix and returns them as an EnvMap.
 * Requires @aws-sdk/client-ssm to be installed.
 */
export class AwsSsmProvider implements Provider {
  readonly name = 'aws-ssm';
  private options: AwsSsmProviderOptions;

  constructor(options: AwsSsmProviderOptions) {
    this.options = options;
  }

  async load(): Promise<EnvMap> {
    // Lazy import so the SDK is optional for users who don't need this provider
    const { SSMClient, GetParametersByPathCommand } = await import('@aws-sdk/client-ssm').catch(() => {
      throw new Error(
        'aws-ssm provider requires @aws-sdk/client-ssm. Run: npm install @aws-sdk/client-ssm'
      );
    });

    const client = new SSMClient({
      region: this.options.region,
      ...(this.options.credentials ? { credentials: this.options.credentials } : {}),
    });

    const result: EnvMap = {};
    let nextToken: string | undefined;

    do {
      const command = new GetParametersByPathCommand({
        Path: this.options.pathPrefix,
        Recursive: true,
        WithDecryption: true,
        NextToken: nextToken,
      });

      const response = await client.send(command);
      nextToken = response.NextToken;

      for (const param of response.Parameters ?? []) {
        if (param.Name && param.Value !== undefined) {
          // Strip the path prefix to get the bare key name
          const key = param.Name.replace(this.options.pathPrefix, '').replace(/^\//, '');
          result[key] = param.Value;
        }
      }
    } while (nextToken);

    return result;
  }
}
