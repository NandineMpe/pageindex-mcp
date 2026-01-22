# Test script to verify OAuth callback server can start

Write-Host "`n=== Testing OAuth Callback Server ===" -ForegroundColor Cyan
Write-Host ""

# Check if port 8090 is available
$portInUse = Get-NetTCPConnection -LocalPort 8090 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠ Port 8090 is already in use!" -ForegroundColor Yellow
    Write-Host "Please close any applications using port 8090 and try again.`n" -ForegroundColor Yellow
} else {
    Write-Host "✓ Port 8090 is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "Expected OAuth Flow:" -ForegroundColor Cyan
Write-Host "1. Script starts a local HTTP server on http://localhost:8090" -ForegroundColor White
Write-Host "2. You open the OAuth URL in your browser" -ForegroundColor White
Write-Host "3. After authorization, browser redirects to http://localhost:8090/callback?code=..." -ForegroundColor White
Write-Host "4. The local server receives the code and completes authentication" -ForegroundColor White
Write-Host "5. You see 'Authorization Successful' page in browser" -ForegroundColor White
Write-Host "6. Tokens are saved automatically`n" -ForegroundColor White

Write-Host "If 'can't be reached' error:" -ForegroundColor Yellow
Write-Host "- Make sure the script is still running (don't close the terminal)" -ForegroundColor White
Write-Host "- The server only runs while the script is active" -ForegroundColor White
Write-Host "- Try running: bun trigger-oauth.ts in a separate terminal window`n" -ForegroundColor White
