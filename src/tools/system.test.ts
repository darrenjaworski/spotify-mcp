import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock child_process before importing system tools
vi.mock("child_process", () => {
  const mockOn = vi.fn();
  const mockStdout = { on: vi.fn() };
  return {
    spawn: vi.fn().mockReturnValue({
      on: mockOn,
      stdout: mockStdout,
      unref: vi.fn(),
    }),
  };
});

vi.mock("../spotify/client.js", () => ({
  getAuthenticatedClient: vi.fn(),
}));

vi.mock("../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { spawn } from "child_process";
import { getAuthenticatedClient } from "../spotify/client.js";
import { openSpotify } from "./system.js";

describe("system tools", () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      getMyDevices: vi.fn().mockResolvedValue({
        body: {
          devices: [{ id: "dev-1", name: "My Laptop", is_active: true }],
        },
      }),
      transferMyPlayback: vi.fn(),
    };
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
  });

  describe("openSpotify", () => {
    describe("unsupported platform", () => {
      it("returns error for unsupported platform", async () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, "platform", { value: "freebsd" });

        const result = await openSpotify({});

        Object.defineProperty(process, "platform", { value: originalPlatform });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Unsupported platform");
        expect(result.content[0].text).toContain("freebsd");
      });
    });

    describe("spotify already running", () => {
      it("reports already running and checks for device", async () => {
        // Mock isSpotifyRunning: pgrep returns code 0 (running)
        const mockSpawn = vi.mocked(spawn);
        const stdoutOn = vi.fn();
        const processOn = vi.fn();

        mockSpawn.mockReturnValueOnce({
          on: processOn,
          stdout: { on: stdoutOn },
          unref: vi.fn(),
          stderr: null,
          stdin: null,
          pid: 123,
        } as any);

        // Trigger the isSpotifyRunning spawn: simulate pgrep finding spotify
        const resultPromise = openSpotify({});

        // pgrep close event with code 0 = process found
        const closeHandler = processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (closeHandler) closeHandler(0);

        const result = await resultPromise;

        expect(result.content[0].text).toContain("already running");
        expect(result.isError).toBeUndefined();
      });
    });

    describe("spotify not running", () => {
      it("launches spotify and reports device activation", async () => {
        const mockSpawn = vi.mocked(spawn);
        const calls: any[] = [];

        // We need to handle two spawn calls:
        // 1. isSpotifyRunning (pgrep)
        // 2. openSpotifyApp (open -a Spotify)
        mockSpawn.mockImplementation((() => {
          const callIndex = calls.length;
          const processOn = vi.fn();
          const stdoutOn = vi.fn();
          const proc = {
            on: processOn,
            stdout: { on: stdoutOn },
            unref: vi.fn(),
            stderr: null,
            stdin: null,
            pid: 100 + callIndex,
          };
          calls.push({ processOn, stdoutOn, proc });
          return proc;
        }) as any);

        const resultPromise = openSpotify({});

        // First spawn: isSpotifyRunning - pgrep returns code 1 (not running)
        const pgrepClose = calls[0].processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (pgrepClose) pgrepClose(1);

        // Wait for openSpotifyApp to be called
        await vi.waitFor(() => {
          expect(calls.length).toBeGreaterThanOrEqual(2);
        });

        // Second spawn: openSpotifyApp - exits with code 0
        const openClose = calls[1].processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (openClose) openClose(0);

        const result = await resultPromise;

        expect(result.content[0].text).toContain("Spotify opened");
        expect(result.isError).toBeUndefined();
      });

      it("returns error when spotify fails to launch", async () => {
        const mockSpawn = vi.mocked(spawn);
        const calls: any[] = [];

        mockSpawn.mockImplementation((() => {
          const callIndex = calls.length;
          const processOn = vi.fn();
          const stdoutOn = vi.fn();
          const proc = {
            on: processOn,
            stdout: { on: stdoutOn },
            unref: vi.fn(),
            stderr: null,
            stdin: null,
            pid: 100 + callIndex,
          };
          calls.push({ processOn, stdoutOn, proc });
          return proc;
        }) as any);

        const resultPromise = openSpotify({});

        // pgrep: not running
        const pgrepClose = calls[0].processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (pgrepClose) pgrepClose(1);

        // Wait for openSpotifyApp spawn
        await vi.waitFor(() => {
          expect(calls.length).toBeGreaterThanOrEqual(2);
        });

        // openSpotifyApp: error event
        const errorHandler = calls[1].processOn.mock.calls.find((c: any) => c[0] === "error")?.[1];
        if (errorHandler) errorHandler(new Error("ENOENT"));

        const result = await resultPromise;

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("Failed to open Spotify");
      });

      it("includes wait message when wait_seconds is provided", async () => {
        const mockSpawn = vi.mocked(spawn);
        const calls: any[] = [];

        mockSpawn.mockImplementation((() => {
          const callIndex = calls.length;
          const processOn = vi.fn();
          const stdoutOn = vi.fn();
          const proc = {
            on: processOn,
            stdout: { on: stdoutOn },
            unref: vi.fn(),
            stderr: null,
            stdin: null,
            pid: 100 + callIndex,
          };
          calls.push({ processOn, stdoutOn, proc });
          return proc;
        }) as any);

        // Use wait_seconds=0 to avoid actual delay, but still trigger the message path
        // (wait_seconds of 0 is falsy so won't trigger - use 1 but mock timers)
        vi.useFakeTimers();
        const resultPromise = openSpotify({ wait_seconds: 1 });

        // pgrep: not running
        const pgrepClose = calls[0].processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (pgrepClose) pgrepClose(1);

        // Wait for openSpotifyApp spawn
        await vi.waitFor(() => {
          expect(calls.length).toBeGreaterThanOrEqual(2);
        });

        // openSpotifyApp: success
        const openClose = calls[1].processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (openClose) openClose(0);

        // Advance timer for sleep(1) and device polling sleep(2)
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;

        expect(result.content[0].text).toContain("Waited 1 seconds");
        vi.useRealTimers();
      });
    });

    describe("device activation", () => {
      it("transfers playback when device is inactive", async () => {
        mockClient.getMyDevices.mockResolvedValue({
          body: {
            devices: [{ id: "dev-1", name: "Speaker", is_active: false }],
          },
        });

        const mockSpawn = vi.mocked(spawn);
        const processOn = vi.fn();
        mockSpawn.mockReturnValueOnce({
          on: processOn,
          stdout: { on: vi.fn() },
          unref: vi.fn(),
          stderr: null,
          stdin: null,
          pid: 123,
        } as any);

        const resultPromise = openSpotify({});
        const closeHandler = processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (closeHandler) closeHandler(0);

        const result = await resultPromise;

        expect(mockClient.transferMyPlayback).toHaveBeenCalledWith(["dev-1"]);
        expect(result.content[0].text).toContain("Speaker");
      });

      it("does not transfer when device is already active", async () => {
        mockClient.getMyDevices.mockResolvedValue({
          body: {
            devices: [{ id: "dev-1", name: "Speaker", is_active: true }],
          },
        });

        const mockSpawn = vi.mocked(spawn);
        const processOn = vi.fn();
        mockSpawn.mockReturnValueOnce({
          on: processOn,
          stdout: { on: vi.fn() },
          unref: vi.fn(),
          stderr: null,
          stdin: null,
          pid: 123,
        } as any);

        const resultPromise = openSpotify({});
        const closeHandler = processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (closeHandler) closeHandler(0);

        const result = await resultPromise;

        expect(mockClient.transferMyPlayback).not.toHaveBeenCalled();
        expect(result.content[0].text).toContain("Speaker");
      });

      it("polls for devices when none are initially available", async () => {
        vi.useFakeTimers();

        // First call: no devices, second call: device found
        mockClient.getMyDevices
          .mockResolvedValueOnce({ body: { devices: [] } })
          .mockResolvedValueOnce({
            body: {
              devices: [{ id: "dev-1", name: "Speaker", is_active: true }],
            },
          });

        const mockSpawn = vi.mocked(spawn);
        const processOn = vi.fn();
        mockSpawn.mockReturnValueOnce({
          on: processOn,
          stdout: { on: vi.fn() },
          unref: vi.fn(),
          stderr: null,
          stdin: null,
          pid: 123,
        } as any);

        const resultPromise = openSpotify({});
        const closeHandler = processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (closeHandler) closeHandler(0);

        // Advance past the 2-second poll interval
        await vi.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;

        expect(mockClient.getMyDevices).toHaveBeenCalledTimes(2);
        expect(result.content[0].text).toContain("Speaker");

        vi.useRealTimers();
      });

      it("warns when no devices found after all polling attempts", async () => {
        vi.useFakeTimers();

        mockClient.getMyDevices.mockResolvedValue({ body: { devices: [] } });

        const mockSpawn = vi.mocked(spawn);
        const processOn = vi.fn();
        mockSpawn.mockReturnValueOnce({
          on: processOn,
          stdout: { on: vi.fn() },
          unref: vi.fn(),
          stderr: null,
          stdin: null,
          pid: 123,
        } as any);

        const resultPromise = openSpotify({});
        const closeHandler = processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (closeHandler) closeHandler(0);

        // Advance past all 5 poll attempts (5 * 2s = 10s)
        for (let i = 0; i < 5; i++) {
          await vi.advanceTimersByTimeAsync(2000);
        }

        const result = await resultPromise;

        expect(mockClient.getMyDevices).toHaveBeenCalledTimes(5);
        expect(result.content[0].text).toContain("Warning");

        vi.useRealTimers();
      });

      it("handles device activation errors gracefully", async () => {
        mockClient.getMyDevices.mockRejectedValue(new Error("API error"));

        const mockSpawn = vi.mocked(spawn);
        const processOn = vi.fn();
        mockSpawn.mockReturnValueOnce({
          on: processOn,
          stdout: { on: vi.fn() },
          unref: vi.fn(),
          stderr: null,
          stdin: null,
          pid: 123,
        } as any);

        const resultPromise = openSpotify({});
        const closeHandler = processOn.mock.calls.find((c: any) => c[0] === "close")?.[1];
        if (closeHandler) closeHandler(0);

        const result = await resultPromise;

        expect(result.content[0].text).toContain("Warning");
        expect(result.content[0].text).toContain("Could not auto-activate");
        expect(result.isError).toBeUndefined();
      });
    });
  });
});
