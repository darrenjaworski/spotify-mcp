#!/usr/bin/env node

/**
 * CLI entry point for Spotify MCP Server
 * Handles both setup wizard and normal server mode
 */

const args = process.argv.slice(2);

// Check if user wants to run setup
if (args.includes('setup') || args.includes('--setup') || args.includes('init')) {
  // Run setup wizard
  import('./setup.js').then(({ runSetup }) => {
    runSetup().catch((err) => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
  });
} else {
  // Run normal MCP server
  import('./index.js');
}
