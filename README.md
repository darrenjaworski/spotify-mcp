# Spotify MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with Spotify's API, enabling AI assistants to control and interact with Spotify playback, manage playlists, search for music, and retrieve user listening data.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Current Features](#current-features)
  - [Planned Features](#planned-features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Automated Setup](#automated-setup-recommended)
  - [Manual Setup](#manual-setup)
  - [Spotify App Setup](#spotify-app-setup)
  - [Environment Variables](#environment-variables)
  - [MCP Configuration](#mcp-configuration)
- [Usage](#usage)
- [Available Tools (16 total)](#available-tools-16-total)
  - [Playback](#playback)
  - [Search & Discovery](#search--discovery)
  - [Library Management](#library-management)
  - [User Data](#user-data)
- [Local Development](#local-development)
  - [Prerequisites](#prerequisites)
  - [Initial Setup](#initial-setup)
  - [Development Workflow](#development-workflow)
  - [Testing Your MCP Server](#testing-your-mcp-server)
  - [Development Tips](#development-tips)
  - [Testing](#testing)
  - [Linting and Code Quality](#linting-and-code-quality)
  - [Troubleshooting](#troubleshooting)
- [Authentication Flow](#authentication-flow)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)
- [Related Projects](#related-projects)
- [Resources](#resources)

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

## Quick Start

The **fastest and easiest** way to get started is using the interactive setup wizard:

```bash
# Run the setup wizard (no installation required!)
npx @darrenjaws/spotify-mcp setup
```

The wizard will:
- ✅ Guide you through creating a Spotify Developer app
- ✅ Open your browser to the right pages automatically
- ✅ Validate your credentials as you enter them
- ✅ Generate the correct configuration for your environment
- ✅ Give you copy-paste ready configs for Claude Desktop or Claude Code

**That's it!** The whole setup takes about 2 minutes.

## Installation

### Option 1: NPM (Recommended)

**Interactive Setup (Easiest):**
```bash
# No installation required - run the setup wizard
npx @darrenjaws/spotify-mcp setup
```

**Or install globally first:**
```bash
npm install -g @darrenjaws/spotify-mcp

# Then run setup
spotify-mcp setup
```

**Using npx without setup wizard:**
```bash
# Skip to manual configuration (see Configuration section below)
npx -y @darrenjaws/spotify-mcp
```

### Option 2: From Source

For development or contributing:

```bash
# Clone the repository
git clone https://github.com/darrenjaworski/spotify-mcp.git
cd spotify-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run the setup wizard
npm run build && node build/bin.js setup
```

## Configuration

### Automated Setup (Recommended)

Use the interactive setup wizard for the easiest configuration experience:

```bash
npx @darrenjaws/spotify-mcp setup
```

The wizard walks you through:
1. Creating a Spotify Developer app
2. Getting your Client ID and Secret
3. Choosing your configuration method (Claude Desktop, Claude Code, or development)
4. Generating the correct config file

### Manual Setup

If you prefer to configure manually or need to update credentials:

#### Spotify App Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Note your **Client ID** and **Client Secret**
4. Add `http://127.0.0.1:3000/callback` to your app's Redirect URIs (note: use `127.0.0.1`, not `localhost`)

### Environment Variables

**For NPM/npx users**: Configure environment variables in your Claude Desktop config (see MCP Configuration above).

**For development from source**: Create a `.env` file in the project root:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
```

### MCP Configuration

Add to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Using npx (recommended):**
```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["-y", "@darrenjaws/spotify-mcp"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id_here",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret_here",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:3000/callback"
      }
    }
  }
}
```

**Using global installation:**
```json
{
  "mcpServers": {
    "spotify": {
      "command": "spotify-mcp",
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id_here",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret_here",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:3000/callback"
      }
    }
  }
}
```

**From source (development):**
```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["/absolute/path/to/spotify-mcp/build/bin.js"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id_here",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret_here",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:3000/callback"
      }
    }
  }
}
```

**Note**: When using npx or global install, environment variables must be specified in the MCP config (not in a `.env` file).

### Claude Code (Terminal) Configuration

If you're using [Claude Code](https://claude.com/code) (the terminal CLI), you can add this MCP server to your project or global configuration.

#### Option 1: Using Claude Code's MCP Command (Recommended)

```bash
# Add the server interactively
claude mcp add

# Follow the prompts:
# - Server name: spotify
# - Command: npx
# - Args: -y @darrenjaws/spotify-mcp
# - Add environment variables when prompted
```

#### Option 2: Manual Configuration

**Global config** (`~/.claude/config.json`):
```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["-y", "@darrenjaws/spotify-mcp"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id_here",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret_here",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:3000/callback"
      }
    }
  }
}
```

**Project-specific config** (`.claude/config.json` in your project):
```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["-y", "@darrenjaws/spotify-mcp"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id_here",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret_here",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:3000/callback"
      }
    }
  }
}
```

#### Migrating from Claude Desktop to Claude Code

If you already have this configured in Claude Desktop, you can copy your configuration:

**1. View your Claude Desktop config:**
```bash
# macOS
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows (PowerShell)
Get-Content $env:APPDATA\Claude\claude_desktop_config.json
```

**2. Copy the `spotify` server config to Claude Code:**
```bash
# Create Claude Code config directory if it doesn't exist
mkdir -p ~/.claude

# Edit your Claude Code config
nano ~/.claude/config.json
# or
code ~/.claude/config.json
```

**3. Paste the same `mcpServers` configuration** - the format is identical!

**4. Verify it works:**
```bash
claude mcp list
```

You should see `spotify` in the list of available MCP servers.

## Usage

Once configured, you can interact with Spotify through natural language:

- "Play my Discover Weekly playlist"
- "What song is currently playing?"
- "Create a playlist called 'Workout Mix' with these songs..."
- "Skip to the next track"
- "Show me my top artists from the last month"
- "Search for songs by The Beatles"
- "Add this song to my liked songs"

## Available Tools (16 total)

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

## Local Development

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Spotify Developer account with app credentials

### Initial Setup

1. **Clone and install dependencies**
```bash
git clone https://github.com/darrenjaworski/spotify-mcp.git
cd spotify-mcp
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your Spotify credentials
```

3. **Build the project**
```bash
npm run build
```

### Development Workflow

#### Watch Mode (Recommended)

Run TypeScript compiler in watch mode for automatic rebuilds:

```bash
npm run dev
```

This continuously watches for file changes and rebuilds automatically. Keep this running in one terminal while you develop.

#### Manual Build

```bash
npm run build       # Compile TypeScript to build/
npm run clean       # Remove build directory
```

### Testing Your MCP Server

#### Option 1: MCP Inspector (Recommended)

The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) is the official interactive testing tool for MCP servers. It provides a browser-based UI to test tools, see protocol messages, and debug your server.

**Start the Inspector:**

```bash
npx @modelcontextprotocol/inspector node build/bin.js
```

This opens a browser at `http://localhost:6274` with:
- **Server Connection Pane**: Configure transport and environment variables
- **Tools Tab**: See all available tools and test them interactively
- **Resources Tab**: View server resources
- **Notifications Pane**: See real-time protocol messages

**With Environment Variables:**

```bash
npx @modelcontextprotocol/inspector node build/bin.js -- \
  SPOTIFY_CLIENT_ID=your_id \
  SPOTIFY_CLIENT_SECRET=your_secret \
  SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
```

**Enable Debug Logging:**

```bash
DEBUG=true npx @modelcontextprotocol/inspector node build/bin.js
```

**Benefits:**
- ✅ Interactive UI to test all 16 tools
- ✅ See JSON-RPC messages in real-time
- ✅ No need to configure Claude Desktop during development
- ✅ Quickly iterate on tool implementations

#### Option 2: Test with Claude Desktop

Add to your Claude Desktop config for real-world testing:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spotify-dev": {
      "command": "node",
      "args": ["/absolute/path/to/spotify-mcp/build/bin.js"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:3000/callback",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

Restart Claude Desktop after config changes.

#### Option 3: Manual stdio Testing

For low-level debugging, you can send JSON-RPC messages directly:

```bash
# Build first
npm run build

# Test list tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/bin.js

# Test a tool call
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"spotify_get_user_profile","arguments":{}}}' | node build/bin.js
```

### Development Tips

**1. Use Watch Mode + Inspector Together**

Terminal 1:
```bash
npm run dev  # Watch mode - rebuilds on changes
```

Terminal 2:
```bash
npx @modelcontextprotocol/inspector node build/bin.js
```

Refresh the Inspector after each rebuild to test changes.

**2. Enable Debug Logging**

Set `LOG_LEVEL=debug` in your `.env` file to see detailed logs:

```bash
LOG_LEVEL=debug node build/bin.js
```

**3. Test Individual Tools**

Use the Inspector's Tools tab to test each tool with different inputs before integrating with Claude.

**4. Check stderr for Logs**

The server logs to stderr (not stdout) to avoid interfering with stdio transport:

```bash
node build/bin.js 2> server.log  # Capture logs to file
```

### Testing

Run the test suite to verify tool registration and functionality:

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

**Test Coverage:**
- ✅ 30 tests covering tool registration
- ✅ Validates all 14 tools are registered correctly
- ✅ Verifies tool naming conventions
- ✅ Checks input schema validation with Zod
- ✅ Integration tests for MCP server setup

### Linting and Code Quality

```bash
npm run lint        # Check code style
npm run lint:fix    # Auto-fix linting issues
```

### Troubleshooting

**Build Errors:**
- Ensure TypeScript is installed: `npm install`
- Check Node version: `node --version` (should be >= 18)

**Inspector Not Loading:**
- Check if port 6274 is available
- Try clearing browser cache
- Restart the inspector

**OAuth Errors:**
- Verify Spotify credentials in `.env`
- Check redirect URI matches in Spotify Dashboard
- Ensure scopes are correct in `src/spotify/auth.ts`

**Server Not Responding:**
- Check logs: `LOG_LEVEL=debug node build/bin.js`
- Verify build succeeded: `ls -la build/`
- Test with simple tool like `spotify_get_user_profile`

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

- Report bugs via [GitHub Issues](https://github.com/darrenjaworski/spotify-mcp/issues)
- Join discussions in [GitHub Discussions](https://github.com/darrenjaworski/spotify-mcp/discussions)

## Related Projects

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Spotify Web API SDK](https://github.com/spotify/spotify-web-api-node)

## Resources

### MCP Development Tools
- [MCP Inspector Documentation](https://modelcontextprotocol.io/docs/tools/inspector) - Official testing tool
- [MCP Inspector GitHub](https://github.com/modelcontextprotocol/inspector) - Source code
- [Testing MCP Servers Guide](https://www.stainless.com/mcp/how-to-test-mcp-servers) - Comprehensive testing strategies
- [MCP Inspector Tutorial](https://hackteam.io/blog/build-test-mcp-server-typescript-mcp-inspector/) - Step-by-step guide

### Spotify API
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
