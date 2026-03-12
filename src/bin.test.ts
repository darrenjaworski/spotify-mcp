import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("bin entry point", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules so bin.ts re-evaluates process.argv on each import
    vi.resetModules();
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("routes to setup module when --setup flag is present", async () => {
    process.argv = ["node", "bin.js", "--setup"];

    const mockRunSetup = vi.fn().mockResolvedValue(undefined);
    vi.doMock("./setup.js", () => ({
      runSetup: mockRunSetup,
    }));
    // Mock index.js to prevent it from executing server startup
    vi.doMock("./index.js", () => ({}));

    await import("./bin.js");

    // Allow dynamic import to resolve
    await vi.waitFor(() => {
      expect(mockRunSetup).toHaveBeenCalled();
    });
  });

  it("routes to setup module when 'setup' argument is present", async () => {
    process.argv = ["node", "bin.js", "setup"];

    const mockRunSetup = vi.fn().mockResolvedValue(undefined);
    vi.doMock("./setup.js", () => ({
      runSetup: mockRunSetup,
    }));
    vi.doMock("./index.js", () => ({}));

    await import("./bin.js");

    await vi.waitFor(() => {
      expect(mockRunSetup).toHaveBeenCalled();
    });
  });

  it("routes to setup module when 'init' argument is present", async () => {
    process.argv = ["node", "bin.js", "init"];

    const mockRunSetup = vi.fn().mockResolvedValue(undefined);
    vi.doMock("./setup.js", () => ({
      runSetup: mockRunSetup,
    }));
    vi.doMock("./index.js", () => ({}));

    await import("./bin.js");

    await vi.waitFor(() => {
      expect(mockRunSetup).toHaveBeenCalled();
    });
  });

  it("routes to index module when no setup flag is present", async () => {
    process.argv = ["node", "bin.js"];

    let indexImported = false;
    vi.doMock("./setup.js", () => ({
      runSetup: vi.fn(),
    }));
    vi.doMock("./index.js", () => {
      indexImported = true;
      return {};
    });

    await import("./bin.js");

    // Allow dynamic import to resolve
    await vi.waitFor(() => {
      expect(indexImported).toBe(true);
    });
  });

  it("does not import setup module when no setup flag is present", async () => {
    process.argv = ["node", "bin.js"];

    let setupImported = false;
    vi.doMock("./setup.js", () => {
      setupImported = true;
      return { runSetup: vi.fn() };
    });
    vi.doMock("./index.js", () => ({}));

    await import("./bin.js");

    // Give time for any dynamic imports to settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(setupImported).toBe(false);
  });
});
