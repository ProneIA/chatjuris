import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Minimize2, Maximize2, MessageSquarePlus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatInterface from "../ai/ChatInterface";
import ModeSelector from "../ai/ModeSelector";
import JurisprudenceSearch from "../ai/JurisprudenceSearch";
import DocumentSummarizer from "../ai/DocumentSummarizer";

export default function AIAssistantPanel({ isOpen, onClose, currentPageContext }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMode, setSelectedMode] = useState("assistant");
  const [isMinimized, setIsMinimized] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at'),
    enabled: isOpen,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (subs.length === 0) {
        return await base44.entities.Subscription.create({
          user_id: user.id,
          plan: "free",
          status: "active",
          daily_actions_limit: 5,
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
          price: 0
        });
      }
      return subs[0];
    },
    enabled: !!user?.id && isOpen
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation);
    },
  });

  const handleNewConversation = () => {
    const contextMessage = currentPageContext 
      ? `Estou na página: ${currentPageContext}. ` 
      : "";

    createConversationMutation.mutate({
      title: `Conversa ${currentPageContext || 'Nova'}`,
      mode: selectedMode,
      messages: contextMessage ? [{
        role: "system",
        content: contextMessage,
        timestamp: new Date().toISOString()
      }] : [],
      last_message_at: new Date().toISOString()
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0, height: isMinimized ? '60px' : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l-2 border-blue-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Assistente IA</h2>
              <p className="text-xs text-white/80">Seu assistente jurídico inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Context Badge */}
            {currentPageContext && (
              <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                <p className="text-xs text-blue-700">
                  📍 Contexto: <span className="font-semibold">{currentPageContext}</span>
                </p>
              </div>
            )}

            {/* Mode Selector */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <ModeSelector selectedMode={selectedMode} setSelectedMode={setSelectedMode} />
            </div>

            {/* Quick Actions */}
            {!selectedConversation && (
              <div className="p-4 border-b border-slate-200">
                <Button
                  onClick={handleNewConversation}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white"
                >
                  <MessageSquarePlus className="w-4 h-4 mr-2" />
                  Nova Conversa
                </Button>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              {selectedMode === 'jurisprudence' ? (
                <JurisprudenceSearch subscription={subscription} />
              ) : selectedMode === 'document_summarizer' ? (
                <DocumentSummarizer />
              ) : selectedConversation ? (
                <ChatInterface
                  conversation={selectedConversation}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
                  subscription={subscription}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Como posso ajudar?
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Inicie uma conversa ou escolha um modo específico
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Conversations */}
            {!selectedConversation && selectedMode === 'assistant' && conversations.length > 0 && (
              <div className="border-t border-slate-200 p-4 max-h-48 overflow-y-auto bg-slate-50">
                <p className="text-xs font-semibold text-slate-500 mb-2">CONVERSAS RECENTES</p>
                <div className="space-y-2">
                  {conversations.slice(0, 3).map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className="w-full text-left p-2 rounded-lg hover:bg-white border border-slate-200 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate">{conv.title}</p>
                      <p className="text-xs text-slate-500">
                        {conv.messages?.length || 0} mensagens
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}