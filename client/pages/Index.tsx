import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Brain, Languages, BarChart3, Sparkles, FileText, Upload,
  Link as LinkIcon, Image, FileImage, Globe, Zap, LogOut, User,
  Home, Heart, Save, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { SentimentAnalysisResponse } from "@shared/api";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { SentimentService, FirebaseAnalyticsService } from "@/lib/firebase-db";
import { FirebaseStorageService } from "@/lib/firebase-storage";
import FirebaseStatus from "@/components/FirebaseStatus";

export default function Index() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SentimentAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'accessible' | 'inaccessible'>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user] = useAuthState(auth);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const checkFirebaseStatus = useCallback(async () => {
    try {
      const accessCheck = await SentimentService.checkFirebaseAccess();
      setFirebaseStatus(accessCheck.accessible ? 'accessible' : 'inaccessible');
    } catch (err) {
      setFirebaseStatus('inaccessible');
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkFirebaseStatus();
    }
  }, [user, checkFirebaseStatus]);

  const handleAnalyze = useCallback(async () => {
    // Client-side validation
    if (!text.trim() && !url.trim() && !file) {
      setError("Please provide text, upload a file, or specify a URL");
      return;
    }

    // Check if text input is long enough (if provided)
    if (text.trim()) {
      const meaningfulWords = text.trim().split(' ').filter(word => word.length > 1);
      if (meaningfulWords.length < 3) {
        setError("Please provide at least 3 meaningful words for analysis");
        return;
      }
    }

    // Ensure at least one meaningful input is provided
    const hasValidInput = (text.trim() && text.trim().split(' ').filter(word => word.length > 1).length >= 3) || 
                         (url.trim() && url.trim().length > 10) || 
                         file;
    
    if (!hasValidInput) {
      setError("Please provide valid input: at least 3 meaningful words, a valid URL, or upload a file");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      
      if (file) {
        formData.append('file', file);
      }
      if (url.trim()) {
        formData.append('url', url.trim());
      }
      if (text.trim()) {
        formData.append('text', text.trim());
      }
      formData.append('autoTranslate', 'true');

      const response = await fetch("/api/sentiment/multi", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - let the browser set it automatically for FormData
        // This ensures the proper multipart boundary is set
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.details || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json() as SentimentAnalysisResponse;
      setResult(data);

      // Save to Firebase if user is authenticated
      if (user && data) {
        try {
          const inputType = file ? 'file' : url ? 'url' : 'text';
          // Prepare the record data, filtering out undefined values
          const recordData: any = {
            uid: user.uid,
            type: inputType,
            inputText: data.originalText,
            originalText: data.originalText,
            detectedLanguage: data.detectedLanguage,
            sentimentScores: data.sentimentScores,
            primarySentiment: data.primarySentiment,
            summary: data.summary,
            processingTimeMs: data.processingTimeMs,
            metadata: {
              fileName: file?.name,
              fileType: file?.type
            },
            tags: [],
            favorite: false
          };

          // Only add translatedText if it exists
          if (data.translatedText) {
            recordData.translatedText = data.translatedText;
          }

          // Only add url to metadata if it exists
          if (url && url.trim()) {
            recordData.metadata.url = url.trim();
          }

          await SentimentService.saveSentimentRecord(recordData);

          // Log analytics event
          await FirebaseAnalyticsService.logEvent('sentiment_analysis_completed', {
            category: 'analysis',
            type: inputType,
            sentiment: data.primarySentiment.label,
            language: data.detectedLanguage.language
          }, user.uid);
        } catch (firebaseError) {
          console.warn('Failed to save to Firebase:', firebaseError);
          // Don't show error to user, just log it
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [text, url, file, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setActiveTab("file");
    }
  };


  const getSentimentColor = (label: string) => {
    switch (label.toUpperCase()) {
      case 'POSITIVE': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'NEGATIVE': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'NEUTRAL': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getSentimentIcon = (label: string) => {
    switch (label.toUpperCase()) {
      case 'POSITIVE': return '😊';
      case 'NEGATIVE': return '😞';
      case 'NEUTRAL': return '😐';
      default: return '🤔';
    }
  };

  const hasInput = text.trim() || url.trim() || file;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 80%, rgba(220, 38, 127, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(220, 38, 127, 0.1) 0%, transparent 50%)`
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <motion.div 
        className="border-b border-rcb-red/20 bg-rcb-black-light/50 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="p-2 rounded-lg bg-gradient-to-r from-rcb-red to-rcb-red-bright animate-glow"
                whileHover={{ scale: 1.1, rotate: 15 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Brain className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  SentimentAI
                </h1>
                <p className="text-gray-400">
                  Multilingual Sentiment Analysis Platform
                </p>
              </div>
            </motion.div>
            
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 text-gray-400">
                <User className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" className="border-rcb-red/30 text-white hover:bg-rcb-red/10 hover:border-rcb-red">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/batch">
                <Button variant="outline" className="border-rcb-red/30 text-white hover:bg-rcb-red/10 hover:border-rcb-red">
                  <Upload className="h-4 w-4 mr-2" />
                  Batch Analysis
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-rcb-red/30 text-white hover:bg-rcb-red/10 hover:border-rcb-red"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Firebase Status Notification */}
      {firebaseStatus === 'inaccessible' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/20 border-b border-yellow-500/30"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  <strong>Firebase Offline:</strong> Your sentiment analysis results are being saved locally. 
                  They will be synced to the cloud when Firebase access is restored.
                </span>
              </div>
              <Button
                onClick={checkFirebaseStatus}
                variant="outline"
                size="sm"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500"
              >
                Check Status
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 text-rcb-red-bright" />
                  </motion.div>
                  Multi-Input Analysis
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Analyze sentiment from text, images, PDFs, or web URLs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-rcb-black/50">
                    <TabsTrigger 
                      value="text" 
                      className="data-[state=active]:bg-rcb-red data-[state=active]:text-white text-gray-400"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger 
                      value="file"
                      className="data-[state=active]:bg-rcb-red data-[state=active]:text-white text-gray-400"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      File
                    </TabsTrigger>
                    <TabsTrigger 
                      value="url"
                      className="data-[state=active]:bg-rcb-red data-[state=active]:text-white text-gray-400"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Textarea
                        placeholder="Enter your text here... (supports multiple languages)"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[200px] resize-none bg-rcb-black/30 border-rcb-red/30 text-white placeholder:text-gray-500 focus:border-rcb-red focus:ring-rcb-red"
                        disabled={isLoading}
                      />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="border-2 border-dashed border-rcb-red/30 rounded-lg p-8 text-center hover:border-rcb-red/50 transition-colors"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FileImage className="h-12 w-12 text-rcb-red mx-auto mb-4" />
                      </motion.div>
                      {file ? (
                        <div className="space-y-2">
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-gray-400 text-sm">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setFile(null)}
                            className="mt-2 border-rcb-red/30 text-rcb-red hover:bg-rcb-red/10"
                          >
                            Remove File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-white">Upload an image or PDF</p>
                          <p className="text-gray-400 text-sm">
                            Supports JPG, PNG, GIF, WebP, PDF (max 10MB)
                          </p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*,.pdf"
                            className="hidden"
                          />
                          <Button
                            className="mt-4 bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-2"
                    >
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="url"
                          placeholder="https://example.com/article"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="pl-11 bg-rcb-black/30 border-rcb-red/30 text-white placeholder:text-gray-500 focus:border-rcb-red focus:ring-rcb-red"
                          disabled={isLoading}
                        />
                      </div>
                      <p className="text-gray-400 text-sm">
                        Enter a web page URL to extract and analyze its content
                      </p>
                    </motion.div>
                  </TabsContent>
                </Tabs>

                <motion.div 
                  className="flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-sm text-gray-400">
                    {activeTab === "text" && `${text.length} characters`}
                    {activeTab === "file" && file && `File: ${file.name}`}
                    {activeTab === "url" && url && `URL: ${url.substring(0, 30)}...`}
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={handleAnalyze}
                      disabled={!hasInput || isLoading}
                      className="bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow text-white font-semibold px-8 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-rcb-red/50 animate-glow"
                    >
                      {isLoading ? (
                        <motion.div
                          className="flex items-center"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Analyzing...
                        </motion.div>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Analyze Sentiment
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <BarChart3 className="h-5 w-5 text-rcb-red-bright" />
                        </motion.div>
                        Analysis Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Language Detection */}
                      <motion.div 
                        className="p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/30"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Languages className="h-4 w-4 text-blue-400" />
                          <span className="font-medium text-blue-300">Language Detection</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-blue-400/30 text-blue-300">
                            {result.detectedLanguage.language}
                          </Badge>
                          <motion.span 
                            className="text-sm text-blue-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {Math.round(result.detectedLanguage.confidence * 100)}% confidence
                          </motion.span>
                        </div>
                      </motion.div>

                      {/* Translation */}
                      {result.translatedText && (
                        <motion.div 
                          className="p-4 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30"
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Languages className="h-4 w-4 text-purple-400" />
                            <span className="font-medium text-purple-300">Translation</span>
                          </div>
                          <p className="text-sm text-purple-200 italic">
                            "{result.translatedText}"
                          </p>
                        </motion.div>
                      )}

                      {/* Primary Sentiment */}
                      <motion.div 
                        className="p-4 rounded-lg bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <motion.span 
                              className="text-2xl"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              {getSentimentIcon(result.primarySentiment.label)}
                            </motion.span>
                            <span className="font-medium text-green-300">Primary Sentiment</span>
                          </div>
                          <Badge className={getSentimentColor(result.primarySentiment.label)}>
                            {result.primarySentiment.label}
                          </Badge>
                        </div>
                        <motion.div 
                          className="text-sm text-green-400"
                          initial={{ width: 0 }}
                          animate={{ width: "auto" }}
                          transition={{ delay: 0.7 }}
                        >
                          {Math.round(result.primarySentiment.confidence * 100)}% confidence
                        </motion.div>
                      </motion.div>

                      {/* Sentiment Breakdown */}
                      <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h4 className="font-medium text-white">Sentiment Breakdown</h4>
                        {result.sentimentScores && result.sentimentScores.length > 0 && result.sentimentScores.map((score, index) => (
                          <motion.div 
                            key={score.label} 
                            className="space-y-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                          >
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-2 text-gray-300">
                                <motion.span
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                >
                                  {getSentimentIcon(score.label)}
                                </motion.span>
                                {score.label}
                              </span>
                              <span className="font-medium text-white">
                                {Math.round(score.score * 100)}%
                              </span>
                            </div>
                            <div className="relative">
                              <Progress 
                                value={score.score * 100} 
                                className="h-2 bg-rcb-black"
                              />
                              <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-rcb-red to-rcb-red-bright rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${score.score * 100}%` }}
                                transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* AI Summary */}
                      <motion.div 
                        className="p-4 rounded-lg bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-4 w-4 text-amber-400" />
                          </motion.div>
                          <span className="font-medium text-amber-300">AI Summary</span>
                        </div>
                        <motion.p 
                          className="text-sm text-amber-200"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 }}
                        >
                          {result.summary}
                        </motion.p>
                      </motion.div>

                      {/* Save to Favorites */}
                      {user && (
                        <motion.div
                          className="flex justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.4 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Save to Favorites
                          </Button>
                        </motion.div>
                      )}

                      {/* Processing Time */}
                      <motion.div
                        className="text-xs text-gray-500 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                      >
                        Analysis completed in {result.processingTimeMs}ms
                        {user && (
                          <span className="ml-2">
                            {firebaseStatus === 'accessible' 
                              ? '• Saved to your dashboard' 
                              : '• Saved locally (will sync when Firebase is restored)'
                            }
                          </span>
                        )}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-red-500/50 bg-red-900/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-400">
                        <span className="font-medium">Error:</span>
                        <span>{error}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Features Sidebar */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Languages, title: "Multi-language Support", desc: "Automatic language detection for 12+ languages" },
                  { icon: Brain, title: "AI-Powered Analysis", desc: "Advanced sentiment classification with confidence scores" },
                  { icon: Sparkles, title: "Smart Insights", desc: "LLM-generated summaries and contextual analysis" },
                  { icon: BarChart3, title: "Detailed Results", desc: "Comprehensive sentiment breakdown and confidence metrics" }
                ].map((feature, index) => (
                  <motion.div 
                    key={feature.title}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                    >
                      <feature.icon className="h-5 w-5 text-rcb-red mt-0.5" />
                    </motion.div>
                    <div>
                      <h4 className="font-medium text-sm text-white">{feature.title}</h4>
                      <p className="text-xs text-gray-400">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-rcb-red/30 bg-gradient-to-br from-rcb-red/5 to-rcb-red-bright/5 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Input Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "📝 Direct text input",
                  "📄 PDF document analysis", 
                  "🖼️ Image OCR extraction",
                  "🌐 Web page content",
                  "📱 Social media posts",
                  "⭐ Product reviews"
                ].map((item, index) => (
                  <motion.div 
                    key={item}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-rcb-red animate-pulse"></div>
                    <span className="text-gray-300">{item}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <FirebaseStatus />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
