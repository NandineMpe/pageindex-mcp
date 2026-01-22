# Quick Deploy to Dedalus Labs

## Prerequisites
- GitHub repository: `NandineMpe/pageindex-mcp`
- OAuth tokens (already obtained)

## Step-by-Step Deployment

### 1. Go to Dedalus Labs
Visit: https://www.dedaluslabs.ai/sandbox

### 2. Create New Deployment
- Click "Deploy MCP Server" or "Spin up privately-hosted MCP server"
- Connect your GitHub repository: `NandineMpe/pageindex-mcp`
- Select branch: `master`

### 3. Configure Build Settings
- **Entry Point**: `src/index-http.ts`
- **Build Command**: `npm run build:dedalus` (or leave default - Dedalus will auto-detect)
- **Start Command**: `node build/index-http.js`

### 4. Set Environment Variables
Add these in the Dedalus dashboard:

```
PAGEINDEX_ACCESS_TOKEN=LDKJQv8b3ch9kKKVUilSdUbwOLADnfWlDNyCtgJ_aCk
PAGEINDEX_REFRESH_TOKEN=LaBX-Wyez_9r-HD5AWx1C6Uko6axfK26su6er4u4iNQ
PAGEINDEX_TOKEN_TYPE=Bearer
PAGEINDEX_EXPIRES_IN=2592000
CLIENT_TYPE=dedalus
PORT=3000
PAGEINDEX_API_URL=https://chat.pageindex.ai
```

**Note**: The `DOMAIN` environment variable is optional. Dedalus will provide its own domain automatically. The code is generic and works with any domain.

### 5. Deploy
- Click "Deploy" or "Save"
- Dedalus will build and deploy your server
- Wait for deployment to complete

### 6. Verify Deployment
Once deployed, you'll get a URL like: `https://your-server.dedalus-labs.com`

Test the health endpoint:
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

## Endpoints

- **Health Check**: `https://your-server.dedalus-labs.com/health`
- **SSE Endpoint**: `https://your-server.dedalus-labs.com/sse`
- **MCP POST**: `https://your-server.dedalus-labs.com/mcp`

## Troubleshooting

### Build Fails with "stdio transport" Error
- Ensure `CLIENT_TYPE=dedalus` is set in environment variables
- Verify entry point is `src/index-http.ts`
- Check build logs to confirm `src/index-http.ts` is being built

### Connection Issues
- Verify OAuth tokens are correct
- Check token expiration (update if needed)
- Ensure `PAGEINDEX_API_URL` is set correctly

### Server Won't Start
- Check logs in Dedalus dashboard
- Verify `PORT` environment variable matches Dedalus's expected port
- Ensure all required environment variables are set

## Updating Tokens

If tokens expire:
1. Run `bun trigger-oauth.ts` locally to get new tokens
2. Run `.\get-tokens.ps1` to extract tokens
3. Update `PAGEINDEX_ACCESS_TOKEN` and `PAGEINDEX_REFRESH_TOKEN` in Dedalus dashboard
4. Redeploy or restart the server

## Next Steps

After successful deployment:
1. Test the health endpoint
2. Test the SSE endpoint with an MCP client
3. Use the Dedalus SDK to connect to your server
4. Add your server to the Dedalus marketplace (optional)
