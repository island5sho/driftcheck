import { EnvMap, Provider } from "./types";

export interface OnePasswordClient {
  getItem(vault: string, itemTitle: string): Promise<{ fields: Array<{ label: string; value: string }> }>;
  listItems(vault: string): Promise<Array<{ title: string }>>;
}

export interface OnePasswordProviderOptions {
  client: OnePasswordClient;
  vault: string;
  itemTitle?: string;
}

/**
 * Reads environment variables from a 1Password vault item.
 * Each field label becomes an env var key, field value becomes the value.
 * If itemTitle is provided, only that item is read; otherwise all items are merged.
 */
export class OnePasswordProvider implements Provider {
  readonly name = "1password";

  private client: OnePasswordClient;
  private vault: string;
  private itemTitle?: string;

  constructor(options: OnePasswordProviderOptions) {
    this.client = options.client;
    this.vault = options.vault;
    this.itemTitle = options.itemTitle;
  }

  async load(): Promise<EnvMap> {
    const result: EnvMap = {};

    if (this.itemTitle) {
      const item = await this.client.getItem(this.vault, this.itemTitle);
      for (const field of item.fields) {
        if (field.label && field.value !== undefined) {
          result[field.label] = field.value;
        }
      }
    } else {
      const items = await this.client.listItems(this.vault);
      for (const { title } of items) {
        const item = await this.client.getItem(this.vault, title);
        for (const field of item.fields) {
          if (field.label && field.value !== undefined) {
            result[field.label] = field.value;
          }
        }
      }
    }

    return result;
  }
}
