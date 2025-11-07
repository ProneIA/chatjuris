import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ChatInterface from "../components/ai/ChatInterface";
import ConversationList from "../components/ai/ConversationList";
import ModeSelector from "../components/ai/ModeSelector";
import WelcomeScreen from "../components/ai/WelcomeScreen";

export default function AIAssistant() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMode, setSelectedMode] = useState("assistant");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('name'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('title'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation);
    },
  });

  const handleNewConversation = () => {
    const modeNames = {
      assistant: "Nova Conversa",
      image_generator: "Gerar Imagens",
      document_analyzer: "Analisar Documento",
      legal_document: "Gerar Documento Jurídico"
    };

    createConversationMutation.mutate({
      title: modeNames[selectedMode],
      mode: selectedMode,
      messages: [],
      last_message_at: new Date().toISOString()
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 flex flex-col shadow-2xl lg:relative absolute inset-y-0 left-0 z-40"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-30 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      IA Jurídica
                    </h1>
                    <p className="text-xs text-slate-500">Assistente Legal Inteligente</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <Button
                onClick={handleNewConversation}
                disabled={createConversationMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Nova Conversa
              </Button>
            </div>

            {/* Mode Selector */}
            <div className="p-6 border-b border-slate-200/50">
              <ModeSelector selectedMode={selectedMode} setSelectedMode={setSelectedMode} />
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
                isLoading={isLoading}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center gap-4 shadow-sm">
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1">
            {selectedConversation ? (
              <div>
                <h2 className="font-semibold text-slate-900">{selectedConversation.title}</h2>
                <p className="text-xs text-slate-500">
                  {selectedConversation.mode === 'assistant' && '💬 Assistente Geral'}
                  {selectedConversation.mode === 'image_generator' && '🎨 Gerador de Imagens'}
                  {selectedConversation.mode === 'document_analyzer' && '📄 Analisador de Documentos'}
                  {selectedConversation.mode === 'legal_document' && '⚖️ Gerador de Documentos Jurídicos'}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold text-slate-900">Bem-vindo</h2>
                <p className="text-xs text-slate-500">Selecione ou crie uma conversa</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          {selectedConversation ? (
            <ChatInterface
              conversation={selectedConversation}
              templates={templates}
              cases={cases}
              clients={clients}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
            />
          ) : (
            <WelcomeScreen onNewConversation={handleNewConversation} selectedMode={selectedMode} />
          )}
        </div>
      </main>
    </div>
  );
}