import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Mail, Lock, Eye, EyeOff, Sparkles, Brain, Zap, LogIn,
  UserPlus, Github, Twitter, Phone, Shield, Crown, Fingerprint
} from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth, analytics } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authTab, setAuthTab] = useState("email");
  const [verificationId, setVerificationId] = useState("");
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const logAuthEvent = (method: string, action: string) => {
    if (analytics) {
      logEvent(analytics, 'login_attempt', {
        method,
        action
      });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        logAuthEvent('email', 'signup');
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account created successfully! Welcome to SentimentAI!");
      } else {
        logAuthEvent('email', 'signin');
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Welcome back to SentimentAI!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github' | 'twitter') => {
    setIsLoading(true);
    setError("");

    try {
      logAuthEvent(provider, 'signin');
      let authProvider;
      
      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider();
          authProvider.addScope('email');
          authProvider.addScope('profile');
          break;
        case 'github':
          authProvider = new GithubAuthProvider();
          authProvider.addScope('user:email');
          break;
        case 'twitter':
          authProvider = new TwitterAuthProvider();
          break;
      }

      const result = await signInWithPopup(auth, authProvider);
      setSuccess(`Welcome to SentimentAI via ${provider}!`);
      
      if (analytics) {
        logEvent(analytics, 'login', {
          method: provider
        });
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError(`${provider} sign-in requires domain authorization. Please contact support.`);
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Please enable popups for this site.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!verificationId) {
        // Initialize reCAPTCHA
        const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA solved')
        });

        const confirmation = await signInWithPhoneNumber(auth, phone, recaptcha);
        setVerificationId(confirmation.verificationId);
        setSuccess("Verification code sent to your phone!");
      } else {
        // Verify the code
        const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
        await signInWithPhoneNumber(auth, phone, phoneCredential as any);
        setSuccess("Phone verification successful!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Animated background particles
  const particles = Array.from({ length: 50 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-gradient-to-r from-rcb-red to-rcb-red-bright rounded-full"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -40, 0],
        x: [0, Math.random() * 30 - 15, 0],
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: 4 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 3,
      }}
    />
  ));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring" }}
          className="text-center"
        >
          <motion.div
            className="p-8 rounded-full bg-gradient-to-r from-rcb-red to-rcb-red-bright mb-6 inline-block animate-glow"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="h-16 w-16 text-white" />
          </motion.div>
          <motion.p 
            className="text-white text-2xl font-bold"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Initializing SentimentAI...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles}
      </div>

      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="grid grid-cols-20 gap-2 h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2 }}
        >
          {Array.from({ length: 400 }, (_, i) => (
            <motion.div
              key={i}
              className="border border-rcb-red h-full"
              initial={{ scaleY: 0, scaleX: 0 }}
              animate={{ scaleY: 1, scaleX: 1 }}
              transition={{ delay: i * 0.001, duration: 0.5 }}
            />
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo and Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ scale: 0, y: -50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
          >
            <motion.div
              className="inline-block p-6 rounded-full bg-gradient-to-r from-rcb-red to-rcb-red-bright mb-6 animate-glow"
              whileHover={{ 
                scale: 1.1, 
                rotate: [0, 5, -5, 0],
                boxShadow: "0 0 50px rgba(220, 38, 127, 0.8)"
              }}
              transition={{ duration: 0.8 }}
            >
              <Brain className="h-16 w-16 text-white" />
            </motion.div>
            <motion.h1
              className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-white to-rcb-red-bright bg-clip-text text-transparent"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              SentimentAI
            </motion.h1>
            <motion.p
              className="text-gray-400 text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Advanced AI-Powered Sentiment Analysis
            </motion.p>
          </motion.div>

          {/* Authentication Card */}
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <Card className="bg-rcb-black-light/90 backdrop-blur-xl border-rcb-red/30 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                >
                  <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Crown className="h-6 w-6 text-rcb-red-bright" />
                    </motion.div>
                    Welcome to SentimentAI
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    Experience the future of emotion analysis
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent>
                <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-rcb-black/50 mb-6">
                    <TabsTrigger 
                      value="email" 
                      className="data-[state=active]:bg-rcb-red data-[state=active]:text-white"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger 
                      value="social"
                      className="data-[state=active]:bg-rcb-red data-[state=active]:text-white"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Social
                    </TabsTrigger>
                    <TabsTrigger 
                      value="phone"
                      className="data-[state=active]:bg-rcb-red data-[state=active]:text-white"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Phone
                    </TabsTrigger>
                  </TabsList>

                  {/* Email Authentication */}
                  <TabsContent value="email" className="space-y-4">
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="relative"
                      >
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-11 bg-rcb-black/30 border-rcb-red/30 text-white placeholder:text-gray-500 focus:border-rcb-red focus:ring-rcb-red"
                          required
                        />
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="relative"
                      >
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-11 pr-11 bg-rcb-black/30 border-rcb-red/30 text-white placeholder:text-gray-500 focus:border-rcb-red focus:ring-rcb-red"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.6 }}
                        className="flex items-center justify-between"
                      >
                        <button
                          type="button"
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="text-sm text-rcb-red hover:text-rcb-red-bright transition-colors"
                        >
                          {isSignUp ? "Already have an account?" : "Need an account?"}
                        </button>
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Forgot password?
                        </button>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.7 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow text-white font-semibold py-3 rounded-lg transform transition-all duration-200 hover:shadow-lg hover:shadow-rcb-red/50 animate-glow"
                        >
                          {isLoading ? (
                            <motion.div
                              className="flex items-center justify-center"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </motion.div>
                          ) : (
                            <span className="flex items-center justify-center">
                              {isSignUp ? <UserPlus className="h-5 w-5 mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
                              {isSignUp ? "Create Account" : "Sign In"}
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </TabsContent>

                  {/* Social Authentication */}
                  <TabsContent value="social" className="space-y-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.4 }}
                      className="space-y-3"
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => handleSocialAuth('google')}
                          disabled={isLoading}
                          className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0 font-medium"
                        >
                          <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => handleSocialAuth('github')}
                          disabled={isLoading}
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white border-0"
                        >
                          <Github className="h-5 w-5 mr-3" />
                          Continue with GitHub
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => handleSocialAuth('twitter')}
                          disabled={isLoading}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0"
                        >
                          <Twitter className="h-5 w-5 mr-3" />
                          Continue with Twitter
                        </Button>
                      </motion.div>
                    </motion.div>
                  </TabsContent>

                  {/* Phone Authentication */}
                  <TabsContent value="phone" className="space-y-4">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1.4 }}
                      className="space-y-4"
                    >
                      {!verificationId ? (
                        <>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="pl-11 bg-rcb-black/30 border-rcb-red/30 text-white placeholder:text-gray-500 focus:border-rcb-red focus:ring-rcb-red"
                            />
                          </div>
                          <div id="recaptcha-container"></div>
                          <Button
                            onClick={handlePhoneAuth}
                            disabled={isLoading || !phone}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          >
                            <Phone className="h-5 w-5 mr-2" />
                            Send Verification Code
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              className="pl-11 bg-rcb-black/30 border-rcb-red/30 text-white placeholder:text-gray-500 focus:border-rcb-red focus:ring-rcb-red"
                              maxLength={6}
                            />
                          </div>
                          <Button
                            onClick={handlePhoneAuth}
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          >
                            <Fingerprint className="h-5 w-5 mr-2" />
                            Verify Code
                          </Button>
                        </>
                      )}
                    </motion.div>
                  </TabsContent>
                </Tabs>

                {/* Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Preview */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-8 text-center"
          >
            <motion.div
              className="flex justify-center space-x-8 text-gray-400"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-center">
                <div className="text-rcb-red text-3xl mb-2">🌍</div>
                <div className="text-xs">Multi-language</div>
              </div>
              <div className="text-center">
                <div className="text-rcb-red text-3xl mb-2">🧠</div>
                <div className="text-xs">AI-Powered</div>
              </div>
              <div className="text-center">
                <div className="text-rcb-red text-3xl mb-2">⚡</div>
                <div className="text-xs">Real-time</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Firebase Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-600/20 border border-yellow-500/30 rounded-full px-4 py-2 text-yellow-400 text-xs">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔥
              </motion.div>
              Powered by Firebase
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
