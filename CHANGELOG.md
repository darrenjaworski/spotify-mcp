# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/darrenjaworski/spotify-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/darrenjaworski/spotify-mcp/compare/d0f4001...v0.1.0
[0.0.0]: https://github.com/darrenjaworski/spotify-mcp/releases/tag/d0f4001
