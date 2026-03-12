/**
 * Type definitions for Spotify MCP server
 */

export interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export interface PlaybackArgs {
  uri?: string;
  uris?: string[];
  device_id?: string;
}

export interface SearchArgs {
  query: string;
  type: "track" | "album" | "artist" | "playlist";
  limit?: number;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  tag?: "new" | "hipster";
}

export interface CreatePlaylistArgs {
  name: string;
  description?: string;
  public?: boolean;
}

export interface AddToPlaylistArgs {
  playlist_id: string;
  uris: string[];
  position?: number;
}

export interface GetPlaylistArgs {
  playlist_id: string;
}

export interface VolumeArgs {
  volume_percent: number;
  device_id?: string;
}

export interface TopItemsArgs {
  type: "artists" | "tracks";
  time_range?: "short_term" | "medium_term" | "long_term";
  limit?: number;
}

export interface RecentlyPlayedArgs {
  limit?: number;
}

export interface OpenSpotifyArgs {
  wait_seconds?: number;
}

export interface GetSavedTracksArgs {
  limit?: number;
  offset?: number;
}

export interface GetSavedAlbumsArgs {
  limit?: number;
  offset?: number;
}

export interface GetFollowedArtistsArgs {
  limit?: number;
  after?: string;
}

export interface SaveTracksArgs {
  track_ids: string[];
}

export interface SaveAlbumsArgs {
  album_ids: string[];
}

export interface FollowArtistsArgs {
  artist_ids: string[];
}

export interface RemoveFromPlaylistArgs {
  playlist_id: string;
  uris: string[];
  snapshot_id?: string;
}

export interface ReorderPlaylistTracksArgs {
  playlist_id: string;
  range_start: number;
  insert_before: number;
  range_length?: number;
  snapshot_id?: string;
}

export interface DeletePlaylistArgs {
  playlist_id: string;
}

export interface UpdatePlaylistArgs {
  playlist_id: string;
  name?: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
}

export interface TransferPlaybackArgs {
  device_id: string;
  play?: boolean;
}

/**
 * Typed interface for the Spotify Web API client methods used in this project.
 * Response bodies are typed as `any` — this is intentional per the project's
 * pragmatic TypeScript philosophy. The value is in typing the method signatures
 * so IDE autocomplete works and obvious call-site mistakes are caught.
 */
export interface SpotifyClient {
  // Playback
  play(options?: any): Promise<any>;
  pause(options?: any): Promise<any>;
  skipToNext(options?: any): Promise<any>;
  skipToPrevious(options?: any): Promise<any>;
  setVolume(volumePercent: number, options?: any): Promise<any>;
  getMyCurrentPlaybackState(): Promise<any>;
  getMyDevices(): Promise<any>;
  transferMyPlayback(deviceIds: string[], options?: any): Promise<any>;

  // Search
  search(query: string, types: string[], options?: any): Promise<any>;

  // Playlists
  getUserPlaylists(options?: any): Promise<any>;
  getPlaylist(playlistId: string): Promise<any>;
  createPlaylist(name: string, options?: any): Promise<any>;
  addTracksToPlaylist(playlistId: string, uris: string[], options?: any): Promise<any>;
  removeTracksFromPlaylist(
    playlistId: string,
    tracks: Array<{ uri: string }>,
    options?: any,
  ): Promise<any>;
  reorderTracksInPlaylist(
    playlistId: string,
    rangeStart: number,
    insertBefore: number,
    options?: any,
  ): Promise<any>;
  unfollowPlaylist(playlistId: string): Promise<any>;
  changePlaylistDetails(playlistId: string, options?: any): Promise<any>;

  // Library
  getMySavedTracks(options?: any): Promise<any>;
  getMySavedAlbums(options?: any): Promise<any>;
  getFollowedArtists(options?: any): Promise<any>;
  addToMySavedTracks(trackIds: string[]): Promise<any>;
  removeFromMySavedTracks(trackIds: string[]): Promise<any>;
  addToMySavedAlbums(albumIds: string[]): Promise<any>;
  removeFromMySavedAlbums(albumIds: string[]): Promise<any>;
  followArtists(artistIds: string[]): Promise<any>;
  unfollowArtists(artistIds: string[]): Promise<any>;

  // User
  getMe(): Promise<any>;
  getMyTopArtists(options?: any): Promise<any>;
  getMyTopTracks(options?: any): Promise<any>;
  getMyRecentlyPlayedTracks(options?: any): Promise<any>;

  // Auth (used internally by client.ts and auth.ts)
  setAccessToken(token: string): void;
  setRefreshToken(token: string): void;
}
