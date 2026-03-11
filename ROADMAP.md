# Spotify MCP Server Roadmap

This roadmap outlines the vision and planned features for the Spotify MCP Server. Timelines are approximate and subject to change based on community feedback and priorities.

## Vision

Create the most comprehensive and user-friendly MCP server for Spotify integration, enabling AI assistants to provide a seamless, natural music experience. Our goal is to make music discovery, playlist management, and playback control feel effortless and intuitive through conversational AI.

## Current Status

**Phase**: Phase 2 - Core Features Development
**Version**: 0.6.1
**Target**: 1.0.0 MVP

## 1.0.0 MVP

The 1.0.0 release completes Phase 2 — delivering solid playback, playlist management, library features, search, and device control. This is a minimal but complete MCP server for everyday Spotify use.

### Shipped

- [x] **Client Integrations**: Setup wizard and README configs for Cursor, Windsurf, VS Code (GitHub Copilot), OpenCode
- [x] **Playlist Management**: Remove tracks, reorder tracks, delete playlists, update details (including collaborative support)
- [x] **Library Features**: Save/unsave tracks, save/unsave albums, follow/unfollow artists, get saved tracks, get saved albums, get followed artists
- [x] **Enhanced Search**: Field filters (artist, album, genre, year, tag) — search suggestions covered via multi-filter search
- [x] **Device Management**: Transfer playback between devices — device-specific control via existing `device_id` parameter on all playback tools

### Remaining

None — all 1.0.0 MVP items shipped.

Everything in Phases 3-5 (recommendations, audio features, queue management, podcasts, etc.) is post-1.0 and will ship in minor releases after the stable foundation is established.

## Development Phases

### Phase 1: Foundation (Q1 2026) ✅ COMPLETED

**Goal**: Establish core functionality and authentication

- [x] Project setup and structure
- [x] OAuth 2.0 authentication (standard authorization code flow)
- [x] Token management and refresh logic
- [x] Basic MCP server setup (migrated to new McpServer API)
- [x] Core playback controls
  - [x] Play/pause
  - [x] Next/previous track
  - [x] Volume control
  - [x] Get playback state
- [x] Basic search functionality (tracks, albums, artists, playlists)
- [x] Error handling framework (centralized across all tools)
- [x] Initial documentation (README, CLAUDE.md, ROADMAP)
- [x] Comprehensive test suite (160+ passing tests across 10 test files)

**Deliverable**: ✅ Working MCP server with basic playback and search

### Phase 2: Core Features (Q2 2026) ✅ COMPLETED — 1.0.0 MVP

**Goal**: Comprehensive music library and playlist management

- [x] **Playlist Management**
  - [x] Get user's playlists
  - [x] Get playlist details
  - [x] Create playlists
  - [x] Add tracks to playlists
  - [x] Remove tracks from playlists
  - [x] Reorder playlist tracks
  - [x] Delete playlists
  - [x] Update playlist details (collaborative support)

- [x] **Library Features**
  - [x] Save/unsave tracks
  - [x] Save/unsave albums
  - [x] Follow/unfollow artists
  - [x] Get saved tracks
  - [x] Get saved albums
  - [x] Get followed artists

- [x] **Enhanced Search**
  - [x] Multi-type search (tracks, albums, artists, playlists)
  - [x] Search filters and refinement (artist, album, genre, year, tag)
  - [x] Search suggestions (via multi-filter search)

- [x] **Device Management**
  - [x] List available devices
  - [x] Transfer playback between devices
  - [x] Device-specific playback control (via device_id on all playback tools)

**Deliverable**: 1.0.0 — Full-featured music management capabilities

### Phase 3: Discovery & Intelligence (Q3 2026) — Post-1.0

**Goal**: Smart music discovery and personalized recommendations

- [ ] **Recommendations**
  - [ ] Track-based recommendations
  - [ ] Artist-based recommendations
  - [ ] Genre-based recommendations
  - [ ] Seed-based recommendation engine

- [x] **User Analytics** (Partial)
  - [x] User profile information
  - [x] Top tracks (various time ranges: 4 weeks, 6 months, all time)
  - [x] Top artists (various time ranges: 4 weeks, 6 months, all time)
  - [x] Recently played tracks
  - [ ] Listening statistics
  - [ ] Genre analysis

- [ ] **Smart Features**
  - [ ] Playlist analysis and insights
  - [ ] Music mood detection
  - [ ] Similar track finder
  - [ ] Genre exploration tools

- [ ] **Audio Features**
  - [ ] Get track audio features (tempo, key, energy, etc.)
  - [ ] Audio analysis for tracks
  - [ ] Playlist audio profile

**Deliverable**: Intelligent music discovery and analytics

### Phase 4: Advanced Features (Q4 2026) — Post-1.0

**Goal**: Power user features and enhanced experiences

- [ ] **Queue Management**
  - [ ] View current queue
  - [ ] Add to queue
  - [ ] Reorder queue
  - [ ] Clear queue

- [ ] **Advanced Playback**
  - [ ] Single track play behavior: play album from track position instead of stopping after one song
  - [ ] Shuffle control
  - [ ] Repeat mode control
  - [ ] Seek position
  - [ ] Crossfade settings

- [ ] **Social Features**
  - [ ] Share tracks/playlists
  - [ ] View friends' activity (if available)
  - [ ] Collaborative playlist management

- [ ] **Podcast Support**
  - [ ] Search podcasts
  - [ ] Play episodes
  - [ ] Save/unsave episodes
  - [ ] Get saved shows

- [ ] **Offline Mode**
  - [ ] Cache frequently used data
  - [ ] Offline queue management
  - [ ] Sync when connection restored

**Deliverable**: Professional-grade Spotify integration

### Phase 5: Polish & Optimization (Q1 2027) — Post-1.0

**Goal**: Performance, reliability, and user experience refinement

- [ ] **Performance**
  - [ ] Response time optimization
  - [ ] Caching strategy implementation
  - [ ] Rate limit handling
  - [ ] Connection pooling

- [ ] **Reliability**
  - [x] Comprehensive error handling (centralized `handleToolError` across all tools)
  - [ ] Automatic retry logic
  - [ ] Graceful degradation
  - [ ] Health monitoring

- [ ] **Developer Experience**
  - [ ] Enhanced documentation
  - [ ] Code examples library
  - [ ] Testing framework
  - [ ] Debug mode

- [ ] **User Experience**
  - [ ] Better error messages
  - [ ] Progress indicators
  - [ ] Batch operations
  - [ ] User preferences

**Deliverable**: Production-ready, polished MCP server

## Future Considerations

### Potential Features (Beyond 2027)

- **AI-Powered Playlist Generation**
  - Natural language playlist creation
  - Mood-based playlist generation
  - Activity-based playlists (workout, study, etc.)

- **Advanced Analytics**
  - Listening habit insights
  - Genre evolution tracking
  - Artist discovery patterns

- **Integration Extensions**
  - Last.fm scrobbling
  - Lyrics integration
  - Concert notifications
  - Music video support

- **Automation**
  - Scheduled playback
  - Context-aware music selection
  - Smart playlist updates

- **Multi-User Support**
  - Family account management
  - User switching
  - Profile-specific preferences

## Security

### Open

- [ ] **`.env` file permissions**: `setup.ts` creates `.env` with default permissions (`0644`), making `SPOTIFY_CLIENT_SECRET` readable by any local user. Should use `{ mode: 0o600 }` consistent with token storage in `auth.ts`.
- [ ] **Logger redaction gap**: String heuristic in `redactSensitiveData()` only matches `[A-Za-z0-9_-]+`, missing tokens containing `.`, `=`, or `/` (JWT/Base64 formats). Broadening the regex or relying solely on field-name redaction would close this defense-in-depth gap.

### Completed

- [x] OAuth state parameter uses `crypto.randomBytes(32)` for CSRF protection
- [x] Browser launch uses `spawn()` with `shell: false` (no command injection)
- [x] HTML output in OAuth callback uses `escapeHtml()` (no XSS)
- [x] Token files stored with `0600` permissions, directory with `0700`
- [x] OAuth callback server: localhost-only, rate-limited (5 req), 5-minute timeout
- [x] Error responses never expose raw API errors or internal paths
- [x] All tool inputs validated with Zod schemas
- [x] No `exec()` or `eval()` usage in codebase
- [x] Logger auto-redacts sensitive field names (token, secret, password, etc.)
- [x] `.env` excluded from git and npm package

## Community Requests

We welcome feature requests and suggestions from the community. Popular requests will be evaluated for inclusion in future phases.

**How to request features:**
1. Open a GitHub issue with the "feature request" label
2. Describe the use case and expected behavior
3. Community can upvote requests they'd like to see

## Success Metrics

We'll measure success by:
- **Adoption**: Number of active users and installations
- **Reliability**: Uptime and error rates
- **Performance**: Average response times
- **User Satisfaction**: GitHub stars, feedback, and reviews
- **Feature Coverage**: Percentage of Spotify Web API covered

## Contributing

We welcome contributions at any phase! Check our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to help shape this roadmap.

## Version History

- **v0.1.0** (Released 2026-02-14): Initial release with foundation features and security audit
- **v0.2.0** (Released 2026-02-14): Album, playlist, and artist playback support
- **v0.3.0** (Released 2026-02-22): `spotify_open` tool, CI/CD pipeline, ESLint v9
- **v0.4.0** (Released 2026-02-22): Auto-activate Spotify device in `spotify_open`
- **v0.5.0** (Released 2026-02-25): Device validation, centralized error handling, expanded test suite
- **v0.6.0** (Released 2026-02-26): `spotify_get_devices` tool, CI/workflow improvements
- **v0.6.1** (Released 2026-02-26): Adapt to Spotify Web API February 2026 breaking changes
- **v1.0.0** (Released 2026-03-10): MVP — Phase 2 complete (playlist CRUD, library management, search filters, device transfer, 30 tools)

---

## Recent Progress

**March 10, 2026**
- ✅ **Phase 2 COMPLETED / 1.0.0 MVP shipped**: All 14 remaining items implemented
- ✅ Playlist CRUD: remove tracks, reorder, delete, update (collaborative support)
- ✅ Library management: 9 tools (saved tracks/albums, followed artists, save/unsave, follow/unfollow)
- ✅ Search filters: artist, album, genre, year, tag field filters
- ✅ Device transfer: `spotify_transfer_playback` tool
- ✅ OAuth scopes expanded: `user-follow-read`, `user-follow-modify`
- ✅ Test suite expanded to 213 tests across 11 files
- ✅ Total tool count: 30

**February 26, 2026**
- ✅ Adapt to Spotify Web API February 2026 breaking changes (user profile fields, search limits, playlist field renames)
- ✅ `spotify_get_devices` tool to list available Spotify Connect devices
- ✅ CI workflow renamed to "Static Checks"
- ✅ Test suite expanded to 168 tests across 10 files

**February 25, 2026**
- ✅ Device validation added to all playback tools
- ✅ Centralized error handling across all tool implementations
- ✅ System volume display alongside Spotify volume (macOS)
- ✅ Expanded test suite to 160+ tests (auth, logger, system tools, all tool modules)
- ✅ Development workflow improvements (validate script, commit conventions, release process)

**February 22, 2026**
- ✅ `spotify_open` tool with auto device activation
- ✅ CI/CD pipeline with GitHub Actions

**February 14, 2026**
- ✅ **Phase 1 COMPLETED**: All foundation features implemented
- 🔄 **Phase 2 Progress**: Core playlist features implemented (completed in v1.0.0)
- 🔄 **Phase 3 Progress**: User analytics features implemented

---

*Last updated: March 10, 2026*
*This roadmap is a living document and will evolve based on user feedback and project priorities.*
