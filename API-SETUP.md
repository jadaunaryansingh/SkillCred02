# 🔑 API Setup Guide

To use **real API-based sentiment analysis** instead of local processing, you need to set up API keys for external services.

## 🚀 **Quick Setup (Recommended)**

### 1. **Hugging Face API Key** (Free)
- Go to: https://huggingface.co/settings/tokens
- Sign up/Login
- Create a new token
- Copy the token

### 2. **Create Environment File**
Create a `.env` file in your project root:
```bash
# .env
HUGGINGFACE_API_KEY=your_actual_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. **Restart Your Server**
```bash
npm run dev
```

## 🔥 **Available APIs**

### **Sentiment Analysis**
- **Hugging Face** (Free tier available)
  - Model: `cardiffnlp/twitter-roberta-base-sentiment-latest`
  - Endpoint: `https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest`
  - Cost: Free tier with rate limits

- **Alternative: OpenAI** (Paid)
  - Model: GPT-3.5-turbo
  - More accurate but costs money

### **AI Summaries & Translations**
- **Gemini AI** (Google)
  - Model: gemini-pro
  - Free tier available
  - Get key from: https://makersuite.google.com/app/apikey

## 📝 **Environment Variables**

```bash
# Required for API-based sentiment analysis
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required for AI summaries and translations
GEMINI_API_KEY=AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Other services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLOUD_API_KEY=AIzaSyCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🧪 **Testing Your Setup**

### 1. **Check API Status**
```bash
npm run status
```

### 2. **Test Sentiment Analysis**
- Go to: http://localhost:5173
- Enter some text for analysis
- Check browser console for API calls

### 3. **Expected Console Output**
```
✅ Hugging Face API: Connected
🔍 Calling Hugging Face sentiment analysis API...
📡 API response received: [array of sentiment scores]
```

## 🚨 **Troubleshooting**

### **"No API key found"**
- Check if `.env` file exists
- Verify API key is correct
- Restart the server after adding keys

### **"API request failed"**
- Check API key validity
- Verify internet connection
- Check rate limits (Hugging Face has free tier limits)

### **"Invalid API response format"**
- API service might be down
- Check API documentation for changes
- Verify model endpoint is correct

## 💡 **Fallback Behavior**

If no API keys are configured:
- ✅ **App still works** with local sentiment analysis
- ✅ **All features functional** (just less accurate)
- ✅ **No errors or crashes**

## 🎯 **Next Steps**

1. **Get your API keys** from the services above
2. **Create `.env` file** with your keys
3. **Restart the server** with `npm run dev`
4. **Test sentiment analysis** - you should see API calls in console
5. **Enjoy accurate, API-based results!** 🚀

## 📚 **API Documentation**

- **Hugging Face**: https://huggingface.co/docs/api-inference
- **Gemini AI**: https://ai.google.dev/docs
- **OpenAI**: https://platform.openai.com/docs
