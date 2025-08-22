# 🚀 Development Setup Guide

## 🔧 **Current Issue: WebSocket Connection Failing**

The Vite dev server is running but WebSocket connections for HMR (Hot Module Replacement) are failing. This affects:
- Live code reloading
- Real-time development experience
- Browser console showing connection errors

## 🎯 **Solution: Separated Development Environment**

### **Option 1: Simple Development (Recommended for now)**

1. **Start Vite Dev Server Only:**
   ```bash
   npm run dev
   ```
   - Frontend runs on: http://localhost:5173
   - Basic development without API endpoints
   - WebSocket issues may persist

2. **Use Browser Console for Development:**
   - Check Firebase integration
   - Test UI components
   - Verify authentication flow

### **Option 2: Full Development with API Server**

1. **Start API Server:**
   ```bash
   npm run dev:api
   ```
   - API runs on: http://localhost:3000
   - All sentiment analysis endpoints available
   - File processing and API integration working

2. **Start Frontend (in new terminal):**
   ```bash
   npm run dev
   ```
   - Frontend runs on: http://localhost:5173
   - API calls will work but need manual configuration

3. **Configure API Base URL:**
   - Update API calls to use `http://localhost:3000/api/...`
   - Or use environment variables for dynamic configuration

## 🚨 **WebSocket Troubleshooting**

### **Why WebSocket Fails:**
- **Express Integration**: The Express server middleware interferes with Vite's WebSocket handling
- **Port Conflicts**: Multiple services trying to use the same port
- **Network Configuration**: IPv4 vs IPv6 binding issues

### **Current Status:**
- ✅ **HTTP Server**: Working on port 5173
- ❌ **WebSocket**: Failing (HMR disabled)
- ⚠️ **API Server**: Not integrated with frontend

## 🔄 **Workarounds for Development**

### **1. Manual Page Refresh**
- Make code changes
- Refresh browser manually
- Slower but functional development

### **2. Browser DevTools**
- Use React DevTools for component debugging
- Check Firebase console logs
- Monitor network requests

### **3. API Testing**
- Use `npm run test-api` for backend testing
- Test sentiment analysis endpoints directly
- Verify file processing functionality

## 🛠️ **Immediate Actions**

### **For Frontend Development:**
1. **Start dev server**: `npm run dev`
2. **Open browser**: http://localhost:5173
3. **Accept WebSocket limitations** for now
4. **Use manual refresh** for code changes

### **For API Testing:**
1. **Start API server**: `npm run dev:api`
2. **Test endpoints**: Use Postman or curl
3. **Verify functionality**: Check sentiment analysis

### **For Full Integration:**
1. **Wait for WebSocket fix** (in progress)
2. **Use separate terminals** for frontend/backend
3. **Configure API base URLs** manually

## 📋 **Development Checklist**

- [ ] **Frontend Server**: `npm run dev` (port 5173)
- [ ] **API Server**: `npm run dev:api` (port 3000) - if needed
- [ ] **Browser Access**: http://localhost:5173
- [ ] **Firebase Integration**: Check console logs
- [ ] **API Endpoints**: Test with separate server
- [ ] **File Upload**: Test PDF processing
- [ ] **Sentiment Analysis**: Verify functionality

## 🎯 **Next Steps**

### **Immediate (Today):**
1. **Continue development** with manual refresh
2. **Test all features** to ensure they work
3. **Document any issues** for future fixes

### **Short Term (This Week):**
1. **Fix WebSocket configuration**
2. **Integrate API server properly**
3. **Enable HMR for better development**

### **Long Term:**
1. **Production deployment setup**
2. **Performance optimization**
3. **Additional features**

## 💡 **Pro Tips**

1. **Use Browser DevTools** extensively
2. **Check console logs** for Firebase messages
3. **Test API endpoints** separately
4. **Keep both servers running** if using full setup
5. **Accept temporary limitations** while fixing core issues

## 🚀 **Quick Start Commands**

```bash
# Frontend only (current setup)
npm run dev

# API server only
npm run dev:api

# Both servers (if needed)
npm run dev:full

# Test API functionality
npm run test-api

# Check system status
npm run status
```

**Remember**: The app is fully functional, just without live reloading. Focus on feature development while we resolve the WebSocket issue! 🎯
