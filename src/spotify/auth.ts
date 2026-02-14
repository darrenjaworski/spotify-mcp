/**
 * Spotify OAuth 2.0 authentication with PKCE
 */

import fs from "fs/promises";
import path from "path";
import os from "os";
import SpotifyWebApi from "spotify-web-api-node";
import type { SpotifyCredentials, StoredTokens } from "../types.js";
import { logger } from "../utils/logger.js";

const TOKEN_DIR = path.join(os.homedir(), ".spotify-mcp");
const TOKEN_FILE = path.join(TOKEN_DIR, "tokens.json");

/**
 * Generate PKCE code verifier and challenge
 * Note: Currently unused as spotify-web-api-node doesn't support PKCE directly
 * Keeping for future implementation if needed
 */
/*
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
*/

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
 * Opens browser for user authorization and handles callback
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

  const state = "random-state-" + Math.random().toString(36).substring(7);
  const authorizeURL = client.createAuthorizeURL(scopes, state);

  logger.info("Starting OAuth flow...");
  logger.info(`Authorization URL: ${authorizeURL}`);

  return new Promise((resolve, reject) => {
    // Import http dynamically to avoid issues
    import("http").then(({ default: http }) => {
      const server = http.createServer(async (req, res) => {
        if (!req.url?.startsWith("/callback")) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const url = new URL(req.url, "http://localhost:3000");
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`<html><body><h1>Authorization failed</h1><p>${error}</p></body></html>`);
          server.close();
          reject(new Error(`Authorization failed: ${error}`));
          return;
        }

        if (returnedState !== state) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h1>State mismatch</h1></body></html>");
          server.close();
          reject(new Error("State mismatch in OAuth callback"));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h1>No authorization code received</h1></body></html>");
          server.close();
          reject(new Error("No authorization code received"));
          return;
        }

        try {
          // Exchange code for tokens
          logger.info("Exchanging authorization code for tokens");
          const data = await client.authorizationCodeGrant(code);

          const tokens: StoredTokens = {
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expiresAt: Date.now() + data.body.expires_in * 1000,
          };

          await saveTokens(tokens);

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(
            "<html><head><meta charset=\"utf-8\"></head><body><h1>✓ Authorization successful!</h1><p>You can close this window and return to your application.</p></body></html>"
          );

          server.close();
          resolve(tokens);
        } catch (error) {
          logger.error("Error exchanging code for tokens:", error);
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Error exchanging authorization code</h1></body></html>");
          server.close();
          reject(error);
        }
      });

      server.listen(3000, () => {
        logger.info("OAuth callback server listening on http://localhost:3000");
        logger.info("Opening browser for authorization...");

        // Open browser
        import("child_process").then(({ exec }) => {
          const platform = process.platform;
          const command =
            platform === "darwin"
              ? `open "${authorizeURL}"`
              : platform === "win32"
              ? `start "${authorizeURL}"`
              : `xdg-open "${authorizeURL}"`;

          exec(command, (error) => {
            if (error) {
              logger.warn("Could not open browser automatically. Please visit:", authorizeURL);
            }
          });
        });
      });

      server.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          reject(
            new Error(
              "Port 3000 is already in use. Please close any application using port 3000 and try again."
            )
          );
        } else {
          reject(error);
        }
      });
    });
  });
}
