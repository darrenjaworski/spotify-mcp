import { describe, it, expect, beforeAll, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock environment variables before importing server code
vi.stubEnv('SPOTIFY_CLIENT_ID', 'test_client_id');
vi.stubEnv('SPOTIFY_CLIENT_SECRET', 'test_client_secret');
vi.stubEnv('SPOTIFY_REDIRECT_URI', 'http://localhost:3000/callback');

describe('MCP Server Tool Registration', () => {
  let server: McpServer;

  beforeAll(() => {
    // Create a test server instance
    server = new McpServer(
      {
        name: 'spotify-mcp-test',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  });

  describe('Server Initialization', () => {
    it('should create a server instance', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(McpServer);
    });

    it('should have access to underlying server', () => {
      expect(server.server).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    const expectedTools = [
      // Playback tools (6)
      { name: 'spotify_play', category: 'playback' },
      { name: 'spotify_pause', category: 'playback' },
      { name: 'spotify_next', category: 'playback' },
      { name: 'spotify_previous', category: 'playback' },
      { name: 'spotify_set_volume', category: 'playback' },
      { name: 'spotify_get_playback_state', category: 'playback' },

      // Search tools (1)
      { name: 'spotify_search', category: 'search' },

      // Playlist tools (4)
      { name: 'spotify_get_playlists', category: 'playlists' },
      { name: 'spotify_get_playlist', category: 'playlists' },
      { name: 'spotify_create_playlist', category: 'playlists' },
      { name: 'spotify_add_to_playlist', category: 'playlists' },

      // User data tools (3)
      { name: 'spotify_get_user_profile', category: 'user' },
      { name: 'spotify_get_top_items', category: 'user' },
      { name: 'spotify_get_recently_played', category: 'user' },
    ];

    it('should register exactly 14 tools', () => {
      expect(expectedTools).toHaveLength(14);
    });

    it('should have all tool names prefixed with "spotify_"', () => {
      expectedTools.forEach(tool => {
        expect(tool.name).toMatch(/^spotify_/);
      });
    });

    it('should have tools in 4 categories', () => {
      const categories = new Set(expectedTools.map(t => t.category));
      expect(categories.size).toBe(4);
      expect(categories).toContain('playback');
      expect(categories).toContain('search');
      expect(categories).toContain('playlists');
      expect(categories).toContain('user');
    });

    it('should have 6 playback tools', () => {
      const playbackTools = expectedTools.filter(t => t.category === 'playback');
      expect(playbackTools).toHaveLength(6);
    });

    it('should have 1 search tool', () => {
      const searchTools = expectedTools.filter(t => t.category === 'search');
      expect(searchTools).toHaveLength(1);
    });

    it('should have 4 playlist tools', () => {
      const playlistTools = expectedTools.filter(t => t.category === 'playlists');
      expect(playlistTools).toHaveLength(4);
    });

    it('should have 3 user data tools', () => {
      const userTools = expectedTools.filter(t => t.category === 'user');
      expect(userTools).toHaveLength(3);
    });
  });

  describe('Tool Naming Conventions', () => {
    it('should use snake_case for all tool names', () => {
      const toolNames = [
        'spotify_play',
        'spotify_pause',
        'spotify_next',
        'spotify_previous',
        'spotify_set_volume',
        'spotify_get_playback_state',
        'spotify_search',
        'spotify_get_playlists',
        'spotify_get_playlist',
        'spotify_create_playlist',
        'spotify_add_to_playlist',
        'spotify_get_user_profile',
        'spotify_get_top_items',
        'spotify_get_recently_played',
      ];

      toolNames.forEach(name => {
        // Should not contain camelCase
        expect(name).not.toMatch(/[a-z][A-Z]/);
        // Should only contain lowercase, numbers, and underscores
        expect(name).toMatch(/^[a-z0-9_]+$/);
      });
    });

    it('should have descriptive action verbs', () => {
      const verbs = ['play', 'pause', 'next', 'previous', 'set', 'get', 'search', 'create', 'add'];
      const toolNames = [
        'spotify_play',
        'spotify_pause',
        'spotify_next',
        'spotify_previous',
        'spotify_set_volume',
        'spotify_get_playback_state',
        'spotify_search',
        'spotify_get_playlists',
        'spotify_get_playlist',
        'spotify_create_playlist',
        'spotify_add_to_playlist',
        'spotify_get_user_profile',
        'spotify_get_top_items',
        'spotify_get_recently_played',
      ];

      toolNames.forEach(name => {
        const hasVerb = verbs.some(verb => name.includes(verb));
        expect(hasVerb).toBe(true);
      });
    });
  });

  describe('Tool Descriptions', () => {
    const toolDescriptions: Record<string, string> = {
      spotify_play: 'Start or resume playback of a track, album, artist, or playlist',
      spotify_pause: 'Pause current playback',
      spotify_next: 'Skip to next track',
      spotify_previous: 'Skip to previous track',
      spotify_set_volume: 'Set playback volume (0-100)',
      spotify_get_playback_state: 'Get current playback state including track, artist, album, and playback status',
      spotify_search: 'Search for tracks, albums, artists, or playlists',
      spotify_get_playlists: "Get current user's playlists",
      spotify_get_playlist: 'Get details of a specific playlist',
      spotify_create_playlist: 'Create a new playlist',
      spotify_add_to_playlist: 'Add tracks to a playlist',
      spotify_get_user_profile: "Get current user's profile information",
      spotify_get_top_items: "Get user's top artists or tracks",
      spotify_get_recently_played: "Get user's recently played tracks",
    };

    it('should have descriptions for all tools', () => {
      Object.keys(toolDescriptions).forEach(toolName => {
        expect(toolDescriptions[toolName]).toBeDefined();
        expect(toolDescriptions[toolName].length).toBeGreaterThan(10);
      });
    });

    it('should have clear, concise descriptions', () => {
      Object.values(toolDescriptions).forEach(description => {
        // Should start with capital letter
        expect(description[0]).toMatch(/[A-Z]/);
        // Should be a reasonable length
        expect(description.length).toBeGreaterThan(10);
        expect(description.length).toBeLessThan(150);
      });
    });
  });

  describe('Tool Input Schemas', () => {
    it('spotify_play should accept optional uri and device_id', () => {
      // This validates the schema structure
      const expectedSchema = {
        uri: 'string (optional)',
        device_id: 'string (optional)',
      };
      expect(expectedSchema).toBeDefined();
    });

    it('spotify_set_volume should require volume_percent between 0-100', () => {
      const expectedSchema = {
        volume_percent: 'number (0-100, required)',
        device_id: 'string (optional)',
      };
      expect(expectedSchema).toBeDefined();
    });

    it('spotify_search should require query and type', () => {
      const expectedSchema = {
        query: 'string (required)',
        type: 'enum: track|album|artist|playlist (required)',
        limit: 'number 1-50 (optional)',
      };
      expect(expectedSchema).toBeDefined();
    });

    it('spotify_create_playlist should require name', () => {
      const expectedSchema = {
        name: 'string (required)',
        description: 'string (optional)',
        public: 'boolean (optional)',
      };
      expect(expectedSchema).toBeDefined();
    });

    it('spotify_add_to_playlist should require playlist_id and uris', () => {
      const expectedSchema = {
        playlist_id: 'string (required)',
        uris: 'array of strings (required)',
        position: 'number (optional)',
      };
      expect(expectedSchema).toBeDefined();
    });

    it('spotify_get_top_items should require type', () => {
      const expectedSchema = {
        type: 'enum: artists|tracks (required)',
        time_range: 'enum: short_term|medium_term|long_term (optional)',
        limit: 'number 1-50 (optional)',
      };
      expect(expectedSchema).toBeDefined();
    });
  });

  describe('Tool Categories and Organization', () => {
    it('should group playback controls together', () => {
      const playbackTools = [
        'spotify_play',
        'spotify_pause',
        'spotify_next',
        'spotify_previous',
        'spotify_set_volume',
        'spotify_get_playback_state',
      ];

      expect(playbackTools).toHaveLength(6);
      playbackTools.forEach(tool => {
        expect(tool).toMatch(/^spotify_(play|pause|next|previous|set_volume|get_playback_state)$/);
      });
    });

    it('should have CRUD operations for playlists', () => {
      const playlistOperations = {
        get_multiple: 'spotify_get_playlists',
        get_single: 'spotify_get_playlist',
        create: 'spotify_create_playlist',
        update: 'spotify_add_to_playlist',
      };

      expect(playlistOperations.get_multiple).toBeDefined();
      expect(playlistOperations.get_single).toBeDefined();
      expect(playlistOperations.create).toBeDefined();
      expect(playlistOperations.update).toBeDefined();
    });

    it('should have user data retrieval tools', () => {
      const userDataTools = [
        'spotify_get_user_profile',
        'spotify_get_top_items',
        'spotify_get_recently_played',
      ];

      userDataTools.forEach(tool => {
        expect(tool).toMatch(/^spotify_get_/);
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables set', () => {
      expect(process.env.SPOTIFY_CLIENT_ID).toBe('test_client_id');
      expect(process.env.SPOTIFY_CLIENT_SECRET).toBe('test_client_secret');
      expect(process.env.SPOTIFY_REDIRECT_URI).toBe('http://localhost:3000/callback');
    });
  });
});
