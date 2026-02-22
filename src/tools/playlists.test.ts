import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../spotify/client.js", () => ({
  getAuthenticatedClient: vi.fn(),
}));
vi.mock("../spotify/errors.js", () => ({
  handleToolError: vi.fn().mockReturnValue({
    content: [{ type: "text", text: "error" }],
    isError: true,
  }),
}));

import { getAuthenticatedClient } from "../spotify/client.js";
import { handleToolError } from "../spotify/errors.js";
import { getPlaylists, getPlaylist, createPlaylist, addToPlaylist } from "./playlists.js";

describe("playlist tools", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getUserPlaylists: vi.fn(),
      getPlaylist: vi.fn(),
      createPlaylist: vi.fn(),
      addTracksToPlaylist: vi.fn(),
    };
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
  });

  describe("getPlaylists", () => {
    it("returns formatted playlist list", async () => {
      mockClient.getUserPlaylists.mockResolvedValue({
        body: {
          items: [
            { name: "My Playlist", tracks: { total: 25 }, id: "pl1" },
            { name: "Workout", tracks: { total: 10 }, id: "pl2" },
          ],
        },
      });

      const result = await getPlaylists({});
      const text = result.content[0].text;
      expect(text).toContain("Your playlists:");
      expect(text).toContain("1. My Playlist (25 tracks) - pl1");
      expect(text).toContain("2. Workout (10 tracks) - pl2");
    });

    it("returns 'No playlists found' when empty", async () => {
      mockClient.getUserPlaylists.mockResolvedValue({
        body: { items: [] },
      });

      const result = await getPlaylists({});
      expect(result.content[0].text).toBe("No playlists found");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getUserPlaylists.mockRejectedValue(error);
      const result = await getPlaylists({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_playlists");
      expect(result.isError).toBe(true);
    });
  });

  describe("getPlaylist", () => {
    it("returns detailed playlist info with tracks", async () => {
      mockClient.getPlaylist.mockResolvedValue({
        body: {
          name: "My Playlist",
          description: "A great playlist",
          owner: { display_name: "TestUser" },
          tracks: {
            total: 3,
            items: [
              { track: { name: "Song 1", artists: [{ name: "Artist A" }] } },
              { track: { name: "Song 2", artists: [{ name: "Artist B" }, { name: "Artist C" }] } },
              { track: { name: "Song 3", artists: [{ name: "Artist D" }] } },
            ],
          },
          public: true,
        },
      });

      const result = await getPlaylist({ playlist_id: "pl1" });
      const text = result.content[0].text;
      expect(text).toContain("Playlist: My Playlist");
      expect(text).toContain("Description: A great playlist");
      expect(text).toContain("Owner: TestUser");
      expect(text).toContain("Tracks: 3");
      expect(text).toContain("Public: Yes");
      expect(text).toContain("1. Song 1 - Artist A");
      expect(text).toContain("2. Song 2 - Artist B, Artist C");
      expect(text).toContain("3. Song 3 - Artist D");
    });

    it("handles missing/null tracks in playlist", async () => {
      mockClient.getPlaylist.mockResolvedValue({
        body: {
          name: "Sparse Playlist",
          description: null,
          owner: { display_name: "User" },
          tracks: {
            total: 2,
            items: [
              { track: null },
              { track: { name: "Real Song", artists: [{ name: "Artist" }] } },
            ],
          },
          public: false,
        },
      });

      const result = await getPlaylist({ playlist_id: "pl2" });
      const text = result.content[0].text;
      expect(text).toContain("1. [Unknown track]");
      expect(text).toContain("2. Real Song - Artist");
      expect(text).toContain("Description: No description");
      expect(text).toContain("Public: No");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getPlaylist.mockRejectedValue(error);
      const result = await getPlaylist({ playlist_id: "bad" });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_playlist");
      expect(result.isError).toBe(true);
    });
  });

  describe("createPlaylist", () => {
    it("creates playlist and returns confirmation with ID", async () => {
      mockClient.createPlaylist.mockResolvedValue({
        body: { name: "New Playlist", id: "newpl1" },
      });

      const result = await createPlaylist({ name: "New Playlist" });
      expect(result.content[0].text).toBe("Created playlist: New Playlist (ID: newpl1)");
    });

    it("defaults public to true", async () => {
      mockClient.createPlaylist.mockResolvedValue({
        body: { name: "Public Playlist", id: "pub1" },
      });

      await createPlaylist({ name: "Public Playlist" });
      expect(mockClient.createPlaylist).toHaveBeenCalledWith("Public Playlist", {
        name: "Public Playlist",
        public: true,
      });
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.createPlaylist.mockRejectedValue(error);
      const result = await createPlaylist({ name: "Fail" });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_create_playlist");
      expect(result.isError).toBe(true);
    });
  });

  describe("addToPlaylist", () => {
    it("adds tracks and returns count message", async () => {
      mockClient.addTracksToPlaylist.mockResolvedValue({});

      const uris = ["spotify:track:a", "spotify:track:b"];
      const result = await addToPlaylist({ playlist_id: "pl1", uris });
      expect(result.content[0].text).toBe("Added 2 track(s) to playlist");
      expect(mockClient.addTracksToPlaylist).toHaveBeenCalledWith("pl1", uris, {});
    });

    it("passes position when provided", async () => {
      mockClient.addTracksToPlaylist.mockResolvedValue({});

      const uris = ["spotify:track:a"];
      await addToPlaylist({ playlist_id: "pl1", uris, position: 3 });
      expect(mockClient.addTracksToPlaylist).toHaveBeenCalledWith("pl1", uris, { position: 3 });
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.addTracksToPlaylist.mockRejectedValue(error);
      const result = await addToPlaylist({
        playlist_id: "pl1",
        uris: ["spotify:track:a"],
      });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_add_to_playlist");
      expect(result.isError).toBe(true);
    });
  });
});
