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
