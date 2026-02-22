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
import { getUserProfile, getTopItems, getRecentlyPlayed } from "./user.js";

describe("user tools", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      getMe: vi.fn(),
      getMyTopArtists: vi.fn(),
      getMyTopTracks: vi.fn(),
      getMyRecentlyPlayedTracks: vi.fn(),
    };
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
  });

  describe("getUserProfile", () => {
    it("returns formatted profile info", async () => {
      mockClient.getMe.mockResolvedValue({
        body: {
          display_name: "Test User",
          email: "test@example.com",
          country: "US",
          product: "premium",
          followers: { total: 42 },
          id: "testuser123",
        },
      });

      const result = await getUserProfile();
      const text = result.content[0].text;
      expect(text).toContain("Name: Test User");
      expect(text).toContain("Email: test@example.com");
      expect(text).toContain("Country: US");
      expect(text).toContain("Product: premium");
      expect(text).toContain("Followers: 42");
      expect(text).toContain("User ID: testuser123");
    });

    it("handles missing optional fields with N/A defaults", async () => {
      mockClient.getMe.mockResolvedValue({
        body: {
          id: "user1",
        },
      });

      const result = await getUserProfile();
      const text = result.content[0].text;
      expect(text).toContain("Name: N/A");
      expect(text).toContain("Email: N/A");
      expect(text).toContain("Country: N/A");
      expect(text).toContain("Product: N/A");
      expect(text).toContain("Followers: 0");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getMe.mockRejectedValue(error);
      const result = await getUserProfile();
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_user_profile");
      expect(result.isError).toBe(true);
    });
  });

  describe("getTopItems", () => {
    it("returns top artists with genres", async () => {
      mockClient.getMyTopArtists.mockResolvedValue({
        body: {
          items: [
            { name: "Queen", genres: ["rock", "classic rock", "glam rock"] },
            { name: "Radiohead", genres: ["alternative rock", "art rock"] },
          ],
        },
      });

      const result = await getTopItems({ type: "artists" });
      const text = result.content[0].text;
      expect(text).toContain("Your top artists (last 6 months):");
      expect(text).toContain("1. Queen (rock, classic rock)");
      expect(text).toContain("2. Radiohead (alternative rock, art rock)");
    });

    it("returns top tracks with artist names", async () => {
      mockClient.getMyTopTracks.mockResolvedValue({
        body: {
          items: [
            { name: "Bohemian Rhapsody", artists: [{ name: "Queen" }] },
            { name: "Creep", artists: [{ name: "Radiohead" }] },
          ],
        },
      });

      const result = await getTopItems({ type: "tracks" });
      const text = result.content[0].text;
      expect(text).toContain("Your top tracks (last 6 months):");
      expect(text).toContain("1. Bohemian Rhapsody - Queen");
      expect(text).toContain("2. Creep - Radiohead");
    });

    it("returns 'No top {type} found' when empty", async () => {
      mockClient.getMyTopArtists.mockResolvedValue({
        body: { items: [] },
      });

      const result = await getTopItems({ type: "artists" });
      expect(result.content[0].text).toBe("No top artists found");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getMyTopTracks.mockRejectedValue(error);
      const result = await getTopItems({ type: "tracks" });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_top_items");
      expect(result.isError).toBe(true);
    });
  });

  describe("getRecentlyPlayed", () => {
    it("returns recently played with timestamps", async () => {
      mockClient.getMyRecentlyPlayedTracks.mockResolvedValue({
        body: {
          items: [
            {
              track: { name: "Song A", artists: [{ name: "Artist 1" }] },
              played_at: "2024-01-15T10:30:00Z",
            },
            {
              track: { name: "Song B", artists: [{ name: "Artist 2" }, { name: "Artist 3" }] },
              played_at: "2024-01-15T10:00:00Z",
            },
          ],
        },
      });

      const result = await getRecentlyPlayed({});
      const text = result.content[0].text;
      expect(text).toContain("Recently played tracks:");
      expect(text).toContain("1. Song A - Artist 1");
      expect(text).toContain("2. Song B - Artist 2, Artist 3");
    });

    it("returns 'No recently played tracks found' when empty", async () => {
      mockClient.getMyRecentlyPlayedTracks.mockResolvedValue({
        body: { items: [] },
      });

      const result = await getRecentlyPlayed({});
      expect(result.content[0].text).toBe("No recently played tracks found");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getMyRecentlyPlayedTracks.mockRejectedValue(error);
      const result = await getRecentlyPlayed({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_recently_played");
      expect(result.isError).toBe(true);
    });
  });
});
