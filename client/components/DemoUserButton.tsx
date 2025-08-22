import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User, Zap } from "lucide-react";
import { localDemoAuth, shouldUseLocalDemoAuth } from "@/lib/local-demo-auth";
import { trackFirebaseAuthError } from "@/lib/error-tracking";

interface DemoUserButtonProps {
  isLoading: boolean;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function DemoUserButton({ isLoading, onSuccess, onError }: DemoUserButtonProps) {
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoUser = async () => {
    setIsDemoLoading(true);

    try {
      // Always try local demo auth first in preview environments
      if (shouldUseLocalDemoAuth()) {
        console.log('Preview environment detected - using local demo authentication...');
        const demoUser = await localDemoAuth.createDemoUser();
        console.log('Local demo user created:', demoUser.email);
        onSuccess();
        return;
      }

      // Try Firebase authentication for production environments
      console.log('Production environment - attempting Firebase demo user creation...');
      const randomId = Math.random().toString(36).substring(7);
      const demoEmail = `demo-${randomId}@sentimentai.demo`;
      const demoPassword = "Demo123!";

      try {
        // Try to sign in first in case the user already exists
        await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        onSuccess();
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found') {
          // User doesn't exist, create new demo user
          await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          onSuccess();
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error("Demo user creation error:", error);

      // Always fallback to local demo auth if Firebase fails
      console.log('Firebase failed, forcing local demo auth fallback...');
      try {
        const demoUser = await localDemoAuth.createDemoUser();
        console.log('Fallback demo user created:', demoUser.email);
        onSuccess();
        return;
      } catch (localError) {
        console.error('Local demo auth also failed:', localError);

        // Handle the original Firebase error
        const { userMessage } = trackFirebaseAuthError(error, 'demo-user-creation');
        onError(`Firebase unavailable and local fallback failed: ${userMessage}`);
      }
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.7 }}
    >
      <Button
        type="button"
        onClick={handleDemoUser}
        disabled={isLoading || isDemoLoading}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white transition-all duration-200"
      >
        {isDemoLoading ? (
          <motion.div
            className="flex items-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Creating Demo User...
          </motion.div>
        ) : (
          <>
            <User className="h-4 w-4 mr-2" />
            Quick Demo Access
          </>
        )}
      </Button>
    </motion.div>
  );
}
