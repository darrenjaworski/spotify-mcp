import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleToolError } from "./errors.js";

// Mock the logger to verify it's called and to suppress output
vi.mock("../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { logger } from "../utils/logger.js";

describe("handleToolError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return isError: true", () => {
    const result = handleToolError(new Error("fail"), "spotify_play");
    expect(result.isError).toBe(true);
  });

  it("should return a text content response", () => {
    const result = handleToolError(new Error("fail"), "spotify_play");
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(typeof result.content[0].text).toBe("string");
  });

  it("should log the error via logger.error", () => {
    const err = new Error("something broke");
    handleToolError(err, "spotify_search");
    expect(logger.error).toHaveBeenCalledWith("spotify_search failed:", err);
  });

  it("should handle 400 status code", () => {
    const err = { statusCode: 400, message: "Bad Request" };
    const result = handleToolError(err, "spotify_play");
    expect(result.content[0].text).toBe(
      "Bad request. Please check your input and try again."
    );
  });

  it("should handle 401 status code", () => {
    const err = { statusCode: 401, message: "Unauthorized" };
    const result = handleToolError(err, "spotify_play");
    expect(result.content[0].text).toBe(
      "Authentication expired. Please restart the server to re-authenticate."
    );
  });

  it("should handle 403 status code", () => {
    const err = { statusCode: 403, message: "Forbidden" };
    const result = handleToolError(err, "spotify_play");
    expect(result.content[0].text).toBe(
      "Insufficient permissions. Your Spotify account may not have access to this feature."
    );
  });

  it("should handle 404 status code", () => {
    const err = { statusCode: 404, message: "Not Found" };
    const result = handleToolError(err, "spotify_get_playlist");
    expect(result.content[0].text).toBe(
      "Resource not found. Please check the ID or URI and try again."
    );
  });

  it("should handle 429 status code", () => {
    const err = { statusCode: 429, message: "Too Many Requests" };
    const result = handleToolError(err, "spotify_search");
    expect(result.content[0].text).toBe(
      "Rate limited by Spotify. Please wait a moment and try again."
    );
  });

  it("should handle 5xx status codes", () => {
    const err = { statusCode: 500, message: "Internal Server Error" };
    const result = handleToolError(err, "spotify_play");
    expect(result.content[0].text).toBe(
      "Spotify is experiencing issues. Please try again in a moment."
    );

    const err503 = { statusCode: 503, message: "Service Unavailable" };
    const result503 = handleToolError(err503, "spotify_play");
    expect(result503.content[0].text).toBe(
      "Spotify is experiencing issues. Please try again in a moment."
    );
  });

  it("should handle nested body.error.status format", () => {
    const err = { body: { error: { status: 404, message: "Not found" } } };
    const result = handleToolError(err, "spotify_get_playlist");
    expect(result.content[0].text).toBe(
      "Resource not found. Please check the ID or URI and try again."
    );
  });

  it("should return default message for unknown errors", () => {
    const err = new Error("something unexpected");
    const result = handleToolError(err, "spotify_play");
    expect(result.content[0].text).toBe(
      "An unexpected error occurred while executing spotify_play."
    );
  });

  it("should include tool name in default message", () => {
    const err = new Error("unknown");
    const result = handleToolError(err, "spotify_get_top_items");
    expect(result.content[0].text).toContain("spotify_get_top_items");
  });

  it("should never expose raw error details in the response", () => {
    const err = {
      statusCode: 500,
      message: "Internal: token=abc123xyz refresh failed at /internal/path",
      body: { error: { status: 500, message: "secret internal details" } },
    };
    const result = handleToolError(err, "spotify_play");
    const text = result.content[0].text;
    expect(text).not.toContain("token=abc123xyz");
    expect(text).not.toContain("/internal/path");
    expect(text).not.toContain("secret internal details");
  });
});
