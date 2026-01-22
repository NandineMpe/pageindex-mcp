# Script to start OAuth flow and display the URL

Write-Host "`n=== PageIndex MCP OAuth Flow ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting OAuth flow..." -ForegroundColor Yellow
Write-Host "A URL will be displayed - copy it and open in your browser" -ForegroundColor Yellow
Write-Host "After authorization, tokens will be saved automatically`n" -ForegroundColor Yellow

# Run the OAuth trigger script
bun trigger-oauth.ts

# After completion, extract tokens
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Extracting Tokens ===" -ForegroundColor Green
    .\get-tokens.ps1
}
