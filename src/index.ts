#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { getToolsList } from "./handlers/tools.js";
import { handleToolCall } from "./handlers/call-tool.js";
import { logger } from "./utils/logger.js";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REDIRECT_URI"];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    logger.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// Create MCP server instance
const server = new Server(
  {
    name: "spotify-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug("Handling tools/list request");
  return {
    tools: getToolsList(),
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.debug(`Handling tool call: ${name}`);

  try {
    const result = await handleToolCall(name, args || {});
    return result as any;
  } catch (error) {
    logger.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    } as any;
  }
});

// Handle shutdown signals
const cleanup = async () => {
  logger.info("Shutting down Spotify MCP server");
  await server.close();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("Spotify MCP server running on stdio");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
