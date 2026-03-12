import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./auth.js", () => ({
  getCredentials: vi.fn().mockReturnValue({
    clientId: "test-id",
    clientSecret: "test-secret",
    redirectUri: "http://127.0.0.1:3000/callback",
  }),
  loadTokens: vi.fn(),
  areTokensExpired: vi.fn(),
  createSpotifyClient: vi.fn(),
  refreshAccessToken: vi.fn(),
  deleteTokens: vi.fn(),
  startOAuthFlow: vi.fn(),
}));

vi.mock("../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  getCredentials,
  loadTokens,
  areTokensExpired,
  createSpotifyClient,
  refreshAccessToken,
  deleteTokens,
  startOAuthFlow,
} from "./auth.js";
import { getAuthenticatedClient, resetClient, withRetry } from "./client.js";
import type { StoredTokens } from "../types.js";

// ─── withRetry tests (from Resilience worktree) ───

describe("withRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns result on successful call", async () => {
    const mockClient: any = {
      getMyDevices: vi.fn().mockResolvedValue({ body: { devices: [] } }),
    };

    const proxied = withRetry(mockClient);
    const result = await proxied.getMyDevices();
    expect(result).toEqual({ body: { devices: [] } });
    expect(mockClient.getMyDevices).toHaveBeenCalledTimes(1);
  });

  it("does not retry on non-429 errors", async () => {
    const mockClient: any = {
      getMyDevices: vi.fn().mockRejectedValue({ statusCode: 404 }),
    };

    const proxied = withRetry(mockClient);
    await expect(proxied.getMyDevices()).rejects.toEqual({ statusCode: 404 });
    expect(mockClient.getMyDevices).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 and succeeds", async () => {
    const mockClient: any = {
      getMyDevices: vi
        .fn()
        .mockRejectedValueOnce({ statusCode: 429 })
        .mockResolvedValueOnce({ body: { devices: [] } }),
    };

    const proxied = withRetry(mockClient);
    const result = await proxied.getMyDevices();
    expect(result).toEqual({ body: { devices: [] } });
    expect(mockClient.getMyDevices).toHaveBeenCalledTimes(2);
  });

  it("retries up to MAX_RETRIES times then throws", async () => {
    const error429 = { statusCode: 429 };
    const mockClient: any = {
      getMyDevices: vi.fn().mockRejectedValue(error429),
    };

    const proxied = withRetry(mockClient);
    await expect(proxied.getMyDevices()).rejects.toEqual(error429);
    // 1 initial + 3 retries = 4 total calls
    expect(mockClient.getMyDevices).toHaveBeenCalledTimes(4);
  }, 15000);

  it("respects Retry-After header when present", async () => {
    const error429 = { statusCode: 429, headers: { "retry-after": "2" } };
    const mockClient: any = {
      getMyDevices: vi
        .fn()
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce({ body: { devices: [] } }),
    };

    const proxied = withRetry(mockClient);
    const result = await proxied.getMyDevices();
    expect(result).toEqual({ body: { devices: [] } });
    expect(mockClient.getMyDevices).toHaveBeenCalledTimes(2);
  });

  it("does not retry setter/getter methods", () => {
    const mockClient: any = {
      setAccessToken: vi.fn(),
      getAccessToken: vi.fn().mockReturnValue("token"),
    };

    const proxied = withRetry(mockClient);
    proxied.setAccessToken("new-token");
    expect(mockClient.setAccessToken).toHaveBeenCalledWith("new-token");

    const token = proxied.getAccessToken();
    expect(token).toBe("token");
  });

  it("passes through non-function properties", () => {
    const mockClient: any = {
      someProperty: "hello",
    };

    const proxied: any = withRetry(mockClient);
    expect(proxied.someProperty).toBe("hello");
  });

  it("detects 429 from body.error.status format", async () => {
    const error429 = { body: { error: { status: 429 } } };
    const mockClient: any = {
      play: vi.fn().mockRejectedValueOnce(error429).mockResolvedValueOnce({ body: {} }),
    };

    const proxied = withRetry(mockClient);
    const result = await proxied.play();
    expect(result).toEqual({ body: {} });
    expect(mockClient.play).toHaveBeenCalledTimes(2);
  });
});

// ─── getAuthenticatedClient tests (merged from both worktrees) ───

describe("getAuthenticatedClient", () => {
  let mockSpotifyClient: any;

  const validTokens: StoredTokens = {
    accessToken: "access-123",
    refreshToken: "refresh-456",
    expiresAt: Date.now() + 3600000,
  };

  const credentials = {
    clientId: "test-id",
    clientSecret: "test-secret",
    redirectUri: "http://127.0.0.1:3000/callback",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetClient();

    mockSpotifyClient = {
      setAccessToken: vi.fn(),
      setRefreshToken: vi.fn(),
    };

    vi.mocked(getCredentials).mockReturnValue(credentials);
    vi.mocked(createSpotifyClient).mockReturnValue(mockSpotifyClient);
  });

  it("returns a client when tokens are valid", async () => {
    vi.mocked(loadTokens).mockResolvedValue(validTokens);
    vi.mocked(areTokensExpired).mockReturnValue(false);

    const client = await getAuthenticatedClient();

    // The returned client is wrapped in a withRetry Proxy, so it won't be === mockSpotifyClient
    expect(client).toBeDefined();
    expect(getCredentials).toHaveBeenCalled();
    expect(createSpotifyClient).toHaveBeenCalledWith(credentials);
    expect(loadTokens).toHaveBeenCalled();
    expect(areTokensExpired).toHaveBeenCalledWith(validTokens);
    expect(mockSpotifyClient.setAccessToken).toHaveBeenCalledWith(validTokens.accessToken);
    expect(mockSpotifyClient.setRefreshToken).toHaveBeenCalledWith(validTokens.refreshToken);
  });

  it("refreshes tokens when they are expired", async () => {
    const refreshedTokens: StoredTokens = {
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresAt: Date.now() + 7200000,
    };

    vi.mocked(loadTokens).mockResolvedValue(validTokens);
    vi.mocked(areTokensExpired).mockReturnValue(true);
    vi.mocked(refreshAccessToken).mockResolvedValue(refreshedTokens);

    const client = await getAuthenticatedClient();

    expect(client).toBeDefined();
    expect(refreshAccessToken).toHaveBeenCalledWith(mockSpotifyClient, validTokens.refreshToken);
    expect(mockSpotifyClient.setAccessToken).toHaveBeenCalledWith(refreshedTokens.accessToken);
    expect(mockSpotifyClient.setRefreshToken).toHaveBeenCalledWith(refreshedTokens.refreshToken);
  });

  it("triggers OAuth flow when no tokens exist", async () => {
    const oauthTokens: StoredTokens = {
      accessToken: "oauth-access",
      refreshToken: "oauth-refresh",
      expiresAt: Date.now() + 3600000,
    };

    vi.mocked(loadTokens).mockResolvedValue(null);
    vi.mocked(startOAuthFlow).mockResolvedValue(oauthTokens);
    vi.mocked(areTokensExpired).mockReturnValue(false);

    const client = await getAuthenticatedClient();

    expect(client).toBeDefined();
    expect(startOAuthFlow).toHaveBeenCalledWith(mockSpotifyClient);
    expect(mockSpotifyClient.setAccessToken).toHaveBeenCalledWith(oauthTokens.accessToken);
    expect(mockSpotifyClient.setRefreshToken).toHaveBeenCalledWith(oauthTokens.refreshToken);
  });

  it("triggers OAuth then checks expiry on returned tokens", async () => {
    const oauthTokens: StoredTokens = {
      accessToken: "oauth-access",
      refreshToken: "oauth-refresh",
      expiresAt: Date.now() - 1000, // expired
    };
    const refreshedTokens: StoredTokens = {
      accessToken: "refreshed-access",
      refreshToken: "refreshed-refresh",
      expiresAt: Date.now() + 3600000,
    };

    vi.mocked(loadTokens).mockResolvedValue(null);
    vi.mocked(startOAuthFlow).mockResolvedValue(oauthTokens);
    vi.mocked(areTokensExpired).mockReturnValue(true);
    vi.mocked(refreshAccessToken).mockResolvedValue(refreshedTokens);

    const client = await getAuthenticatedClient();

    expect(client).toBeDefined();
    expect(startOAuthFlow).toHaveBeenCalledWith(mockSpotifyClient);
    expect(refreshAccessToken).toHaveBeenCalledWith(mockSpotifyClient, oauthTokens.refreshToken);
    expect(mockSpotifyClient.setAccessToken).toHaveBeenCalledWith(refreshedTokens.accessToken);
  });

  it("deletes tokens and throws user-friendly error when refresh fails", async () => {
    vi.mocked(loadTokens).mockResolvedValue({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: Date.now() - 60000, // expired
    });
    vi.mocked(areTokensExpired).mockReturnValue(true);
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error("invalid grant"));
    vi.mocked(deleteTokens).mockResolvedValue(undefined);

    await expect(getAuthenticatedClient()).rejects.toThrow(
      "Session expired. Please re-authenticate.",
    );
    expect(deleteTokens).toHaveBeenCalled();
  });

  it("propagates error when OAuth flow fails", async () => {
    vi.mocked(loadTokens).mockResolvedValue(null);
    vi.mocked(startOAuthFlow).mockRejectedValue(new Error("OAuth timeout"));

    await expect(getAuthenticatedClient()).rejects.toThrow("OAuth timeout");
  });

  it("propagates error when loadTokens fails", async () => {
    vi.mocked(loadTokens).mockRejectedValue(new Error("Permission denied"));

    await expect(getAuthenticatedClient()).rejects.toThrow("Permission denied");
  });

  it("propagates error when getCredentials throws", async () => {
    vi.mocked(getCredentials).mockImplementation(() => {
      throw new Error("Missing Spotify credentials in environment variables");
    });

    await expect(getAuthenticatedClient()).rejects.toThrow(
      "Missing Spotify credentials in environment variables",
    );
  });

  it("reuses existing client on subsequent calls", async () => {
    vi.mocked(loadTokens).mockResolvedValue(validTokens);
    vi.mocked(areTokensExpired).mockReturnValue(false);

    await getAuthenticatedClient();
    await getAuthenticatedClient();

    // createSpotifyClient should only be called once
    expect(createSpotifyClient).toHaveBeenCalledTimes(1);
  });

  it("creates a new client after resetClient is called", async () => {
    vi.mocked(loadTokens).mockResolvedValue(validTokens);
    vi.mocked(areTokensExpired).mockReturnValue(false);

    await getAuthenticatedClient();
    resetClient();
    await getAuthenticatedClient();

    // createSpotifyClient should be called twice (once before reset, once after)
    expect(createSpotifyClient).toHaveBeenCalledTimes(2);
  });

  it("returns a client wrapped with retry logic", async () => {
    vi.mocked(loadTokens).mockResolvedValue({
      accessToken: "valid-access",
      refreshToken: "valid-refresh",
      expiresAt: Date.now() + 3600000,
    });
    vi.mocked(areTokensExpired).mockReturnValue(false);

    const client = await getAuthenticatedClient();
    // The returned client should be a Proxy (withRetry wraps it)
    expect(client).toBeDefined();
    expect(mockSpotifyClient.setAccessToken).toHaveBeenCalledWith("valid-access");
    expect(mockSpotifyClient.setRefreshToken).toHaveBeenCalledWith("valid-refresh");
  });
});

describe("resetClient", () => {
  it("resets the cached client so a new one is created", async () => {
    vi.clearAllMocks();
    resetClient();

    const mockClient: any = {
      setAccessToken: vi.fn(),
      setRefreshToken: vi.fn(),
    };

    vi.mocked(getCredentials).mockReturnValue({
      clientId: "id",
      clientSecret: "secret",
      redirectUri: "http://127.0.0.1:3000/callback",
    });
    vi.mocked(createSpotifyClient).mockReturnValue(mockClient);
    vi.mocked(loadTokens).mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: Date.now() + 3600000,
    });
    vi.mocked(areTokensExpired).mockReturnValue(false);

    await getAuthenticatedClient();
    expect(createSpotifyClient).toHaveBeenCalledTimes(1);

    resetClient();
    await getAuthenticatedClient();
    expect(createSpotifyClient).toHaveBeenCalledTimes(2);
  });
});
