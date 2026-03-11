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
import { getPlaylists, getPlaylist, createPlaylist, addToPlaylist, removeFromPlaylist, reorderPlaylistTracks, deletePlaylist, updatePlaylist } from "./playlists.js";

describe("playlist tools", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getUserPlaylists: vi.fn(),
      getPlaylist: vi.fn(),
      createPlaylist: vi.fn(),
      addTracksToPlaylist: vi.fn(),
      removeTracksFromPlaylist: vi.fn(),
      reorderTracksInPlaylist: vi.fn(),
      unfollowPlaylist: vi.fn(),
      changePlaylistDetails: vi.fn(),
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
            { name: "My Playlist", items: { total: 25 }, id: "pl1" },
            { name: "Workout", items: { total: 10 }, id: "pl2" },
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
          items: {
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
          items: {
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

  describe("removeFromPlaylist", () => {
    it("removes tracks and returns confirmation", async () => {
      mockClient.removeTracksFromPlaylist.mockResolvedValue({});

      const uris = ["spotify:track:a", "spotify:track:b"];
      const result = await removeFromPlaylist({ playlist_id: "pl1", uris });
      expect(result.content[0].text).toBe("Removed 2 track(s) from playlist");
      expect(mockClient.removeTracksFromPlaylist).toHaveBeenCalledWith(
        "pl1",
        [{ uri: "spotify:track:a" }, { uri: "spotify:track:b" }],
        {}
      );
    });

    it("passes snapshot_id when provided", async () => {
      mockClient.removeTracksFromPlaylist.mockResolvedValue({});

      await removeFromPlaylist({
        playlist_id: "pl1",
        uris: ["spotify:track:a"],
        snapshot_id: "snap123",
      });
      expect(mockClient.removeTracksFromPlaylist).toHaveBeenCalledWith(
        "pl1",
        [{ uri: "spotify:track:a" }],
        { snapshot_id: "snap123" }
      );
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.removeTracksFromPlaylist.mockRejectedValue(error);
      const result = await removeFromPlaylist({ playlist_id: "pl1", uris: ["spotify:track:a"] });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_remove_from_playlist");
      expect(result.isError).toBe(true);
    });
  });

  describe("reorderPlaylistTracks", () => {
    it("reorders tracks and returns confirmation", async () => {
      mockClient.reorderTracksInPlaylist.mockResolvedValue({});

      const result = await reorderPlaylistTracks({
        playlist_id: "pl1",
        range_start: 0,
        insert_before: 5,
      });
      expect(result.content[0].text).toBe("Moved 1 track(s) from position 0 to position 5");
      expect(mockClient.reorderTracksInPlaylist).toHaveBeenCalledWith("pl1", 0, 5, {});
    });

    it("passes range_length and snapshot_id when provided", async () => {
      mockClient.reorderTracksInPlaylist.mockResolvedValue({});

      const result = await reorderPlaylistTracks({
        playlist_id: "pl1",
        range_start: 2,
        insert_before: 0,
        range_length: 3,
        snapshot_id: "snap123",
      });
      expect(result.content[0].text).toBe("Moved 3 track(s) from position 2 to position 0");
      expect(mockClient.reorderTracksInPlaylist).toHaveBeenCalledWith("pl1", 2, 0, {
        range_length: 3,
        snapshot_id: "snap123",
      });
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.reorderTracksInPlaylist.mockRejectedValue(error);
      const result = await reorderPlaylistTracks({
        playlist_id: "pl1",
        range_start: 0,
        insert_before: 5,
      });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_reorder_playlist_tracks");
      expect(result.isError).toBe(true);
    });
  });

  describe("deletePlaylist", () => {
    it("unfollows playlist and returns confirmation", async () => {
      mockClient.unfollowPlaylist.mockResolvedValue({});

      const result = await deletePlaylist({ playlist_id: "pl1" });
      expect(result.content[0].text).toBe("Deleted (unfollowed) playlist pl1");
      expect(mockClient.unfollowPlaylist).toHaveBeenCalledWith("pl1");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.unfollowPlaylist.mockRejectedValue(error);
      const result = await deletePlaylist({ playlist_id: "pl1" });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_delete_playlist");
      expect(result.isError).toBe(true);
    });
  });

  describe("updatePlaylist", () => {
    it("updates playlist name and returns confirmation", async () => {
      mockClient.changePlaylistDetails.mockResolvedValue({});

      const result = await updatePlaylist({ playlist_id: "pl1", name: "New Name" });
      expect(result.content[0].text).toBe('Updated playlist: name: "New Name"');
      expect(mockClient.changePlaylistDetails).toHaveBeenCalledWith("pl1", { name: "New Name" });
    });

    it("updates multiple fields", async () => {
      mockClient.changePlaylistDetails.mockResolvedValue({});

      const result = await updatePlaylist({
        playlist_id: "pl1",
        name: "Collab Playlist",
        public: false,
        collaborative: true,
      });
      expect(result.content[0].text).toContain('name: "Collab Playlist"');
      expect(result.content[0].text).toContain("public: false");
      expect(result.content[0].text).toContain("collaborative: true");
    });

    it("returns error when collaborative and public are both true", async () => {
      const result = await updatePlaylist({
        playlist_id: "pl1",
        public: true,
        collaborative: true,
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Collaborative playlists must be non-public");
      expect(mockClient.changePlaylistDetails).not.toHaveBeenCalled();
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.changePlaylistDetails.mockRejectedValue(error);
      const result = await updatePlaylist({ playlist_id: "pl1", name: "Fail" });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_update_playlist");
      expect(result.isError).toBe(true);
    });
  });
});
