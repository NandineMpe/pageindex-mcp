#!/usr/bin/env bun

/**
 * Script to trigger OAuth flow and get tokens
 * This connects to PageIndex MCP server to trigger authentication
 */

// Set build-time constants
globalThis.__CLIENT_NAME__ = 'PageIndex MCP (OAuth Token Getter)';
globalThis.__CLIENT_TYPE__ = 'oauth-script';
globalThis.__VERSION__ = '1.6.3';

import { PageIndexMcpClient } from './src/client/mcp-client.js';

async function main() {
  console.log('\n========================================');
  console.log('PageIndex MCP OAuth Flow');
  console.log('========================================\n');
  console.log('IMPORTANT: Keep this window open!');
  console.log('The server must stay running to receive the OAuth callback.\n');
  console.log('Steps:');
  console.log('1. A URL will be displayed below');
  console.log('2. Copy that URL and open it in your browser');
  console.log('3. Sign in and authorize PageIndex');
  console.log('4. Your browser will redirect to localhost:8090');
  console.log('5. Wait for "Authorization Successful" message\n');
  console.log('Starting OAuth flow...\n');

  try {
    const client = await PageIndexMcpClient.createWithStoredClientInfo();
    await client.connect();
    
    console.log('\n========================================');
    console.log('✓ Successfully connected! Tokens have been saved.');
    console.log('========================================\n');
    console.log('Run .\\get-tokens.ps1 to extract tokens for Dedalus.\n');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      console.error('\n========================================');
      console.error('✗ OAuth callback timed out');
      console.error('========================================\n');
      console.error('Possible reasons:');
      console.error('1. The OAuth URL was not opened in browser');
      console.error('2. Authorization was not completed');
      console.error('3. Browser could not reach localhost:8090');
      console.error('4. Firewall is blocking port 8090\n');
      console.error('Please try again. Make sure to:');
      console.error('- Keep this window open while authorizing');
      console.error('- Open the URL in your browser');
      console.error('- Complete the authorization within 5 minutes\n');
    } else {
      console.error(`\nError: ${error}\n`);
    }
    process.exit(1);
  }
}

main();
