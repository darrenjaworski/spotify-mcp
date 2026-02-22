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
import { play, pause, next, previous, setVolume, getPlaybackState } from "./playback.js";

describe("playback tools", () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      play: vi.fn(),
      pause: vi.fn(),
      skipToNext: vi.fn(),
      skipToPrevious: vi.fn(),
      setVolume: vi.fn(),
      getMyCurrentPlaybackState: vi.fn(),
    };
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedClient).mockResolvedValue(mockClient);
  });

  describe("play", () => {
    it("resumes playback when no URI or URIs provided", async () => {
      const result = await play({});
      expect(mockClient.play).toHaveBeenCalledWith({});
      expect(result.content[0].text).toBe("Resumed playback");
      expect(result.isError).toBeUndefined();
    });

    it("plays a track URI via uris array", async () => {
      const uri = "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp";
      const result = await play({ uri });
      expect(mockClient.play).toHaveBeenCalledWith({ uris: [uri] });
      expect(result.content[0].text).toBe(`Started playing track: ${uri}`);
    });

    it("plays an album URI via context_uri", async () => {
      const uri = "spotify:album:6DEjYFkNZh67HP7R9PSZvv";
      const result = await play({ uri });
      expect(mockClient.play).toHaveBeenCalledWith({ context_uri: uri });
      expect(result.content[0].text).toBe(`Started playing album: ${uri}`);
    });

    it("plays a playlist URI via context_uri", async () => {
      const uri = "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M";
      const result = await play({ uri });
      expect(mockClient.play).toHaveBeenCalledWith({ context_uri: uri });
      expect(result.content[0].text).toBe(`Started playing playlist: ${uri}`);
    });

    it("plays an artist URI via context_uri", async () => {
      const uri = "spotify:artist:0TnOYISbd1XYRBk9myaseg";
      const result = await play({ uri });
      expect(mockClient.play).toHaveBeenCalledWith({ context_uri: uri });
      expect(result.content[0].text).toBe(`Started playing artist: ${uri}`);
    });

    it("plays multiple tracks via uris parameter", async () => {
      const uris = ["spotify:track:aaa", "spotify:track:bbb", "spotify:track:ccc"];
      const result = await play({ uris });
      expect(mockClient.play).toHaveBeenCalledWith({ uris });
      expect(result.content[0].text).toBe("Started playing 3 tracks");
    });

    it("passes device_id when provided", async () => {
      const uri = "spotify:track:abc123";
      const result = await play({ uri, device_id: "device1" });
      expect(mockClient.play).toHaveBeenCalledWith({
        uris: [uri],
        device_id: "device1",
      });
      expect(result.content[0].text).toContain("Started playing track");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.play.mockRejectedValue(error);
      const result = await play({ uri: "spotify:track:fail" });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_play");
      expect(result.isError).toBe(true);
    });
  });

  describe("pause", () => {
    it("pauses playback and returns confirmation", async () => {
      const result = await pause({});
      expect(mockClient.pause).toHaveBeenCalledWith({});
      expect(result.content[0].text).toBe("Playback paused");
    });

    it("passes device_id when provided", async () => {
      await pause({ device_id: "device1" });
      expect(mockClient.pause).toHaveBeenCalledWith({ device_id: "device1" });
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.pause.mockRejectedValue(error);
      const result = await pause({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_pause");
      expect(result.isError).toBe(true);
    });
  });

  describe("next", () => {
    it("skips to next track", async () => {
      const result = await next({});
      expect(mockClient.skipToNext).toHaveBeenCalledWith({});
      expect(result.content[0].text).toBe("Skipped to next track");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.skipToNext.mockRejectedValue(error);
      const result = await next({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_next");
      expect(result.isError).toBe(true);
    });
  });

  describe("previous", () => {
    it("skips to previous track", async () => {
      const result = await previous({});
      expect(mockClient.skipToPrevious).toHaveBeenCalledWith({});
      expect(result.content[0].text).toBe("Skipped to previous track");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.skipToPrevious.mockRejectedValue(error);
      const result = await previous({});
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_previous");
      expect(result.isError).toBe(true);
    });
  });

  describe("setVolume", () => {
    it("sets volume and returns confirmation", async () => {
      const result = await setVolume({ volume_percent: 75 });
      expect(mockClient.setVolume).toHaveBeenCalledWith(75, { volume_percent: 75 });
      expect(result.content[0].text).toBe("Volume set to 75%");
    });

    it("passes device_id when provided", async () => {
      await setVolume({ volume_percent: 50, device_id: "device1" });
      expect(mockClient.setVolume).toHaveBeenCalledWith(50, {
        volume_percent: 50,
        device_id: "device1",
      });
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.setVolume.mockRejectedValue(error);
      const result = await setVolume({ volume_percent: 50 });
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_set_volume");
      expect(result.isError).toBe(true);
    });
  });

  describe("getPlaybackState", () => {
    it("returns 'No active playback' when state is empty", async () => {
      mockClient.getMyCurrentPlaybackState.mockResolvedValue({ body: null });
      const result = await getPlaybackState();
      expect(result.content[0].text).toBe("No active playback");
    });

    it("returns 'No active playback' when item is null", async () => {
      mockClient.getMyCurrentPlaybackState.mockResolvedValue({
        body: { item: null },
      });
      const result = await getPlaybackState();
      expect(result.content[0].text).toBe("No active playback");
    });

    it("returns full track info when playing", async () => {
      mockClient.getMyCurrentPlaybackState.mockResolvedValue({
        body: {
          is_playing: true,
          progress_ms: 65000,
          item: {
            type: "track",
            name: "Bohemian Rhapsody",
            duration_ms: 354000,
            artists: [{ name: "Queen" }],
            album: { name: "A Night at the Opera" },
          },
          device: { name: "My Speaker", type: "Speaker", volume_percent: 80 },
        },
      });
      const result = await getPlaybackState();
      const text = result.content[0].text;
      expect(text).toContain("Playing");
      expect(text).toContain("Bohemian Rhapsody");
      expect(text).toContain("Queen");
      expect(text).toContain("A Night at the Opera");
      expect(text).toContain("My Speaker");
      expect(text).toContain("80%");
    });

    it("returns paused state correctly", async () => {
      mockClient.getMyCurrentPlaybackState.mockResolvedValue({
        body: {
          is_playing: false,
          progress_ms: 30000,
          item: {
            type: "track",
            name: "Test Song",
            duration_ms: 180000,
            artists: [{ name: "Artist" }],
            album: { name: "Album" },
          },
          device: { name: "Phone", type: "Smartphone", volume_percent: 50 },
        },
      });
      const result = await getPlaybackState();
      expect(result.content[0].text).toContain("Paused");
      expect(result.content[0].text).toContain("Test Song");
    });

    it("handles non-track items (episodes)", async () => {
      mockClient.getMyCurrentPlaybackState.mockResolvedValue({
        body: {
          is_playing: true,
          progress_ms: 10000,
          item: {
            type: "episode",
            name: "Podcast Episode 1",
          },
          device: { name: "Speaker", type: "Speaker", volume_percent: 60 },
        },
      });
      const result = await getPlaybackState();
      expect(result.content[0].text).toContain("Podcast Episode 1");
      expect(result.content[0].text).toContain("episode");
    });

    it("calls handleToolError on API failure", async () => {
      const error = new Error("API fail");
      mockClient.getMyCurrentPlaybackState.mockRejectedValue(error);
      const result = await getPlaybackState();
      expect(handleToolError).toHaveBeenCalledWith(error, "spotify_get_playback_state");
      expect(result.isError).toBe(true);
    });
  });
});
