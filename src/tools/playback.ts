/**
 * Playback control tools
 */

import { getAuthenticatedClient } from "../spotify/client.js";
import type { ToolResponse, PlaybackArgs, VolumeArgs } from "../types.js";

export async function play(args: PlaybackArgs): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();

  const options: any = {};
  if (args.uri) {
    options.uris = [args.uri];
  }
  if (args.uris) {
    options.uris = args.uris;
  }
  if (args.device_id) {
    options.device_id = args.device_id;
  }

  await client.play(options);

  const uriText = args.uri || (args.uris && args.uris.length > 0 ? `${args.uris.length} tracks` : "");
  return {
    content: [
      {
        type: "text",
        text: uriText ? `Started playback: ${uriText}` : "Resumed playback",
      },
    ],
  };
}

export async function pause(args: { device_id?: string }): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();

  const options: any = {};
  if (args.device_id) {
    options.device_id = args.device_id;
  }

  await client.pause(options);

  return {
    content: [
      {
        type: "text",
        text: "Playback paused",
      },
    ],
  };
}

export async function next(args: { device_id?: string }): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();

  const options: any = {};
  if (args.device_id) {
    options.device_id = args.device_id;
  }

  await client.skipToNext(options);

  return {
    content: [
      {
        type: "text",
        text: "Skipped to next track",
      },
    ],
  };
}

export async function previous(args: { device_id?: string }): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();

  const options: any = {};
  if (args.device_id) {
    options.device_id = args.device_id;
  }

  await client.skipToPrevious(options);

  return {
    content: [
      {
        type: "text",
        text: "Skipped to previous track",
      },
    ],
  };
}

export async function setVolume(args: VolumeArgs): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();

  const options: any = { volume_percent: args.volume_percent };
  if (args.device_id) {
    options.device_id = args.device_id;
  }

  await client.setVolume(options.volume_percent, options);

  return {
    content: [
      {
        type: "text",
        text: `Volume set to ${args.volume_percent}%`,
      },
    ],
  };
}

export async function getPlaybackState(): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();

  const state = await client.getMyCurrentPlaybackState();

  if (!state.body || !state.body.item) {
    return {
      content: [
        {
          type: "text",
          text: "No active playback",
        },
      ],
    };
  }

  const track = state.body.item;
  const isPlaying = state.body.is_playing;
  const device = state.body.device;

  // Type guard for track
  if (track.type !== "track") {
    return {
      content: [
        {
          type: "text",
          text: `Currently playing: ${track.name} (${track.type})`,
        },
      ],
    };
  }

  const artists = track.artists.map((a) => a.name).join(", ");
  const album = track.album.name;
  const progress = Math.floor((state.body.progress_ms || 0) / 1000);
  const duration = Math.floor(track.duration_ms / 1000);

  const text = `${isPlaying ? "▶️ Playing" : "⏸️ Paused"}: ${track.name}
Artist: ${artists}
Album: ${album}
Progress: ${formatTime(progress)} / ${formatTime(duration)}
Device: ${device.name} (${device.type})
Volume: ${device.volume_percent}%`;

  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
