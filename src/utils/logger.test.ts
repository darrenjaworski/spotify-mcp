import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to test the logger module's internals, so we import fresh for each test group.
// The logger reads LOG_LEVEL at module load time, so we test redaction and formatting
// by calling the module directly.

// Mock console.error to capture log output
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

// Import after spy setup so the logger uses our mock
import { logger } from "./logger.js";

describe("logger", () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  describe("log methods exist", () => {
    it("has debug, info, warn, error methods", () => {
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });
  });

  describe("output format", () => {
    it("logs to stderr via console.error", () => {
      logger.error("test message");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("includes timestamp in ISO format", () => {
      logger.error("timestamp test");
      const output = consoleErrorSpy.mock.calls[0][0];
      // Match ISO 8601 timestamp pattern
      expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("includes log level in uppercase", () => {
      logger.error("level test");
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[ERROR]");
    });

    it("includes the message", () => {
      logger.error("my specific message");
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("my specific message");
    });
  });

  describe("sensitive data redaction", () => {
    it("redacts objects with token fields", () => {
      logger.error("auth data:", { accessToken: "secret123", name: "test" });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("secret123");
    });

    it("redacts objects with refresh_token fields", () => {
      logger.error("tokens:", { refresh_token: "abc123" });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("abc123");
    });

    it("redacts objects with client_secret fields", () => {
      logger.error("creds:", { client_secret: "mysecret" });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("mysecret");
    });

    it("redacts objects with password fields", () => {
      logger.error("login:", { password: "pass123" });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("pass123");
    });

    it("redacts objects with apiKey fields", () => {
      logger.error("config:", { apiKey: "key-val" });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("key-val");
    });

    it("redacts objects with authorization fields", () => {
      logger.error("headers:", { authorization: "Bearer xyz" });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("Bearer xyz");
    });

    it("redacts long alphanumeric strings that look like tokens", () => {
      const tokenLike = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef";
      logger.error("value:", { data: tokenLike });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain(tokenLike);
    });

    it("redacts JWT-format tokens containing dots", () => {
      const jwt = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.Tz1jHzG4Ow";
      logger.error("value:", { data: jwt });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain(jwt);
    });

    it("redacts Base64-encoded tokens containing +, /, and =", () => {
      const base64Token = "dGhpcyBpcyBhIHNlY3JldCB0b2tlbg==";
      logger.error("value:", { data: base64Token });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain(base64Token);
    });

    it("redacts Base64url tokens with + and / characters", () => {
      const base64UrlToken = "abc+def/ghi+jkl/mno+pqr/stu";
      logger.error("value:", { data: base64UrlToken });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain(base64UrlToken);
    });

    it("does not redact short strings", () => {
      logger.error("value:", { name: "hello" });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("hello");
    });

    it("does not redact non-alphanumeric long strings", () => {
      const normalText = "This is a normal long sentence with spaces and punctuation!";
      logger.error("value:", { description: normalText });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain(normalText);
    });

    it("redacts nested sensitive fields", () => {
      logger.error("nested:", {
        user: { name: "test", credentials: { accessToken: "secret" } },
      });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[REDACTED]");
      expect(output).not.toContain("secret");
      expect(output).toContain("test");
    });

    it("redacts sensitive fields in arrays", () => {
      logger.error("list:", { items: [{ token: "abc" }, { token: "def" }] });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).not.toContain("abc");
      expect(output).not.toContain("def");
    });

    it("handles null and undefined args gracefully", () => {
      expect(() => logger.error("null:", null)).not.toThrow();
      expect(() => logger.error("undefined:", undefined)).not.toThrow();
    });

    it("preserves non-sensitive fields", () => {
      logger.error("safe:", { name: "playlist", count: 42 });
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("playlist");
      expect(output).toContain("42");
    });
  });

  describe("log level filtering", () => {
    // The default LOG_LEVEL is "info", so debug should be suppressed
    it("suppresses debug messages at info level", () => {
      logger.debug("should not appear");
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("allows info messages at info level", () => {
      logger.info("should appear");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("allows warn messages at info level", () => {
      logger.warn("should appear");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("allows error messages at info level", () => {
      logger.error("should appear");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
