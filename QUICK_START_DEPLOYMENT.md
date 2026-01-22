# Quick Start: Deploy to tryaugentik.com

## Choose Your Platform

### 🚀 Railway (Recommended - Easiest)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `NandineMpe/pageindex-mcp`
4. Add environment variables:
   ```
   PAGEINDEX_ACCESS_TOKEN=LDKJQv8b3ch9kKKVUilSdUbwOLADnfWlDNyCtgJ_aCk
   PAGEINDEX_REFRESH_TOKEN=LaBX-Wyez_9r-HD5AWx1C6Uko6axfK26su6er4u4iNQ
   PAGEINDEX_TOKEN_TYPE=Bearer
   CLIENT_TYPE=production
   DOMAIN=tryaugentik.com
   ```
5. Go to Settings → Networking → Add Custom Domain
6. Add `tryaugentik.com`
7. Railway will give you DNS records - add them to your domain registrar
8. Done! Your server will be live at https://tryaugentik.com

### 🐳 Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect GitHub repo: `NandineMpe/pageindex-mcp`
4. Settings:
   - Build Command: `CLIENT_TYPE=production bun run build`
   - Start Command: `node build/index-http.js`
5. Add environment variables (same as Railway above)
6. Go to Settings → Custom Domains → Add `tryaugentik.com`
7. Follow DNS setup instructions
8. Deploy!

### ☁️ Vercel

**Note**: Vercel has limitations with SSE (long-running connections). Consider Railway or Render instead.

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Add environment variables in Vercel dashboard
4. Add custom domain in Settings → Domains

### 🐋 Docker + VPS

1. Build: `docker build -t pageindex-mcp .`
2. Run: 
   ```bash
   docker run -d -p 3000:3000 \
     -e PAGEINDEX_ACCESS_TOKEN=your_token \
     -e PAGEINDEX_REFRESH_TOKEN=your_refresh_token \
     -e CLIENT_TYPE=production \
     -e DOMAIN=tryaugentik.com \
     pageindex-mcp
   ```
3. Set up Nginx reverse proxy (see DEPLOYMENT.md)
4. Configure DNS A record to your server IP
5. Set up SSL with Let's Encrypt

## Environment Variables Checklist

Make sure you set ALL of these:

- ✅ `PAGEINDEX_ACCESS_TOKEN` (your OAuth token)
- ✅ `PAGEINDEX_REFRESH_TOKEN` (your refresh token)
- ✅ `PAGEINDEX_TOKEN_TYPE=Bearer`
- ✅ `CLIENT_TYPE=production`
- ✅ `DOMAIN=tryaugentik.com`
- ✅ `PORT=3000` (or platform default)
- ✅ `NODE_ENV=production`

## Test Your Deployment

Once deployed, test with:

```bash
# Health check
curl https://tryaugentik.com/health

# Should return:
# {"status":"ok","name":"pageindex-mcp","version":"1.6.3"}
```

## Endpoints

- Health: `https://tryaugentik.com/health`
- SSE (MCP): `https://tryaugentik.com/sse`
- MCP POST: `https://tryaugentik.com/mcp`

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
