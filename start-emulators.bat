@echo off
echo Starting Firebase Emulators...
echo.
echo This will start the following emulators:
echo - Auth: http://localhost:9099
echo - Firestore: http://localhost:8080
echo - Storage: http://localhost:9199
echo - Functions: http://localhost:5001
echo - UI: http://localhost:4000
echo.
echo Press Ctrl+C to stop the emulators
echo.
firebase emulators:start
pause
