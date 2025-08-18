import { motion } from "framer-motion";
import { TestTube, Info } from "lucide-react";
import { shouldUseLocalDemoAuth } from "@/lib/local-demo-auth";

export default function DemoModeIndicator() {
  if (!shouldUseLocalDemoAuth()) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 bg-amber-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium z-50 flex items-center gap-2 shadow-lg"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <TestTube className="h-4 w-4" />
      </motion.div>
      <span>Demo Mode</span>
      <div className="group relative">
        <Info className="h-3 w-3 opacity-70 hover:opacity-100 cursor-help" />
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-xs text-white p-2 rounded shadow-lg w-48">
          Running in local demo mode. Authentication is handled locally without external services.
        </div>
      </div>
    </motion.div>
  );
}
