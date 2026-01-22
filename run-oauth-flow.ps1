# Complete OAuth flow script with better error handling

Write-Host "`n=== PageIndex MCP OAuth Flow ===" -ForegroundColor Cyan
Write-Host ""

# Check if port is available
$portCheck = Get-NetTCPConnection -LocalPort 8090 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "Port 8090 is in use. Stopping existing processes..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -like "*bun*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Starting OAuth flow..." -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Keep this window open!" -ForegroundColor Yellow
Write-Host "The server must stay running to receive the OAuth callback.`n" -ForegroundColor Yellow

# Run the OAuth script
Write-Host "When you see the OAuth URL:" -ForegroundColor Cyan
Write-Host "1. Copy the entire URL" -ForegroundColor White
Write-Host "2. Open it in your browser (Chrome, Edge, Firefox, etc.)" -ForegroundColor White
Write-Host "3. Sign in and authorize PageIndex" -ForegroundColor White
Write-Host "4. Wait for the redirect to localhost:8090/callback" -ForegroundColor White
Write-Host "5. You should see 'Authorization Successful' page`n" -ForegroundColor White

Write-Host "Starting server now...`n" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

# Run the trigger script - this will block until OAuth completes
bun trigger-oauth.ts

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

if ($exitCode -eq 0) {
    Write-Host "OAuth flow completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Extracting tokens..." -ForegroundColor Cyan
    .\get-tokens.ps1
} else {
    Write-Host "OAuth flow failed or timed out" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "- Did you open the URL in your browser?" -ForegroundColor White
    Write-Host "- Did you complete the authorization?" -ForegroundColor White
    Write-Host "- Did you wait for the redirect to localhost:8090?" -ForegroundColor White
    Write-Host "- Is your firewall blocking localhost:8090?" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running this script again." -ForegroundColor Yellow
}
