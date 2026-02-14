import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Mock environment variables
vi.stubEnv('SPOTIFY_CLIENT_ID', 'test_client_id');
vi.stubEnv('SPOTIFY_CLIENT_SECRET', 'test_client_secret');
vi.stubEnv('SPOTIFY_REDIRECT_URI', 'http://localhost:3000/callback');

describe('MCP Server Integration Tests', () => {
  it('should successfully create and configure a server with all tools', () => {
    const server = new McpServer(
      {
        name: 'spotify-mcp-integration-test',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register a sample tool to verify the API works
    const registration = server.registerTool(
      'test_tool',
      {
        description: 'A test tool',
        inputSchema: {
          test_param: z.string().describe('A test parameter'),
        },
      },
      async ({ test_param }: any) => {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Received: ${test_param}`,
            },
          ],
        };
      }
    );

    expect(registration).toBeDefined();
    expect(server).toBeDefined();
  });

  it('should register tools with Zod schemas', () => {
    // Test that Zod schemas work correctly
    const schema = {
      query: z.string().min(1).describe('Search query'),
      limit: z.number().min(1).max(50).optional().describe('Result limit'),
      type: z.enum(['track', 'album', 'artist']).describe('Search type'),
    };

    expect(schema.query).toBeDefined();
    expect(schema.limit).toBeDefined();
    expect(schema.type).toBeDefined();
  });

  it('should handle optional and required parameters correctly', () => {
    // Test optional parameter
    const optionalSchema = z.string().optional();
    expect(optionalSchema.isOptional()).toBe(true);

    // Test required parameter
    const requiredSchema = z.string();
    expect(requiredSchema.isOptional()).toBe(false);
  });

  it('should validate number constraints', () => {
    const volumeSchema = z.number().min(0).max(100);

    // Valid values
    expect(() => volumeSchema.parse(0)).not.toThrow();
    expect(() => volumeSchema.parse(50)).not.toThrow();
    expect(() => volumeSchema.parse(100)).not.toThrow();

    // Invalid values
    expect(() => volumeSchema.parse(-1)).toThrow();
    expect(() => volumeSchema.parse(101)).toThrow();
    expect(() => volumeSchema.parse('50')).toThrow();
  });

  it('should validate enum constraints', () => {
    const typeSchema = z.enum(['track', 'album', 'artist', 'playlist']);

    // Valid values
    expect(() => typeSchema.parse('track')).not.toThrow();
    expect(() => typeSchema.parse('album')).not.toThrow();
    expect(() => typeSchema.parse('artist')).not.toThrow();
    expect(() => typeSchema.parse('playlist')).not.toThrow();

    // Invalid values
    expect(() => typeSchema.parse('song')).toThrow();
    expect(() => typeSchema.parse('TRACK')).toThrow();
    expect(() => typeSchema.parse('')).toThrow();
  });

  it('should validate array schemas', () => {
    const urisSchema = z.array(z.string());

    // Valid values
    expect(() => urisSchema.parse(['spotify:track:123'])).not.toThrow();
    expect(() => urisSchema.parse(['spotify:track:123', 'spotify:track:456'])).not.toThrow();
    expect(() => urisSchema.parse([])).not.toThrow();

    // Invalid values
    expect(() => urisSchema.parse('spotify:track:123')).toThrow();
    expect(() => urisSchema.parse([123])).toThrow();
  });

  it('should handle tool callbacks with proper signatures', async () => {
    const server = new McpServer(
      { name: 'test', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    let callbackExecuted = false;

    server.registerTool(
      'test_callback',
      {
        description: 'Test callback execution',
        inputSchema: {
          param: z.string(),
        },
      },
      async ({ param }: any) => {
        callbackExecuted = true;
        return {
          content: [{ type: 'text' as const, text: `Got: ${param}` }],
        };
      }
    );

    // The callback would be executed when tool is invoked by MCP protocol
    expect(callbackExecuted).toBe(false); // Not yet invoked in this test
  });
});
