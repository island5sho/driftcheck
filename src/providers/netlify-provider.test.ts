import axios from "axios";
import { NetlifyProvider } from "./netlify-provider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const SITE_ID = "test-site-id";
const ACCESS_TOKEN = "test-token";

function makeEnvVars(
  overrides: Array<{ key: string; context: string; value: string }>
) {
  return overrides.map(({ key, context, value }) => ({
    key,
    values: [{ context, value }],
  }));
}

describe("NetlifyProvider", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads env vars for the production context", async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: makeEnvVars([
        { key: "API_URL", context: "production", value: "https://api.example.com" },
        { key: "DEBUG", context: "all", value: "false" },
      ]),
    });

    const provider = new NetlifyProvider({ siteId: SITE_ID, accessToken: ACCESS_TOKEN });
    const result = await provider.load();

    expect(result).toEqual({
      API_URL: "https://api.example.com",
      DEBUG: "false",
    });
  });

  it("uses a custom context when provided", async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: makeEnvVars([
        { key: "API_URL", context: "deploy-preview", value: "https://preview.example.com" },
      ]),
    });

    const provider = new NetlifyProvider({
      siteId: SITE_ID,
      accessToken: ACCESS_TOKEN,
      context: "deploy-preview",
    });
    const result = await provider.load();

    expect(result).toEqual({ API_URL: "https://preview.example.com" });
  });

  it("skips vars with no matching context value", async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: makeEnvVars([
        { key: "ONLY_PREVIEW", context: "deploy-preview", value: "yes" },
      ]),
    });

    const provider = new NetlifyProvider({ siteId: SITE_ID, accessToken: ACCESS_TOKEN });
    const result = await provider.load();

    expect(result).toEqual({});
  });

  it("calls the Netlify API with correct headers and params", async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: [] });

    const provider = new NetlifyProvider({ siteId: SITE_ID, accessToken: ACCESS_TOKEN });
    await provider.load();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://api.netlify.com/api/v1/sites/${SITE_ID}/env`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        }),
        params: { context_name: "production" },
      })
    );
  });

  it("has the correct provider name", () => {
    const provider = new NetlifyProvider({ siteId: SITE_ID, accessToken: ACCESS_TOKEN });
    expect(provider.name).toBe("netlify");
  });
});
