# Deploying PageIndex MCP on Dedalus Labs

This guide explains how to deploy the PageIndex MCP server on the Dedalus Labs platform.

## Overview

Dedalus Labs provides a hosting platform for MCP servers with automatic scaling, health checks, and HTTP endpoints. This deployment uses the HTTP transport version of the PageIndex MCP server.

## Prerequisites

1. A GitHub repository containing this codebase
2. A Dedalus Labs account
3. OAuth tokens from PageIndex (see Authentication section below)

## Authentication Setup

Since Dedalus doesn't support interactive OAuth flows, you need to provide OAuth tokens via environment variables:

1. **Get OAuth tokens**: Run the local MCP server once to complete the OAuth flow and obtain tokens
   - See [HOW_TO_GET_OAUTH_TOKENS.md](./HOW_TO_GET_OAUTH_TOKENS.md) for detailed instructions
2. **Extract tokens**: The tokens are stored in:
   - **Windows**: `C:\Users\<YourUsername>\.pageindex-mcp\oauth-tokens.json`
   - **macOS/Linux**: `~/.pageindex-mcp/oauth-tokens.json`
3. **Set environment variables** in Dedalus dashboard:
   - `PAGEINDEX_ACCESS_TOKEN`: Your OAuth access token
   - `PAGEINDEX_REFRESH_TOKEN`: Your OAuth refresh token (optional but recommended)
   - `PAGEINDEX_TOKEN_TYPE`: Token type (default: "Bearer")
   - `PAGEINDEX_EXPIRES_IN`: Token expiration in seconds (optional)
   - `PAGEINDEX_CLIENT_ID`: OAuth client ID (optional)
   - `PAGEINDEX_CLIENT_SECRET`: OAuth client secret (optional)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository has:
- `src/index-http.ts` - HTTP server entry point
- `src/server-http.ts` - HTTP server implementation
- `src/client/oauth-provider-env.ts` - Environment-based OAuth provider
- `package.json` - Dependencies and build scripts
- `tsup.config.ts` - Build configuration

### 2. Build Configuration

The server entry point is automatically selected based on the `CLIENT_TYPE` environment variable. For Dedalus, set:

```bash
CLIENT_TYPE=dedalus
```

Or modify `tsup.config.ts` to use `src/index-http.ts` as the entry point.

### 3. Deploy on Dedalus

1. Log in to [Dedalus Labs](https://www.dedaluslabs.ai/sandbox)
2. Navigate to "Deploy MCP Server" or "Spin up privately-hosted MCP server"
3. Connect your GitHub repository
4. Configure the following:
   - **Entry Point**: `src/index-http.ts` (or ensure `CLIENT_TYPE=dedalus` is set)
   - **Port**: `3000` (or set via `PORT` environment variable)
   - **Environment Variables**: Add all OAuth-related variables listed above

### 4. Environment Variables

Set these in the Dedalus dashboard:

```bash
PORT=3000
CLIENT_TYPE=dedalus
PAGEINDEX_ACCESS_TOKEN=your_access_token_here
PAGEINDEX_REFRESH_TOKEN=your_refresh_token_here
PAGEINDEX_API_URL=https://chat.pageindex.ai
```

### 5. Health Check

The server exposes a health check endpoint at `/health`:

```bash
curl https://your-server.dedalus-labs.com/health
```

Expected response:
```json
{
  "status": "ok",
  "name": "pageindex-mcp",
  "version": "1.6.3"
}
```

### 6. MCP Endpoint

The MCP server is accessible via SSE (Server-Sent Events) at:

```
https://your-server.dedalus-labs.com/sse
```

## Server Structure

The HTTP server implementation:
- Uses SSE (Server-Sent Events) transport for MCP protocol
- Supports CORS for cross-origin requests
- Provides health check endpoint
- Reads OAuth tokens from environment variables (stateless)

## Limitations

1. **No Interactive OAuth**: The server cannot perform interactive OAuth flows. Tokens must be provided via environment variables.
2. **Token Refresh**: If tokens expire, you'll need to update them manually in the Dedalus dashboard.
3. **Stateless**: The server doesn't persist state between requests (as required by Dedalus).

## Troubleshooting

### Connection Issues

If the server fails to connect to PageIndex:
1. Verify OAuth tokens are set correctly
2. Check token expiration
3. Ensure `PAGEINDEX_API_URL` is correct

### Build Issues

If the build fails:
1. Ensure `CLIENT_TYPE=dedalus` is set
2. Verify all dependencies are in `package.json`
3. Check that `src/index-http.ts` exists

### Runtime Issues

If the server crashes:
1. Check logs in Dedalus dashboard
2. Verify environment variables are set
3. Ensure Node.js version >= 20.8.1

## Updating Tokens

When OAuth tokens expire:

1. Run the local MCP server to complete OAuth flow
2. Extract new tokens from `~/.pageindex-mcp/oauth-tokens.json`
3. Update environment variables in Dedalus dashboard
4. Redeploy or restart the server

## Support

For issues specific to:
- **Dedalus Platform**: Contact Dedalus Labs support
- **PageIndex MCP**: Open an issue at [GitHub](https://github.com/VectifyAI/pageindex-mcp)
- **OAuth/Authentication**: See [PageIndex MCP Documentation](https://pageindex.ai/mcp)
