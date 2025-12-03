import React from "react";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";

export default function LoadingSpinner({ size = "default", text = "Carregando..." }) {
  const sizeClasses = {
    small: "w-8 h-8",
    default: "w-16 h-16",
    large: "w-24 h-24",
  };

  const iconSizes = {
    small: "w-3 h-3",
    default: "w-6 h-6",
    large: "w-10 h-10",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-2 border-transparent`}
          style={{
            borderTopColor: "#8b5cf6",
            borderRightColor: "#6366f1",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Middle pulsing ring */}
        <motion.div
          className={`absolute inset-1 rounded-full border-2 border-transparent`}
          style={{
            borderBottomColor: "#a855f7",
            borderLeftColor: "#818cf8",
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner glow */}
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Scale className={`${iconSizes[size]} text-purple-600`} />
          </motion.div>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
            style={{
              top: "50%",
              left: "50%",
              marginTop: -4,
              marginLeft: -4,
            }}
            animate={{
              x: [0, 30, 0, -30, 0],
              y: [-30, 0, 30, 0, -30],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.66,
            }}
          />
        ))}
      </div>

      {text && (
        <motion.p
          className="text-sm text-gray-500 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Full page loading overlay
export function FullPageLoader({ text = "Carregando..." }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="large" text={text} />
    </div>
  );
}

// Inline skeleton loader
export function ContentLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="default" text="" />
    </div>
  );
}