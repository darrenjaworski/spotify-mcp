/**
 * Playback control tools
 */

import { getAuthenticatedClient } from "../spotify/client.js";
import { handleToolError } from "../spotify/errors.js";
import type { ToolResponse, PlaybackArgs, VolumeArgs } from "../types.js";

export async function play(args: PlaybackArgs): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();

    const options: any = {};

    if (args.uri) {
      // Determine if URI is a context (album, playlist, artist) or a track
      if (args.uri.startsWith('spotify:album:') ||
          args.uri.startsWith('spotify:playlist:') ||
          args.uri.startsWith('spotify:artist:')) {
        options.context_uri = args.uri;
      } else {
        // Track or other URI - use uris array
        options.uris = [args.uri];
      }
    }
    if (args.uris) {
      options.uris = args.uris;
    }
    if (args.device_id) {
      options.device_id = args.device_id;
    }

    await client.play(options);

    // Generate appropriate response message
    let message = "Resumed playback";
    if (args.uri) {
      if (args.uri.startsWith('spotify:album:')) {
        message = `Started playing album: ${args.uri}`;
      } else if (args.uri.startsWith('spotify:playlist:')) {
        message = `Started playing playlist: ${args.uri}`;
      } else if (args.uri.startsWith('spotify:artist:')) {
        message = `Started playing artist: ${args.uri}`;
      } else if (args.uri.startsWith('spotify:track:')) {
        message = `Started playing track: ${args.uri}`;
      } else {
        message = `Started playback: ${args.uri}`;
      }
    } else if (args.uris && args.uris.length > 0) {
      message = `Started playing ${args.uris.length} track${args.uris.length > 1 ? 's' : ''}`;
    }

    return {
      content: [
        {
          type: "text",
          text: message,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_play");
  }
}

export async function pause(args: { device_id?: string }): Promise<ToolResponse> {
  try {
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
  } catch (error) {
    return handleToolError(error, "spotify_pause");
  }
}

export async function next(args: { device_id?: string }): Promise<ToolResponse> {
  try {
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
  } catch (error) {
    return handleToolError(error, "spotify_next");
  }
}

export async function previous(args: { device_id?: string }): Promise<ToolResponse> {
  try {
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
  } catch (error) {
    return handleToolError(error, "spotify_previous");
  }
}

export async function setVolume(args: VolumeArgs): Promise<ToolResponse> {
  try {
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
  } catch (error) {
    return handleToolError(error, "spotify_set_volume");
  }
}

export async function getPlaybackState(): Promise<ToolResponse> {
  try {
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
  } catch (error) {
    return handleToolError(error, "spotify_get_playback_state");
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
