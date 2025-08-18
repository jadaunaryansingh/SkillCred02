# Firebase Emulators Setup

This project is configured to use Firebase emulators for local development.

## What are Firebase Emulators?

Firebase emulators allow you to run Firebase services locally on your machine, providing a safe environment for development and testing without affecting production data.

## Available Emulators

- **Auth**: http://localhost:9099 - User authentication
- **Firestore**: http://localhost:8080 - Database
- **Storage**: http://localhost:9199 - File storage
- **Functions**: http://localhost:5001 - Cloud functions
- **UI**: http://localhost:4000 - Emulator dashboard

## Quick Start

### Option 1: Using npm scripts
```bash
npm run emulators
```

### Option 2: Using Firebase CLI directly
```bash
firebase emulators:start
```

### Option 3: Windows batch file
Double-click `start-emulators.bat`

### Option 4: PowerShell
```powershell
.\start-emulators.ps1
```

## Prerequisites

1. **Firebase CLI**: Make sure you have Firebase CLI installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**: Authenticate with Firebase
   ```bash
   firebase login
   ```

3. **Project Setup**: The project is already configured with `.firebaserc` and `firebase.json`

## Configuration Files

- `firebase.json` - Emulator configuration
- `.firebaserc` - Project configuration
- `client/lib/firebase.ts` - Client-side Firebase setup

## Troubleshooting

### Connection Refused Errors
If you see connection refused errors, it means the emulators aren't running. Start them first using one of the methods above.

**Note**: The app now automatically checks if emulators are running before attempting to connect, so you'll see clear messages like "Auth emulator not running on port 9099" instead of connection errors.

### Emulator Already Connected
The app automatically detects if emulators are already running and won't try to connect again.

### Port Conflicts
If you get port conflicts, you can modify the ports in `firebase.json`:
```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "functions": { "port": 5001 },
    "ui": { "port": 4000 }
  }
}
```

### Improved Error Handling
The latest version includes:
- **Availability Checks**: Automatically checks if emulators are running before connecting
- **Graceful Fallbacks**: App continues working even when emulators aren't available
- **Clear Messages**: Console shows exactly which emulators are running or not
- **No More Crashes**: Connection failures won't crash your app

## Development Workflow

1. Start the emulators: `npm run emulators`
2. Start your app: `npm run dev`
3. The app will automatically connect to the emulators
4. Use the emulator UI at http://localhost:4000 to monitor data

## Production

When you build for production (`npm run build`), the app will automatically use the real Firebase services instead of emulators.

## Benefits

- **Safe Development**: No risk of affecting production data
- **Fast Iteration**: No network latency
- **Offline Development**: Work without internet connection
- **Cost Savings**: No Firebase usage charges during development
- **Data Isolation**: Each developer has their own local data