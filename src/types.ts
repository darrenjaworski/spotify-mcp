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
