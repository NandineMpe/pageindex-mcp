# 🚀 Deploying PageIndex MCP to Vercel

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free account works)
2. **GitHub Repository**: Your code must be pushed to GitHub
3. **Vercel CLI** (optional, but recommended): `npm i -g vercel`

---

## Method 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Go to Vercel Dashboard
1. Open [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Sign in with your **GitHub** account

### Step 2: Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find and select: **`VectifyAI/pageindex-mcp`** (or your repository)
4. Click **"Import"**

### Step 3: Configure Project Settings

**Framework Preset**: Leave as **"Other"** or select **"Other"**

**Build and Output Settings**:
- **Root Directory**: `./` (leave default)
- **Build Command**: `bun install && CLIENT_TYPE=production bun run build:production`
- **Output Directory**: `build` (leave default)
- **Install Command**: `bun install` (or leave empty, Vercel will auto-detect)

**Environment Variables** (Click "Environment Variables" and add these):

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `PAGEINDEX_ACCESS_TOKEN` | `LDKJQv8b3ch9kKKVUilSdUbwOLADnfWlDNyCtgJ_aCk` | Production, Preview, Development |
| `PAGEINDEX_REFRESH_TOKEN` | `LaBX-Wyez_9r-HD5AWx1C6Uko6axfK26su6er4u4iNQ` | Production, Preview, Development |
| `PAGEINDEX_TOKEN_TYPE` | `Bearer` | Production, Preview, Development |
| `CLIENT_TYPE` | `production` | Production, Preview, Development |

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://pageindex-mcp-xxxxx.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Navigate to Your Project
```bash
cd C:\Users\nandi\pageindex-mcp
```

### Step 4: Deploy
```bash
vercel --prod
```

When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N` (first time) or `Y` (if redeploying)
- **Project name?** → `pageindex-mcp` (or press Enter for default)
- **Directory?** → `./` (press Enter)
- **Override settings?** → `N` (or `Y` if you want to change)

### Step 5: Set Environment Variables
```bash
vercel env add PAGEINDEX_ACCESS_TOKEN production
# Paste: LDKJQv8b3ch9kKKVUilSdUbwOLADnfWlDNyCtgJ_aCk

vercel env add PAGEINDEX_REFRESH_TOKEN production
# Paste: LaBX-Wyez_9r-HD5AWx1C6Uko6axfK26su6er4u4iNQ

vercel env add PAGEINDEX_TOKEN_TYPE production
# Paste: Bearer

vercel env add CLIENT_TYPE production
# Paste: production
```

### Step 6: Redeploy with Environment Variables
```bash
vercel --prod
```

---

## ✅ Verify Deployment

After deployment, test these endpoints:

1. **Health Check**: 
   ```
   https://your-project.vercel.app/health
   ```
   Should return: `{"status":"ok","name":"pageindex-mcp","version":"1.6.3"}`

2. **SSE Endpoint** (for MCP connections):
   ```
   https://your-project.vercel.app/sse
   ```

---

## 🔧 Troubleshooting

### Build Fails
- **Error**: "bun: command not found"
  - **Solution**: Vercel might not have Bun installed. Check if you need to add a `vercel.json` with Bun runtime configuration, or switch to using `npm`/`pnpm` for builds.

- **Error**: "Cannot find module"
  - **Solution**: Make sure `buildCommand` includes `bun install` or `npm install`

### Runtime Errors
- **Error**: "Port is not defined"
  - **Solution**: Vercel automatically sets `PORT` environment variable. Make sure your code reads `process.env.PORT`

- **Error**: "Environment variables not found"
  - **Solution**: Double-check that all environment variables are set in Vercel dashboard under Project Settings → Environment Variables

---

## 📝 Important Notes

⚠️ **Vercel Serverless Limitations**:
- Vercel uses serverless functions, which have a **10-second timeout** for free tier (300 seconds for Pro)
- SSE (Server-Sent Events) connections might timeout on the free tier
- For production MCP usage, consider upgrading to Vercel Pro or using a platform like Railway/Render that supports long-running processes

---

## 🔄 Updating Deployment

To update your deployment:
1. Push changes to GitHub
2. Vercel will automatically redeploy (if auto-deploy is enabled)
3. Or manually trigger: Go to Vercel Dashboard → Your Project → Deployments → "Redeploy"

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
