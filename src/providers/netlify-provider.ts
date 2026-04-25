import axios from "axios";
import { EnvMap, Provider } from "./types";

export interface NetlifyProviderOptions {
  siteId: string;
  accessToken: string;
  context?: string; // e.g. 'production', 'deploy-preview', 'branch-deploy'
}

export class NetlifyProvider implements Provider {
  readonly name = "netlify";
  private readonly siteId: string;
  private readonly accessToken: string;
  private readonly context: string;

  constructor(options: NetlifyProviderOptions) {
    this.siteId = options.siteId;
    this.accessToken = options.accessToken;
    this.context = options.context ?? "production";
  }

  async load(): Promise<EnvMap> {
    const url = `https://api.netlify.com/api/v1/sites/${this.siteId}/env`;

    const response = await axios.get<NetlifyEnvVar[]>(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      params: { context_name: this.context },
    });

    const result: EnvMap = {};

    for (const envVar of response.data) {
      const value = envVar.values?.find(
        (v) => v.context === this.context || v.context === "all"
      );
      if (value !== undefined) {
        result[envVar.key] = value.value;
      }
    }

    return result;
  }
}

interface NetlifyEnvVarValue {
  context: string;
  value: string;
}

interface NetlifyEnvVar {
  key: string;
  values?: NetlifyEnvVarValue[];
}
