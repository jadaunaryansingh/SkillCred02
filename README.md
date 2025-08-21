# Swoosh Sanctuary

A React-based application with Firebase integration for sentiment analysis and skill assessment.

## 🚀 Quick Start

### Development Server
```bash
npm run dev
```
The app will be available at: **http://localhost:5173**

### Build for Production
```bash
npm run build
npm start
```

## 🔧 Current Configuration

### Firebase Services
- **Status**: ✅ **Working with real Firebase services**
- **Project**: `sentimentskillcred`
- **Services**: Auth, Firestore, Storage, Functions, Analytics, Performance, Messaging

### Emulators
- **Status**: ⏸️ **Temporarily disabled** (to resolve setup issues)
- **Ports**: 8080 (Firestore), 9099 (Auth), 9199 (Storage), 5001 (Functions), 4000 (UI)

## 📁 Project Structure

```
swoosh-sanctuary/
├── client/                 # React frontend
│   ├── components/        # UI components
│   ├── pages/            # Page components
│   ├── lib/              # Firebase and utilities
│   └── hooks/            # Custom React hooks
├── server/                # Express backend
├── shared/                # Shared utilities
└── netlify/               # Netlify functions
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run emulators` - Start Firebase emulators (when configured)
- `npm run test-emulators` - Test emulator connectivity
- `npm run setup-firebase` - Setup Firebase authentication

## 🔥 Firebase Setup

### Option 1: Use Real Services (Current)
✅ **Already configured and working**
- No additional setup needed
- Uses your production Firebase project
- All features functional

### Option 2: Use Emulators (Future)
1. Follow the guide in `FIREBASE-SETUP.md`
2. Set up Firebase authentication
3. Start emulators for local development

## 🤖 **API Integration**

### **Sentiment Analysis**
- **Current**: Local keyword-based analysis (fallback)
- **API Option**: Hugging Face ML models (free tier available)
- **Setup**: See `API-SETUP.md` for configuration

### **AI Features**
- **Summaries**: Gemini AI integration
- **Translations**: Multi-language support
- **File Processing**: PDF, text, and URL analysis

### **To Enable API Features**
1. Get API keys (see `API-SETUP.md`)
2. Create `.env` file with your keys
3. Restart the server
4. Enjoy accurate, API-based results!

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Firebase Console**: https://console.firebase.google.com/
- **Emulator UI** (when running): http://localhost:4000

## 📚 Documentation

- `FIREBASE-SETUP.md` - Complete Firebase setup guide
- `FIREBASE-EMULATORS.md` - Emulator configuration details
- `AGENTS.md` - Project architecture overview

## 🚨 Troubleshooting

### App won't start
- Check if port 5173 is available
- Ensure all dependencies are installed: `npm install`

### Firebase errors
- Check `FIREBASE-SETUP.md` for configuration issues
- Verify API keys in `client/lib/firebase.ts`

### Port conflicts
- Vite dev server: Port 5173
- Firestore emulator: Port 8080
- Auth emulator: Port 9099

## 🎯 Next Steps

1. **Test the app** - Navigate to http://localhost:5173
2. **Verify Firebase integration** - Check browser console for Firebase messages
3. **Choose development approach** - Real services vs. emulators
4. **Customize as needed** - Modify components and functionality

## 📞 Support

For Firebase setup issues, see `FIREBASE-SETUP.md`
For general development, check the console logs and documentation
# SkillcredProject01
# SkillcredProject02
# SkillcredProject02
"# SkillcredProject02" 
