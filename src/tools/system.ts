/**
 * System-level tools (non-API, local machine operations)
 */

import { spawn } from "child_process";
import { logger } from "../utils/logger.js";
import type { ToolResponse, OpenSpotifyArgs } from "../types.js";

const SUPPORTED_PLATFORMS = ["darwin", "win32", "linux"] as const;
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

function isSupportedPlatform(platform: string): platform is SupportedPlatform {
  return (SUPPORTED_PLATFORMS as readonly string[]).includes(platform);
}

function isSpotifyRunning(): Promise<boolean> {
  const platform = process.platform;

  return new Promise((resolve) => {
    let cmd: string;
    let args: string[];

    if (platform === "darwin") {
      cmd = "pgrep";
      args = ["-x", "Spotify"];
    } else if (platform === "win32") {
      cmd = "tasklist";
      args = ["/FI", "IMAGENAME eq Spotify.exe", "/NH"];
    } else {
      // linux
      cmd = "pgrep";
      args = ["-x", "spotify"];
    }

    const child = spawn(cmd, args, { shell: false });
    let stdout = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.on("error", () => {
      resolve(false);
    });

    child.on("close", (code) => {
      if (platform === "win32") {
        resolve(stdout.toLowerCase().includes("spotify.exe"));
      } else {
        resolve(code === 0);
      }
    });
  });
}

function openSpotifyApp(): Promise<void> {
  const platform = process.platform;

  return new Promise((resolve, reject) => {
    let cmd: string;
    let args: string[];

    if (platform === "darwin") {
      cmd = "open";
      args = ["-a", "Spotify"];
    } else if (platform === "win32") {
      cmd = "cmd";
      args = ["/c", "start", "spotify:"];
    } else {
      // linux
      cmd = "spotify";
      args = [];
    }

    const child = spawn(cmd, args, { shell: false, detached: true, stdio: "ignore" });

    child.on("error", (err) => {
      reject(new Error(`Failed to launch Spotify: ${err.message}`));
    });

    // On macOS/Linux, `open`/`spotify` exits quickly after launching.
    // On Windows, `cmd /c start` also exits quickly.
    child.on("close", (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`Failed to launch Spotify (exit code ${code})`));
      }
    });

    child.unref();
  });
}

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export async function openSpotify(args: OpenSpotifyArgs): Promise<ToolResponse> {
  const platform = process.platform;

  if (!isSupportedPlatform(platform)) {
    return {
      content: [
        {
          type: "text",
          text: `Unsupported platform: ${platform}. Supported platforms: macOS, Windows, Linux.`,
        },
      ],
      isError: true,
    };
  }

  const running = await isSpotifyRunning();

  if (running) {
    return {
      content: [
        {
          type: "text",
          text: "Spotify is already running.",
        },
      ],
    };
  }

  logger.info("Opening Spotify application");

  try {
    await openSpotifyApp();
  } catch (error: any) {
    logger.error("Failed to open Spotify:", error);
    return {
      content: [
        {
          type: "text",
          text: "Failed to open Spotify. Please make sure Spotify is installed.",
        },
      ],
      isError: true,
    };
  }

  if (args.wait_seconds && args.wait_seconds > 0) {
    await sleep(args.wait_seconds);
  }

  return {
    content: [
      {
        type: "text",
        text: args.wait_seconds
          ? `Spotify opened. Waited ${args.wait_seconds} seconds for it to initialize.`
          : "Spotify opened.",
      },
    ],
  };
}
