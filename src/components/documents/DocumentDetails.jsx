import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Download, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DocumentDetails({ document, onClose, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState(document.status);
  const [editedNotes, setEditedNotes] = useState(document.notes || "");

  const handleSave = () => {
    onUpdate({
      status: editedStatus,
      notes: editedNotes
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-96 bg-white border-l border-slate-200 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Detalhes do Documento</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          {document.file_url && (
            <Button asChild variant="outline" className="flex-1">
              <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (confirm('Deseja realmente excluir este documento?')) {
                onDelete();
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">{document.title}</h3>
          <Badge>{document.type}</Badge>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Status
            </label>
            {isEditing ? (
              <Select value={editedStatus} onValueChange={setEditedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className="text-base px-4 py-2">
                {document.status === 'draft' && 'Rascunho'}
                {document.status === 'review' && 'Em Revisão'}
                {document.status === 'approved' && 'Aprovado'}
                {document.status === 'sent' && 'Enviado'}
                {document.status === 'archived' && 'Arquivado'}
              </Badge>
            )}
          </div>

          {document.template_used && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Template Utilizado</p>
              <p className="text-slate-900">{document.template_used}</p>
            </div>
          )}

          {document.case_id && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Processo</p>
              <p className="text-slate-900">ID: {document.case_id}</p>
            </div>
          )}

          {document.client_id && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Cliente</p>
              <p className="text-slate-900">ID: {document.client_id}</p>
            </div>
          )}

          {document.content && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Conteúdo</p>
              <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {document.content}
                </pre>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Observações
            </label>
            {isEditing ? (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={4}
                placeholder="Adicione observações..."
              />
            ) : (
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                {document.notes || 'Sem observações'}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Informações do Sistema
            </p>
            <div className="text-sm text-slate-600 space-y-1">
              <p>
                Criado em: {format(new Date(document.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {document.created_by && <p>Por: {document.created_by}</p>}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedStatus(document.status);
                  setEditedNotes(document.notes || "");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Salvar
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              Editar Documento
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}