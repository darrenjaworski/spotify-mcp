/**
 * System-level tools (non-API, local machine operations)
 */

import { spawn } from "child_process";
import { logger } from "../utils/logger.js";
import { getAuthenticatedClient } from "../spotify/client.js";
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
    const deviceResult = await activateDevice();
    return {
      content: [
        {
          type: "text",
          text: `Spotify is already running. ${deviceResult}`,
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

  // Poll for a device and activate it so playback commands work immediately
  const deviceResult = await activateDevice();

  const waitMsg = args.wait_seconds
    ? ` Waited ${args.wait_seconds} seconds for it to initialize.`
    : "";

  return {
    content: [
      {
        type: "text",
        text: `Spotify opened.${waitMsg} ${deviceResult}`,
      },
    ],
  };
}

const DEVICE_POLL_INTERVAL_S = 2;
const DEVICE_POLL_MAX_ATTEMPTS = 5;

async function activateDevice(): Promise<string> {
  try {
    const client = await getAuthenticatedClient();

    for (let attempt = 0; attempt < DEVICE_POLL_MAX_ATTEMPTS; attempt++) {
      const response: any = await client.getMyDevices();
      const devices: any[] = response.body?.devices ?? [];

      if (devices.length > 0) {
        const device = devices[0];
        if (!device.is_active) {
          await client.transferMyPlayback([device.id]);
          logger.info(`Activated device: ${device.name}`);
        }
        return `Device active: ${device.name}.`;
      }

      logger.debug(
        `No devices found (attempt ${attempt + 1}/${DEVICE_POLL_MAX_ATTEMPTS}), retrying...`,
      );
      await sleep(DEVICE_POLL_INTERVAL_S);
    }

    logger.warn("No Spotify devices found after polling");
    return "Warning: No Spotify device found. You may need to interact with Spotify before playback commands will work.";
  } catch (error: any) {
    logger.error("Failed to activate device:", error);
    return "Warning: Could not auto-activate device. Playback commands may require manual interaction with Spotify.";
  }
}
