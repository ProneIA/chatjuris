import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus, Menu, X, Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

import ChatInterface from "../components/ai/ChatInterface";
import ModeSelector from "../components/ai/ModeSelector";
import WelcomeScreen from "../components/ai/WelcomeScreen";
import JurisprudenceSearch from "../components/ai/JurisprudenceSearch";
import DocumentSummarizer from "../components/ai/DocumentSummarizer";

const shouldResetDaily = (subscription) => {
  if (!subscription || !subscription.last_reset_date) return true;
  
  const today = new Date().toISOString().split('T')[0];
  return subscription.last_reset_date !== today;
};

export default function AIAssistant() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMode, setSelectedMode] = useState("assistant");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at'),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      
      if (subs.length === 0) {
        const newSub = await base44.entities.Subscription.create({
          user_id: user.id,
          plan: "free",
          status: "active",
          daily_actions_limit: 5,
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
          price: 0
        });
        return newSub;
      }
      
      const sub = subs[0];
      
      if (shouldResetDaily(sub)) {
        const resetSub = await base44.entities.Subscription.update(sub.id, {
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        });
        return resetSub;
      }
      
      return sub;
    },
    enabled: !!user?.id
  });

  const updateUsageMutation = useMutation({
    mutationFn: ({ increment = 1 }) => {
      if (!subscription) return Promise.resolve();
      if (subscription.plan === "pro") return Promise.resolve();
      
      const currentUsed = subscription.daily_actions_used || 0;
      return base44.entities.Subscription.update(subscription.id, {
        daily_actions_used: currentUsed + increment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation);
      updateUsageMutation.mutate({ increment: 1 });
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    },
  });

  const handleNewConversation = () => {
    if (subscription && subscription.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      
      if (used >= limit) {
        alert('🚫 Você atingiu o limite de 5 ações diárias! Volte amanhã ou faça upgrade para o Plano Pro.');
        return;
      }
    }

    const modeNames = {
      assistant: "Nova Conversa",
      document_analyzer: "Analisar Documento",
      legal_document_generator: "Gerar Documento Legal",
      jurisprudence: "Pesquisa de Jurisprudência",
      document_summarizer: "Resumo de Documento"
    };

    createConversationMutation.mutate({
      title: modeNames[selectedMode],
      mode: selectedMode,
      messages: [],
      last_message_at: new Date().toISOString()
    });
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    if (mode === 'jurisprudence' || mode === 'document_summarizer') {
      setSelectedConversation(null);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showConversationsList = !['jurisprudence', 'document_summarizer'].includes(selectedMode);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Mobile Overlay */}
            {window.innerWidth < 768 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />
            )}

            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-80 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 md:relative md:z-0"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-slate-900">Assistente IA</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <Button
                  onClick={handleNewConversation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={createConversationMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conversa
                </Button>
              </div>

              {/* Mode Selector */}
              <div className="p-4 border-b border-slate-200 flex-shrink-0">
                <ModeSelector selectedMode={selectedMode} setSelectedMode={handleModeChange} />
              </div>

              {/* Search */}
              {showConversationsList && conversations.length > 0 && (
                <div className="p-4 border-b border-slate-200 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Buscar conversas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Conversations List */}
              {showConversationsList && (
                <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <MessageSquarePlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma conversa ainda</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setSelectedConversation(conv);
                            if (window.innerWidth < 768) {
                              setIsSidebarOpen(false);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedConversation?.id === conv.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {conv.messages?.length || 0} mensagens
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            {selectedConversation ? (
              <div>
                <h2 className="font-semibold text-slate-900 truncate">
                  {selectedConversation.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedConversation.messages?.length || 0} mensagens
                </p>
              </div>
            ) : (
              <h2 className="font-semibold text-slate-900">
                Assistente IA
              </h2>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedMode === 'jurisprudence' ? (
              <motion.div
                key="jurisprudence"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <JurisprudenceSearch subscription={subscription} updateUsage={updateUsageMutation.mutate} />
              </motion.div>
            ) : selectedMode === 'document_summarizer' ? (
              <motion.div
                key="document_summarizer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <DocumentSummarizer />
              </motion.div>
            ) : selectedConversation ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <ChatInterface
                  conversation={selectedConversation}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
                  subscription={subscription}
                  updateUsage={updateUsageMutation.mutate}
                />
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <WelcomeScreen onNewConversation={handleNewConversation} selectedMode={selectedMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}