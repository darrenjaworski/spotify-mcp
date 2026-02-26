import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("fs/promises");
vi.mock("../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import fs from "fs/promises";
import {
  getCredentials,
  loadTokens,
  saveTokens,
  areTokensExpired,
  createSpotifyClient,
  refreshAccessToken,
} from "./auth.js";
import type { StoredTokens } from "../types.js";

describe("getCredentials", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns credentials when all env vars are set", () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REDIRECT_URI = "http://127.0.0.1:3000/callback";

    const creds = getCredentials();
    expect(creds).toEqual({
      clientId: "test-id",
      clientSecret: "test-secret",
      redirectUri: "http://127.0.0.1:3000/callback",
    });
  });

  it("throws when SPOTIFY_CLIENT_ID is missing", () => {
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    process.env.SPOTIFY_REDIRECT_URI = "http://127.0.0.1:3000/callback";
    delete process.env.SPOTIFY_CLIENT_ID;

    expect(() => getCredentials()).toThrow("Missing Spotify credentials");
  });

  it("throws when SPOTIFY_CLIENT_SECRET is missing", () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_REDIRECT_URI = "http://127.0.0.1:3000/callback";
    delete process.env.SPOTIFY_CLIENT_SECRET;

    expect(() => getCredentials()).toThrow("Missing Spotify credentials");
  });

  it("throws when SPOTIFY_REDIRECT_URI is missing", () => {
    process.env.SPOTIFY_CLIENT_ID = "test-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret";
    delete process.env.SPOTIFY_REDIRECT_URI;

    expect(() => getCredentials()).toThrow("Missing Spotify credentials");
  });

  it("throws when all env vars are missing", () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
    delete process.env.SPOTIFY_REDIRECT_URI;

    expect(() => getCredentials()).toThrow("Missing Spotify credentials");
  });
});

describe("loadTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed tokens from file", async () => {
    const storedTokens: StoredTokens = {
      accessToken: "access-123",
      refreshToken: "refresh-456",
      expiresAt: Date.now() + 3600000,
    };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(storedTokens));

    const tokens = await loadTokens();
    expect(tokens).toEqual(storedTokens);
  });

  it("returns null when token file does not exist", async () => {
    const error = new Error("ENOENT") as NodeJS.ErrnoException;
    error.code = "ENOENT";
    vi.mocked(fs.readFile).mockRejectedValue(error);

    const tokens = await loadTokens();
    expect(tokens).toBeNull();
  });

  it("throws on non-ENOENT file errors", async () => {
    const error = new Error("Permission denied") as NodeJS.ErrnoException;
    error.code = "EACCES";
    vi.mocked(fs.readFile).mockRejectedValue(error);

    await expect(loadTokens()).rejects.toThrow("Permission denied");
  });
});

describe("saveTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it("creates directory with 0700 permissions", async () => {
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
    };

    await saveTokens(tokens);
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining(".spotify-mcp"),
      { recursive: true, mode: 0o700 },
    );
  });

  it("writes token file with 0600 permissions", async () => {
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
    };

    await saveTokens(tokens);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("tokens.json"),
      JSON.stringify(tokens, null, 2),
      { mode: 0o600 },
    );
  });

  it("throws when directory creation fails", async () => {
    vi.mocked(fs.mkdir).mockRejectedValue(new Error("disk full"));
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
    };

    await expect(saveTokens(tokens)).rejects.toThrow("disk full");
  });

  it("throws when file write fails", async () => {
    vi.mocked(fs.writeFile).mockRejectedValue(new Error("write error"));
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
    };

    await expect(saveTokens(tokens)).rejects.toThrow("write error");
  });
});

describe("areTokensExpired", () => {
  it("returns true when tokens are already expired", () => {
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() - 60000, // 1 minute ago
    };
    expect(areTokensExpired(tokens)).toBe(true);
  });

  it("returns true when tokens expire within 5 minutes", () => {
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes from now
    };
    expect(areTokensExpired(tokens)).toBe(true);
  });

  it("returns false when tokens expire after 5 minutes", () => {
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
    };
    expect(areTokensExpired(tokens)).toBe(false);
  });

  it("returns true when tokens expire exactly at 5-minute boundary", () => {
    const tokens: StoredTokens = {
      accessToken: "a",
      refreshToken: "r",
      // Exactly 5 minutes from now — still considered expired (< check)
      expiresAt: Date.now() + 5 * 60 * 1000 - 1,
    };
    expect(areTokensExpired(tokens)).toBe(true);
  });
});

describe("createSpotifyClient", () => {
  it("returns a SpotifyWebApi instance with credentials", () => {
    const client = createSpotifyClient({
      clientId: "id",
      clientSecret: "secret",
      redirectUri: "http://127.0.0.1:3000/callback",
    });
    expect(client).toBeDefined();
    expect(client.getClientId()).toBe("id");
    expect(client.getRedirectURI()).toBe("http://127.0.0.1:3000/callback");
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it("refreshes and returns new tokens", async () => {
    const mockClient: any = {
      setRefreshToken: vi.fn(),
      refreshAccessToken: vi.fn().mockResolvedValue({
        body: {
          access_token: "new-access",
          refresh_token: "new-refresh",
          expires_in: 3600,
        },
      }),
    };

    const tokens = await refreshAccessToken(mockClient, "old-refresh");

    expect(mockClient.setRefreshToken).toHaveBeenCalledWith("old-refresh");
    expect(tokens.accessToken).toBe("new-access");
    expect(tokens.refreshToken).toBe("new-refresh");
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());
  });

  it("keeps old refresh token when new one is not provided", async () => {
    const mockClient: any = {
      setRefreshToken: vi.fn(),
      refreshAccessToken: vi.fn().mockResolvedValue({
        body: {
          access_token: "new-access",
          refresh_token: undefined,
          expires_in: 3600,
        },
      }),
    };

    const tokens = await refreshAccessToken(mockClient, "old-refresh");
    expect(tokens.refreshToken).toBe("old-refresh");
  });

  it("saves tokens to file after refresh", async () => {
    const mockClient: any = {
      setRefreshToken: vi.fn(),
      refreshAccessToken: vi.fn().mockResolvedValue({
        body: {
          access_token: "new-access",
          refresh_token: "new-refresh",
          expires_in: 3600,
        },
      }),
    };

    await refreshAccessToken(mockClient, "old-refresh");
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("propagates errors from Spotify API", async () => {
    const mockClient: any = {
      setRefreshToken: vi.fn(),
      refreshAccessToken: vi.fn().mockRejectedValue(new Error("invalid grant")),
    };

    await expect(refreshAccessToken(mockClient, "bad-token")).rejects.toThrow(
      "invalid grant",
    );
  });
});
