/**
 * Spotify API client wrapper with automatic token refresh
 */

import SpotifyWebApi from "spotify-web-api-node";
import {
  getCredentials,
  loadTokens,
  areTokensExpired,
  createSpotifyClient,
  refreshAccessToken,
  startOAuthFlow,
} from "./auth.js";
import { logger } from "../utils/logger.js";

let spotifyClient: SpotifyWebApi | null = null;

/**
 * Get an authenticated Spotify client
 * Handles token loading, refresh, and OAuth flow as needed
 */
export async function getAuthenticatedClient(): Promise<SpotifyWebApi> {
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
    tokens = await refreshAccessToken(spotifyClient, tokens.refreshToken);
  }

  // Set tokens on client
  spotifyClient.setAccessToken(tokens.accessToken);
  spotifyClient.setRefreshToken(tokens.refreshToken);

  return spotifyClient;
}

/**
 * Reset the client (useful for testing or forcing re-authentication)
 */
export function resetClient(): void {
  spotifyClient = null;
}
