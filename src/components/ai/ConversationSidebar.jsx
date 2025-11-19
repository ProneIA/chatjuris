import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MessageSquare, 
  Pencil, 
  Check, 
  X, 
  Trash2,
  Clock,
  History
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ConversationHistoryDialog from "./ConversationHistoryDialog";

export default function ConversationSidebar({ 
  conversations, 
  selectedConversation, 
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const filteredConversations = conversations.filter(conv => {
    const matchesTitle = conv.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContent = conv.messages?.some(msg => 
      msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesTitle || matchesContent;
  });

  // Mostrar apenas últimas 5 conversas se não houver busca
  const displayedConversations = searchTerm ? filteredConversations : filteredConversations.slice(0, 5);

  const handleStartEdit = (conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = (conversationId) => {
    if (editTitle.trim()) {
      onRenameConversation(conversationId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-50"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {filteredConversations.length} {filteredConversations.length === 1 ? 'conversa' : 'conversas'}
        </p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {displayedConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
            </div>
          ) : (
            displayedConversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const isEditing = editingId === conversation.id;
              const messageCount = conversation.messages?.length || 0;
              
              return (
                <motion.div
                  key={conversation.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`mb-2 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-white border-blue-300 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="p-3">
                    {isEditing ? (
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(conversation.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50"
                          onClick={() => handleSaveEdit(conversation.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer group"
                        onClick={() => !isEditing && onSelectConversation(conversation)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`text-sm font-medium line-clamp-1 ${
                            isSelected ? 'text-blue-700' : 'text-slate-900'
                          }`}>
                            {conversation.title}
                          </h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 shrink-0 hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(conversation);
                              }}
                            >
                              <Pencil className="w-3 h-3 text-slate-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 shrink-0 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Excluir esta conversa?')) {
                                  onDeleteConversation(conversation.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <MessageSquare className="w-3 h-3" />
                          <span>{messageCount} {messageCount === 1 ? 'mensagem' : 'mensagens'}</span>
                          {conversation.last_message_at && (
                            <>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>
                                {format(new Date(conversation.last_message_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Preview da última mensagem */}
                        {messageCount > 0 && conversation.messages[messageCount - 1]?.content && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                            {conversation.messages[messageCount - 1].content}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Botão Ver Histórico Completo */}
      {!searchTerm && conversations.length > 5 && (
        <div className="p-3 border-t border-slate-200 bg-white">
          <Button
            onClick={() => setShowHistoryDialog(true)}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <History className="w-4 h-4 mr-2" />
            Ver Histórico Completo ({conversations.length})
          </Button>
        </div>
      )}

      {/* Dialog de Histórico Completo */}
      <ConversationHistoryDialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={(conv) => {
          onSelectConversation(conv);
          setShowHistoryDialog(false);
        }}
        onRenameConversation={onRenameConversation}
        onDeleteConversation={onDeleteConversation}
      />
    </div>
  );
}