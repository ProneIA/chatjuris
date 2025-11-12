import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Star, 
  ExternalLink, 
  Calendar, 
  Edit, 
  Save, 
  Trash2,
  FileText,
  Link as LinkIcon
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function JurisprudenceDetails({ 
  jurisprudence, 
  cases, 
  onClose, 
  onUpdate, 
  onDelete 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(jurisprudence.notes || "");
  const [caseId, setCaseId] = useState(jurisprudence.case_id || "");

  const handleToggleFavorite = () => {
    onUpdate({ ...jurisprudence, is_favorite: !jurisprudence.is_favorite });
  };

  const handleSaveEdits = () => {
    onUpdate({ ...jurisprudence, notes, case_id: caseId || undefined });
    setIsEditing(false);
  };

  const courtColors = {
    STF: "bg-blue-100 text-blue-800",
    STJ: "bg-purple-100 text-purple-800",
    TST: "bg-green-100 text-green-800",
    TSE: "bg-yellow-100 text-yellow-800",
    TRF: "bg-indigo-100 text-indigo-800",
    TJ: "bg-pink-100 text-pink-800",
    TRT: "bg-orange-100 text-orange-800",
    outros: "bg-gray-100 text-gray-800"
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-[600px] bg-white border-l border-slate-200 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Detalhes</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className={jurisprudence.is_favorite ? "text-yellow-500" : ""}
            >
              <Star 
                className={`w-5 h-5 ${jurisprudence.is_favorite ? "fill-yellow-500" : ""}`} 
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => isEditing ? handleSaveEdits() : setIsEditing(true)}
            className="flex-1"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Title and Court */}
        <div>
          <Badge className={courtColors[jurisprudence.court]} size="lg">
            {jurisprudence.court}
          </Badge>
          <h3 className="text-lg font-bold text-slate-900 mt-3">
            {jurisprudence.title}
          </h3>
        </div>

        {/* Case Number */}
        {jurisprudence.case_number && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Número do Processo
            </p>
            <p className="font-mono text-sm text-slate-900 bg-slate-50 rounded-lg p-3">
              {jurisprudence.case_number}
            </p>
          </div>
        )}

        {/* Decision Date */}
        {jurisprudence.decision_date && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            Data da decisão: {format(new Date(jurisprudence.decision_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        )}

        {/* Summary */}
        {jurisprudence.summary && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Resumo
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
              {jurisprudence.summary}
            </p>
          </div>
        )}

        {/* Full Text */}
        {jurisprudence.full_text && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Texto Completo
            </p>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
              {jurisprudence.full_text}
            </div>
          </div>
        )}

        {/* Tags */}
        {jurisprudence.tags && jurisprudence.tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {jurisprudence.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Source URL */}
        {jurisprudence.source_url && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Fonte
            </p>
            <a
              href={jurisprudence.source_url.startsWith('http') ? jurisprudence.source_url : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1 bg-blue-50 rounded-lg p-3"
            >
              {jurisprudence.source_url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Relevance Score */}
        {jurisprudence.relevance_score && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Relevância
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${jurisprudence.relevance_score}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {jurisprudence.relevance_score}%
              </span>
            </div>
          </div>
        )}

        {/* Notes (Editable) */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Anotações Pessoais
          </p>
          {isEditing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione suas observações sobre esta jurisprudência..."
              rows={6}
            />
          ) : (
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 min-h-[100px]">
              {jurisprudence.notes || (
                <span className="text-slate-400 italic">Nenhuma anotação ainda</span>
              )}
            </div>
          )}
        </div>

        {/* Related Case (Editable) */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Processo Relacionado
          </p>
          {isEditing ? (
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um processo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhum</SelectItem>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
              {jurisprudence.case_id ? (
                cases.find(c => c.id === jurisprudence.case_id)?.title || "Processo não encontrado"
              ) : (
                <span className="text-slate-400 italic">Não vinculado a nenhum processo</span>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Informações do Sistema
          </p>
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Salva em: {format(new Date(jurisprudence.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {jurisprudence.created_by && (
              <p>Por: {jurisprudence.created_by}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}