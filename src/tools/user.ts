/**
 * User data tools
 */

import { getAuthenticatedClient } from "../spotify/client.js";
import type { ToolResponse, TopItemsArgs, RecentlyPlayedArgs } from "../types.js";

export async function getUserProfile(): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();

  const result = await client.getMe();
  const user = result.body;

  const text = `User Profile:
Name: ${user.display_name || "N/A"}
Email: ${user.email || "N/A"}
Country: ${user.country || "N/A"}
Product: ${user.product || "N/A"}
Followers: ${user.followers?.total || 0}
User ID: ${user.id}`;

  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

export async function getTopItems(args: TopItemsArgs): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();
  const limit = args.limit || 20;
  const timeRange = args.time_range || "medium_term";

  let result;
  let items: any[] = [];
  let itemType = "";

  if (args.type === "artists") {
    result = await client.getMyTopArtists({ limit, time_range: timeRange });
    items = result.body.items;
    itemType = "artists";
  } else {
    result = await client.getMyTopTracks({ limit, time_range: timeRange });
    items = result.body.items;
    itemType = "tracks";
  }

  if (items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No top ${itemType} found`,
        },
      ],
    };
  }

  const timeRangeText = {
    short_term: "last 4 weeks",
    medium_term: "last 6 months",
    long_term: "all time",
  }[timeRange];

  const formatted = items.map((item, index) => {
    if (args.type === "artists") {
      return `${index + 1}. ${item.name} (${item.genres.slice(0, 2).join(", ")})`;
    } else {
      return `${index + 1}. ${item.name} - ${item.artists.map((a: any) => a.name).join(", ")}`;
    }
  });

  return {
    content: [
      {
        type: "text",
        text: `Your top ${itemType} (${timeRangeText}):\n\n${formatted.join("\n")}`,
      },
    ],
  };
}

export async function getRecentlyPlayed(args: RecentlyPlayedArgs): Promise<ToolResponse> {
  const client = await getAuthenticatedClient();
  const limit = args.limit || 20;

  const result = await client.getMyRecentlyPlayedTracks({ limit });
  const items = result.body.items;

  if (items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No recently played tracks found",
        },
      ],
    };
  }

  const formatted = items.map((item, index) => {
    const track = item.track;
    const playedAt = new Date(item.played_at).toLocaleString();
    return `${index + 1}. ${track.name} - ${track.artists.map((a) => a.name).join(", ")} (${playedAt})`;
  });

  return {
    content: [
      {
        type: "text",
        text: `Recently played tracks:\n\n${formatted.join("\n")}`,
      },
    ],
  };
}
