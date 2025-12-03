import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, FileText, Scale, Search, Sparkles, Check, BookOpen } from "lucide-react";

const modes = [
  {
    id: "assistant",
    name: "Assistente Geral",
    icon: MessageSquare,
    description: "Conversas e perguntas jurídicas",
    color: "from-blue-500 via-blue-600 to-cyan-600",
    lightBg: "from-blue-50 to-cyan-50",
    iconColor: "text-blue-600",
    emoji: "💬"
  },
  {
    id: "jurisprudence",
    name: "Jurisprudência",
    icon: Search,
    description: "STF, STJ e tribunais",
    color: "from-emerald-500 via-teal-600 to-green-600",
    lightBg: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-600",
    emoji: "⚖️"
  },
  {
    id: "document_summarizer",
    name: "Resumo de Documentos",
    icon: BookOpen,
    description: "Análise detalhada de peças jurídicas",
    color: "from-orange-500 via-amber-600 to-yellow-600",
    lightBg: "from-orange-50 to-amber-50",
    iconColor: "text-orange-600",
    emoji: "📚"
  },
  {
    id: "legal_document_generator",
    name: "Gerar Documentos",
    icon: Scale,
    description: "Petições e contratos",
    color: "from-purple-500 via-purple-600 to-pink-600",
    lightBg: "from-purple-50 to-pink-50",
    iconColor: "text-purple-600",
    emoji: "📜"
  },
  {
    id: "document_analyzer",
    name: "Analisar Documentos",
    icon: FileText,
    description: "Upload e análise de PDFs",
    color: "from-green-500 via-emerald-600 to-teal-600",
    lightBg: "from-green-50 to-emerald-50",
    iconColor: "text-green-600",
    emoji: "📄"
  }
];

export default function ModeSelector({ selectedMode, setSelectedMode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Escolha o Modo IA
          </label>
        </div>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <motion.button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full text-left p-4 rounded-xl transition-all duration-300 relative overflow-hidden
                  ${isSelected
                    ? `bg-gradient-to-r ${mode.color} shadow-xl ring-2 ring-offset-2 ring-purple-400 dark:ring-purple-600`
                    : `bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md`
                  }
                `}
              >
                {/* Background Pattern */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                  />
                )}

                <div className="relative flex items-center gap-3">
                  {/* Icon Container */}
                  <motion.div 
                    className={`
                      shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative
                      ${isSelected 
                        ? "bg-white/20 backdrop-blur-sm" 
                        : `bg-gradient-to-br ${mode.lightBg} dark:bg-slate-700`
                      }
                    `}
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? "text-white" : mode.iconColor + " dark:text-slate-300"}`} />
                    
                    {/* Emoji Badge */}
                    <motion.span 
                      className="absolute -top-1 -right-1 text-xs bg-white dark:bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      {mode.emoji}
                    </motion.span>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                        {mode.name}
                      </h3>
                      
                      {/* Selected Check */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <p className={`text-xs ${isSelected ? "text-white/90" : "text-slate-600 dark:text-slate-400"}`}>
                      {mode.description}
                    </p>
                  </div>

                  {/* Glow Effect on Hover */}
                  {!isSelected && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${mode.color} opacity-0 rounded-xl`}
                      whileHover={{ opacity: 0.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>

                {/* Bottom Accent Line */}
                {isSelected && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-100 dark:border-purple-800"
      >
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <Sparkles className="w-3 h-3 inline mr-1 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold">Dica:</span> Escolha o modo ideal para sua tarefa. Você pode alternar entre modos a qualquer momento!
        </p>
      </motion.div>
    </div>
  );
}