import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Download, BarChart3, FileText, ArrowLeft, User, LogOut, Brain } from "lucide-react";
import { BatchAnalysisRequest, BatchAnalysisResponse } from "@shared/api";
import { Link } from "react-router-dom";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import DemoModeIndicator from "@/components/DemoModeIndicator";

export default function BatchAnalysis() {
  const [texts, setTexts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BatchAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const { user, signOut: handleSignOut, isLocalDemo } = useUnifiedAuth();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      setTexts(lines.slice(0, 50));
    };
    reader.readAsText(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (texts.length === 0) return;
    
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const request: BatchAnalysisRequest = {
        texts,
        autoTranslate: true
      };

      const response = await fetch("/api/sentiment/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as BatchAnalysisResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [texts]);

  const exportResults = useCallback(() => {
    if (!result) return;

    const csvContent = [
      ['Text', 'Language', 'Primary Sentiment', 'Confidence', 'Positive %', 'Negative %', 'Neutral %', 'Summary'].join(','),
      ...result.results.map(r => [
        `"${r.originalText.replace(/"/g, '""')}"`,
        r.detectedLanguage.language,
        r.primarySentiment.label,
        (r.primarySentiment.confidence * 100).toFixed(1),
        (r.sentimentScores.find(s => s.label === 'POSITIVE')?.score * 100 || 0).toFixed(1),
        (r.sentimentScores.find(s => s.label === 'NEGATIVE')?.score * 100 || 0).toFixed(1),
        (r.sentimentScores.find(s => s.label === 'NEUTRAL')?.score * 100 || 0).toFixed(1),
        `"${r.summary.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);


  const getSentimentColor = (label: string) => {
    switch (label.toUpperCase()) {
      case 'POSITIVE': return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'NEGATIVE': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'NEUTRAL': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  // Floating particles background
  const floatingParticles = Array.from({ length: 15 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-rcb-red rounded-full opacity-20"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, Math.random() * 20 - 10, 0],
        opacity: [0.2, 0.6, 0.2],
      }}
      transition={{
        duration: 4 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 2,
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingParticles}
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="grid grid-cols-12 gap-4 h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2 }}
        >
          {Array.from({ length: 48 }, (_, i) => (
            <motion.div
              key={i}
              className="border border-rcb-red h-full"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
            />
          ))}
        </motion.div>
      </div>

      {/* Header */}
      <motion.div 
        className="border-b border-rcb-red/20 bg-rcb-black-light/50 backdrop-blur-xl relative z-10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" size="sm" className="text-white hover:bg-rcb-red/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Analysis
                  </Button>
                </motion.div>
              </Link>
              <div className="h-6 w-px bg-rcb-red/30" />
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2 rounded-lg bg-gradient-to-r from-rcb-red to-rcb-red-bright animate-glow"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <BarChart3 className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Batch Analysis
                  </h1>
                  <p className="text-gray-400">
                    Analyze multiple texts at once from file upload
                  </p>
                </div>
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
                <span className="text-sm">
                  {user?.email} {isLocalDemo && '(Demo)'}
                </span>
              </div>
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

      <div className="container mx-auto px-4 py-8 relative z-10">
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
                    <Upload className="h-5 w-5 text-rcb-red-bright" />
                  </motion.div>
                  File Upload
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload a text file with one entry per line (max 50 entries)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div 
                  className="border-2 border-dashed border-rcb-red/30 rounded-lg p-8 text-center hover:border-rcb-red/50 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText className="h-12 w-12 text-rcb-red mx-auto mb-4" />
                  </motion.div>
                  <div className="space-y-2">
                    <p className="text-white font-medium">Upload a .txt file</p>
                    <p className="text-gray-400 text-sm">
                      Each line should contain one text to analyze
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button className="mt-4 bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow" asChild>
                        <span className="cursor-pointer">
                          Choose File
                        </span>
                      </Button>
                    </motion.div>
                  </label>
                </motion.div>
                
                <AnimatePresence>
                  {texts.length > 0 && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex justify-between items-center">
                        <motion.span 
                          className="text-sm font-medium text-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {texts.length} texts loaded
                        </motion.span>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button 
                            onClick={handleAnalyze}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow text-white font-semibold px-6 py-2 rounded-lg transform transition-all duration-200 hover:shadow-lg hover:shadow-rcb-red/50 animate-glow"
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
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analyze All
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                      
                      <motion.div 
                        className="max-h-40 overflow-y-auto space-y-2 p-3 bg-rcb-black/30 rounded-lg border border-rcb-red/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {texts.slice(0, 5).map((text, index) => (
                          <motion.div 
                            key={index} 
                            className="text-sm text-gray-300 truncate"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                          >
                            {index + 1}. {text}
                          </motion.div>
                        ))}
                        {texts.length > 5 && (
                          <motion.div 
                            className="text-sm text-gray-500 italic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                          >
                            ... and {texts.length - 5} more
                          </motion.div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <BarChart3 className="h-5 w-5 text-rcb-red-bright" />
                          </motion.div>
                          Batch Analysis Results
                        </CardTitle>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button onClick={exportResults} variant="outline" size="sm" className="border-rcb-red/30 text-white hover:bg-rcb-red/10">
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                        </motion.div>
                      </div>
                      <CardDescription className="text-gray-400">
                        Processed {result.totalProcessed} texts in {result.averageProcessingTimeMs}ms average
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {result.results && result.results.length > 0 && result.results.map((item, index) => (
                          <motion.div 
                            key={index} 
                            className="p-4 border border-rcb-red/20 rounded-lg bg-rcb-black/20 hover:bg-rcb-black/30 transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate font-medium">
                                  {item.originalText}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                                    {item.detectedLanguage.language}
                                  </Badge>
                                  <Badge className={`text-xs ${getSentimentColor(item.primarySentiment.label)}`}>
                                    {item.primarySentiment.label} ({Math.round(item.primarySentiment.confidence * 100)}%)
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 italic">
                              {item.summary}
                            </p>
                          </motion.div>
                        ))}
                      </div>
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

          {/* Instructions Sidebar */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  { title: "File Format", desc: "Upload a .txt file with one text entry per line. Empty lines will be ignored." },
                  { title: "Limits", desc: "Maximum 50 texts per batch. Longer files will be truncated." },
                  { title: "Export", desc: "Results can be exported as CSV with all sentiment scores and summaries." }
                ].map((instruction, index) => (
                  <motion.div 
                    key={instruction.title}
                    className="space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <h4 className="font-medium text-white">{instruction.title}</h4>
                    <p className="text-gray-400">{instruction.desc}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-rcb-red/30 bg-gradient-to-br from-rcb-red/5 to-rcb-red-bright/5 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Example File Content</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-xs font-mono bg-rcb-black/30 rounded p-3 border border-rcb-red/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="space-y-1 text-gray-300">
                    {[
                      "This product is amazing!",
                      "I hate waiting in long lines",
                      "The service was okay, nothing special",
                      "¡Me encanta este restaurante!",
                      "这个应用程序很好用"
                    ].map((line, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                      >
                        {line}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <DemoModeIndicator />
    </div>
  );
}
