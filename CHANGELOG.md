# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features
- **Setup Wizard**: Add configuration support for Cursor, Windsurf, VS Code (GitHub Copilot), and OpenCode
  - Setup wizard now offers 7 client options (up from 3)
  - Each client generates the correct config format and file path instructions

### Documentation
- **README**: Add MCP configuration examples for Cursor, Windsurf, and VS Code (GitHub Copilot)
- **Roadmap**: Define 1.0.0 MVP scope (Phase 2 completion) with trackable checklist
  - Mark Phases 3-5 as post-1.0
  - Add shipped/remaining sections for progress tracking

## [0.6.1] - 2026-02-26

### Changed
- **User Profile**: Remove `email`, `country`, `product`, and `followers` fields from profile output (removed from Spotify Web API February 2026)
- **Search**: Reduce default search limit from 10 to 5 and cap maximum at 10 (Spotify API limit reduction)
- **Auth**: Remove `user-read-email` and `user-read-private` OAuth scopes (fields no longer available)
- **Playlists**: Handle Spotify API field rename from `tracks` to `items` on playlist objects (backwards-compatible with both field names)

## [0.6.0] - 2026-02-26

### Features
- **Playback**: Add `spotify_get_devices` tool to list available Spotify Connect devices
  - Shows device name, type, active status, volume, and device ID
  - Device IDs can be used with playback tools (`spotify_play`, `spotify_pause`, etc.)

### Changed
- **CI/CD**: Rename CI workflow to "Static Checks"
- **Workflow**: Rename `validate` script to `static-checks`

### Documentation
- **README**: Simplify MCP configuration section with clear Claude Desktop and Claude Code subsections
- **README**: Add `claude mcp add` one-liner for Claude Code setup
- **README**: Update test coverage stats (167 tests across 10 files)
- **README**: Add `npm run static-checks` to linting section
- **README**: Remove outdated `test:coverage` script reference

## [0.5.3] - 2026-02-25

### Fixed
- **CI/CD**: Fix npm publish authentication for trusted publishing
  - Remove `registry-url` from setup-node (was injecting placeholder token)
  - Upgrade npm to v11.5.1+ at runtime for OIDC trusted publishing support

## [0.5.2] - 2026-02-25

### Changed
- **CI/CD**: Switch npm publish to trusted publisher (OIDC) instead of `NPM_TOKEN` secret

## [0.5.1] - 2026-02-25

### Changed
- **CI/CD**: Add npm publish to release workflow on tag push (uses `NPM_TOKEN` secret)

## [0.5.0] - 2026-02-25

### Features
- **Playback**: Add device validation to all playback tools (play, pause, next, previous, volume)
  - Checks for an active Spotify device before making API calls
  - Lists available inactive devices when no active device is found
  - Skips validation when an explicit `device_id` is provided
  - Suggests using `spotify_open` to launch Spotify
- **Playback**: Show system volume alongside Spotify volume in playback state (macOS)
  - Uses `osascript` to read macOS system output volume
  - Displays as `Volume: X% (Spotify) / Y% (System)` when available
  - Gracefully omitted on non-macOS platforms or if system volume is unavailable
- **Error Handling**: Add centralized error handling to all tool implementations

### Changed
- **Workflow**: Add `npm run validate` script (lint + build + test in one command)
- **Workflow**: Changelog entries now required for all commit types, not just user-facing changes

### Tests
- Add unit tests for auth (credentials, token load/save, file permissions, expiry, refresh)
- Add unit tests for logger (redaction of tokens/secrets, log levels, output format)
- Add unit tests for system tools (platform detection, device activation, polling)
- Add tool-level unit tests for playback, search, playlists, and user

### Documentation
- **CLAUDE.md**: Add commit conventions section (conventional commits format)
- **CLAUDE.md**: Add releasing checklist (semver from commits, validate, update roadmap/changelog, version bump)
- **CLAUDE.md**: Add dependencies policy (necessity, maintenance, transitive deps, security)
- **CLAUDE.md**: Add "run checks routinely" guidance — validate after changes, not just before commits
- **CLAUDE.md**: Streamline testing and changelog sections

## [0.4.0] - 2026-02-22

### Features
- **System**: Auto-activate Spotify device in `spotify_open`
  - Polls for available devices after opening Spotify (up to ~10 seconds)
  - Transfers playback to the first available device so playback commands work immediately
  - Also activates device when Spotify is already running but has no active device
  - Eliminates `NO_ACTIVE_DEVICE` errors after opening Spotify

## [0.3.0] - 2026-02-22

### Features
- **System**: Add `spotify_open` tool to launch the Spotify desktop app
  - Detects if Spotify is already running before launching
  - Supports macOS, Windows, and Linux
  - Optional `wait_seconds` parameter (0-30) to wait for Spotify to initialize before issuing playback commands

### Added
- **CI/CD**: GitHub Actions workflow for automated testing and code quality checks
  - Runs on push to main and pull requests
  - Tests on Node.js 18.x, 20.x, and 22.x
  - Linting, build verification, and test execution
  - Detects uncommitted changes after build

### Removed
- **Coverage reporting**: Removed coverage job from CI and related tooling
  - Coverage reporting is not meaningful for MCP servers (stdio-based, requires external APIs)
  - Removed `test:coverage` script from package.json
  - Removed `@vitest/coverage-v8` dependency
  - Removed coverage configuration from vitest.config.ts
  - Removed coverage job from CI workflow

### Documentation
- Add npm version, downloads, and license badges to README
- Add changelog maintenance workflow to CLAUDE.md
  - Guidelines for when to update changelog
  - Keep a Changelog format instructions
  - Pre-commit checklist for changelog updates
- Update CLAUDE.md testing workflow to emphasize running linter before tests
  - Added recommended command: `npm run lint && npm test`
  - Best practice: lint first to catch style issues early

### Fixed
- **Documentation**: Correct tool count in README (14 tools, not 16)
  - Removed non-existent `spotify_get_recommendations` from documentation
  - Removed non-existent `spotify_get_saved_tracks` from documentation
  - Added tool counts per category for clarity
- **CI/CD**: Fix ESLint configuration for ESLint v9
  - Add eslint.config.mjs with flat config format
  - Install typescript-eslint package
  - Configure rules per project TypeScript philosophy (allow 'any')
  - Fix failing CI linting step

## [0.2.0] - 2026-02-14

### Features
- **Playback**: Add full support for playing albums, playlists, and artists
  - Albums use `context_uri` parameter for full album playback
  - Playlists use `context_uri` for complete playlist playback
  - Artists use `context_uri` to play artist's top tracks
  - Improved response messages to clearly indicate content type being played
  - Updated tool schema and documentation with URI examples

### Documentation
- Document album, playlist, and artist playback in README and CLAUDE.md
- Add usage example for album playback
- Add detailed playback implementation guide in CLAUDE.md

## [0.1.0] - 2026-02-14

### Features
- **Setup Wizard**: Interactive setup wizard for streamlined onboarding
  - Automated Spotify Developer Dashboard workflow
  - Credential validation during setup
  - Browser automation for key setup steps
  - Multi-platform configuration support (Claude Desktop, Claude Code, development)
- **Community**: Add CODE_OF_CONDUCT.md and CONTRIBUTING.md
- **Configuration**: Fix redirect URI configuration to use 127.0.0.1

### Security
- Comprehensive security audit fixes
  - Use cryptographically secure random state generation for OAuth (crypto.randomBytes)
  - Add CSRF protection with state parameter validation
  - Implement secure token storage with 0600 file permissions
  - Add HTML escaping to prevent XSS in OAuth callback responses
  - Use spawn instead of exec to prevent command injection
  - Add automatic token redaction in logs
  - Implement OAuth callback server timeout and rate limiting
  - Add localhost-only request validation

### Documentation
- Fix critical documentation errors and inconsistencies
- Add comprehensive local development guide to README
- Add pragmatic TypeScript philosophy to CLAUDE.md
- Add table of contents to README

### Testing
- Add comprehensive test suite with 30 passing tests
- Integration tests for MCP server setup
- Tool registration validation tests

### Changed
- Migrate from deprecated `Server` to `McpServer` API
- Update dev dependencies and add .nvmrc for Node version management
- Add prepublishOnly script for safer publishing (auto-runs build + tests)

### Infrastructure
- Prepare package for NPM publication
- Complete TypeScript MCP server scaffold
- OAuth 2.0 Authorization Code flow implementation
- Secure callback server with timeout and rate limiting

## [0.0.0] - 2026-02-12

### Added
- Initial project foundation and documentation
- Basic TypeScript MCP server structure
- OAuth authentication flow
- Core playback control tools (play, pause, next, previous, volume, get state)
- Search functionality (tracks, albums, artists, playlists)
- Playlist management tools (get, create, add tracks)
- User data tools (profile, top items, recently played)
- Project documentation (README, CLAUDE.md, LICENSE)

[Unreleased]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.5.3...v0.6.0
[0.5.3]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/darrenjaworski/spotify-mcp/compare/d0f4001...v0.1.0
[0.0.0]: https://github.com/darrenjaworski/spotify-mcp/releases/tag/d0f4001
