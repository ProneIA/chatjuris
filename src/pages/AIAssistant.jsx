import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus, Menu, X, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ChatInterface from "../components/ai/ChatInterface";
import ConversationList from "../components/ai/ConversationList";
import ModeSelector from "../components/ai/ModeSelector";
import WelcomeScreen from "../components/ai/WelcomeScreen";
import JurisprudenceSearch from "../components/ai/JurisprudenceSearch";
import UsageLimits from "../components/subscription/UsageLimits";

export default function AIAssistant() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMode, setSelectedMode] = useState("assistant");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
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
        // Create default free subscription
        return await base44.entities.Subscription.create({
          user_id: user.id,
          plan: "free",
          status: "active",
          conversations_limit: 5,
          conversations_used: 0,
          documents_limit: 2,
          documents_used: 0,
          jurisprudence_searches_limit: 2,
          jurisprudence_searches_used: 0,
          start_date: new Date().toISOString().split('T')[0],
          billing_cycle: "monthly",
          price: 0
        });
      }
      return subs[0];
    },
    enabled: !!user?.id
  });

  const updateUsageMutation = useMutation({
    mutationFn: ({ field, increment = 1 }) => {
      if (!subscription) return Promise.resolve();
      const currentUsed = subscription[field] || 0;
      return base44.entities.Subscription.update(subscription.id, {
        [field]: currentUsed + increment
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
      // Increment usage
      updateUsageMutation.mutate({ field: 'conversations_used' });
    },
  });

  const handleNewConversation = () => {
    // Check limits
    if (subscription) {
      const conversationsUsed = subscription.conversations_used || 0;
      const conversationsLimit = subscription.conversations_limit || 5;
      
      if (conversationsUsed >= conversationsLimit && conversationsLimit < 999999) {
        alert('🚫 Limite de conversas atingido! Faça upgrade para continuar.');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }

    const modeNames = {
      assistant: "Nova Conversa",
      image_generator: "Gerar Imagens",
      document_analyzer: "Analisar Documento",
      jurisprudence: "Pesquisa de Jurisprudência"
    };

    createConversationMutation.mutate({
      title: modeNames[selectedMode],
      mode: selectedMode,
      messages: [],
      last_message_at: new Date().toISOString()
    });
  };

  const handleModeChange = (mode) => {
    // Check if mode is available for current plan
    if (subscription && subscription.plan === 'free') {
      const restrictedModes = ['legal_document_generator', 'document_analyzer', 'image_generator'];
      if (restrictedModes.includes(mode)) {
        alert('🔒 Este modo é exclusivo para planos Premium! Faça upgrade para desbloquear.');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }
    setSelectedMode(mode);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When mode changes to jurisprudence, clear conversation
  useEffect(() => {
    if (selectedMode === 'jurisprudence') {
      setSelectedConversation(null);
    }
  }, [selectedMode]);

  const getModeInfo = () => {
    const modes = {
      assistant: { icon: "💬", name: "Assistente Geral", color: "from-blue-500 to-cyan-500" },
      jurisprudence: { icon: "⚖️", name: "Pesquisa de Jurisprudência", color: "from-emerald-500 to-teal-500" },
      legal_document_generator: { icon: "📜", name: "Gerador de Documentos", color: "from-purple-500 to-pink-500" },
      image_generator: { icon: "🎨", name: "Gerador de Imagens", color: "from-pink-500 to-rose-500" },
      document_analyzer: { icon: "📄", name: "Analisador de Documentos", color: "from-green-500 to-emerald-500" }
    };
    return modes[selectedMode] || modes.assistant;
  };

  const currentMode = getModeInfo();

  // Check if user has reached limits
  const hasReachedLimit = subscription && (
    (subscription.conversations_used >= subscription.conversations_limit && subscription.conversations_limit < 999999) ||
    (subscription.documents_used >= subscription.documents_limit && subscription.documents_limit < 999999) ||
    (subscription.jurisprudence_searches_used >= subscription.jurisprudence_searches_limit && subscription.jurisprudence_searches_limit < 999999)
  );

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
            <div className="p-6 border-b border-slate-200/50 bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <motion.div 
                      className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.6, 0.4]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      IA Jurídica
                    </h1>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-500" />
                      Powered by AI
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-purple-100"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {selectedMode !== 'jurisprudence' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button
                    onClick={handleNewConversation}
                    disabled={createConversationMutation.isPending || hasReachedLimit}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group disabled:opacity-50"
                  >
                    <MessageSquarePlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    {hasReachedLimit ? '🔒 Limite Atingido' : 'Nova Conversa'}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Usage Limits */}
            {subscription && (
              <div className="p-6 border-b border-slate-200/50 bg-gradient-to-br from-white/50 to-slate-50/50">
                <UsageLimits subscription={subscription} />
              </div>
            )}

            {/* Mode Selector */}
            <div className="p-6 border-b border-slate-200/50 bg-gradient-to-br from-white/50 to-blue-50/50">
              <ModeSelector selectedMode={selectedMode} setSelectedMode={handleModeChange} />
            </div>

            {/* Conversations List */}
            {selectedMode !== 'jurisprudence' && (
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  setSelectedConversation={setSelectedConversation}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Footer Info */}
            <motion.div 
              className="p-4 border-t border-slate-200/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Sistema operacional</span>
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <motion.div 
          className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center gap-4 shadow-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="hover:bg-purple-100"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1 flex items-center gap-3">
            <motion.div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <span className="text-xl">{currentMode.icon}</span>
            </motion.div>
            <div>
              {selectedMode === 'jurisprudence' ? (
                <>
                  <h2 className="font-semibold text-slate-900">{currentMode.name}</h2>
                  <p className="text-xs text-slate-500">STF, STJ, TRFs e outros tribunais</p>
                </>
              ) : selectedConversation ? (
                <>
                  <h2 className="font-semibold text-slate-900">{selectedConversation.title}</h2>
                  <p className="text-xs text-slate-500">{currentMode.icon} {currentMode.name}</p>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-slate-900">Bem-vindo ao {currentMode.name}</h2>
                  <p className="text-xs text-slate-500">Selecione ou crie uma conversa</p>
                </>
              )}
            </div>
          </div>
          
          {subscription && subscription.plan === 'free' && (
            <Button
              onClick={() => navigate(createPageUrl('Pricing'))}
              size="sm"
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          )}
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedMode === 'jurisprudence' ? (
              <motion.div
                key="jurisprudence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <JurisprudenceSearch subscription={subscription} updateUsage={updateUsageMutation.mutate} />
              </motion.div>
            ) : selectedConversation ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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