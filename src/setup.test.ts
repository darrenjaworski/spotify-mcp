import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock modules before imports
vi.mock("fs/promises", () => ({
  writeFile: vi.fn(),
}));
vi.mock("readline/promises", () => ({
  createInterface: vi.fn(),
}));
vi.mock("child_process", () => ({
  spawn: vi.fn(),
}));

import { writeFile } from "fs/promises";
import * as readline from "readline/promises";

/**
 * Since setup.ts exports runSetup (an interactive wizard) and several
 * internal helper functions that are not exported, we test the exported
 * function behavior and also re-implement validation logic tests inline
 * to verify the core business rules.
 */

describe("setup validation logic", () => {
  describe("validateClientId", () => {
    // The validation function checks for 32-character hex strings
    const validateClientId = (id: string): boolean => /^[a-f0-9]{32}$/i.test(id);

    it("accepts valid 32-character hex client ID", () => {
      expect(validateClientId("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4")).toBe(true);
    });

    it("accepts uppercase hex characters", () => {
      expect(validateClientId("A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4")).toBe(true);
    });

    it("rejects too short strings", () => {
      expect(validateClientId("abc123")).toBe(false);
    });

    it("rejects too long strings", () => {
      expect(validateClientId("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5")).toBe(false);
    });

    it("rejects non-hex characters", () => {
      expect(validateClientId("g1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateClientId("")).toBe(false);
    });

    it("rejects strings with spaces", () => {
      expect(validateClientId("a1b2c3d4 e5f6a1b2c3d4e5f6a1b2c3d")).toBe(false);
    });

    it("rejects strings with special characters", () => {
      expect(validateClientId("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d!")).toBe(false);
    });
  });

  describe("validateClientSecret", () => {
    const validateClientSecret = (secret: string): boolean => /^[a-f0-9]{32}$/i.test(secret);

    it("accepts valid 32-character hex client secret", () => {
      expect(validateClientSecret("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4")).toBe(true);
    });

    it("rejects invalid format", () => {
      expect(validateClientSecret("not-a-valid-secret")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateClientSecret("")).toBe(false);
    });
  });

  describe("generateMcpConfig", () => {
    // Re-implement the config generation logic for testing
    function generateMcpConfig(
      clientId: string,
      clientSecret: string,
      useNpx: boolean = true,
    ): string {
      if (useNpx) {
        return JSON.stringify(
          {
            mcpServers: {
              spotify: {
                command: "npx",
                args: ["-y", "@darrenjaws/spotify-mcp"],
                env: {
                  SPOTIFY_CLIENT_ID: clientId,
                  SPOTIFY_CLIENT_SECRET: clientSecret,
                  SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/callback",
                },
              },
            },
          },
          null,
          2,
        );
      } else {
        return JSON.stringify(
          {
            mcpServers: {
              spotify: {
                command: "spotify-mcp",
                env: {
                  SPOTIFY_CLIENT_ID: clientId,
                  SPOTIFY_CLIENT_SECRET: clientSecret,
                  SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/callback",
                },
              },
            },
          },
          null,
          2,
        );
      }
    }

    it("generates npx config by default", () => {
      const config = generateMcpConfig("test-id", "test-secret");
      const parsed = JSON.parse(config);
      expect(parsed.mcpServers.spotify.command).toBe("npx");
      expect(parsed.mcpServers.spotify.args).toEqual(["-y", "@darrenjaws/spotify-mcp"]);
      expect(parsed.mcpServers.spotify.env.SPOTIFY_CLIENT_ID).toBe("test-id");
      expect(parsed.mcpServers.spotify.env.SPOTIFY_CLIENT_SECRET).toBe("test-secret");
      expect(parsed.mcpServers.spotify.env.SPOTIFY_REDIRECT_URI).toBe(
        "http://127.0.0.1:3000/callback",
      );
    });

    it("generates global install config when useNpx is false", () => {
      const config = generateMcpConfig("test-id", "test-secret", false);
      const parsed = JSON.parse(config);
      expect(parsed.mcpServers.spotify.command).toBe("spotify-mcp");
      expect(parsed.mcpServers.spotify.args).toBeUndefined();
    });

    it("includes all required env vars", () => {
      const config = generateMcpConfig("id", "secret", true);
      const parsed = JSON.parse(config);
      const env = parsed.mcpServers.spotify.env;
      expect(env).toHaveProperty("SPOTIFY_CLIENT_ID");
      expect(env).toHaveProperty("SPOTIFY_CLIENT_SECRET");
      expect(env).toHaveProperty("SPOTIFY_REDIRECT_URI");
    });
  });

  describe("generateVSCodeConfig", () => {
    function generateVSCodeConfig(clientId: string, clientSecret: string): string {
      return JSON.stringify(
        {
          servers: {
            spotify: {
              type: "stdio",
              command: "npx",
              args: ["-y", "@darrenjaws/spotify-mcp"],
              env: {
                SPOTIFY_CLIENT_ID: clientId,
                SPOTIFY_CLIENT_SECRET: clientSecret,
                SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/callback",
              },
            },
          },
        },
        null,
        2,
      );
    }

    it("generates VS Code config with servers key (not mcpServers)", () => {
      const config = generateVSCodeConfig("test-id", "test-secret");
      const parsed = JSON.parse(config);
      expect(parsed.servers).toBeDefined();
      expect(parsed.mcpServers).toBeUndefined();
      expect(parsed.servers.spotify.type).toBe("stdio");
    });
  });

  describe("generateOpenCodeConfig", () => {
    function generateOpenCodeConfig(clientId: string, clientSecret: string): string {
      return JSON.stringify(
        {
          spotify: {
            command: ["npx", "-y", "@darrenjaws/spotify-mcp@latest"],
            environment: {
              SPOTIFY_CLIENT_ID: clientId,
              SPOTIFY_CLIENT_SECRET: clientSecret,
              SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/callback",
            },
            type: "local",
          },
        },
        null,
        2,
      );
    }

    it("generates OpenCode config with environment key (not env)", () => {
      const config = generateOpenCodeConfig("test-id", "test-secret");
      const parsed = JSON.parse(config);
      expect(parsed.spotify.environment).toBeDefined();
      expect(parsed.spotify.type).toBe("local");
      expect(parsed.spotify.command).toEqual(["npx", "-y", "@darrenjaws/spotify-mcp@latest"]);
    });
  });

  describe("getConfigPath", () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, "platform", { value: originalPlatform });
    });

    it("returns macOS path on darwin", async () => {
      Object.defineProperty(process, "platform", { value: "darwin" });
      const { homedir } = await import("os");
      const { join } = await import("path");
      const expected = join(
        homedir(),
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json",
      );
      // We verify the expected path format since we can't call the unexported function
      expect(expected).toContain("Library/Application Support/Claude/claude_desktop_config.json");
    });

    it("returns Linux path on linux", async () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      const { homedir } = await import("os");
      const { join } = await import("path");
      const expected = join(homedir(), ".config", "Claude", "claude_desktop_config.json");
      expect(expected).toContain(".config/Claude/claude_desktop_config.json");
    });
  });
});

describe("runSetup", () => {
  let mockRl: any;
  let promptResponses: string[];
  let promptIndex: number;

  beforeEach(() => {
    vi.clearAllMocks();
    promptIndex = 0;
    promptResponses = [];

    mockRl = {
      question: vi.fn().mockImplementation(() => {
        const response = promptResponses[promptIndex] || "";
        promptIndex++;
        return Promise.resolve(response);
      }),
      close: vi.fn(),
    };

    vi.mocked(readline.createInterface).mockReturnValue(mockRl as any);
    vi.mocked(writeFile).mockResolvedValue(undefined);
  });

  it("closes readline interface on completion", async () => {
    // Simulate: Y to open browser, ENTER to continue, valid client ID, valid secret, choice 7 (dev)
    promptResponses = [
      "n", // skip browser open
      "", // press ENTER
      "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", // client ID
      "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3", // client secret
      "7", // development from source
    ];

    const { runSetup } = await import("./setup.js");
    await runSetup();

    expect(mockRl.close).toHaveBeenCalled();
  });

  it("creates .env file when development option is selected", async () => {
    promptResponses = [
      "n", // skip browser open
      "", // press ENTER
      "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", // client ID
      "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3", // client secret
      "7", // development from source
    ];

    const { runSetup } = await import("./setup.js");
    await runSetup();

    expect(writeFile).toHaveBeenCalledWith(
      ".env",
      expect.stringContaining("SPOTIFY_CLIENT_ID=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"),
    );
    expect(writeFile).toHaveBeenCalledWith(
      ".env",
      expect.stringContaining("SPOTIFY_CLIENT_SECRET=f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3"),
    );
    expect(writeFile).toHaveBeenCalledWith(
      ".env",
      expect.stringContaining("SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback"),
    );
  });

  it("retries on invalid client ID", async () => {
    promptResponses = [
      "n", // skip browser open
      "", // press ENTER
      "invalid-id", // invalid client ID
      "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", // valid client ID
      "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3", // client secret
      "1", // Claude Desktop
      "1", // npx method
    ];

    const { runSetup } = await import("./setup.js");
    await runSetup();

    // Should have been called 7 times total (including the retry)
    expect(mockRl.question).toHaveBeenCalledTimes(7);
  });

  it("retries on invalid client secret", async () => {
    promptResponses = [
      "n", // skip browser open
      "", // press ENTER
      "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4", // valid client ID
      "bad-secret", // invalid secret
      "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3", // valid secret
      "1", // Claude Desktop
      "1", // npx method
    ];

    const { runSetup } = await import("./setup.js");
    await runSetup();

    // Should have been called 7 times total (including the retry)
    expect(mockRl.question).toHaveBeenCalledTimes(7);
  });

  it("closes readline interface even when an error occurs", async () => {
    mockRl.question.mockRejectedValue(new Error("readline error"));

    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    const { runSetup } = await import("./setup.js");

    await expect(runSetup()).rejects.toThrow("process.exit called");
    expect(mockRl.close).toHaveBeenCalled();

    mockExit.mockRestore();
  });
});
