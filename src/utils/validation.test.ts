import { describe, it, expect } from "vitest";
import { validateSpotifyUri, validateArraySize, validateRange } from "./validation.js";

describe("validateSpotifyUri", () => {
  it("accepts valid track URIs", () => {
    expect(() => validateSpotifyUri("spotify:track:3n3Ppam7vgaVa1iaRUc9Lp")).not.toThrow();
  });

  it("accepts valid album URIs", () => {
    expect(() => validateSpotifyUri("spotify:album:6DEjYFkNZh67HP7R9PSZvv")).not.toThrow();
  });

  it("accepts valid artist URIs", () => {
    expect(() => validateSpotifyUri("spotify:artist:0TnOYISbd1XYRBk9myaseg")).not.toThrow();
  });

  it("accepts valid playlist URIs", () => {
    expect(() => validateSpotifyUri("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M")).not.toThrow();
  });

  it("rejects URIs with invalid prefix", () => {
    expect(() => validateSpotifyUri("invalid:track:abc123")).toThrow("Invalid Spotify URI");
  });

  it("rejects URIs with unknown type", () => {
    expect(() => validateSpotifyUri("spotify:episode:abc123")).toThrow("Invalid Spotify URI");
  });

  it("rejects empty strings", () => {
    expect(() => validateSpotifyUri("")).toThrow("Invalid Spotify URI");
  });

  it("rejects URIs with missing ID segment", () => {
    expect(() => validateSpotifyUri("spotify:track:")).toThrow("Invalid Spotify URI");
  });

  it("rejects URIs with special characters in ID", () => {
    expect(() => validateSpotifyUri("spotify:track:abc!@#")).toThrow("Invalid Spotify URI");
  });

  it("rejects URIs with spaces", () => {
    expect(() => validateSpotifyUri("spotify:track:abc 123")).toThrow("Invalid Spotify URI");
  });

  it("rejects plain URLs", () => {
    expect(() =>
      validateSpotifyUri("https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp"),
    ).toThrow("Invalid Spotify URI");
  });

  describe("with allowedTypes filter", () => {
    it("accepts URI when type is in allowedTypes", () => {
      expect(() => validateSpotifyUri("spotify:track:abc123", ["track"])).not.toThrow();
    });

    it("accepts URI when type is one of multiple allowedTypes", () => {
      expect(() =>
        validateSpotifyUri("spotify:album:abc123", ["track", "album", "playlist"]),
      ).not.toThrow();
    });

    it("rejects URI when type is not in allowedTypes", () => {
      expect(() => validateSpotifyUri("spotify:album:abc123", ["track"])).toThrow(
        'Invalid Spotify URI type: "album"',
      );
    });

    it("rejects artist URI when only tracks allowed", () => {
      expect(() => validateSpotifyUri("spotify:artist:abc123", ["track"])).toThrow(
        'Invalid Spotify URI type: "artist"',
      );
    });

    it("includes allowed types in error message", () => {
      expect(() => validateSpotifyUri("spotify:playlist:abc123", ["track", "album"])).toThrow(
        "Expected one of: track, album",
      );
    });

    it("still validates URI format before checking type", () => {
      expect(() => validateSpotifyUri("not-a-uri", ["track"])).toThrow("Invalid Spotify URI");
    });
  });
});

describe("validateArraySize", () => {
  it("accepts arrays within the limit", () => {
    expect(() => validateArraySize([1, 2, 3], 50, "items")).not.toThrow();
  });

  it("accepts arrays at exactly the limit", () => {
    const arr = new Array(50).fill("x");
    expect(() => validateArraySize(arr, 50, "track_ids")).not.toThrow();
  });

  it("accepts empty arrays", () => {
    expect(() => validateArraySize([], 50, "items")).not.toThrow();
  });

  it("rejects arrays exceeding the limit", () => {
    const arr = new Array(51).fill("x");
    expect(() => validateArraySize(arr, 50, "track_ids")).toThrow(
      "track_ids exceeds maximum size of 50 (got 51)",
    );
  });

  it("includes field name in error message", () => {
    expect(() => validateArraySize([1, 2, 3], 2, "album_ids")).toThrow("album_ids");
  });

  it("works with custom limits", () => {
    expect(() => validateArraySize([1, 2, 3, 4, 5, 6], 5, "items")).toThrow(
      "items exceeds maximum size of 5 (got 6)",
    );
  });

  it("accepts single-item arrays with limit of 1", () => {
    expect(() => validateArraySize(["a"], 1, "items")).not.toThrow();
  });
});

describe("validateRange", () => {
  it("accepts values within range", () => {
    expect(() => validateRange(50, 0, 100, "volume_percent")).not.toThrow();
  });

  it("accepts value at minimum", () => {
    expect(() => validateRange(0, 0, 100, "volume_percent")).not.toThrow();
  });

  it("accepts value at maximum", () => {
    expect(() => validateRange(100, 0, 100, "volume_percent")).not.toThrow();
  });

  it("rejects value below minimum", () => {
    expect(() => validateRange(-1, 0, 100, "volume_percent")).toThrow(
      "volume_percent must be between 0 and 100 (got -1)",
    );
  });

  it("rejects value above maximum", () => {
    expect(() => validateRange(101, 0, 100, "volume_percent")).toThrow(
      "volume_percent must be between 0 and 100 (got 101)",
    );
  });

  it("includes field name in error message", () => {
    expect(() => validateRange(200, 0, 100, "brightness")).toThrow("brightness");
  });

  it("works with negative ranges", () => {
    expect(() => validateRange(-5, -10, -1, "offset")).not.toThrow();
  });

  it("rejects value outside negative range", () => {
    expect(() => validateRange(0, -10, -1, "offset")).toThrow(
      "offset must be between -10 and -1 (got 0)",
    );
  });
});
