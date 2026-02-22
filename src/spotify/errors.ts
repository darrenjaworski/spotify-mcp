/**
 * Centralized error handling for tool implementations.
 * Transforms raw Spotify API errors into safe, user-friendly responses.
 */

import { logger } from "../utils/logger.js";
import type { ToolResponse } from "../types.js";

/**
 * Extract HTTP status code from various error shapes.
 * spotify-web-api-node can throw errors with .statusCode or .body.error.status
 */
function getStatusCode(error: any): number {
  if (typeof error?.statusCode === "number") {
    return error.statusCode;
  }
  if (typeof error?.body?.error?.status === "number") {
    return error.body.error.status;
  }
  return 0;
}

/**
 * Map HTTP status codes to safe, user-friendly messages.
 */
function getUserMessage(statusCode: number, toolName: string): string {
  if (statusCode === 400) {
    return "Bad request. Please check your input and try again.";
  }
  if (statusCode === 401) {
    return "Authentication expired. Please restart the server to re-authenticate.";
  }
  if (statusCode === 403) {
    return "Insufficient permissions. Your Spotify account may not have access to this feature.";
  }
  if (statusCode === 404) {
    return "Resource not found. Please check the ID or URI and try again.";
  }
  if (statusCode === 429) {
    return "Rate limited by Spotify. Please wait a moment and try again.";
  }
  if (statusCode >= 500 && statusCode < 600) {
    return "Spotify is experiencing issues. Please try again in a moment.";
  }
  return `An unexpected error occurred while executing ${toolName}.`;
}

/**
 * Handle errors from tool functions.
 * Logs the real error (with auto-redaction) and returns a safe ToolResponse.
 */
export function handleToolError(error: unknown, toolName: string): ToolResponse {
  logger.error(`${toolName} failed:`, error);

  const statusCode = getStatusCode(error);
  const message = getUserMessage(statusCode, toolName);

  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
  };
}
