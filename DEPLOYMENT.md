# Deployment Guide for tryaugentik.com

This guide explains how to deploy the PageIndex MCP server to your own domain (tryaugentik.com).

## Overview

The HTTP server implementation (`src/server-http.ts`) can be deployed to any Node.js hosting platform. The server exposes:
- **SSE Endpoint**: `/sse` - Main MCP protocol endpoint
- **Health Check**: `/health` - Health monitoring endpoint

## Deployment Options

### Option 1: Node.js Hosting (Recommended)

Deploy to platforms like:
- **Vercel** (Serverless Functions)
- **Railway**
- **Render**
- **Fly.io**
- **DigitalOcean App Platform**
- **AWS Lambda** (with adapter)
- **Google Cloud Run**

### Option 2: Docker Container

Build and deploy as a Docker container to:
- **Docker Hub** + Any container hosting
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Instances**
- **DigitalOcean App Platform**

### Option 3: Traditional VPS

Deploy to a VPS with:
- **PM2** (process manager)
- **Nginx** (reverse proxy)
- **SSL certificate** (Let's Encrypt)

## Environment Variables

Set these in your hosting platform:

```bash
# OAuth Tokens (Required)
PAGEINDEX_ACCESS_TOKEN=your_access_token_here
PAGEINDEX_REFRESH_TOKEN=your_refresh_token_here
PAGEINDEX_TOKEN_TYPE=Bearer
PAGEINDEX_EXPIRES_IN=2592000

# Server Configuration
PORT=3000
NODE_ENV=production

# PageIndex API
PAGEINDEX_API_URL=https://chat.pageindex.ai

# Client Configuration
CLIENT_TYPE=dedalus
```

## Quick Start: Vercel Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Create `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index-http.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/sse",
      "dest": "src/index-http.ts"
    },
    {
      "src": "/health",
      "dest": "src/index-http.ts"
    }
  ],
  "env": {
    "CLIENT_TYPE": "dedalus"
  }
}
```

### 3. Deploy
```bash
vercel --prod
```

## Quick Start: Railway Deployment

### 1. Connect GitHub Repository
- Go to Railway.app
- Click "New Project"
- Select "Deploy from GitHub"
- Choose your repository

### 2. Configure
- **Start Command**: `bun run build:dedalus && bun run start:http`
- **Port**: `3000` (or set via `PORT` env var)

### 3. Set Environment Variables
Add all required environment variables in Railway dashboard.

## Quick Start: Docker Deployment

### 1. Create `Dockerfile`
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build
ENV CLIENT_TYPE=dedalus
RUN bun run build:dedalus

# Production
FROM oven/bun:1
WORKDIR /app
COPY --from=base /app/build ./build
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["bun", "run", "start:http"]
```

### 2. Build and Deploy
```bash
docker build -t pageindex-mcp .
docker run -p 3000:3000 \
  -e PAGEINDEX_ACCESS_TOKEN=your_token \
  -e PAGEINDEX_REFRESH_TOKEN=your_refresh_token \
  pageindex-mcp
```

## Quick Start: VPS with PM2

### 1. Install Dependencies
```bash
# Install Node.js/Bun
curl -fsSL https://bun.sh/install | bash

# Install PM2
npm install -g pm2
```

### 2. Clone and Build
```bash
git clone https://github.com/NandineMpe/pageindex-mcp.git
cd pageindex-mcp
bun install
CLIENT_TYPE=dedalus bun run build
```

### 3. Create PM2 Ecosystem File (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'pageindex-mcp',
    script: 'build/index-http.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      CLIENT_TYPE: 'dedalus',
      PAGEINDEX_ACCESS_TOKEN: 'your_token',
      PAGEINDEX_REFRESH_TOKEN: 'your_refresh_token',
      PAGEINDEX_TOKEN_TYPE: 'Bearer',
      PAGEINDEX_EXPIRES_IN: '2592000',
      PAGEINDEX_API_URL: 'https://chat.pageindex.ai'
    }
  }]
};
```

### 4. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # For auto-start on reboot
```

### 5. Setup Nginx Reverse Proxy

Create `/etc/nginx/sites-available/pageindex-mcp`:
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/pageindex-mcp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tryaugentik.com -d www.tryaugentik.com
```

## Testing Your Deployment

### Health Check
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

### SSE Endpoint
The MCP server is accessible at:
```
https://tryaugentik.com/sse
```

## Monitoring

### PM2 Monitoring
```bash
pm2 status
pm2 logs pageindex-mcp
pm2 monit
```

### Health Check Monitoring
Set up monitoring to check `/health` endpoint regularly.

## Troubleshooting

### Server Not Starting
- Check environment variables are set correctly
- Verify OAuth tokens are valid
- Check logs: `pm2 logs` or hosting platform logs

### Connection Refused
- Verify server is running on correct port
- Check firewall rules
- Ensure reverse proxy is configured correctly

### OAuth Errors
- Verify tokens haven't expired
- Check `PAGEINDEX_API_URL` is correct
- Ensure tokens are set as environment variables (not hardcoded)

## Security Considerations

1. **Never commit OAuth tokens** - Use environment variables only
2. **Use HTTPS** - Always deploy with SSL/TLS
3. **Set up rate limiting** - Consider adding rate limiting for production
4. **Monitor logs** - Set up log monitoring and alerts
5. **Keep dependencies updated** - Regularly update packages

## Next Steps

1. Choose your deployment platform
2. Set up environment variables
3. Deploy the server
4. Configure DNS to point to your server
5. Set up SSL certificate
6. Test the `/health` endpoint
7. Connect your MCP clients to `https://tryaugentik.com/sse`
