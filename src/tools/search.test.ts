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
import { search } from "./search.js";

describe("search tool", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      search: vi.fn(),
    };
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
  });

  it("returns formatted track results", async () => {
    mockClient.search.mockResolvedValue({
      body: {
        tracks: {
          items: [
            {
              name: "Bohemian Rhapsody",
              artists: [{ name: "Queen" }],
              uri: "spotify:track:abc",
            },
            {
              name: "Don't Stop Me Now",
              artists: [{ name: "Queen" }],
              uri: "spotify:track:def",
            },
          ],
        },
      },
    });

    const result = await search({ query: "Queen", type: "track" });
    const text = result.content[0].text;
    expect(text).toContain('Found 2 tracks for "Queen"');
    expect(text).toContain("1. Bohemian Rhapsody - Queen (spotify:track:abc)");
    expect(text).toContain("2. Don't Stop Me Now - Queen (spotify:track:def)");
  });

  it("returns formatted album results", async () => {
    mockClient.search.mockResolvedValue({
      body: {
        albums: {
          items: [
            {
              name: "A Night at the Opera",
              artists: [{ name: "Queen" }],
              uri: "spotify:album:xyz",
            },
          ],
        },
      },
    });

    const result = await search({ query: "Queen", type: "album" });
    const text = result.content[0].text;
    expect(text).toContain("Found 1 albums");
    expect(text).toContain("1. A Night at the Opera - Queen (spotify:album:xyz)");
  });

  it("returns formatted artist results", async () => {
    mockClient.search.mockResolvedValue({
      body: {
        artists: {
          items: [
            { name: "Queen", uri: "spotify:artist:queen1" },
          ],
        },
      },
    });

    const result = await search({ query: "Queen", type: "artist" });
    const text = result.content[0].text;
    expect(text).toContain("Found 1 artists");
    expect(text).toContain("1. Queen (spotify:artist:queen1)");
  });

  it("returns formatted playlist results", async () => {
    mockClient.search.mockResolvedValue({
      body: {
        playlists: {
          items: [
            {
              name: "Queen Essentials",
              owner: { display_name: "Spotify" },
              tracks: { total: 50 },
              uri: "spotify:playlist:pl1",
            },
          ],
        },
      },
    });

    const result = await search({ query: "Queen", type: "playlist" });
    const text = result.content[0].text;
    expect(text).toContain("Found 1 playlists");
    expect(text).toContain("1. Queen Essentials - Spotify (50 tracks) (spotify:playlist:pl1)");
  });

  it("returns 'No {type} found' when empty", async () => {
    mockClient.search.mockResolvedValue({
      body: { tracks: { items: [] } },
    });

    const result = await search({ query: "nonexistent", type: "track" });
    expect(result.content[0].text).toBe('No tracks found for query: "nonexistent"');
  });

  it("uses default limit of 10", async () => {
    mockClient.search.mockResolvedValue({
      body: { tracks: { items: [] } },
    });

    await search({ query: "test", type: "track" });
    expect(mockClient.search).toHaveBeenCalledWith("test", ["track"], { limit: 10 });
  });

  it("uses custom limit when provided", async () => {
    mockClient.search.mockResolvedValue({
      body: { tracks: { items: [] } },
    });

    await search({ query: "test", type: "track", limit: 5 });
    expect(mockClient.search).toHaveBeenCalledWith("test", ["track"], { limit: 5 });
  });

  it("calls handleToolError on API failure", async () => {
    const error = new Error("API fail");
    mockClient.search.mockRejectedValue(error);
    const result = await search({ query: "test", type: "track" });
    expect(handleToolError).toHaveBeenCalledWith(error, "spotify_search");
    expect(result.isError).toBe(true);
  });
});
