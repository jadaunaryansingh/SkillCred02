import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const floatingParticles = Array.from({ length: 10 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-rcb-red rounded-full opacity-30"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -20, 0],
        x: [0, Math.random() * 10 - 5, 0],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 2,
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-rcb-black via-rcb-black-dark to-rcb-black flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingParticles}
      </div>

      <motion.div 
        className="text-center relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="inline-block p-6 rounded-full bg-gradient-to-r from-rcb-red to-rcb-red-bright mb-8 animate-glow"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1, rotate: 15 }}
        >
          <Brain className="h-16 w-16 text-white" />
        </motion.div>
        
        <motion.h1 
          className="text-8xl font-bold text-white mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
        >
          404
        </motion.h1>
        
        <motion.p 
          className="text-2xl text-gray-400 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Page not found in the neural network
        </motion.p>
        
        <motion.p 
          className="text-gray-500 mb-12 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          The page you're looking for has been lost in the sentiment analysis pipeline. 
          Let's get you back to analyzing emotions!
        </motion.p>
        
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow text-white font-semibold px-8 py-4 rounded-lg transform transition-all duration-200 hover:shadow-lg hover:shadow-rcb-red/50 animate-glow"
              >
                <Home className="h-5 w-5 mr-2" />
                Return to Analysis
              </Button>
            </motion.div>
          </Link>
          
          <div className="mt-4">
            <motion.button
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-white transition-colors flex items-center justify-center mx-auto"
              whileHover={{ x: -5 }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back to previous page
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
