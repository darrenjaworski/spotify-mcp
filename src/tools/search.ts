/**
 * Search tools
 */

import { getAuthenticatedClient } from "../spotify/client.js";
import { handleToolError } from "../spotify/errors.js";
import type { ToolResponse, SearchArgs } from "../types.js";

export async function search(args: SearchArgs): Promise<ToolResponse> {
  try {
    const client = await getAuthenticatedClient();
    const limit = args.limit || 10;

    const result = await client.search(args.query, [args.type], { limit });

    let items: any[] = [];
    let itemType = "";

    switch (args.type) {
      case "track":
        items = result.body.tracks?.items || [];
        itemType = "tracks";
        break;
      case "album":
        items = result.body.albums?.items || [];
        itemType = "albums";
        break;
      case "artist":
        items = result.body.artists?.items || [];
        itemType = "artists";
        break;
      case "playlist":
        items = result.body.playlists?.items || [];
        itemType = "playlists";
        break;
    }

    if (items.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No ${itemType} found for query: "${args.query}"`,
          },
        ],
      };
    }

    const formatted = items.map((item, index) => {
      switch (args.type) {
        case "track":
          return `${index + 1}. ${item.name} - ${item.artists.map((a: any) => a.name).join(", ")} (${item.uri})`;
        case "album":
          return `${index + 1}. ${item.name} - ${item.artists.map((a: any) => a.name).join(", ")} (${item.uri})`;
        case "artist":
          return `${index + 1}. ${item.name} (${item.uri})`;
        case "playlist":
          return `${index + 1}. ${item.name} - ${item.owner.display_name} (${item.tracks.total} tracks) (${item.uri})`;
        default:
          return `${index + 1}. ${item.name}`;
      }
    });

    return {
      content: [
        {
          type: "text",
          text: `Found ${items.length} ${itemType} for "${args.query}":\n\n${formatted.join("\n")}`,
        },
      ],
    };
  } catch (error) {
    return handleToolError(error, "spotify_search");
  }
}
