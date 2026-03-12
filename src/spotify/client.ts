/**
 * Spotify API client wrapper with automatic token refresh and retry logic
 */

import SpotifyWebApi from "spotify-web-api-node";
import {
  getCredentials,
  loadTokens,
  areTokensExpired,
  createSpotifyClient,
  refreshAccessToken,
  deleteTokens,
  startOAuthFlow,
} from "./auth.js";
import { logger } from "../utils/logger.js";
import type { SpotifyClient } from "../types.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

let spotifyClient: SpotifyWebApi | null = null;

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap a SpotifyWebApi instance with retry logic for 429 (rate limit) responses.
 * Uses exponential backoff: 1s, 2s, 4s — and respects Retry-After header if present.
 */
export function withRetry(client: SpotifyWebApi): SpotifyWebApi {
  return new Proxy(client, {
    get(target: any, prop: string) {
      const original = target[prop];
      if (typeof original !== "function") {
        return original;
      }

      // Only wrap API-calling methods, not setters/getters
      const nonRetryMethods = [
        "setAccessToken",
        "setRefreshToken",
        "setClientId",
        "setClientSecret",
        "setRedirectURI",
        "getAccessToken",
        "getRefreshToken",
        "getClientId",
        "getClientSecret",
        "getRedirectURI",
        "createAuthorizeURL",
        "authorizationCodeGrant",
        "refreshAccessToken",
      ];
      if (nonRetryMethods.includes(prop)) {
        return original.bind(target);
      }

      return async function (...args: any[]) {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            return await original.apply(target, args);
          } catch (error: any) {
            const statusCode = error?.statusCode ?? error?.body?.error?.status;
            if (statusCode !== 429 || attempt >= MAX_RETRIES) {
              throw error;
            }

            // Determine delay: use Retry-After header if available, else exponential backoff
            const retryAfter = error?.headers?.["retry-after"];
            const delayMs = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : BASE_DELAY_MS * Math.pow(2, attempt);

            logger.warn(
              `Rate limited (429) on ${prop}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await sleep(delayMs);
          }
        }
      };
    },
  });
}

/**
 * Get an authenticated Spotify client
 * Handles token loading, refresh, and OAuth flow as needed
 */
export async function getAuthenticatedClient(): Promise<SpotifyClient> {
  const credentials = getCredentials();

  // Create client if it doesn't exist
  if (!spotifyClient) {
    spotifyClient = createSpotifyClient(credentials);
  }

  // Try to load existing tokens
  let tokens = await loadTokens();

  // If no tokens exist, start OAuth flow
  if (!tokens) {
    logger.info("No tokens found, starting OAuth flow");
    tokens = await startOAuthFlow(spotifyClient);
  }

  // Refresh tokens if expired
  if (areTokensExpired(tokens)) {
    logger.info("Tokens expired, refreshing");
    try {
      tokens = await refreshAccessToken(spotifyClient, tokens.refreshToken);
    } catch (error) {
      logger.error("Token refresh failed:", error);
      await deleteTokens();
      throw new Error("Session expired. Please re-authenticate.");
    }
  }

  // Set tokens on client
  spotifyClient.setAccessToken(tokens.accessToken);
  spotifyClient.setRefreshToken(tokens.refreshToken);

  return withRetry(spotifyClient) as unknown as SpotifyClient;
}

/**
 * Reset the client (useful for testing or forcing re-authentication)
 */
export function resetClient(): void {
  spotifyClient = null;
}
