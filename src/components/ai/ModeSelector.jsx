import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Image, FileText } from "lucide-react";

const modes = [
  {
    id: "assistant",
    name: "Assistente",
    icon: MessageSquare,
    description: "Chat geral e perguntas",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "image_generator",
    name: "Gerar Imagens",
    icon: Image,
    description: "Crie imagens com IA",
    color: "from-pink-500 to-purple-500"
  },
  {
    id: "document_analyzer",
    name: "Analisar Docs",
    icon: FileText,
    description: "Upload e análise",
    color: "from-green-500 to-emerald-500"
  }
];

export default function ModeSelector({ selectedMode, setSelectedMode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">
        Modo da IA
      </label>
      <div className="space-y-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <motion.button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                isSelected
                  ? "bg-gradient-to-r shadow-lg ring-2 ring-offset-2 ring-slate-300"
                  : "bg-white border border-slate-200 hover:border-slate-300"
              } ${isSelected ? mode.color : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? "bg-white/20" : "bg-slate-100"
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {mode.name}
                  </h3>
                  <p className={`text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                    {mode.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}