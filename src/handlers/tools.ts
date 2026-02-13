/**
 * Tool definitions for the Spotify MCP server
 */

export function getToolsList() {
  return [
    // Playback controls
    {
      name: "spotify_play",
      description: "Start or resume playback of a track, album, artist, or playlist",
      inputSchema: {
        type: "object",
        properties: {
          uri: {
            type: "string",
            description: "Spotify URI to play (e.g., spotify:track:xxx, spotify:playlist:xxx)",
          },
          device_id: {
            type: "string",
            description: "Optional: Device ID to play on",
          },
        },
      },
    },
    {
      name: "spotify_pause",
      description: "Pause current playback",
      inputSchema: {
        type: "object",
        properties: {
          device_id: {
            type: "string",
            description: "Optional: Device ID",
          },
        },
      },
    },
    {
      name: "spotify_next",
      description: "Skip to next track",
      inputSchema: {
        type: "object",
        properties: {
          device_id: {
            type: "string",
            description: "Optional: Device ID",
          },
        },
      },
    },
    {
      name: "spotify_previous",
      description: "Skip to previous track",
      inputSchema: {
        type: "object",
        properties: {
          device_id: {
            type: "string",
            description: "Optional: Device ID",
          },
        },
      },
    },
    {
      name: "spotify_set_volume",
      description: "Set playback volume (0-100)",
      inputSchema: {
        type: "object",
        properties: {
          volume_percent: {
            type: "number",
            description: "Volume level (0-100)",
            minimum: 0,
            maximum: 100,
          },
          device_id: {
            type: "string",
            description: "Optional: Device ID",
          },
        },
        required: ["volume_percent"],
      },
    },
    {
      name: "spotify_get_playback_state",
      description: "Get current playback state including track, artist, album, and playback status",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },

    // Search
    {
      name: "spotify_search",
      description: "Search for tracks, albums, artists, or playlists",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          type: {
            type: "string",
            enum: ["track", "album", "artist", "playlist"],
            description: "Type of item to search for",
          },
          limit: {
            type: "number",
            description: "Number of results to return (default: 10, max: 50)",
            minimum: 1,
            maximum: 50,
          },
        },
        required: ["query", "type"],
      },
    },

    // Playlists
    {
      name: "spotify_get_playlists",
      description: "Get current user's playlists",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of playlists to return (default: 20)",
            minimum: 1,
            maximum: 50,
          },
        },
      },
    },
    {
      name: "spotify_get_playlist",
      description: "Get details of a specific playlist",
      inputSchema: {
        type: "object",
        properties: {
          playlist_id: {
            type: "string",
            description: "Spotify playlist ID",
          },
        },
        required: ["playlist_id"],
      },
    },
    {
      name: "spotify_create_playlist",
      description: "Create a new playlist",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Playlist name",
          },
          description: {
            type: "string",
            description: "Playlist description",
          },
          public: {
            type: "boolean",
            description: "Whether the playlist should be public (default: true)",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "spotify_add_to_playlist",
      description: "Add tracks to a playlist",
      inputSchema: {
        type: "object",
        properties: {
          playlist_id: {
            type: "string",
            description: "Spotify playlist ID",
          },
          uris: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Array of Spotify track URIs to add",
          },
          position: {
            type: "number",
            description: "Position to insert tracks (default: end of playlist)",
          },
        },
        required: ["playlist_id", "uris"],
      },
    },

    // User data
    {
      name: "spotify_get_user_profile",
      description: "Get current user's profile information",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "spotify_get_top_items",
      description: "Get user's top artists or tracks",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["artists", "tracks"],
            description: "Type of items to get",
          },
          time_range: {
            type: "string",
            enum: ["short_term", "medium_term", "long_term"],
            description: "Time range: short_term (4 weeks), medium_term (6 months), long_term (all time)",
          },
          limit: {
            type: "number",
            description: "Number of items to return (default: 20)",
            minimum: 1,
            maximum: 50,
          },
        },
        required: ["type"],
      },
    },
    {
      name: "spotify_get_recently_played",
      description: "Get user's recently played tracks",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of tracks to return (default: 20)",
            minimum: 1,
            maximum: 50,
          },
        },
      },
    },
  ];
}
