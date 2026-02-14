# Interactive Setup Guide

## Overview

The Spotify MCP Server now includes an **interactive setup wizard** that makes configuration a breeze! No more manual config file editing or confusion about where to find credentials.

## Quick Start

```bash
npx @darrenjaws/spotify-mcp setup
```

That's it! The wizard handles everything else.

## What the Setup Wizard Does

### 1. Welcome & Introduction
```
============================================================
Spotify MCP Server - Setup Wizard
============================================================

This wizard will help you configure the Spotify MCP Server.

ℹ You'll need to create a Spotify Developer app to get started.
```

### 2. Spotify Developer App Creation
The wizard:
- Opens your browser to https://developer.spotify.com/dashboard
- Provides step-by-step instructions for creating an app
- Tells you exactly what to fill in:
  - App name: "My Spotify MCP"
  - Redirect URI: `http://127.0.0.1:3000/callback`
  - API: "Web API"

### 3. Client ID Collection
```
============================================================
Step 2: Get Your Client ID
============================================================

In your Spotify app settings:
1. Look for "Client ID" (it's already visible)
2. Copy the 32-character code

Paste your Client ID here: [user enters ID]

✓ Client ID looks good!
```

The wizard **validates** the format in real-time!

### 4. Client Secret Collection
```
============================================================
Step 3: Get Your Client Secret
============================================================

In your Spotify app settings:
1. Click "View client secret" link
2. Copy the secret that appears

Paste your Client Secret here: [user enters secret]

✓ Client Secret looks good!
```

Again, validated automatically.

### 5. Configuration Method
```
============================================================
Step 4: Choose Configuration Method
============================================================

How would you like to use the Spotify MCP server?

1. Claude Desktop (recommended for most users)
2. Claude Code CLI
3. From source (for development)

Enter your choice (1-3): 1
```

### 6. Generated Configuration

Based on your choice, the wizard provides **copy-paste ready** configuration:

**For Claude Desktop:**
```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["-y", "@darrenjaws/spotify-mcp"],
      "env": {
        "SPOTIFY_CLIENT_ID": "abc123...",
        "SPOTIFY_CLIENT_SECRET": "def456...",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:3000/callback"
      }
    }
  }
}
```

**For Claude Code:**
```bash
claude mcp add
# Or manually edit ~/.claude/config.json
```

**For Development:**
```bash
✓ Created .env file in current directory

Next steps:
1. Run: npm run build
2. Test with MCP Inspector: npx @modelcontextprotocol/inspector node build/index.js
```

### 7. Completion & Next Steps
```
============================================================
Setup Complete!
============================================================

✓ Your Spotify MCP server is configured!

ℹ Next steps:
1. Restart Claude Desktop (if using desktop app)
2. Try asking Claude: "What's currently playing on Spotify?"
3. The first request will trigger OAuth authentication in your browser

✓ Happy listening! 🎵
```

## Benefits

### For End Users
- ✅ **No manual config file editing** - the wizard generates it for you
- ✅ **Validation as you go** - catches typos before they cause errors
- ✅ **Browser automation** - opens the right pages automatically
- ✅ **Clear instructions** - no guessing what to do next
- ✅ **Environment detection** - generates correct config for your OS

### For Developers
- ✅ **Fewer support tickets** - users get it right the first time
- ✅ **Better onboarding** - reduced time to first successful request
- ✅ **Consistent setup** - everyone follows the same process

## Running the Setup Wizard

### First-time users (npx)
```bash
npx @darrenjaws/spotify-mcp setup
```

### After global installation
```bash
npm install -g @darrenjaws/spotify-mcp
spotify-mcp setup
```

### Development (from source)
```bash
git clone https://github.com/darrenjaworski/spotify-mcp.git
cd spotify-mcp
npm install
npm run build
node build/bin.js setup
```

## Manual Setup (Advanced)

If you prefer to configure manually or need to update credentials later, you can still manually edit your configuration files. See the [README.md](README.md) for manual configuration instructions.

## Troubleshooting Setup

### "Invalid Client ID format"
- Make sure you copied the entire 32-character hex string
- Don't include any spaces or quotes
- The Client ID should only contain letters a-f and numbers 0-9

### "Invalid Client Secret format"
- Same as Client ID - should be 32 hex characters
- Make sure to reveal the secret first in the Spotify Dashboard

### "Could not open browser automatically"
- The wizard will show you the URL to visit manually
- Just copy-paste the URL into your browser

### Setup completes but server doesn't work
1. Make sure you added the exact redirect URI: `http://127.0.0.1:3000/callback`
2. Restart Claude Desktop after config changes
3. Check that you pasted the config in the right location
4. Verify the config JSON is valid (no trailing commas, balanced braces)

## Technical Details

The setup wizard (`src/setup.ts`) is a standalone CLI tool that:
- Uses Node.js `readline/promises` for interactive prompts
- Validates inputs with regex patterns matching Spotify's format
- Opens browsers using platform-specific commands (macOS, Windows, Linux)
- Generates configuration based on detected OS and user preferences
- Provides colored terminal output for better readability

## Contributing

Want to improve the setup experience? Check out:
- `src/setup.ts` - Main wizard logic
- `src/bin.ts` - CLI entry point that routes to setup or server
- `package.json` - Bin configuration

Ideas for future improvements:
- [ ] Test connection to Spotify API after setup
- [ ] Auto-detect if Claude Desktop is installed
- [ ] Offer to update existing config instead of replacing
- [ ] Support for custom redirect URIs
- [ ] Setup wizard localization (multiple languages)
