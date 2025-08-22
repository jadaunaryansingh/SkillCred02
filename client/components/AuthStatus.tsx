import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { isGoogleSignInEnabled, getCurrentDomain } from "@/lib/environment";

export default function AuthStatus() {
  const googleEnabled = isGoogleSignInEnabled();
  const domain = getCurrentDomain();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.2 }}
      className="fixed bottom-4 right-4 bg-rcb-black-light/80 backdrop-blur-sm border border-rcb-red/20 rounded-lg p-3 text-xs max-w-xs z-50"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Auth Status</span>
        </div>
        
        <div className="space-y-1 text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Email/Password: Active</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-amber-400" />
            <span>Demo Access: Available</span>
          </div>
          
          <div className="flex items-center gap-2">
            {googleEnabled ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <XCircle className="h-3 w-3 text-gray-500" />
            )}
            <span>Google Sign-In: {googleEnabled ? 'Active' : 'Disabled'}</span>
          </div>
          
          <div className="pt-1 border-t border-rcb-red/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-blue-400" />
              <span className="truncate">Domain: {domain}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
