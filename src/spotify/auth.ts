/**
 * Spotify OAuth 2.0 authentication with PKCE
 */

import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import SpotifyWebApi from "spotify-web-api-node";
import type { SpotifyCredentials, StoredTokens } from "../types.js";
import { logger } from "../utils/logger.js";

const TOKEN_DIR = path.join(os.homedir(), ".spotify-mcp");
const TOKEN_FILE = path.join(TOKEN_DIR, "tokens.json");

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/**
 * Get Spotify credentials from environment
 */
export function getCredentials(): SpotifyCredentials {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Spotify credentials in environment variables");
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Load stored tokens from file
 */
export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const tokens = JSON.parse(data) as StoredTokens;
    logger.debug("Loaded tokens from file");
    return tokens;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logger.debug("No stored tokens found");
      return null;
    }
    logger.error("Error loading tokens:", error);
    throw error;
  }
}

/**
 * Save tokens to file
 */
export async function saveTokens(tokens: StoredTokens): Promise<void> {
  try {
    await fs.mkdir(TOKEN_DIR, { recursive: true, mode: 0o700 });
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    logger.debug("Saved tokens to file");
  } catch (error) {
    logger.error("Error saving tokens:", error);
    throw error;
  }
}

/**
 * Check if tokens are expired or will expire soon (within 5 minutes)
 */
export function areTokensExpired(tokens: StoredTokens): boolean {
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
  return tokens.expiresAt < fiveMinutesFromNow;
}

/**
 * Create a Spotify API client with credentials
 */
export function createSpotifyClient(credentials: SpotifyCredentials): SpotifyWebApi {
  return new SpotifyWebApi({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri: credentials.redirectUri,
  });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  client: SpotifyWebApi,
  refreshToken: string
): Promise<StoredTokens> {
  logger.info("Refreshing access token");

  client.setRefreshToken(refreshToken);
  const data = await client.refreshAccessToken();

  const tokens: StoredTokens = {
    accessToken: data.body.access_token,
    refreshToken: data.body.refresh_token || refreshToken, // Keep old refresh token if not provided
    expiresAt: Date.now() + data.body.expires_in * 1000,
  };

  await saveTokens(tokens);
  return tokens;
}

/**
 * Start OAuth flow (for initial authentication)
 * This is a placeholder - actual implementation would need to handle browser opening
 * and callback server for the authorization code
 */
export async function startOAuthFlow(client: SpotifyWebApi): Promise<StoredTokens> {
  const scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-read",
    "user-library-modify",
    "user-top-read",
    "user-read-recently-played",
    "user-read-email",
    "user-read-private",
  ];

  // Generate PKCE for future use
  generatePKCE();

  // Store state for later use (in real implementation)
  const state = "random-state-" + Math.random().toString(36).substring(7);
  const authorizeURL = client.createAuthorizeURL(scopes, state);

  // In a real implementation, this would:
  // 1. Open the browser to authorizeURL
  // 2. Start a local server to receive the callback
  // 3. Exchange the authorization code for tokens using PKCE
  // 4. Save and return the tokens

  throw new Error(
    `OAuth flow not fully implemented yet. Please visit: ${authorizeURL}\n\n` +
    "After authorization, you'll need to manually exchange the code for tokens.\n" +
    "This will be automated in a future version."
  );
}
