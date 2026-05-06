import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as child_process from "child_process";
import { createTerraformProvider } from "./terraform-provider";

vi.mock("fs");
vi.mock("child_process");

const mockState = {
  outputs: {
    db_host: { value: "db.prod.example.com", type: "string" },
    db_port: { value: 5432, type: "number" },
    feature_flags: { value: { dark_mode: "true", beta: "false" }, type: "object" },
  },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createTerraformProvider", () => {
  it("loads variables from a local state file", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockState));

    const provider = createTerraformProvider({ workspaceDir: "/tf/workspace" });
    const result = await provider.load();

    expect(result["DB_HOST"]).toBe("db.prod.example.com");
    expect(result["DB_PORT"]).toBe("5432");
    expect(result["FEATURE_FLAGS_DARK_MODE"]).toBe("true");
    expect(result["FEATURE_FLAGS_BETA"]).toBe("false");
  });

  it("falls back to terraform output -json when state file is missing", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(child_process.execSync).mockReturnValue(
      JSON.stringify({
        api_url: { value: "https://api.example.com" },
        timeout: { value: 30 },
      })
    );

    const provider = createTerraformProvider({ workspaceDir: "/tf/workspace" });
    const result = await provider.load();

    expect(result["API_URL"]).toBe("https://api.example.com");
    expect(result["TIMEOUT"]).toBe("30");
  });

  it("filters outputs by prefix", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockState));

    const provider = createTerraformProvider({
      workspaceDir: "/tf/workspace",
      outputPrefix: "db_",
    });
    const result = await provider.load();

    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(["DB_HOST", "DB_PORT"])
    );
    expect(result["FEATURE_FLAGS_DARK_MODE"]).toBeUndefined();
  });

  it("returns empty object when there are no outputs", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ outputs: {} }));

    const provider = createTerraformProvider({ workspaceDir: "/tf/workspace" });
    const result = await provider.load();

    expect(result).toEqual({});
  });

  it("has the correct provider name", () => {
    const provider = createTerraformProvider({ workspaceDir: "/tf/workspace" });
    expect(provider.name).toBe("terraform");
  });
});
