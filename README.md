# Spotify MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with Spotify's API, enabling AI assistants to control and interact with Spotify playback, manage playlists, search for music, and retrieve user listening data.

## Overview

The Spotify MCP Server bridges the gap between AI assistants and Spotify, allowing natural language interactions with your music library and playback. Whether you want to play specific songs, create playlists, discover new music, or analyze your listening habits, this server provides the tools to make it happen.

## Features

### Current Features
- **Authentication & Authorization**: OAuth 2.0 flow with PKCE for secure Spotify API access
- **Playback Control**: Play, pause, skip, adjust volume, and control playback across devices
- **Search**: Find tracks, albums, artists, and playlists
- **Library Management**: Access and manage saved tracks, albums, and playlists
- **User Data**: Retrieve user profile information and listening statistics

### Planned Features
See [ROADMAP.md](ROADMAP.md) for detailed feature timeline and future enhancements.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spotify-mcp.git
cd spotify-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### Spotify App Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Add `http://localhost:3000/callback` to your app's Redirect URIs

### Environment Variables

Create a `.env` file in the project root:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

### MCP Configuration

Add to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["/path/to/spotify-mcp/build/index.js"]
    }
  }
}
```

## Usage

Once configured, you can interact with Spotify through natural language:

- "Play my Discover Weekly playlist"
- "What song is currently playing?"
- "Create a playlist called 'Workout Mix' with these songs..."
- "Skip to the next track"
- "Show me my top artists from the last month"
- "Search for songs by The Beatles"
- "Add this song to my liked songs"

## Available Tools

### Playback
- `spotify_play` - Start or resume playback
- `spotify_pause` - Pause playback
- `spotify_next` - Skip to next track
- `spotify_previous` - Skip to previous track
- `spotify_set_volume` - Adjust volume level
- `spotify_get_playback_state` - Get current playback information

### Search & Discovery
- `spotify_search` - Search for tracks, albums, artists, or playlists
- `spotify_get_recommendations` - Get song recommendations based on seeds

### Library Management
- `spotify_get_playlists` - Get user's playlists
- `spotify_get_playlist` - Get specific playlist details
- `spotify_create_playlist` - Create a new playlist
- `spotify_add_to_playlist` - Add tracks to a playlist
- `spotify_get_saved_tracks` - Get user's saved tracks

### User Data
- `spotify_get_user_profile` - Get user profile information
- `spotify_get_top_items` - Get user's top artists or tracks
- `spotify_get_recently_played` - Get recently played tracks

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Authentication Flow

The server handles Spotify's OAuth 2.0 authentication with PKCE:

1. First request triggers the auth flow
2. User is redirected to Spotify login
3. After authorization, tokens are stored securely
4. Tokens are automatically refreshed when expired

## Security

- OAuth tokens are stored securely and never logged
- PKCE (Proof Key for Code Exchange) is used for enhanced security
- Client secrets are kept in environment variables
- All API requests use HTTPS

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io/)
- Uses the [Spotify Web API](https://developer.spotify.com/documentation/web-api)

## Support

- Report bugs via [GitHub Issues](https://github.com/yourusername/spotify-mcp/issues)
- Join discussions in [GitHub Discussions](https://github.com/yourusername/spotify-mcp/discussions)

## Related Projects

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Spotify Web API SDK](https://github.com/spotify/spotify-web-api-node)
