Write-Host "Starting Firebase Emulators..." -ForegroundColor Green
Write-Host ""
Write-Host "This will start the following emulators:" -ForegroundColor Yellow
Write-Host "- Auth: http://localhost:9099" -ForegroundColor Cyan
Write-Host "- Firestore: http://localhost:8080" -ForegroundColor Cyan
Write-Host "- Storage: http://localhost:9199" -ForegroundColor Cyan
Write-Host "- Functions: http://localhost:5001" -ForegroundColor Cyan
Write-Host "- UI: http://localhost:4000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the emulators" -ForegroundColor Red
Write-Host ""

try {
    firebase emulators:start
} catch {
    Write-Host "Error starting emulators. Make sure you have Firebase CLI installed and configured." -ForegroundColor Red
    Write-Host "Run: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host "Then run: firebase login" -ForegroundColor Yellow
}

Read-Host "Press Enter to continue"
