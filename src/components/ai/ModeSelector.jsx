import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Image, FileText, Scale, Search } from "lucide-react";

const modes = [
  {
    id: "assistant",
    name: "Assistente Geral",
    icon: MessageSquare,
    description: "Perguntas e conversas sobre qualquer tema jurídico",
    color: "from-blue-500 via-blue-600 to-cyan-600",
    bgColor: "from-blue-50 to-cyan-50",
    iconColor: "text-blue-600",
    emoji: "💬"
  },
  {
    id: "jurisprudence",
    name: "Jurisprudência",
    icon: Search,
    description: "Pesquise decisões do STF, STJ e outros tribunais",
    color: "from-emerald-500 via-green-600 to-teal-600",
    bgColor: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-600",
    emoji: "⚖️"
  },
  {
    id: "legal_document_generator",
    name: "Gerar Documento",
    icon: Scale,
    description: "Crie petições, contratos e peças processuais",
    color: "from-purple-500 via-purple-600 to-pink-600",
    bgColor: "from-purple-50 to-pink-50",
    iconColor: "text-purple-600",
    emoji: "📋"
  },
  {
    id: "document_analyzer",
    name: "Analisar Documento",
    icon: FileText,
    description: "Upload e análise de PDFs e documentos legais",
    color: "from-green-500 via-emerald-600 to-green-600",
    bgColor: "from-green-50 to-emerald-50",
    iconColor: "text-green-600",
    emoji: "📄"
  },
  {
    id: "image_generator",
    name: "Criar Imagens",
    icon: Image,
    description: "Gere imagens e ilustrações com IA",
    color: "from-pink-500 via-rose-600 to-red-600",
    bgColor: "from-pink-50 to-rose-50",
    iconColor: "text-pink-600",
    emoji: "🎨"
  }
];

export default function ModeSelector({ selectedMode, setSelectedMode }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Escolha o Modo da IA</h3>
        <p className="text-xs text-slate-500">Selecione como deseja usar o assistente</p>
      </div>
      
      <div className="space-y-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <motion.button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left rounded-2xl transition-all duration-300 overflow-hidden ${
                isSelected
                  ? "shadow-xl ring-2 ring-offset-2 ring-blue-400"
                  : "shadow-sm hover:shadow-md"
              }`}
            >
              <div className={`relative p-4 ${
                isSelected
                  ? `bg-gradient-to-br ${mode.color}`
                  : `bg-gradient-to-br ${mode.bgColor} border-2 border-slate-200`
              }`}>
                {/* Floating emoji decoration */}
                <div className={`absolute top-2 right-2 text-2xl transition-transform duration-300 ${
                  isSelected ? "scale-125" : "scale-100 opacity-40"
                }`}>
                  {mode.emoji}
                </div>

                {/* Icon and content */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                      ? "bg-white/20 backdrop-blur-sm shadow-lg" 
                      : "bg-white shadow-sm"
                  }`}>
                    <Icon className={`w-6 h-6 transition-colors duration-300 ${
                      isSelected ? "text-white" : mode.iconColor
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className={`text-base font-bold mb-1 transition-colors duration-300 ${
                      isSelected ? "text-white" : "text-slate-900"
                    }`}>
                      {mode.name}
                    </h3>
                    <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                      isSelected ? "text-white/90" : "text-slate-600"
                    }`}>
                      {mode.description}
                    </p>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                  </motion.div>
                )}

                {/* Shine effect on hover */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100 rounded-xl p-3"
      >
        <p className="text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold">💡 Dica:</span> Cada modo é otimizado para tarefas específicas. 
          Escolha o mais adequado para suas necessidades!
        </p>
      </motion.div>
    </div>
  );
}