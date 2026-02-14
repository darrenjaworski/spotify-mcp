# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides Spotify integration for AI assistants. It enables natural language control of Spotify playback, playlist management, music discovery, and user analytics through standardized MCP tools.

## MCP Architecture

### Transport Layer
The server uses **stdio transport** (standard input/output) for communication with MCP clients. This is the most common transport for locally-run MCP servers and works with Claude Desktop, Claude Code, and VSCode extensions like Cline.

### Core Components
- **Server**: MCP server instance that handles tool registration and request routing
- **Tools**: Individual Spotify operations exposed as MCP tools (play, pause, search, etc.)
- **Spotify Client**: Wrapper around Spotify Web API with OAuth management
- **Auth Manager**: Handles OAuth 2.0 PKCE flow and token persistence

### Tool Design Philosophy
Each tool should:
- Have a clear, descriptive name prefixed with `spotify_`
- Accept parameters via JSON schema validation
- Return structured, consistent responses
- Handle errors gracefully with user-friendly messages
- Never expose raw API errors to the user

## Project Structure

```
src/
├── index.ts              # Entry point, stdio transport setup
├── server.ts             # MCP server initialization and tool registration
├── tools/                # MCP tool implementations
│   ├── playback.ts       # Play, pause, next, previous, volume
│   ├── search.ts         # Search tracks, albums, artists, playlists
│   ├── playlists.ts      # Playlist CRUD operations
│   ├── library.ts        # Saved tracks, albums, followed artists
│   └── user.ts           # Profile, top items, recently played
├── spotify/              # Spotify API client layer
│   ├── client.ts         # Main Spotify API wrapper
│   ├── types.ts          # TypeScript types for Spotify objects
│   └── errors.ts         # Spotify-specific error handling
├── auth/                 # OAuth 2.0 authentication
│   ├── oauth.ts          # PKCE flow implementation
│   ├── token-manager.ts  # Token storage and refresh logic
│   └── storage.ts        # File-based token persistence
└── utils/
    ├── logger.ts         # Logging utilities
    └── validation.ts     # Input validation helpers
```

## TypeScript Philosophy

**Pragmatic over Purist**: Use `any` when appropriate. TypeScript is a tool to help us, not a burden.

### When to Use `any`
- **Third-party API responses**: Spotify API types may not match perfectly - use `any` and extract what you need
- **MCP SDK type mismatches**: If the SDK types don't align cleanly, cast to `any` rather than fight the type system
- **Quick prototyping**: Get it working first, refine types later if needed
- **Type gymnastics**: If you're spending >5 minutes on a complex type, just use `any` and move on

### When to Avoid `any`
- **Public function signatures**: Keep function parameters and return types typed for clarity
- **Critical business logic**: User-facing types (args, responses) should be explicit
- **Easy to type**: If TypeScript infers it correctly, don't override with `any`

**Example of pragmatic typing**:
```typescript
// Good: Use any for Spotify API responses
const result: any = await client.getPlaylist(id);
const name: string = result.body.name; // Extract what we need

// Good: Cast args when routing
case "spotify_play":
  return await playbackTools.play(args as any);

// Avoid: Fighting the type system
// Don't spend 20 minutes trying to perfectly type third-party API responses
```

## Development Workflow

### Build and Run
```bash
npm run build          # Compile TypeScript to build/
npm run dev            # Build with watch mode
npm run clean          # Remove build directory
```

### Testing
```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

### Linting
```bash
npm run lint           # Check code style
npm run lint:fix       # Auto-fix linting issues
```

### Local Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Configuration Requirements

### Environment Variables
The server requires these environment variables (stored in `.env`):

```env
SPOTIFY_CLIENT_ID=<your_spotify_app_client_id>
SPOTIFY_CLIENT_SECRET=<your_spotify_app_client_secret>
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/callback
```

**CRITICAL**: Never commit `.env` files. Always use `.env.example` for templates.

### Spotify App Setup
Before the server can authenticate:
1. Create app at https://developer.spotify.com/dashboard
2. Add redirect URI: `http://127.0.0.1:3000/callback`
3. Copy client ID and secret to `.env`

### Token Storage Location
OAuth tokens are persisted at: `~/.spotify-mcp/tokens.json`

This location:
- Is outside the project directory (survives clean builds)
- Is in the user's home directory (user-specific)
- Should be added to `.gitignore`

## OAuth 2.0 PKCE Flow

### Why PKCE?
Spotify requires PKCE (Proof Key for Code Exchange) for enhanced security. This prevents authorization code interception attacks.

### Authentication Flow
1. **First tool call without tokens** → Start OAuth flow
2. Generate code verifier and challenge
3. Open browser to Spotify auth URL with challenge
4. User authorizes, Spotify redirects with code
5. Exchange code + verifier for access & refresh tokens
6. Store tokens in `~/.spotify-mcp/tokens.json`
7. **Subsequent calls** → Use stored access token
8. **Token expired** → Automatically refresh using refresh token

### Token Refresh Strategy
- Check token expiry before each API call
- Refresh proactively if < 5 minutes remaining
- Never expose refresh logic to tool callers (transparent)
- Handle refresh failures by re-triggering full OAuth flow

## MCP Protocol Implementation

### Tool Registration Pattern
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "spotify_play",
      description: "Start or resume playback of a track, album, artist, or playlist",
      inputSchema: {
        type: "object",
        properties: {
          uri: {
            type: "string",
            description: "Spotify URI (e.g., spotify:track:xxx)"
          },
          device_id: {
            type: "string",
            description: "Optional device ID to play on"
          }
        }
      }
    }
  ]
}));
```

### Tool Execution Pattern
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "spotify_play":
      return await handlePlay(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

### Response Format
Always return responses in this structure:
```typescript
{
  content: [
    {
      type: "text",
      text: "Human-readable success/error message"
    }
  ],
  isError: false // or true for errors
}
```

## Spotify API Considerations

### Rate Limiting
- Spotify enforces rate limits (429 responses)
- Implement exponential backoff for retries
- Cache frequently accessed data (playlists, user profile)

### Scopes Required
Minimum OAuth scopes needed:
```
user-read-playback-state
user-modify-playback-state
user-read-currently-playing
playlist-read-private
playlist-modify-public
playlist-modify-private
user-library-read
user-library-modify
user-top-read
user-read-recently-played
```

### Device Handling
Many playback operations require an active device. If no device is active, tools should:
1. List available devices
2. Return clear error: "No active device found. Please open Spotify on a device."
3. Do NOT attempt to activate devices (not reliable via API)

## Error Handling Strategy

### Error Categories
1. **Auth Errors** (401, 403) → Trigger re-authentication
2. **Not Found** (404) → User-friendly "resource not found" message
3. **Rate Limit** (429) → Retry with backoff
4. **Bad Request** (400) → Validate input and return specific error
5. **Server Error** (5xx) → Retry once, then fail with message

### Error Response Format
Never expose raw Spotify API errors. Transform them:
```typescript
// Bad
throw new Error(JSON.stringify(spotifyApiError));

// Good
throw new Error("Playlist not found. Please check the playlist ID.");
```

## Testing Strategy

### Unit Tests
- Test each tool handler in isolation
- Mock Spotify API client
- Focus on input validation and error handling

### Integration Tests
- Test OAuth flow (with test credentials)
- Test token refresh logic
- Test actual Spotify API calls (in CI only, with test account)

### Manual Testing
Use MCP Inspector to test tools interactively before deploying.

## Distribution

### NPM Package
Primary distribution method. The `package.json` should include:
```json
{
  "bin": {
    "spotify-mcp": "./build/index.js"
  },
  "files": ["build", "README.md", "LICENSE"]
}
```

### Installation Methods
Users can install via:
1. `npm install -g spotify-mcp` (after publishing)
2. `npx -y spotify-mcp` (no install required)
3. Clone and build from source

## Security Considerations

### Token Security
- Tokens stored in `~/.spotify-mcp/tokens.json` with 0600 permissions
- Never log tokens or sensitive auth data
- Clear tokens on logout (future feature)

### Input Validation
- Validate all user inputs against JSON schemas
- Sanitize Spotify URIs to prevent injection
- Limit string lengths to prevent DoS

### Environment Variables
- Use `dotenv` for local development only
- In production (MCP client config), pass via `env` field
- Never bundle `.env` in distribution package

## Token Usage & Model Efficiency

### Minimize Token Usage
To keep costs low and responses fast:

**Response Size**
- Return only essential information in tool responses
- Avoid dumping full JSON objects when a summary suffices
- For lists (playlists, tracks), default to concise format with optional `verbose` flag
- Example: Return track name + artist instead of full track object

**Code Efficiency**
- Use targeted file reads instead of reading entire large files
- Leverage TypeScript interfaces to avoid runtime validation overhead
- Cache static data (user profile, device list) instead of fetching repeatedly
- Batch API calls when possible to reduce round trips

**MCP Tool Design**
- Tools should return human-readable text, not raw API responses
- Structure responses as brief summaries unless detail is explicitly requested
- Use the `isError` flag to avoid verbose stack traces in errors

### Model Selection Strategy

**When to use Haiku (fast, cheap)**
- Simple validation tasks
- Formatting or parsing structured data
- Repetitive operations (e.g., batch playlist updates)
- Quick status checks

**When to use Sonnet (balanced)**
- Most tool executions (default)
- Complex queries requiring context
- Multi-step operations

**When to use Opus (powerful, expensive)**
- Complex playlist generation with AI reasoning
- Advanced music recommendation logic
- Natural language query interpretation
- Only when explicitly needed

**Implementation**
In the future, consider adding a `model` hint to tool metadata for MCP clients that support model selection. For now, design tools to be efficient enough for Haiku/Sonnet.

## Common Patterns

### Making Spotify API Calls
```typescript
const client = await getAuthenticatedClient(); // Handles auth + refresh
const result = await client.makeRequest('/v1/me/player/play', {
  method: 'PUT',
  body: { uris: [trackUri] }
});
```

### URI Validation
Spotify URIs must match: `spotify:(track|album|artist|playlist):[\w]+`

### Pagination
Many Spotify endpoints return paginated results. For MCP tools:
- Default to first page (50 items)
- Add optional `limit` and `offset` parameters if pagination is needed
- Document pagination in tool descriptions

### Efficient Response Format
```typescript
// Bad: Returns massive JSON blob
return {
  content: [{ type: "text", text: JSON.stringify(playlist) }]
};

// Good: Returns concise summary
return {
  content: [{
    type: "text",
    text: `Playlist "${playlist.name}" (${playlist.tracks.total} tracks)`
  }]
};

// Better: Configurable detail level
return {
  content: [{
    type: "text",
    text: args.verbose
      ? formatDetailedPlaylist(playlist)
      : formatConcisePlaylist(playlist)
  }]
};
```
