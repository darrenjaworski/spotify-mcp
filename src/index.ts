#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import * as playbackTools from "./tools/playback.js";
import * as searchTools from "./tools/search.js";
import * as playlistTools from "./tools/playlists.js";
import * as userTools from "./tools/user.js";

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
  }
);

// Register playback tools
server.registerTool(
  "spotify_play",
  {
    description: "Start or resume playback of a track, album, artist, or playlist",
    inputSchema: {
      uri: z.string().optional().describe("Spotify URI to play (e.g., spotify:track:xxx, spotify:playlist:xxx)"),
      device_id: z.string().optional().describe("Optional: Device ID to play on"),
    },
  },
  async ({ uri, device_id }: any) => playbackTools.play({ uri, device_id } as any) as any
);

server.registerTool(
  "spotify_pause",
  {
    description: "Pause current playback",
    inputSchema: {
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ device_id }: any) => playbackTools.pause({ device_id } as any) as any
);

server.registerTool(
  "spotify_next",
  {
    description: "Skip to next track",
    inputSchema: {
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ device_id }: any) => playbackTools.next({ device_id } as any) as any
);

server.registerTool(
  "spotify_previous",
  {
    description: "Skip to previous track",
    inputSchema: {
      device_id: z.string().optional().describe("Optional: Device ID"),
    },
  },
  async ({ device_id }: any) => playbackTools.previous({ device_id } as any) as any
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
  async ({ volume_percent, device_id }: any) => playbackTools.setVolume({ volume_percent, device_id } as any) as any
);

server.registerTool(
  "spotify_get_playback_state",
  {
    description: "Get current playback state including track, artist, album, and playback status",
    inputSchema: {},
  },
  async () => playbackTools.getPlaybackState() as any
);

// Register search tool
server.registerTool(
  "spotify_search",
  {
    description: "Search for tracks, albums, artists, or playlists",
    inputSchema: {
      query: z.string().describe("Search query"),
      type: z.enum(["track", "album", "artist", "playlist"]).describe("Type of item to search for"),
      limit: z.number().min(1).max(50).optional().describe("Number of results to return (default: 10, max: 50)"),
    },
  },
  async ({ query, type, limit }: any) => searchTools.search({ query, type, limit } as any) as any
);

// Register playlist tools
server.registerTool(
  "spotify_get_playlists",
  {
    description: "Get current user's playlists",
    inputSchema: {
      limit: z.number().min(1).max(50).optional().describe("Number of playlists to return (default: 20)"),
    },
  },
  async ({ limit }: any) => playlistTools.getPlaylists({ limit } as any) as any
);

server.registerTool(
  "spotify_get_playlist",
  {
    description: "Get details of a specific playlist",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID"),
    },
  },
  async ({ playlist_id }: any) => playlistTools.getPlaylist({ playlist_id } as any) as any
);

server.registerTool(
  "spotify_create_playlist",
  {
    description: "Create a new playlist",
    inputSchema: {
      name: z.string().describe("Playlist name"),
      description: z.string().optional().describe("Playlist description"),
      public: z.boolean().optional().describe("Whether the playlist should be public (default: true)"),
    },
  },
  async ({ name, description, public: isPublic }: any) =>
    playlistTools.createPlaylist({ name, description, public: isPublic } as any) as any
);

server.registerTool(
  "spotify_add_to_playlist",
  {
    description: "Add tracks to a playlist",
    inputSchema: {
      playlist_id: z.string().describe("Spotify playlist ID"),
      uris: z.array(z.string()).describe("Array of Spotify track URIs to add"),
      position: z.number().optional().describe("Position to insert tracks (default: end of playlist)"),
    },
  },
  async ({ playlist_id, uris, position }: any) =>
    playlistTools.addToPlaylist({ playlist_id, uris, position } as any) as any
);

// Register user data tools
server.registerTool(
  "spotify_get_user_profile",
  {
    description: "Get current user's profile information",
    inputSchema: {},
  },
  async () => userTools.getUserProfile() as any
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
      limit: z.number().min(1).max(50).optional().describe("Number of items to return (default: 20)"),
    },
  },
  async ({ type, time_range, limit }: any) => userTools.getTopItems({ type, time_range, limit } as any) as any
);

server.registerTool(
  "spotify_get_recently_played",
  {
    description: "Get user's recently played tracks",
    inputSchema: {
      limit: z.number().min(1).max(50).optional().describe("Number of tracks to return (default: 20)"),
    },
  },
  async ({ limit }: any) => userTools.getRecentlyPlayed({ limit } as any) as any
);

// Handle shutdown signals
const cleanup = async () => {
  logger.info("Shutting down Spotify MCP server");
  await server.close();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

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
