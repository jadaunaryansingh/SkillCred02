import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import Login from "@/pages/Login";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
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
        </motion.div>
      </div>
    );
  }

  if (error) {
    console.error("Auth error:", error);
    return (
      <div className="min-h-screen bg-rcb-black flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center p-8"
        >
          <div className="text-rcb-red text-xl mb-4">Authentication Error</div>
          <div className="text-gray-400 mb-4">{error.message}</div>
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

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}
