# Deploying PageIndex MCP to tryaugentik.com

This guide covers deploying the PageIndex MCP server to your custom domain (tryaugentik.com).

## Prerequisites

1. OAuth tokens from PageIndex (see [HOW_TO_GET_OAUTH_TOKENS.md](./HOW_TO_GET_OAUTH_TOKENS.md))
2. A hosting platform account (Vercel, Railway, Render, Fly.io, or VPS)
3. Domain DNS access for tryaugentik.com

## Environment Variables

Set these in your hosting platform:

```bash
# OAuth Tokens (REQUIRED)
PAGEINDEX_ACCESS_TOKEN=your_access_token_here
PAGEINDEX_REFRESH_TOKEN=your_refresh_token_here
PAGEINDEX_TOKEN_TYPE=Bearer
PAGEINDEX_EXPIRES_IN=2592000

# Server Configuration
CLIENT_TYPE=production
PORT=3000
NODE_ENV=production
DOMAIN=tryaugentik.com  # Your custom domain

# Optional
PAGEINDEX_API_URL=https://chat.pageindex.ai
HOST=0.0.0.0  # Listen on all interfaces
```

## Deployment Options

### Option 1: Vercel (Recommended for Serverless)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables listed above

4. **Configure Custom Domain**:
   - Go to Settings → Domains
   - Add `tryaugentik.com` and `www.tryaugentik.com`
   - Follow DNS configuration instructions

5. **Update vercel.json** (if needed):
   - The included `vercel.json` should work, but you may need to adjust routes

**Note**: Vercel uses serverless functions. For long-running SSE connections, consider Railway or Render instead.

### Option 2: Railway (Recommended for SSE/WebSockets)

1. **Connect GitHub**:
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure**:
   - Railway will auto-detect the `railway.json` configuration
   - Set environment variables in Railway dashboard

3. **Custom Domain**:
   - Go to Settings → Networking
   - Add custom domain: `tryaugentik.com`
   - Railway will provide DNS records to add

4. **Deploy**:
   - Railway automatically deploys on git push
   - Or click "Deploy" in dashboard

### Option 3: Render

1. **Create Web Service**:
   - Go to [Render](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure**:
   - **Build Command**: `CLIENT_TYPE=production bun run build`
   - **Start Command**: `node build/index-http.js`
   - **Environment**: Node
   - Set all environment variables

3. **Custom Domain**:
   - Go to Settings → Custom Domains
   - Add `tryaugentik.com`
   - Follow DNS setup instructions

### Option 4: Docker + VPS (Full Control)

1. **Build Docker Image**:
   ```bash
   docker build -t pageindex-mcp .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name pageindex-mcp \
     -p 3000:3000 \
     -e PAGEINDEX_ACCESS_TOKEN=your_token \
     -e PAGEINDEX_REFRESH_TOKEN=your_refresh_token \
     -e CLIENT_TYPE=production \
     -e DOMAIN=tryaugentik.com \
     pageindex-mcp
   ```

3. **Set up Nginx Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name tryaugentik.com www.tryaugentik.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

4. **Set up SSL with Let's Encrypt**:
   ```bash
   sudo certbot --nginx -d tryaugentik.com -d www.tryaugentik.com
   ```

### Option 5: Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create Fly App**:
   ```bash
   fly launch
   ```

3. **Set Secrets**:
   ```bash
   fly secrets set PAGEINDEX_ACCESS_TOKEN=your_token
   fly secrets set PAGEINDEX_REFRESH_TOKEN=your_refresh_token
   fly secrets set CLIENT_TYPE=production
   ```

4. **Add Custom Domain**:
   ```bash
   fly domains add tryaugentik.com
   ```

## DNS Configuration

For your domain (tryaugentik.com), add these DNS records:

### For Railway/Render/Fly.io:
- **Type**: CNAME
- **Name**: @ (or tryaugentik.com)
- **Value**: [provided by hosting platform]

### For VPS with Static IP:
- **Type**: A
- **Name**: @ (or tryaugentik.com)
- **Value**: [your server IP address]

### For www subdomain:
- **Type**: CNAME
- **Name**: www
- **Value**: tryaugentik.com (or platform-provided URL)

## Endpoints

Once deployed, your MCP server will be available at:

- **Health Check**: `https://tryaugentik.com/health`
- **SSE Endpoint**: `https://tryaugentik.com/sse`
- **MCP POST**: `https://tryaugentik.com/mcp`

## Testing Deployment

1. **Check Health**:
   ```bash
   curl https://tryaugentik.com/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "name": "pageindex-mcp",
     "version": "1.6.3"
   }
   ```

2. **Test SSE Connection**:
   ```bash
   curl -N https://tryaugentik.com/sse
   ```

## Troubleshooting

### Server Won't Start
- Check environment variables are set correctly
- Verify OAuth tokens are valid
- Check logs in hosting platform dashboard

### Domain Not Working
- Verify DNS records are correct (may take up to 48 hours to propagate)
- Check SSL certificate is installed
- Ensure reverse proxy (if using) is configured correctly

### SSE Connection Issues
- Some platforms (like Vercel) have limitations with long-running connections
- Consider Railway, Render, or VPS for SSE support
- Check firewall rules allow port 3000

### OAuth Token Expired
- Update `PAGEINDEX_ACCESS_TOKEN` in environment variables
- If refresh token is available, the server should auto-refresh
- Otherwise, get new tokens using `trigger-oauth.ts`

## Continuous Deployment

All platforms support automatic deployment from GitHub:

1. Push code to your repository
2. Platform automatically builds and deploys
3. Your changes go live on tryaugentik.com

## Monitoring

Set up monitoring for:
- Server uptime (health check endpoint)
- Error logs (platform dashboard)
- OAuth token expiration (set reminders)

## Security Notes

- Never commit OAuth tokens to git
- Use environment variables for all secrets
- Enable HTTPS/SSL for your domain
- Consider rate limiting for production use
- Monitor for unauthorized access

## Support

For issues specific to:
- **PageIndex MCP**: [GitHub Issues](https://github.com/VectifyAI/pageindex-mcp/issues)
- **Hosting Platform**: Check platform documentation
- **Domain/DNS**: Contact your domain registrar
