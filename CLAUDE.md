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
- **Auth Manager**: Handles OAuth 2.0 Authorization Code flow and token persistence

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
├── spotify/              # Spotify API and authentication
│   ├── auth.ts           # OAuth 2.0 Authorization Code flow
│   ├── client.ts         # Authenticated API client wrapper
│   └── (types defined in ../types.ts)
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

### Changelog Maintenance

**IMPORTANT**: Always update CHANGELOG.md BEFORE making commits for any user-facing changes.

Follow the [Keep a Changelog](https://keepachangelog.com/) format:
- Add entries under the `[Unreleased]` section at the top
- Group changes by type: Features, Bug Fixes, Security, Documentation, etc.
- Write clear, user-focused descriptions (not just commit messages)
- Reference issues/PRs where relevant

**When to update the changelog:**
- ✅ New features or enhancements
- ✅ Bug fixes
- ✅ Breaking changes (mark as **BREAKING**)
- ✅ Security fixes
- ✅ Deprecations
- ❌ Internal refactoring (unless it affects users)
- ❌ Documentation typo fixes
- ❌ Dependency updates (unless they fix bugs or add features)

**Before committing:**
1. Update CHANGELOG.md with your changes under `[Unreleased]`
2. Stage the changelog: `git add CHANGELOG.md`
3. Make your commit (include all changes + changelog)

**Example changelog entry:**
```markdown
## [Unreleased]

### Features
- **Playback**: Add support for playing albums and playlists
  - Albums use `context_uri` for full album playback
  - Improved response messages to indicate content type

### Bug Fixes
- Fix volume control not working on some devices
```

**On release** (when publishing to npm):
1. Move `[Unreleased]` entries to a new version section (e.g., `[0.3.0]`)
2. Add the release date
3. Update comparison links at the bottom
4. Commit the changelog update with the version bump

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

## OAuth 2.0 Authorization Code Flow

### Why Authorization Code Flow?
This server uses the standard OAuth 2.0 Authorization Code flow with `client_secret`, which is the appropriate and secure method for confidential server applications. PKCE is recommended for public clients (mobile apps, SPAs) that cannot securely store secrets.

### Authentication Flow
1. **First tool call without tokens** → Start OAuth flow
2. Generate cryptographically secure state parameter for CSRF protection
3. Open browser to Spotify auth URL with state parameter
4. User authorizes, Spotify redirects with authorization code and state
5. Verify state parameter matches (CSRF protection)
6. Exchange authorization code + client_secret for access & refresh tokens
7. Store tokens in `~/.spotify-mcp/tokens.json` with 0600 file permissions
8. **Subsequent calls** → Use stored access token
9. **Token expired** → Automatically refresh using refresh token

### Token Refresh Strategy
- Check token expiry before each API call
- Refresh proactively if < 5 minutes remaining
- Never expose refresh logic to tool callers (transparent)
- Handle refresh failures by re-triggering full OAuth flow

## Playback Implementation

### URI Types and Context Handling

The `spotify_play` tool supports multiple types of Spotify URIs:

- **Tracks** (`spotify:track:xxx`) - Plays a single track using `uris` array parameter
- **Albums** (`spotify:album:xxx`) - Plays entire album using `context_uri` parameter
- **Playlists** (`spotify:playlist:xxx`) - Plays entire playlist using `context_uri` parameter
- **Artists** (`spotify:artist:xxx`) - Plays artist's top tracks using `context_uri` parameter

**Implementation Details:**
- The play function detects URI type by prefix and routes appropriately
- Context URIs (album/playlist/artist) use Spotify's `context_uri` parameter
- Track URIs are wrapped in an array and use the `uris` parameter
- Multiple tracks can be queued by passing an array to the `uris` parameter

**Example:**
```typescript
// Playing an album
await play({ uri: "spotify:album:6DEjYFkNZh67HP7R9PSZvv" });
// Uses: { context_uri: "spotify:album:..." }

// Playing a single track
await play({ uri: "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp" });
// Uses: { uris: ["spotify:track:..."] }
```

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

**CRITICAL**: Security is paramount for an MCP server that handles OAuth credentials and user data. Follow these guidelines strictly.

### Authentication & Authorization

#### OAuth 2.0 Best Practices
- **Use Authorization Code flow** with `client_secret` (appropriate for server apps)
- **Generate cryptographically secure state parameters** using `crypto.randomBytes()` for CSRF protection
- **Never use `Math.random()`** for security-sensitive values (predictable and weak)
- **Validate state parameter** on callback to prevent CSRF attacks
- **Token storage**: Use file permissions `0600` for token files, `0700` for directories
- **Automatic token refresh**: Check expiry before each API call, refresh if < 5 minutes remaining

#### Example: Secure State Generation
```typescript
// ✅ GOOD - Cryptographically secure
import crypto from 'crypto';
const state = crypto.randomBytes(32).toString('hex');

// ❌ BAD - Weak and predictable
const state = "state-" + Math.random().toString(36);
```

#### OAuth Callback Server Security
- **Timeout**: Automatically close server after 5 minutes
- **Rate limiting**: Maximum 5 requests per OAuth flow
- **Localhost-only**: Verify requests come from `127.0.0.1`, `::1`, or `::ffff:127.0.0.1`
- **Close after use**: Server must close immediately after successful/failed callback

### Token Security

#### Storage
- **File location**: `~/.spotify-mcp/tokens.json` (outside project directory)
- **File permissions**: `0600` (read/write for owner only)
- **Directory permissions**: `0700` (access for owner only)
- **Never commit tokens**: Ensure `.gitignore` includes token files

#### Logging
- **NEVER log token values**: Tokens, secrets, passwords must never appear in logs
- **Automatic redaction**: Logger automatically redacts sensitive fields
- **Sensitive field names**: token, accessToken, refreshToken, secret, clientSecret, password, apiKey, authorization
- **Debug mode**: Even in debug mode, tokens must be redacted

#### Example: Safe Logging
```typescript
// ✅ GOOD - Tokens automatically redacted
logger.debug("Loaded tokens from file");
logger.debug("Token info", { expiresAt: tokens.expiresAt }); // Don't include token value

// ❌ BAD - Never do this
logger.debug("Token:", tokens.accessToken); // NEVER LOG TOKEN VALUES
```

### Input Validation & Injection Prevention

#### Command Injection Prevention
- **NEVER use `exec()` with string concatenation**
- **Always use `spawn()` with `shell: false` and argument arrays**
- **Validate URLs before opening in browser**

#### Example: Safe Command Execution
```typescript
// ✅ GOOD - No shell injection risk
import { spawn } from 'child_process';
const child = spawn('open', [url], { shell: false });

// ❌ BAD - Shell injection vulnerability
import { exec } from 'child_process';
exec(`open "${url}"`); // url could contain "; rm -rf /"
```

#### XSS Prevention in HTML Responses
- **Escape all user-controlled data** in HTML responses
- **Use Content-Type with charset**: `text/html; charset=utf-8`
- **Include meta charset tag**: `<meta charset="utf-8">`

#### Example: HTML Escaping
```typescript
function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (char) => map[char] || char);
}

// ✅ GOOD - Escaped user input
res.end(`<p>${escapeHtml(error)}</p>`);

// ❌ BAD - XSS vulnerability
res.end(`<p>${error}</p>`); // error could be "<script>alert('XSS')</script>"
```

#### Input Validation with Zod
- **Validate all tool inputs** using Zod schemas
- **Set appropriate constraints**: min/max for numbers, enum for fixed values
- **Sanitize Spotify URIs** to ensure they match expected format: `spotify:(track|album|artist|playlist):[\w]+`

#### Example: Input Validation
```typescript
// ✅ GOOD - Strict validation
{
  volume_percent: z.number().min(0).max(100),
  type: z.enum(["track", "album", "artist", "playlist"]),
  uri: z.string().regex(/^spotify:(track|album|artist|playlist):[\w]+$/)
}

// ❌ BAD - No validation
{
  volume_percent: z.number(), // Could be negative or > 100
  type: z.string(),           // Could be anything
  uri: z.string()             // Could contain malicious input
}
```

### Error Handling

#### Never Expose Sensitive Information
- **Don't return raw API errors** to users (may contain tokens, internal URLs)
- **Transform errors** to user-friendly messages
- **Don't leak internal paths** or stack traces to end users
- **Log detailed errors** to stderr for debugging, but return generic messages to users

#### Example: Safe Error Handling
```typescript
// ✅ GOOD - User-friendly, no sensitive data
try {
  await client.play({ uri });
} catch (error) {
  logger.error("Playback failed:", error); // Detailed log to stderr
  throw new Error("Failed to start playback. Please check the track URI and try again.");
}

// ❌ BAD - Exposes internal details
catch (error) {
  throw new Error(JSON.stringify(error)); // May contain tokens, paths, etc.
}
```

### Environment Variables & Secrets

#### Development
- **Use `.env` file** for local development only
- **Never commit `.env`**: Ensure it's in `.gitignore`
- **Use `.env.example`** with placeholder values for documentation

#### Production (MCP Client Config)
- **Pass secrets via `env` field** in MCP config
- **Never hardcode secrets** in source code
- **Never bundle `.env`** in npm package (excluded via `files` field in package.json)

#### Example: Safe Environment Variable Usage
```typescript
// ✅ GOOD - Read from environment
const clientId = process.env.SPOTIFY_CLIENT_ID;
if (!clientId) {
  throw new Error("Missing SPOTIFY_CLIENT_ID environment variable");
}

// ❌ BAD - Hardcoded secret
const clientId = "abc123def456"; // NEVER DO THIS
```

### Dependency Security

#### Regular Audits
- **Run `npm audit`** before releases
- **Fix high/critical vulnerabilities** immediately
- **Evaluate moderate vulnerabilities** based on actual risk to this project
- **Document accepted risks** in package.json or security notes

#### Dev vs Production Dependencies
- **Dev dependency vulnerabilities** are lower risk (don't affect production)
- **Prioritize production dependencies** for security updates
- **Review transitive dependencies** for known vulnerabilities

#### Example: Dependency Management
```bash
# Before release
npm audit --audit-level=high

# Fix automatically if possible
npm audit fix

# For breaking changes, evaluate risk vs. benefit
npm audit fix --force  # Use with caution
```

### Rate Limiting & DoS Prevention

#### OAuth Callback Server
- **Maximum 5 requests** per OAuth flow
- **5-minute timeout**: Auto-close if no callback received
- **Localhost-only**: Reject requests from non-localhost addresses

#### API Calls
- **Respect Spotify rate limits**: Handle 429 responses with exponential backoff
- **Cache frequently accessed data**: User profile, device list
- **Batch requests** when possible to reduce API calls

### Code Review Checklist

Before committing code, verify:
- [ ] No secrets or tokens in source code or logs
- [ ] All user inputs validated with Zod schemas
- [ ] No shell command injection risks (use `spawn`, not `exec`)
- [ ] HTML output properly escaped
- [ ] Error messages don't expose sensitive data
- [ ] New dependencies audited for vulnerabilities
- [ ] OAuth flows use cryptographically secure randomness
- [ ] Token files created with appropriate permissions
- [ ] Tests verify security properties (input validation, error handling)

### Security Testing

#### Manual Testing
- Test with malicious inputs (SQL injection attempts, XSS payloads, shell metacharacters)
- Verify token files have correct permissions: `ls -la ~/.spotify-mcp/`
- Check logs don't contain sensitive data when `LOG_LEVEL=debug`
- Test OAuth flow timeout and rate limiting

#### Automated Testing
- Unit tests for input validation (reject invalid URIs, volumes, etc.)
- Tests for HTML escaping in OAuth callbacks
- Tests that tokens are never logged
- Integration tests for token refresh logic

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
