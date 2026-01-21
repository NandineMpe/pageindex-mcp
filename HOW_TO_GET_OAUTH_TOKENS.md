# How to Get OAuth Access Token and Refresh Token

To deploy the PageIndex MCP server on Dedalus, you need to obtain OAuth tokens by running the local MCP server once to complete the OAuth flow.

## Step-by-Step Instructions

### 1. Run the Local MCP Server

First, run the MCP server locally. This will trigger the OAuth authentication flow:

**Option A: Using npx (Recommended)**
```bash
npx -y @pageindex/mcp
```

**Option B: If you have the repo cloned**
```bash
npm install
npm run build
npm start
```

### 2. Complete OAuth Flow

When you run the server for the first time:

1. **A browser window will automatically open** (or you'll see a URL in the terminal)
2. **Sign in to PageIndex** using your credentials
3. **Authorize the application** 
4. **The browser will redirect** to `http://localhost:8090/callback`
5. **You'll see a success message** - "Authorization Successful"
6. **The tokens are now saved** to your local file system

### 3. Locate the Token File

The OAuth tokens are stored in a JSON file:

**On Windows:**
```
C:\Users\<YourUsername>\.pageindex-mcp\oauth-tokens.json
```

**On macOS/Linux:**
```
~/.pageindex-mcp/oauth-tokens.json
```

Or programmatically:
```bash
# Windows PowerShell
$env:USERPROFILE\.pageindex-mcp\oauth-tokens.json

# macOS/Linux
~/.pageindex-mcp/oauth-tokens.json
```

### 4. Extract the Tokens

Open the `oauth-tokens.json` file. It will look something like this:

```json
{
  "tokens": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "def50200a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "clientInfo": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    ...
  },
  "codeVerifier": "..."
}
```

### 5. Copy the Tokens for Dedalus

Extract these values from the JSON file:

- **`PAGEINDEX_ACCESS_TOKEN`**: Copy the value of `tokens.access_token`
- **`PAGEINDEX_REFRESH_TOKEN`**: Copy the value of `tokens.refresh_token`
- **`PAGEINDEX_TOKEN_TYPE`**: Copy the value of `tokens.token_type` (usually "Bearer")
- **`PAGEINDEX_EXPIRES_IN`**: Copy the value of `tokens.expires_in` (optional)

### 6. Set Environment Variables in Dedalus

In the Dedalus Labs dashboard, set these environment variables:

```bash
PAGEINDEX_ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
PAGEINDEX_REFRESH_TOKEN=def50200a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
PAGEINDEX_TOKEN_TYPE=Bearer
PAGEINDEX_EXPIRES_IN=3600
```

## Quick Script to Extract Tokens

You can use this script to quickly extract tokens:

**Windows PowerShell:**
```powershell
$tokenFile = "$env:USERPROFILE\.pageindex-mcp\oauth-tokens.json"
if (Test-Path $tokenFile) {
    $tokens = Get-Content $tokenFile | ConvertFrom-Json
    Write-Host "Access Token:"
    Write-Host $tokens.tokens.access_token
    Write-Host "`nRefresh Token:"
    Write-Host $tokens.tokens.refresh_token
} else {
    Write-Host "Token file not found. Run the MCP server first."
}
```

**macOS/Linux:**
```bash
#!/bin/bash
TOKEN_FILE="$HOME/.pageindex-mcp/oauth-tokens.json"
if [ -f "$TOKEN_FILE" ]; then
    echo "Access Token:"
    cat "$TOKEN_FILE" | jq -r '.tokens.access_token'
    echo ""
    echo "Refresh Token:"
    cat "$TOKEN_FILE" | jq -r '.tokens.refresh_token'
else
    echo "Token file not found. Run the MCP server first."
fi
```

## Important Notes

1. **Token Expiration**: Access tokens expire (typically after 1 hour). When they expire, you'll need to:
   - Either use the refresh token to get a new access token
   - Or run the OAuth flow again to get new tokens

2. **Security**: 
   - Keep these tokens **secret** - never commit them to version control
   - The token file has restricted permissions (600) on Unix systems
   - Only share tokens with trusted services (like Dedalus)

3. **Refresh Tokens**: 
   - Refresh tokens are longer-lived and can be used to get new access tokens
   - If you have a refresh token, you may not need to re-authenticate frequently

4. **If Tokens Expire**: 
   - Update the `PAGEINDEX_ACCESS_TOKEN` environment variable in Dedalus
   - If refresh token is available, the SDK should handle refresh automatically
   - Otherwise, repeat steps 1-5 to get new tokens

## Troubleshooting

**Problem**: Browser doesn't open automatically
- **Solution**: Check the terminal output for the authorization URL and open it manually

**Problem**: Can't find the token file
- **Solution**: Make sure you completed the OAuth flow successfully. The file is created after successful authentication.

**Problem**: Tokens expired
- **Solution**: Run the OAuth flow again to get fresh tokens, or use the refresh token if available.

**Problem**: Permission denied when reading token file
- **Solution**: On Unix systems, ensure you have read permissions. The file should be readable by your user only.

## Alternative: Direct API Access

If you have direct access to PageIndex API credentials, you might be able to obtain tokens via their API directly. Check the [PageIndex documentation](https://pageindex.ai/mcp) for API authentication methods.
