/**
 * Playlist management tools
 */

import { getAuthenticatedClient } from "../spotify/client.js";
import { handleToolError } from "../spotify/errors.js";
import type {
  ToolResponse,
  CreatePlaylistArgs,
  AddToPlaylistArgs,
  GetPlaylistArgs,
} from "../types.js";

export async function getPlaylists(args: { limit?: number }): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();
    const limit = args.limit || 20;

    const result = await client.getUserPlaylists({ limit });
    const playlists = result.body.items;

    if (playlists.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No playlists found",
          },
        ],
      };
    }

    const formatted = playlists.map(
      (playlist, index) =>
        `${index + 1}. ${playlist.name} (${playlist.tracks.total} tracks) - ${playlist.id}`
    );

    return {
      content: [
        {
          type: "text",
          text: `Your playlists:\n\n${formatted.join("\n")}`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_get_playlists");
  }
}

export async function getPlaylist(args: GetPlaylistArgs): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();

    const result = await client.getPlaylist(args.playlist_id);
    const playlist = result.body;

    const tracks = playlist.tracks.items.slice(0, 10).map((item, index) => {
      const track = item.track;
      if (!track) return `${index + 1}. [Unknown track]`;
      return `${index + 1}. ${track.name} - ${track.artists.map((a) => a.name).join(", ")}`;
    });

    const text = `Playlist: ${playlist.name}
Description: ${playlist.description || "No description"}
Owner: ${playlist.owner.display_name}
Tracks: ${playlist.tracks.total}
Public: ${playlist.public ? "Yes" : "No"}

First 10 tracks:
${tracks.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_get_playlist");
  }
}

export async function createPlaylist(args: CreatePlaylistArgs): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();

    const options: any = {
      name: args.name,
      public: args.public !== false, // Default to true
    };

    if (args.description) {
      options.description = args.description;
    }

    const result: any = await client.createPlaylist(options.name, options);
    const playlist = result.body;

    return {
      content: [
        {
          type: "text",
          text: `Created playlist: ${playlist.name} (ID: ${playlist.id})`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_create_playlist");
  }
}

export async function addToPlaylist(args: AddToPlaylistArgs): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();

    const options: any = {};
    if (args.position !== undefined) {
      options.position = args.position;
    }

    await client.addTracksToPlaylist(args.playlist_id, args.uris, options);

    return {
      content: [
        {
          type: "text",
          text: `Added ${args.uris.length} track(s) to playlist`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_add_to_playlist");
  }
}
