import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  ListChecks, 
  Users, 
  ClipboardList, 
  Clock, 
  AlertTriangle, 
  Lightbulb,
  Sparkles,
  X
} from "lucide-react";

const quickActions = [
  {
    id: "summary",
    icon: FileText,
    title: "Resumo Executivo",
    description: "Visão geral completa do documento",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "key_clauses",
    icon: ListChecks,
    title: "Cláusulas Principais",
    description: "Identificar cláusulas críticas",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "parties",
    icon: Users,
    title: "Partes Envolvidas",
    description: "Listar todas as partes e seus papéis",
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "obligations",
    icon: ClipboardList,
    title: "Obrigações & Direitos",
    description: "Direitos e deveres de cada parte",
    color: "from-orange-500 to-amber-500"
  },
  {
    id: "deadlines",
    icon: Clock,
    title: "Prazos & Datas",
    description: "Identificar datas importantes",
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "risks",
    icon: AlertTriangle,
    title: "Análise de Riscos",
    description: "Identificar riscos e pontos de atenção",
    color: "from-red-500 to-rose-500"
  },
  {
    id: "amendments",
    icon: Lightbulb,
    title: "Sugestões de Melhoria",
    description: "Recomendações de alterações",
    color: "from-yellow-500 to-orange-500"
  }
];

export default function DocumentAnalysisPanel({ fileName, onQuickAnalysis, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Análise de Documento</h3>
              <p className="text-sm text-slate-600 truncate max-w-xs">{fileName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-slate-700">Análises Rápidas com IA</p>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Selecione uma análise pré-configurada ou faça sua própria pergunta no campo abaixo
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                onClick={() => onQuickAnalysis(action.id)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">
                  {action.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {action.description}
                </p>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            💡 Dica: Você também pode fazer perguntas personalizadas no campo de mensagem abaixo
          </p>
        </div>
      </Card>
    </motion.div>
  );
}