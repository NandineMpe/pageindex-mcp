# Deployment Fix: HTTP Build Issue

## Problem
The deployment platform was detecting stdio transport instead of HTTP transport.

## Solution
Updated all deployment configurations to explicitly use `CLIENT_TYPE=production` during build, which ensures the HTTP entry point (`src/index-http.ts`) is used instead of the stdio entry point (`src/index.ts`).

## Changes Made

### 1. Railway (`railway.json`)
- Changed build command to use `npm run build:production`
- Added `nixpacks.toml` for explicit build configuration

### 2. Render (`render.yaml`)
- Changed build command to use `npm run build:production`
- Ensures `CLIENT_TYPE=production` is set

### 3. Vercel (`vercel.json`)
- Updated to use built files (`build/index-http.js`) instead of source files
- Added build command

### 4. Added Files
- `nixpacks.toml` - Railway build configuration
- `Procfile` - Heroku/Render compatibility

## How It Works

When `CLIENT_TYPE=production` is set:
1. `tsup.config.ts` detects the client type
2. Builds `src/index-http.ts` instead of `src/index.ts`
3. Outputs to `build/index-http.js`
4. Server starts with HTTP transport (not stdio)

## Verification

After deployment, verify the HTTP server is running:

```bash
curl https://tryaugentik.com/health
```

Should return:
```json
{"status":"ok","name":"pageindex-mcp","version":"1.6.3"}
```

## If Still Having Issues

1. **Check Environment Variables**: Ensure `CLIENT_TYPE=production` is set in your platform
2. **Check Build Logs**: Look for "Build completed successfully!" and verify `build/index-http.js` exists
3. **Check Start Command**: Should be `node build/index-http.js` (not `node build/index.js`)
4. **Rebuild**: Trigger a new deployment after these changes

## Platform-Specific Notes

### Railway
- Uses `nixpacks.toml` for build configuration
- Build command: `npm run build:production`
- Start command: `node build/index-http.js`

### Render
- Uses `render.yaml` configuration
- Build command: `npm run build:production`
- Start command: `node build/index-http.js`

### Vercel
- Uses `vercel.json` configuration
- Builds serverless functions
- Note: SSE connections may have limitations on Vercel
