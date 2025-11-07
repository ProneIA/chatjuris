import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Image, FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const modeIcons = {
  assistant: MessageSquare,
  image_generator: Image,
  document_analyzer: FileText
};

const modeColors = {
  assistant: "text-blue-600 bg-blue-100",
  image_generator: "text-pink-600 bg-pink-100",
  document_analyzer: "text-green-600 bg-green-100"
};

export default function ConversationList({ 
  conversations, 
  selectedConversation, 
  setSelectedConversation,
  isLoading 
}) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">Nenhuma conversa ainda</p>
        <p className="text-xs text-slate-400 mt-1">Crie uma nova conversa para começar</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {conversations.map((conversation) => {
        const Icon = modeIcons[conversation.mode] || MessageSquare;
        const isSelected = selectedConversation?.id === conversation.id;

        return (
          <motion.button
            key={conversation.id}
            onClick={() => setSelectedConversation(conversation)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
              isSelected
                ? "bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 shadow-md"
                : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${modeColors[conversation.mode]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${
                  isSelected ? "text-blue-900" : "text-slate-900"
                }`}>
                  {conversation.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {conversation.messages?.length || 0} mensagens
                </p>
                {conversation.last_message_at && (
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}