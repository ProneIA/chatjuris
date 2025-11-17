import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Loader2 } from "lucide-react";

const modeConfig = {
  assistant: { icon: "💬", color: "text-blue-500" },
  document_analyzer: { icon: "📄", color: "text-green-500" },
  legal_document_generator: { icon: "📜", color: "text-purple-500" },
  jurisprudence: { icon: "⚖️", color: "text-emerald-500" },
  document_summarizer: { icon: "📚", color: "text-orange-500" }
};

export default function ConversationList({ conversations, selectedConversation, setSelectedConversation, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
        <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">Nenhuma conversa ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-2">
      {conversations.map((conv) => {
        const mode = modeConfig[conv.mode] || modeConfig.assistant;
        const isSelected = selectedConversation?.id === conv.id;

        return (
          <motion.button
            key={conv.id}
            onClick={() => setSelectedConversation(conv)}
            whileHover={{ x: 4 }}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
              isSelected
                ? 'bg-slate-700 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0 mt-0.5">{mode.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {conv.messages?.length || 0} mensagens
                </p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}