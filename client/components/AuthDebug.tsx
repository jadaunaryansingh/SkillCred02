import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bug, ChevronDown, ChevronUp } from "lucide-react";
import { shouldUseLocalDemoAuth, localDemoAuth } from "@/lib/local-demo-auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function AuthDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);
  const [localUser, setLocalUser] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribe = localDemoAuth.onAuthStateChanged(setLocalUser);
    return unsubscribe;
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const useLocal = shouldUseLocalDemoAuth();
  const hostname = window.location.hostname;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-4 left-4 bg-gray-900/95 backdrop-blur-sm text-white p-3 rounded-lg text-xs font-mono z-50 max-w-sm"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
      >
        <Bug className="h-4 w-4" />
        <span>Auth Debug</span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-2 space-y-2 text-gray-300"
        >
          <div>
            <div className="text-blue-300">Environment:</div>
            <div>Domain: {hostname}</div>
            <div>Use Local: {useLocal ? '✅' : '❌'}</div>
          </div>
          
          <div>
            <div className="text-green-300">Firebase Auth:</div>
            <div>User: {firebaseUser?.email || 'None'}</div>
            <div>Loading: {firebaseLoading ? '⏳' : '✅'}</div>
            <div>Error: {firebaseError ? '❌' : '✅'}</div>
          </div>
          
          <div>
            <div className="text-purple-300">Local Demo Auth:</div>
            <div>User: {localUser?.email || 'None'}</div>
            <div>Stats: {JSON.stringify(localDemoAuth.getDemoUserStats(), null, 1)}</div>
          </div>
          
          <div className="pt-2 border-t border-gray-700">
            <button
              onClick={() => localDemoAuth.clearAllDemoData()}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              Clear Demo Data
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
