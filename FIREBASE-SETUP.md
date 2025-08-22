# Firebase Setup & Troubleshooting Guide

## Current Status

The Firebase emulators are currently **temporarily disabled** to allow the app to work with real Firebase services while we resolve the emulator setup issues.

## Quick Fix (Immediate)

The app is now configured to work with **real Firebase services** instead of emulators. This means:

✅ **Your app will work immediately**  
✅ **No more connection errors**  
✅ **Uses your production Firebase project**  

## To Re-enable Emulators (When Ready)

1. **Uncomment the emulator code** in `client/lib/firebase.ts`
2. **Set up Firebase authentication** (see steps below)
3. **Start the emulators**

## Complete Firebase Setup

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Authenticate with Firebase
```bash
npx firebase login --no-localhost
```

Follow the authentication flow in your browser.

### Step 3: Initialize Firebase Project
```bash
npx firebase init emulators
```

Select:
- [x] Auth Emulator
- [x] Firestore Emulator  
- [x] Storage Emulator
- [x] Functions Emulator
- [x] Emulator UI

### Step 4: Start Emulators
```bash
npm run emulators
```

## Alternative: Use Real Firebase Services

If you prefer to use real Firebase services (current setup):

1. **Your app is already configured** to use real Firebase
2. **No additional setup needed**
3. **All features will work** with your production Firebase project

## Troubleshooting

### "firebase command not found"
```bash
npm install -g firebase-tools
# or use npx
npx firebase --version
```

### "Failed to authenticate"
```bash
npx firebase login --no-localhost
```

### "Port already in use"
Check what's using the ports:
```bash
# Windows
netstat -an | findstr ":9099"
# or
Get-NetTCPConnection -LocalPort 9099
```

### Emulators won't start
1. Check if you're logged in: `npx firebase login:list`
2. Try starting individual emulators: `npm run emulators:auth`
3. Check the Firebase console for project access

## Current Configuration

- **Firebase Project**: `sentimentskillcred`
- **API Key**: Configured in `firebase.ts`
- **Services**: Auth, Firestore, Storage, Functions, Analytics, Performance, Messaging
- **Emulators**: Temporarily disabled

## Next Steps

1. **Test your app** - it should work with real Firebase now
2. **Decide** if you want emulators or real services
3. **If you want emulators**: Follow the setup steps above
4. **If you want real services**: You're all set!

## Support

- **Firebase Console**: https://console.firebase.google.com/
- **Firebase Docs**: https://firebase.google.com/docs
- **Emulator Suite**: https://firebase.google.com/docs/emulator-suite
