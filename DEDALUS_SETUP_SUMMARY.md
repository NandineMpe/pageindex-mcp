# Dedalus Deployment Setup Summary

## What Was Created

To enable hosting on Dedalus Labs, the following files and configurations were added:

### New Files

1. **`src/index-http.ts`** - HTTP server entry point for Dedalus
   - Starts an HTTP server instead of stdio
   - Listens on port specified by `PORT` environment variable (default: 3000)

2. **`src/server-http.ts`** - HTTP server implementation
   - Uses SSE (Server-Sent Events) transport for MCP protocol
   - Provides `/sse` endpoint for MCP connections
   - Includes `/health` endpoint for health checks
   - Handles CORS for cross-origin requests

3. **`src/client/oauth-provider-env.ts`** - Environment-based OAuth provider
   - Reads OAuth tokens from environment variables (stateless)
   - Designed for hosted environments where file storage isn't available
   - Supports token refresh via environment variables

4. **`DEDALUS_DEPLOYMENT.md`** - Complete deployment guide
   - Step-by-step instructions
   - Environment variable configuration
   - Troubleshooting tips

### Modified Files

1. **`package.json`**
   - Added `build:dedalus` script
   - Added `start:http` script

2. **`tsup.config.ts`**
   - Added support for `CLIENT_TYPE=dedalus` build
   - Automatically selects `src/index-http.ts` when building for Dedalus

3. **`README.md`**
   - Added section about Dedalus hosting option

## Key Features

### Stateless Design
- OAuth tokens provided via environment variables
- No file system dependencies
- Suitable for containerized/hosted environments

### HTTP Transport
- SSE (Server-Sent Events) endpoint at `/sse`
- Health check endpoint at `/health`
- CORS enabled for cross-origin access

### Environment Variables Required

```bash
PORT=3000                          # Server port
CLIENT_TYPE=dedalus                # Build type
PAGEINDEX_ACCESS_TOKEN=...          # OAuth access token
PAGEINDEX_REFRESH_TOKEN=...        # OAuth refresh token (optional)
PAGEINDEX_API_URL=https://chat.pageindex.ai  # PageIndex API URL
```

## Deployment Steps

1. **Get OAuth Tokens**
   - Run local MCP server once to complete OAuth flow
   - Extract tokens from `~/.pageindex-mcp/oauth-tokens.json`

2. **Build for Dedalus**
   ```bash
   npm run build:dedalus
   ```

3. **Deploy to Dedalus**
   - Connect GitHub repository
   - Set environment variables
   - Deploy

4. **Access Server**
   - SSE endpoint: `https://your-server.dedalus-labs.com/sse`
   - Health check: `https://your-server.dedalus-labs.com/health`

## Testing Locally

To test the HTTP server locally:

```bash
# Set environment variables
export PAGEINDEX_ACCESS_TOKEN=your_token_here
export PAGEINDEX_REFRESH_TOKEN=your_refresh_token_here
export CLIENT_TYPE=dedalus

# Build and run
npm run build:dedalus
npm run start:http
```

The server will start on port 3000 (or PORT env var).

## Limitations

1. **No Interactive OAuth**: Tokens must be provided via environment variables
2. **Manual Token Refresh**: When tokens expire, update them manually in Dedalus dashboard
3. **Stateless Only**: No persistent state between requests

## Next Steps

1. Test the HTTP server locally with environment variables
2. Deploy to Dedalus Labs platform
3. Monitor health check endpoint
4. Update tokens when they expire

For detailed deployment instructions, see [DEDALUS_DEPLOYMENT.md](./DEDALUS_DEPLOYMENT.md).
