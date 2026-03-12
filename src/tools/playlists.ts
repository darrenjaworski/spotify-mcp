/**
 * Playlist management tools
 */

import { getAuthenticatedClient } from "../spotify/client.js";
import { handleToolError } from "../spotify/errors.js";
import { validateSpotifyUri } from "../utils/validation.js";
import type {
  ToolResponse,
  CreatePlaylistArgs,
  AddToPlaylistArgs,
  GetPlaylistArgs,
  RemoveFromPlaylistArgs,
  ReorderPlaylistTracksArgs,
  DeletePlaylistArgs,
  UpdatePlaylistArgs,
} from "../types.js";

export async function getPlaylists(args: { limit?: number }): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();
    const limit = args.limit || 20;

    const result = await client.getUserPlaylists({ limit });
    const playlists = result.body?.items ?? [];

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

    const formatted = playlists.map((playlist: any, index: number) => {
      const trackInfo = playlist.items ?? playlist.tracks;
      return `${index + 1}. ${playlist.name} (${trackInfo?.total ?? 0} tracks) - ${playlist.id}`;
    });

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
    const playlist: any = result.body;

    const trackInfo = playlist.items ?? playlist.tracks;
    const trackItems = trackInfo?.items ?? [];
    const tracks = trackItems.slice(0, 10).map((item: any, index: number) => {
      const track = item?.track;
      if (!track) return `${index + 1}. [Unknown track]`;
      const artists = track.artists?.map((a: any) => a.name).join(", ") ?? "Unknown artist";
      return `${index + 1}. ${track.name} - ${artists}`;
    });

    const ownerName = playlist.owner?.display_name ?? "Unknown";
    const text = `Playlist: ${playlist.name}
Description: ${playlist.description || "No description"}
Owner: ${ownerName}
Tracks: ${trackInfo?.total ?? 0}
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
    // Validate all track URIs before making API calls
    for (const uri of args.uris) {
      validateSpotifyUri(uri, ["track"]);
    }

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

export async function removeFromPlaylist(args: RemoveFromPlaylistArgs): Promise<ToolResponse> {
  try {
    // Validate all track URIs before making API calls
    for (const uri of args.uris) {
      validateSpotifyUri(uri, ["track"]);
    }

    const client = await getAuthenticatedClient();

    const tracks = args.uris.map((uri) => ({ uri }));
    const options: any = {};
    if (args.snapshot_id) {
      options.snapshot_id = args.snapshot_id;
    }

    await client.removeTracksFromPlaylist(args.playlist_id, tracks, options);

    return {
      content: [
        {
          type: "text",
          text: `Removed ${args.uris.length} track(s) from playlist`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_remove_from_playlist");
  }
}

export async function reorderPlaylistTracks(
  args: ReorderPlaylistTracksArgs,
): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();

    const options: any = {};
    if (args.range_length !== undefined) {
      options.range_length = args.range_length;
    }
    if (args.snapshot_id) {
      options.snapshot_id = args.snapshot_id;
    }

    await client.reorderTracksInPlaylist(
      args.playlist_id,
      args.range_start,
      args.insert_before,
      options,
    );

    const count = args.range_length || 1;
    return {
      content: [
        {
          type: "text",
          text: `Moved ${count} track(s) from position ${args.range_start} to position ${args.insert_before}`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_reorder_playlist_tracks");
  }
}

export async function deletePlaylist(args: DeletePlaylistArgs): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();
    await client.unfollowPlaylist(args.playlist_id);

    return {
      content: [
        {
          type: "text",
          text: `Deleted (unfollowed) playlist ${args.playlist_id}`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_delete_playlist");
  }
}

export async function updatePlaylist(args: UpdatePlaylistArgs): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();

    if (args.collaborative && args.public) {
      return {
        content: [
          {
            type: "text",
            text: "Collaborative playlists must be non-public. Set public to false when enabling collaborative mode.",
          },
        ],
        isError: true,
      };
    }

    const options: any = {};
    if (args.name !== undefined) options.name = args.name;
    if (args.description !== undefined) options.description = args.description;
    if (args.public !== undefined) options.public = args.public;
    if (args.collaborative !== undefined) options.collaborative = args.collaborative;

    await client.changePlaylistDetails(args.playlist_id, options);

    const changes: string[] = [];
    if (args.name !== undefined) changes.push(`name: "${args.name}"`);
    if (args.description !== undefined) changes.push(`description updated`);
    if (args.public !== undefined) changes.push(`public: ${args.public}`);
    if (args.collaborative !== undefined) changes.push(`collaborative: ${args.collaborative}`);

    return {
      content: [
        {
          type: "text",
          text: `Updated playlist: ${changes.join(", ")}`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_update_playlist");
  }
}
