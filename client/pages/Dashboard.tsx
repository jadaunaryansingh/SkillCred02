import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, Heart, Star, Clock, TrendingUp, Zap, Crown, 
  Download, Upload, Eye, Trash2, Settings, Bell, Shield,
  Brain, Globe, FileText, Image as ImageIcon, Link2
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { UserProfileService, SentimentService, UserProfile, SentimentRecord } from "@/lib/firebase-db";
import { FirebaseStorageService, formatFileSize } from "@/lib/firebase-storage";

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentSentiments, setRecentSentiments] = useState<SentimentRecord[]>([]);
  const [favoritesSentiments, setFavoritesSentiments] = useState<SentimentRecord[]>([]);
  const [storageUsage, setStorageUsage] = useState({ usedBytes: 0, fileCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      loadDashboardData();
      setupRealTimeListeners();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load user profile
      const profile = await UserProfileService.getProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        // Create profile if it doesn't exist
        await UserProfileService.createProfile(user.uid, {
          email: user.email || '',
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      }

      // Load recent sentiments
      const sentiments = await SentimentService.getUserSentiments(user.uid, 10);
      setRecentSentiments(sentiments);

      // Load favorites
      const favorites = await SentimentService.getFavoriteSentiments(user.uid);
      setFavoritesSentiments(favorites);

      // Load storage usage
      const usage = await FirebaseStorageService.getStorageUsage(user.uid);
      setStorageUsage(usage);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeListeners = () => {
    if (!user) return;

    // Real-time profile updates
    const unsubscribeProfile = UserProfileService.subscribeToProfile(user.uid, (profile) => {
      if (profile) setUserProfile(profile);
    });

    // Real-time sentiments updates
    const unsubscribeSentiments = SentimentService.subscribeToUserSentiments(user.uid, (sentiments) => {
      setRecentSentiments(sentiments);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSentiments();
    };
  };

  const toggleFavorite = async (sentimentId: string, currentFavorite: boolean) => {
    try {
      await SentimentService.updateSentiment(sentimentId, { favorite: !currentFavorite });
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const deleteSentiment = async (sentimentId: string) => {
    try {
      await SentimentService.deleteSentiment(sentimentId);
    } catch (error) {
      console.error('Error deleting sentiment:', error);
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

  const getSentimentColor = (label: string) => {
    switch (label.toUpperCase()) {
      case 'POSITIVE': return 'from-green-500 to-emerald-600';
      case 'NEGATIVE': return 'from-red-500 to-rose-600';
      case 'NEUTRAL': return 'from-gray-500 to-slate-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'file': return <ImageIcon className="h-4 w-4" />;
      case 'url': return <Link2 className="h-4 w-4" />;
      case 'batch': return <BarChart3 className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="p-8 rounded-full bg-gradient-to-r from-rcb-red to-rcb-red-bright mb-6 inline-block animate-glow"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="h-16 w-16 text-white" />
          </motion.div>
          <motion.p 
            className="text-white text-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading Dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black">
      {/* Header */}
      <motion.div 
        className="border-b border-rcb-red/20 bg-rcb-black-light/50 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="relative"
              >
                <Avatar className="h-16 w-16 border-2 border-rcb-red/50">
                  <AvatarImage src={userProfile?.photoURL || user?.photoURL || ''} />
                  <AvatarFallback className="bg-gradient-to-r from-rcb-red to-rcb-red-bright text-white text-xl">
                    {userProfile?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-rcb-black"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {userProfile?.displayName || user?.displayName || 'User'}!
                </h1>
                <p className="text-gray-400">
                  {userProfile?.subscription.plan === 'pro' && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white mr-2">
                      <Crown className="h-3 w-3 mr-1" />
                      PRO
                    </Badge>
                  )}
                  Ready to analyze some emotions today?
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button variant="outline" size="sm" className="border-rcb-red/30 text-white hover:bg-rcb-red/10">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" className="border-rcb-red/30 text-white hover:bg-rcb-red/10">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {[
            { 
              title: "Total Analyses", 
              value: userProfile?.stats.totalAnalyses || 0, 
              icon: Brain, 
              color: "from-blue-500 to-blue-600",
              trend: "+12%"
            },
            { 
              title: "Text Analyses", 
              value: userProfile?.stats.textAnalyses || 0, 
              icon: FileText, 
              color: "from-green-500 to-green-600",
              trend: "+8%"
            },
            { 
              title: "File Analyses", 
              value: userProfile?.stats.fileAnalyses || 0, 
              icon: Upload, 
              color: "from-purple-500 to-purple-600",
              trend: "+15%"
            },
            { 
              title: "Storage Used", 
              value: formatFileSize(storageUsage.usedBytes), 
              icon: Shield, 
              color: "from-orange-500 to-orange-600",
              trend: "2GB limit"
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-green-400 text-sm">{stat.trend}</p>
                    </div>
                    <motion.div
                      className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Analyses */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock className="h-5 w-5 text-rcb-red-bright" />
                  </motion.div>
                  Recent Analyses
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your latest sentiment analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {recentSentiments.map((sentiment, index) => (
                      <motion.div
                        key={sentiment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border border-rcb-red/20 rounded-lg bg-rcb-black/20 hover:bg-rcb-black/30 transition-all group"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getTypeIcon(sentiment.type)}
                              <span className="text-white font-medium truncate">
                                {sentiment.inputText.substring(0, 60)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                                {sentiment.detectedLanguage.language}
                              </Badge>
                              <div className={`px-2 py-1 rounded-full text-xs bg-gradient-to-r ${getSentimentColor(sentiment.primarySentiment.label)} text-white`}>
                                <span className="mr-1">{getSentimentIcon(sentiment.primarySentiment.label)}</span>
                                {sentiment.primarySentiment.label} ({Math.round(sentiment.primarySentiment.confidence * 100)}%)
                              </div>
                            </div>
                            <p className="text-gray-400 text-xs italic">
                              {sentiment.summary.substring(0, 100)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFavorite(sentiment.id!, sentiment.favorite)}
                              className="text-gray-400 hover:text-yellow-400"
                            >
                              <Heart className={`h-4 w-4 ${sentiment.favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSentiment(sentiment.id!)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {recentSentiments.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-400"
                    >
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No analyses yet. Start analyzing some text!</p>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar - Favorites & Quick Actions */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Favorites */}
            <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Star className="h-5 w-5 text-yellow-400" />
                  </motion.div>
                  Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {favoritesSentiments.slice(0, 3).map((sentiment, index) => (
                    <motion.div
                      key={sentiment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 border border-yellow-500/20 rounded-lg bg-yellow-900/10"
                    >
                      <p className="text-white text-sm font-medium truncate">
                        {sentiment.inputText.substring(0, 40)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">{getSentimentIcon(sentiment.primarySentiment.label)}</span>
                        <span className="text-yellow-400 text-xs">{sentiment.primarySentiment.label}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {favoritesSentiments.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No favorites yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-rcb-red-bright" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow">
                    <Brain className="h-4 w-4 mr-2" />
                    New Analysis
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="w-full border-rcb-red/30 text-white hover:bg-rcb-red/10">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="w-full border-rcb-red/30 text-white hover:bg-rcb-red/10">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </motion.div>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Usage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Storage</span>
                    <span className="text-white">{formatFileSize(storageUsage.usedBytes)} / 2GB</span>
                  </div>
                  <Progress 
                    value={(storageUsage.usedBytes / (2 * 1024 * 1024 * 1024)) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Monthly Analyses</span>
                    <span className="text-white">{userProfile?.stats.totalAnalyses || 0} / 1000</span>
                  </div>
                  <Progress 
                    value={((userProfile?.stats.totalAnalyses || 0) / 1000) * 100} 
                    className="h-2"
                  />
                </div>
                
                {userProfile?.subscription.plan === 'free' && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="mt-4"
                  >
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
