import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit2, Trash2, MessageSquare, Check, X, Star } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConversationHistoryDialog({
  open,
  onClose,
  conversations,
  selectedConversation,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedConversations = filteredConversations.slice(startIndex, startIndex + itemsPerPage);

  const handleStartEdit = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico Completo de Conversas</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {paginatedConversations.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhuma conversa encontrada</p>
          ) : (
            paginatedConversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ scale: 1.01 }}
                className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedConversation?.id === conv.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-slate-200 hover:border-blue-300"
                }`}
                onClick={() => !editingId && onSelectConversation(conv)}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                  
                  {conv.is_favorite && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit();
                          }}
                          className="h-8 w-8"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {conv.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{conv.messages?.length || 0} mensagens</span>
                          <span>•</span>
                          <span>
                            {conv.last_message_at
                              ? format(new Date(conv.last_message_at), "dd MMM, HH:mm", { locale: ptBR })
                              : "Sem mensagens"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {editingId !== conv.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(conv);
                        }}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Excluir esta conversa?")) {
                            onDeleteConversation(conv.id);
                          }
                        }}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-slate-600">
              Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredConversations.length)} de {filteredConversations.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}