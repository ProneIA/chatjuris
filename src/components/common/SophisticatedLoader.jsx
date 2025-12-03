import React from "react";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";

export default function SophisticatedLoader({ size = "default", text = "Carregando..." }) {
  const sizeClasses = {
    small: { container: "w-8 h-8", icon: "w-4 h-4", ring: "w-10 h-10" },
    default: { container: "w-16 h-16", icon: "w-8 h-8", ring: "w-20 h-20" },
    large: { container: "w-24 h-24", icon: "w-12 h-12", ring: "w-28 h-28" },
  };

  const s = sizeClasses[size] || sizeClasses.default;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={`absolute inset-0 ${s.ring} -m-2 rounded-full border-2 border-transparent border-t-purple-500 border-r-indigo-500`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Middle pulsing ring */}
        <motion.div
          className={`absolute inset-0 ${s.container} rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20`}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Inner rotating ring (opposite direction) */}
        <motion.div
          className={`absolute inset-0 ${s.container} rounded-full border-2 border-transparent border-b-purple-400 border-l-indigo-400`}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center icon */}
        <motion.div
          className={`relative ${s.container} rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30`}
          animate={{ scale: [1, 0.95, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Scale className={`${s.icon} text-white`} />
        </motion.div>
        
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-purple-400"
            style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4 }}
            animate={{
              x: [0, 30, 0, -30, 0],
              y: [-30, 0, 30, 0, -30],
              scale: [1, 0.8, 1, 0.8, 1],
              opacity: [1, 0.6, 1, 0.6, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1,
            }}
          />
        ))}
      </div>
      
      {text && (
        <motion.p
          className="text-sm text-gray-500 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}