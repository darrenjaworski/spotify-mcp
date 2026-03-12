import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import * as playbackTools from "./tools/playback.js";
import * as searchTools from "./tools/search.js";
import * as playlistTools from "./tools/playlists.js";
import * as userTools from "./tools/user.js";
import * as libraryTools from "./tools/library.js";
import * as systemTools from "./tools/system.js";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REDIRECT_URI"];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    logger.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// The MCP SDK validates tool inputs against Zod schemas at runtime before
// calling handlers (see McpServer.validateToolInput which calls safeParseAsync).
// Tool handlers receive pre-validated args, so we do not need explicit .parse()
// calls for schema-level validation. However, tool handlers still perform
// domain-specific validation (e.g., Spotify URI format, array size limits)
// using utilities from src/utils/validation.ts.

// Create MCP server instance
const server = new McpServer(
  {
    name: "spotify-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register playback tools
server.registerTool(
  "spotify_play",
  {
    description: "Start or resume playback of a track, album, artist, or playlist",
    inputSchema: {
      uri: z
        .string()
        .optional()
        .describe(
          "Spotify URI to play (e.g., spotify:track:xxx, spotify:album:xxx, spotify:playlist:xxx, spotify:artist:xxx). Use search tool to get URIs.",
        ),
      device_id: z.string().optional().describe("Optional: Device ID to play on"),
    },
  },
  async ({ uri, device_id }: any) => playbackTools.play({ uri, device_id } as any) as any,
);

server.registerTool(
  "spotify_pause",
  {
    description: "Pause current playback",
    inputSchema: {
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ device_id }: any) => playbackTools.pause({ device_id } as any) as any,
);

server.registerTool(
  "spotify_next",
  {
    description: "Skip to next track",
    inputSchema: {
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ device_id }: any) => playbackTools.next({ device_id } as any) as any,
);

server.registerTool(
  "spotify_previous",
  {
    description: "Skip to previous track",
    inputSchema: {
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ device_id }: any) => playbackTools.previous({ device_id } as any) as any,
);

server.registerTool(
  "spotify_set_volume",
  {
    description: "Set playback volume (0-100)",
    inputSchema: {
      volume_percent: z.number().min(0).max(100).describe("Volume level (0-100)"),
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ volume_percent, device_id }: any) =>
    playbackTools.setVolume({ volume_percent, device_id } as any) as any,
);

server.registerTool(
  "spotify_get_playback_state",
  {
    description: "Get current playback state including track, artist, album, and playback status",
    inputSchema: {},
  },
  async () => playbackTools.getPlaybackState() as any,
);

server.registerTool(
  "spotify_get_devices",
  {
    description: "List available Spotify Connect devices",
    inputSchema: {},
  },
  async () => playbackTools.getDevices() as any,
);

server.registerTool(
  "spotify_shuffle",
  {
    description: "Enable or disable shuffle mode",
    inputSchema: {
      state: z.boolean().describe("true to enable shuffle, false to disable"),
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ state, device_id }: any) => playbackTools.setShuffle({ state, device_id } as any) as any,
);

server.registerTool(
  "spotify_repeat",
  {
    description:
      "Set repeat mode: 'track' repeats current track, 'context' repeats album/playlist, 'off' disables repeat",
    inputSchema: {
      state: z
        .enum(["track", "context", "off"])
        .describe("Repeat mode: 'track', 'context' (album/playlist), or 'off'"),
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ state, device_id }: any) => playbackTools.setRepeat({ state, device_id } as any) as any,
);

// Register search tool
server.registerTool(
  "spotify_search",
  {
    description: "Search for tracks, albums, artists, or playlists with optional field filters",
    inputSchema: {
      query: z.string().describe("Search query"),
      type: z.enum(["track", "album", "artist", "playlist"]).describe("Type of item to search for"),
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe("Number of results to return (default: 5, max: 10)"),
      artist: z.string().optional().describe("Filter by artist name"),
      album: z.string().optional().describe("Filter by album name"),
      genre: z.string().optional().describe("Filter by genre"),
      year: z
        .string()
        .optional()
        .describe("Filter by year or year range (e.g., '2024' or '2020-2024')"),
      tag: z
        .enum(["new", "hipster"])
        .optional()
        .describe("Filter by tag: 'new' for recent releases, 'hipster' for low-popularity"),
    },
  },
  async ({ query, type, limit, artist, album, genre, year, tag }: any) =>
    searchTools.search({ query, type, limit, artist, album, genre, year, tag } as any) as any,
);

// Register playlist tools
server.registerTool(
  "spotify_get_playlists",
  {
    description: "Get current user's playlists",
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of playlists to return (default: 20)"),
    },
  },
  async ({ limit }: any) => playlistTools.getPlaylists({ limit } as any) as any,
);

server.registerTool(
  "spotify_get_playlist",
  {
    description: "Get details of a specific playlist",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID"),
    },
  },
  async ({ playlist_id }: any) => playlistTools.getPlaylist({ playlist_id } as any) as any,
);

server.registerTool(
  "spotify_create_playlist",
  {
    description: "Create a new playlist",
    inputSchema: {
      name: z.string().describe("Playlist name"),
      description: z.string().optional().describe("Playlist description"),
      public: z
        .boolean()
        .optional()
        .describe("Whether the playlist should be public (default: true)"),
    },
  },
  async ({ name, description, public: isPublic }: any) =>
    playlistTools.createPlaylist({ name, description, public: isPublic } as any) as any,
);

server.registerTool(
  "spotify_add_to_playlist",
  {
    description: "Add tracks to a playlist",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID"),
      uris: z.array(z.string()).describe("Array of Spotify track URIs to add"),
      position: z
        .number()
        .optional()
        .describe("Position to insert tracks (default: end of playlist)"),
    },
  },
  async ({ playlist_id, uris, position }: any) =>
    playlistTools.addToPlaylist({ playlist_id, uris, position } as any) as any,
);

server.registerTool(
  "spotify_remove_from_playlist",
  {
    description: "Remove tracks from a playlist",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID"),
      uris: z.array(z.string()).min(1).describe("Array of Spotify track URIs to remove"),
      snapshot_id: z
        .string()
        .optional()
        .describe("Playlist snapshot ID for concurrent modification safety"),
    },
  },
  async ({ playlist_id, uris, snapshot_id }: any) =>
    playlistTools.removeFromPlaylist({ playlist_id, uris, snapshot_id } as any) as any,
);

server.registerTool(
  "spotify_reorder_playlist_tracks",
  {
    description: "Reorder tracks in a playlist",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID"),
      range_start: z.number().min(0).describe("Position of the first track to move"),
      insert_before: z.number().min(0).describe("Position where tracks should be inserted"),
      range_length: z.number().min(1).optional().describe("Number of tracks to move (default: 1)"),
      snapshot_id: z
        .string()
        .optional()
        .describe("Playlist snapshot ID for concurrent modification safety"),
    },
  },
  async ({ playlist_id, range_start, insert_before, range_length, snapshot_id }: any) =>
    playlistTools.reorderPlaylistTracks({
      playlist_id,
      range_start,
      insert_before,
      range_length,
      snapshot_id,
    } as any) as any,
);

server.registerTool(
  "spotify_delete_playlist",
  {
    description: "Delete (unfollow) a playlist. You can only delete playlists you own.",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID to delete"),
    },
  },
  async ({ playlist_id }: any) => playlistTools.deletePlaylist({ playlist_id } as any) as any,
);

server.registerTool(
  "spotify_update_playlist",
  {
    description: "Update playlist details (name, description, public/private, collaborative)",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID"),
      name: z.string().optional().describe("New playlist name"),
      description: z.string().optional().describe("New playlist description"),
      public: z.boolean().optional().describe("Whether the playlist should be public"),
      collaborative: z
        .boolean()
        .optional()
        .describe("Whether the playlist should be collaborative (must be non-public)"),
    },
  },
  async ({ playlist_id, name, description, public: isPublic, collaborative }: any) =>
    playlistTools.updatePlaylist({
      playlist_id,
      name,
      description,
      public: isPublic,
      collaborative,
    } as any) as any,
);

// Register user data tools
server.registerTool(
  "spotify_get_user_profile",
  {
    description: "Get current user's profile information",
    inputSchema: {},
  },
  async () => userTools.getUserProfile() as any,
);

server.registerTool(
  "spotify_get_top_items",
  {
    description: "Get user's top artists or tracks",
    inputSchema: {
      type: z.enum(["artists", "tracks"]).describe("Type of items to get"),
      time_range: z
        .enum(["short_term", "medium_term", "long_term"])
        .optional()
        .describe("Time range: short_term (4 weeks), medium_term (6 months), long_term (all time)"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of items to return (default: 20)"),
    },
  },
  async ({ type, time_range, limit }: any) =>
    userTools.getTopItems({ type, time_range, limit } as any) as any,
);

server.registerTool(
  "spotify_get_recently_played",
  {
    description: "Get user's recently played tracks",
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of tracks to return (default: 20)"),
    },
  },
  async ({ limit }: any) => userTools.getRecentlyPlayed({ limit } as any) as any,
);

// Register library tools
server.registerTool(
  "spotify_get_saved_tracks",
  {
    description: "Get tracks saved in the current user's library",
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of tracks to return (default: 20)"),
      offset: z.number().min(0).optional().describe("Index of first track to return (default: 0)"),
    },
  },
  async ({ limit, offset }: any) => libraryTools.getSavedTracks({ limit, offset } as any) as any,
);

server.registerTool(
  "spotify_get_saved_albums",
  {
    description: "Get albums saved in the current user's library",
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of albums to return (default: 20)"),
      offset: z.number().min(0).optional().describe("Index of first album to return (default: 0)"),
    },
  },
  async ({ limit, offset }: any) => libraryTools.getSavedAlbums({ limit, offset } as any) as any,
);

server.registerTool(
  "spotify_get_followed_artists",
  {
    description: "Get artists followed by the current user",
    inputSchema: {
      limit: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of artists to return (default: 20)"),
      after: z
        .string()
        .optional()
        .describe("Last artist ID from previous page for cursor pagination"),
    },
  },
  async ({ limit, after }: any) => libraryTools.getFollowedArtists({ limit, after } as any) as any,
);

server.registerTool(
  "spotify_save_tracks",
  {
    description: "Save tracks to the current user's library",
    inputSchema: {
      track_ids: z.array(z.string()).min(1).max(50).describe("Array of Spotify track IDs to save"),
    },
  },
  async ({ track_ids }: any) => libraryTools.saveTracks({ track_ids } as any) as any,
);

server.registerTool(
  "spotify_remove_saved_tracks",
  {
    description: "Remove tracks from the current user's library",
    inputSchema: {
      track_ids: z
        .array(z.string())
        .min(1)
        .max(50)
        .describe("Array of Spotify track IDs to remove"),
    },
  },
  async ({ track_ids }: any) => libraryTools.removeSavedTracks({ track_ids } as any) as any,
);

server.registerTool(
  "spotify_save_albums",
  {
    description: "Save albums to the current user's library",
    inputSchema: {
      album_ids: z.array(z.string()).min(1).max(50).describe("Array of Spotify album IDs to save"),
    },
  },
  async ({ album_ids }: any) => libraryTools.saveAlbums({ album_ids } as any) as any,
);

server.registerTool(
  "spotify_remove_saved_albums",
  {
    description: "Remove albums from the current user's library",
    inputSchema: {
      album_ids: z
        .array(z.string())
        .min(1)
        .max(50)
        .describe("Array of Spotify album IDs to remove"),
    },
  },
  async ({ album_ids }: any) => libraryTools.removeSavedAlbums({ album_ids } as any) as any,
);

server.registerTool(
  "spotify_follow_artists",
  {
    description: "Follow one or more artists",
    inputSchema: {
      artist_ids: z
        .array(z.string())
        .min(1)
        .max(50)
        .describe("Array of Spotify artist IDs to follow"),
    },
  },
  async ({ artist_ids }: any) => libraryTools.followArtists({ artist_ids } as any) as any,
);

server.registerTool(
  "spotify_unfollow_artists",
  {
    description: "Unfollow one or more artists",
    inputSchema: {
      artist_ids: z
        .array(z.string())
        .min(1)
        .max(50)
        .describe("Array of Spotify artist IDs to unfollow"),
    },
  },
  async ({ artist_ids }: any) => libraryTools.unfollowArtists({ artist_ids } as any) as any,
);

// Register device management tools
server.registerTool(
  "spotify_transfer_playback",
  {
    description:
      "Transfer playback to a different device (use spotify_get_devices to find device IDs)",
    inputSchema: {
      device_id: z.string().describe("Device ID to transfer playback to"),
      play: z
        .boolean()
        .optional()
        .describe("Whether to start playback on the new device (default: true)"),
    },
  },
  async ({ device_id, play }: any) =>
    playbackTools.transferPlayback({ device_id, play } as any) as any,
);

// Register system tools
server.registerTool(
  "spotify_open",
  {
    description: "Open the Spotify desktop app on this machine",
    inputSchema: {
      wait_seconds: z
        .number()
        .min(0)
        .max(30)
        .optional()
        .describe("Seconds to wait after opening for Spotify to initialize (0-30)"),
    },
  },
  async ({ wait_seconds }: any) => systemTools.openSpotify({ wait_seconds } as any) as any,
);

// Handle shutdown signals
const cleanup = async () => {
  logger.info("Shutting down Spotify MCP server");
  await server.close();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Keep the MCP server alive on unexpected errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("Spotify MCP server running on stdio");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
