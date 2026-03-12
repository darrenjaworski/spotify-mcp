/**
 * Input validation utilities for Spotify MCP tool handlers.
 *
 * These provide domain-specific validation beyond what Zod schemas enforce.
 * The MCP SDK already validates tool inputs against Zod schemas at runtime
 * (see McpServer.validateToolInput in @modelcontextprotocol/sdk), so these
 * validators focus on Spotify-specific constraints like URI format and
 * API batch size limits.
 */

const SPOTIFY_URI_PATTERN = /^spotify:(track|album|artist|playlist):[\w]+$/;

type SpotifyUriType = "track" | "album" | "artist" | "playlist";

/**
 * Validates that a string is a well-formed Spotify URI.
 *
 * @param uri - The URI string to validate
 * @param allowedTypes - Optional subset of URI types to accept (defaults to all)
 * @throws Error with a user-friendly message if invalid
 */
export function validateSpotifyUri(uri: string, allowedTypes?: SpotifyUriType[]): void {
  if (!SPOTIFY_URI_PATTERN.test(uri)) {
    throw new Error(
      `Invalid Spotify URI: "${uri}". Expected format: spotify:(track|album|artist|playlist):<id>`,
    );
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const uriType = uri.split(":")[1] as SpotifyUriType;
    if (!allowedTypes.includes(uriType)) {
      throw new Error(
        `Invalid Spotify URI type: "${uriType}". Expected one of: ${allowedTypes.join(", ")}`,
      );
    }
  }
}

/**
 * Validates that an array does not exceed a maximum size.
 * Spotify's batch endpoints typically accept at most 50 items.
 *
 * @param arr - The array to check
 * @param max - Maximum allowed length
 * @param fieldName - Field name for the error message
 * @throws Error with a user-friendly message if exceeded
 */
export function validateArraySize(arr: unknown[], max: number, fieldName: string): void {
  if (arr.length > max) {
    throw new Error(`${fieldName} exceeds maximum size of ${max} (got ${arr.length})`);
  }
}

/**
 * Validates that a number falls within an inclusive range.
 *
 * @param value - The number to check
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param fieldName - Field name for the error message
 * @throws Error with a user-friendly message if out of range
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max} (got ${value})`);
  }
}
