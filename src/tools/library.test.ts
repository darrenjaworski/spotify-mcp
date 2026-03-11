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
import {
  getSavedTracks,
  getSavedAlbums,
  getFollowedArtists,
  saveTracks,
  removeSavedTracks,
  saveAlbums,
  removeSavedAlbums,
  followArtists,
  unfollowArtists,
} from "./library.js";

describe("library tools", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getMySavedTracks: vi.fn(),
      getMySavedAlbums: vi.fn(),
      getFollowedArtists: vi.fn(),
      addToMySavedTracks: vi.fn(),
      removeFromMySavedTracks: vi.fn(),
      addToMySavedAlbums: vi.fn(),
      removeFromMySavedAlbums: vi.fn(),
      followArtists: vi.fn(),
      unfollowArtists: vi.fn(),
    };
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
  });

  describe("getSavedTracks", () => {
    it("returns formatted saved tracks", async () => {
      mockClient.getMySavedTracks.mockResolvedValue({
        body: {
          total: 100,
          items: [
            {
              track: {
                name: "Bohemian Rhapsody",
                artists: [{ name: "Queen" }],
                uri: "spotify:track:abc123",
              },
            },
            {
              track: {
                name: "Stairway to Heaven",
                artists: [{ name: "Led Zeppelin" }],
                uri: "spotify:track:def456",
              },
            },
          ],
        },
      });

      const result = await getSavedTracks({});
      const text = result.content[0].text;
      expect(text).toContain("Saved tracks (100 total):");
      expect(text).toContain("1. Bohemian Rhapsody - Queen (spotify:track:abc123)");
      expect(text).toContain("2. Stairway to Heaven - Led Zeppelin (spotify:track:def456)");
    });

    it("uses offset for numbering", async () => {
      mockClient.getMySavedTracks.mockResolvedValue({
        body: {
          total: 50,
          items: [
            {
              track: {
                name: "Song",
                artists: [{ name: "Artist" }],
                uri: "spotify:track:xyz",
              },
            },
          ],
        },
      });

      const result = await getSavedTracks({ offset: 10 });
      expect(result.content[0].text).toContain("11. Song");
    });

    it("returns message when no saved tracks", async () => {
      mockClient.getMySavedTracks.mockResolvedValue({
        body: { total: 0, items: [] },
      });

      const result = await getSavedTracks({});
      expect(result.content[0].text).toBe("No saved tracks found");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getMySavedTracks.mockRejectedValue(error);
      const result = await getSavedTracks({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_saved_tracks");
      expect(result.isError).toBe(true);
    });
  });

  describe("getSavedAlbums", () => {
    it("returns formatted saved albums", async () => {
      mockClient.getMySavedAlbums.mockResolvedValue({
        body: {
          total: 25,
          items: [
            {
              album: {
                name: "A Night at the Opera",
                artists: [{ name: "Queen" }],
                uri: "spotify:album:abc123",
              },
            },
          ],
        },
      });

      const result = await getSavedAlbums({});
      const text = result.content[0].text;
      expect(text).toContain("Saved albums (25 total):");
      expect(text).toContain("1. A Night at the Opera - Queen (spotify:album:abc123)");
    });

    it("returns message when no saved albums", async () => {
      mockClient.getMySavedAlbums.mockResolvedValue({
        body: { total: 0, items: [] },
      });

      const result = await getSavedAlbums({});
      expect(result.content[0].text).toBe("No saved albums found");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getMySavedAlbums.mockRejectedValue(error);
      const result = await getSavedAlbums({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_saved_albums");
      expect(result.isError).toBe(true);
    });
  });

  describe("getFollowedArtists", () => {
    it("returns formatted followed artists with genres", async () => {
      mockClient.getFollowedArtists.mockResolvedValue({
        body: {
          artists: {
            items: [
              {
                name: "Queen",
                genres: ["rock", "classic rock", "glam rock"],
                uri: "spotify:artist:abc123",
              },
              {
                name: "Radiohead",
                genres: [],
                uri: "spotify:artist:def456",
              },
            ],
            cursors: { after: null },
          },
        },
      });

      const result = await getFollowedArtists({});
      const text = result.content[0].text;
      expect(text).toContain("Followed artists:");
      expect(text).toContain("1. Queen (rock, classic rock) (spotify:artist:abc123)");
      expect(text).toContain("2. Radiohead (spotify:artist:def456)");
      expect(text).not.toContain("More artists available");
    });

    it("shows pagination cursor when more results available", async () => {
      mockClient.getFollowedArtists.mockResolvedValue({
        body: {
          artists: {
            items: [{ name: "Artist", genres: [], uri: "spotify:artist:abc" }],
            cursors: { after: "next_cursor_id" },
          },
        },
      });

      const result = await getFollowedArtists({});
      expect(result.content[0].text).toContain('after: "next_cursor_id"');
    });

    it("passes after parameter for pagination", async () => {
      mockClient.getFollowedArtists.mockResolvedValue({
        body: {
          artists: {
            items: [{ name: "Artist", genres: [], uri: "spotify:artist:abc" }],
            cursors: { after: null },
          },
        },
      });

      await getFollowedArtists({ after: "some_cursor" });
      expect(mockClient.getFollowedArtists).toHaveBeenCalledWith({
        limit: 20,
        after: "some_cursor",
      });
    });

    it("returns message when no followed artists", async () => {
      mockClient.getFollowedArtists.mockResolvedValue({
        body: {
          artists: { items: [], cursors: { after: null } },
        },
      });

      const result = await getFollowedArtists({});
      expect(result.content[0].text).toBe("No followed artists found");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getFollowedArtists.mockRejectedValue(error);
      const result = await getFollowedArtists({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_followed_artists");
      expect(result.isError).toBe(true);
    });
  });

  describe("saveTracks", () => {
    it("saves tracks and returns confirmation", async () => {
      mockClient.addToMySavedTracks.mockResolvedValue({});

      const result = await saveTracks({ track_ids: ["id1", "id2"] });
      expect(result.content[0].text).toBe("Saved 2 track(s) to your library");
      expect(mockClient.addToMySavedTracks).toHaveBeenCalledWith(["id1", "id2"]);
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.addToMySavedTracks.mockRejectedValue(error);
      const result = await saveTracks({ track_ids: ["id1"] });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_save_tracks");
      expect(result.isError).toBe(true);
    });
  });

  describe("removeSavedTracks", () => {
    it("removes tracks and returns confirmation", async () => {
      mockClient.removeFromMySavedTracks.mockResolvedValue({});

      const result = await removeSavedTracks({ track_ids: ["id1", "id2", "id3"] });
      expect(result.content[0].text).toBe("Removed 3 track(s) from your library");
      expect(mockClient.removeFromMySavedTracks).toHaveBeenCalledWith(["id1", "id2", "id3"]);
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.removeFromMySavedTracks.mockRejectedValue(error);
      const result = await removeSavedTracks({ track_ids: ["id1"] });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_remove_saved_tracks");
      expect(result.isError).toBe(true);
    });
  });

  describe("saveAlbums", () => {
    it("saves albums and returns confirmation", async () => {
      mockClient.addToMySavedAlbums.mockResolvedValue({});

      const result = await saveAlbums({ album_ids: ["album1"] });
      expect(result.content[0].text).toBe("Saved 1 album(s) to your library");
      expect(mockClient.addToMySavedAlbums).toHaveBeenCalledWith(["album1"]);
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.addToMySavedAlbums.mockRejectedValue(error);
      const result = await saveAlbums({ album_ids: ["album1"] });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_save_albums");
      expect(result.isError).toBe(true);
    });
  });

  describe("removeSavedAlbums", () => {
    it("removes albums and returns confirmation", async () => {
      mockClient.removeFromMySavedAlbums.mockResolvedValue({});

      const result = await removeSavedAlbums({ album_ids: ["album1", "album2"] });
      expect(result.content[0].text).toBe("Removed 2 album(s) from your library");
      expect(mockClient.removeFromMySavedAlbums).toHaveBeenCalledWith(["album1", "album2"]);
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.removeFromMySavedAlbums.mockRejectedValue(error);
      const result = await removeSavedAlbums({ album_ids: ["album1"] });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_remove_saved_albums");
      expect(result.isError).toBe(true);
    });
  });

  describe("followArtists", () => {
    it("follows artists and returns confirmation", async () => {
      mockClient.followArtists.mockResolvedValue({});

      const result = await followArtists({ artist_ids: ["artist1", "artist2"] });
      expect(result.content[0].text).toBe("Now following 2 artist(s)");
      expect(mockClient.followArtists).toHaveBeenCalledWith(["artist1", "artist2"]);
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.followArtists.mockRejectedValue(error);
      const result = await followArtists({ artist_ids: ["artist1"] });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_follow_artists");
      expect(result.isError).toBe(true);
    });
  });

  describe("unfollowArtists", () => {
    it("unfollows artists and returns confirmation", async () => {
      mockClient.unfollowArtists.mockResolvedValue({});

      const result = await unfollowArtists({ artist_ids: ["artist1"] });
      expect(result.content[0].text).toBe("Unfollowed 1 artist(s)");
      expect(mockClient.unfollowArtists).toHaveBeenCalledWith(["artist1"]);
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.unfollowArtists.mockRejectedValue(error);
      const result = await unfollowArtists({ artist_ids: ["artist1"] });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_unfollow_artists");
      expect(result.isError).toBe(true);
    });
  });
});
