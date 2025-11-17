import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingAIButton({ onClick }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <Button
        onClick={onClick}
        size="lg"
        className="relative h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 shadow-2xl group"
        title="Abrir Assistente IA"
      >
        <MessageSquare className="w-7 h-7 text-white" />
        
        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-75"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.75, 0, 0.75],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Sparkle Icon */}
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles className="w-3 h-3 text-white" />
        </motion.div>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
            Assistente IA - Clique para conversar
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      </Button>
    </motion.div>
  );
}