import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { localDemoAuth, shouldUseLocalDemoAuth } from "@/lib/local-demo-auth";
import Login from "@/pages/Login";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface UnifiedAuthWrapperProps {
  children: React.ReactNode;
}

interface AuthState {
  user: any | null;
  loading: boolean;
  error: Error | null;
}

export default function UnifiedAuthWrapper({ children }: UnifiedAuthWrapperProps) {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);
  const [localUser, setLocalUser] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(true);

  // Unified auth state
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const useLocal = shouldUseLocalDemoAuth();
    console.log('Auth system selection:', {
      hostname: window.location.hostname,
      useLocal,
      firebaseUser: !!firebaseUser,
      firebaseLoading,
      firebaseError: !!firebaseError
    });

    if (useLocal) {
      // Use local demo auth for preview environments
      console.log('Using local demo authentication system');

      // Check for existing session immediately
      const currentUser = localDemoAuth.getCurrentUser();
      console.log('Existing local user:', currentUser);

      if (currentUser) {
        setLocalUser(currentUser);
        setLocalLoading(false);
        setAuthState({
          user: currentUser,
          loading: false,
          error: null
        });
      } else {
        setLocalLoading(false);
        setAuthState({
          user: null,
          loading: false,
          error: null
        });
      }

      const unsubscribe = localDemoAuth.onAuthStateChanged((user) => {
        console.log('Local auth state changed:', user);
        setLocalUser(user);
        setAuthState({
          user,
          loading: false,
          error: null
        });
      });

      return unsubscribe;
    } else {
      // Use Firebase auth for production environments
      console.log('Using Firebase authentication system');
      setAuthState({
        user: firebaseUser,
        loading: firebaseLoading,
        error: firebaseError
      });
      setLocalLoading(false);
    }
  }, [firebaseUser, firebaseLoading, firebaseError]);

  if (authState.loading || localLoading) {
    return (
      <div className="min-h-screen bg-rcb-black flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="animate-glow p-8 rounded-full bg-rcb-black-light mb-4 inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="h-12 w-12 text-rcb-red" />
          </motion.div>
          <motion.p 
            className="text-white text-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Initializing SentimentAI...
          </motion.p>
          <motion.p 
            className="text-gray-400 text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {shouldUseLocalDemoAuth() ? 'Local Demo Mode' : 'Firebase Auth Mode'}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (authState.error) {
    console.error("Auth error:", authState.error);
    return (
      <div className="min-h-screen bg-rcb-black flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center p-8"
        >
          <div className="text-rcb-red text-xl mb-4">Authentication Error</div>
          <div className="text-gray-400 mb-4">{authState.error.message}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-rcb-red hover:text-rcb-red-bright underline"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  if (!authState.user) {
    return <Login />;
  }

  return <>{children}</>;
}
