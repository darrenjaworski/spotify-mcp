/**
 * Spotify OAuth 2.0 authentication using Authorization Code flow
 * Uses client_secret for secure server-to-server authentication
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
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(str: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Note: This server uses the Authorization Code flow with client_secret,
 * which is the appropriate flow for confidential server applications.
 * PKCE is recommended for public clients (SPAs, mobile apps) that cannot
 * securely store a client_secret. Since this is a server-side application
 * with secure credential storage, the standard flow is both secure and correct.
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

  // Generate cryptographically secure state parameter for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  const authorizeURL = client.createAuthorizeURL(scopes, state);

  logger.info("Starting OAuth flow...");
  logger.info(`Authorization URL: ${authorizeURL}`);

  return new Promise((resolve, reject) => {
    // Import http dynamically to avoid issues
    import("http").then(({ default: http }) => {
      let requestCount = 0;
      const MAX_REQUESTS = 5;
      let serverClosed = false;

      const server = http.createServer(async (req, res) => {
        // Rate limiting: reject after max requests
        requestCount++;
        if (requestCount > MAX_REQUESTS) {
          logger.warn("OAuth callback server: too many requests, rejecting");
          res.writeHead(429, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><head><meta charset=\"utf-8\"></head><body><h1>Too Many Requests</h1></body></html>");
          return;
        }

        // Security: only accept requests from localhost
        const remoteAddress = req.socket.remoteAddress;
        if (remoteAddress && !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress)) {
          logger.warn(`OAuth callback server: rejected request from ${remoteAddress}`);
          res.writeHead(403, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><head><meta charset=\"utf-8\"></head><body><h1>Forbidden</h1></body></html>");
          return;
        }

        if (!req.url?.startsWith("/callback")) {
          res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><head><meta charset=\"utf-8\"></head><body><h1>Not Found</h1></body></html>");
          return;
        }

        const url = new URL(req.url, "http://127.0.0.1:3000");
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<html><head><meta charset="utf-8"></head><body><h1>Authorization failed</h1><p>${escapeHtml(error)}</p></body></html>`);
          server.close();
          reject(new Error(`Authorization failed: ${error}`));
          return;
        }

        if (returnedState !== state) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><head><meta charset=\"utf-8\"></head><body><h1>State mismatch</h1><p>Invalid state parameter. Please try again.</p></body></html>");
          server.close();
          reject(new Error("State mismatch in OAuth callback"));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><head><meta charset=\"utf-8\"></head><body><h1>No authorization code received</h1><p>The authorization process was incomplete. Please try again.</p></body></html>");
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
          res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><head><meta charset=\"utf-8\"></head><body><h1>Error exchanging authorization code</h1><p>An error occurred during authentication. Please try again.</p></body></html>");
          server.close();
          reject(error);
        }
      });

      // Set timeout to automatically close server after 5 minutes
      const serverTimeout = setTimeout(() => {
        if (!serverClosed) {
          logger.warn("OAuth callback server timeout - closing server");
          server.close();
          serverClosed = true;
          reject(new Error("OAuth flow timeout - no callback received within 5 minutes"));
        }
      }, 5 * 60 * 1000); // 5 minutes

      // Clear timeout when server closes
      server.on('close', () => {
        clearTimeout(serverTimeout);
        serverClosed = true;
      });

      server.listen(3000, "127.0.0.1", () => {
        logger.info("OAuth callback server listening on http://127.0.0.1:3000");
        logger.info("Authorization timeout: 5 minutes");
        logger.info("Opening browser for authorization...");

        // Open browser (safely without shell injection)
        import("child_process").then(({ spawn }) => {
          const platform = process.platform;
          let command: string;
          let args: string[];

          if (platform === "darwin") {
            command = "open";
            args = [authorizeURL];
          } else if (platform === "win32") {
            command = "cmd";
            args = ["/c", "start", "", authorizeURL];
          } else {
            command = "xdg-open";
            args = [authorizeURL];
          }

          const child = spawn(command, args, { shell: false });

          child.on("error", () => {
            logger.warn("Could not open browser automatically. Please visit:", authorizeURL);
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
