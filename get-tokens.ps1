# Script to get OAuth tokens for Dedalus deployment

$tokenFile = "$env:USERPROFILE\.pageindex-mcp\oauth-tokens.json"

Write-Host "`n=== PageIndex MCP OAuth Token Extractor ===" -ForegroundColor Cyan
Write-Host ""

# Check if tokens already exist
if (Test-Path $tokenFile) {
    Write-Host "Token file found!" -ForegroundColor Green
    Write-Host ""
    
    $tokens = Get-Content $tokenFile | ConvertFrom-Json
    
    if ($tokens.tokens) {
        Write-Host "=== Copy these to Dedalus Dashboard ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "PAGEINDEX_ACCESS_TOKEN=$($tokens.tokens.access_token)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "PAGEINDEX_REFRESH_TOKEN=$($tokens.tokens.refresh_token)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "PAGEINDEX_TOKEN_TYPE=$($tokens.tokens.token_type)" -ForegroundColor Yellow
        Write-Host ""
        if ($tokens.tokens.expires_in) {
            Write-Host "PAGEINDEX_EXPIRES_IN=$($tokens.tokens.expires_in)" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "=== End of tokens ===" -ForegroundColor Green
    } else {
        Write-Host "Token file exists but doesn't contain tokens. Run the MCP server first." -ForegroundColor Red
    }
} else {
    Write-Host "Token file not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "To get tokens:" -ForegroundColor Yellow
    Write-Host "1. Run: bun run start" -ForegroundColor White
    Write-Host "2. Complete the OAuth flow in your browser" -ForegroundColor White
    Write-Host "3. Run this script again to extract tokens" -ForegroundColor White
    Write-Host ""
}
