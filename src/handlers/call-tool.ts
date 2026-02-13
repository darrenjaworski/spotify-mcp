/**
 * Tool call handler - routes tool calls to appropriate implementations
 */

import type { ToolResponse } from "../types.js";
import * as playbackTools from "../tools/playback.js";
import * as searchTools from "../tools/search.js";
import * as playlistTools from "../tools/playlists.js";
import * as userTools from "../tools/user.js";

export async function handleToolCall(name: string, args: Record<string, any>): Promise<ToolResponse> {
  switch (name) {
    // Playback controls
    case "spotify_play":
      return await playbackTools.play(args as any);
    case "spotify_pause":
      return await playbackTools.pause(args as any);
    case "spotify_next":
      return await playbackTools.next(args as any);
    case "spotify_previous":
      return await playbackTools.previous(args as any);
    case "spotify_set_volume":
      return await playbackTools.setVolume(args as any);
    case "spotify_get_playback_state":
      return await playbackTools.getPlaybackState();

    // Search
    case "spotify_search":
      return await searchTools.search(args as any);

    // Playlists
    case "spotify_get_playlists":
      return await playlistTools.getPlaylists(args as any);
    case "spotify_get_playlist":
      return await playlistTools.getPlaylist(args as any);
    case "spotify_create_playlist":
      return await playlistTools.createPlaylist(args as any);
    case "spotify_add_to_playlist":
      return await playlistTools.addToPlaylist(args as any);

    // User data
    case "spotify_get_user_profile":
      return await userTools.getUserProfile();
    case "spotify_get_top_items":
      return await userTools.getTopItems(args as any);
    case "spotify_get_recently_played":
      return await userTools.getRecentlyPlayed(args as any);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
