import { motion } from "framer-motion";
import { Info, Shield, Zap, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2 }}
      className="mt-8"
    >
      <Card className="bg-rcb-black-light/30 border-rcb-red/20 backdrop-blur-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-center justify-center">
            <Info className="h-4 w-4 text-rcb-red" />
            <span className="text-sm font-medium text-white">Authentication Options</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="flex items-start gap-2 text-gray-400">
              <Mail className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-blue-300 font-medium">Email/Password</div>
                <div>Create a secure account with your email</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-gray-400">
              <Zap className="h-3 w-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-amber-300 font-medium">Quick Demo</div>
                <div>Instant access with temporary demo account</div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-gray-400">
              <Shield className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-gray-400 font-medium">Google Sign-In</div>
                <div>Disabled in preview environment</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
