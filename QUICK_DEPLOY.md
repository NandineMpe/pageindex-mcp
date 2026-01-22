# Quick Deploy to tryaugentik.com

## Your OAuth Tokens (Already Obtained)

```
PAGEINDEX_ACCESS_TOKEN=LDKJQv8b3ch9kKKVUilSdUbwOLADnfWlDNyCtgJ_aCk
PAGEINDEX_REFRESH_TOKEN=LaBX-Wyez_9r-HD5AWx1C6Uko6axfK26su6er4u4iNQ
PAGEINDEX_TOKEN_TYPE=Bearer
PAGEINDEX_EXPIRES_IN=2592000
```

## Choose Your Deployment Method

### Option 1: Railway (Easiest - Recommended)

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository: `NandineMpe/pageindex-mcp`
4. Set environment variables:
   ```
   PAGEINDEX_ACCESS_TOKEN=LDKJQv8b3ch9kKKVUilSdUbwOLADnfWlDNyCtgJ_aCk
   PAGEINDEX_REFRESH_TOKEN=LaBX-Wyez_9r-HD5AWx1C6Uko6axfK26su6er4u4iNQ
   PAGEINDEX_TOKEN_TYPE=Bearer
   PAGEINDEX_EXPIRES_IN=2592000
   CLIENT_TYPE=dedalus
   PORT=3000
   PAGEINDEX_API_URL=https://chat.pageindex.ai
   ```
5. Set start command: `bun run build:dedalus && bun run start:http:bun`
6. Add custom domain: `tryaugentik.com`
7. Deploy!

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Set environment variables in Vercel dashboard
4. Add custom domain: `tryaugentik.com`

### Option 3: Docker + Your Server

1. Build image:
   ```bash
   docker build -t pageindex-mcp .
   ```

2. Run container:
   ```bash
   docker run -d -p 3000:3000 \
     -e PAGEINDEX_ACCESS_TOKEN=LDKJQv8b3ch9kKKVUilSdUbwOLADnfWlDNyCtgJ_aCk \
     -e PAGEINDEX_REFRESH_TOKEN=LaBX-Wyez_9r-HD5AWx1C6Uko6axfK26su6er4u4iNQ \
     -e PAGEINDEX_TOKEN_TYPE=Bearer \
     -e CLIENT_TYPE=dedalus \
     --name pageindex-mcp \
     pageindex-mcp
   ```

3. Point your domain to the server IP
4. Set up Nginx reverse proxy (see DEPLOYMENT.md)

### Option 4: VPS with PM2

1. SSH into your server
2. Clone repo: `git clone https://github.com/NandineMpe/pageindex-mcp.git`
3. Install Bun: `curl -fsSL https://bun.sh/install | bash`
4. Install dependencies: `cd pageindex-mcp && bun install`
5. Build: `CLIENT_TYPE=dedalus bun run build`
6. Edit `ecosystem.config.js` with your tokens
7. Start: `pm2 start ecosystem.config.js`
8. Setup Nginx (see DEPLOYMENT.md)

## After Deployment

### Test Health Endpoint
```bash
curl https://tryaugentik.com/health
```

Expected:
```json
{
  "status": "ok",
  "name": "pageindex-mcp",
  "version": "1.6.3"
}
```

### MCP Endpoint
Your MCP server will be available at:
```
https://tryaugentik.com/sse
```

## Which Platform Are You Using?

Tell me which hosting platform you're using for tryaugentik.com and I can provide specific step-by-step instructions!
