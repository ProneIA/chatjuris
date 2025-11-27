import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  StarOff, 
  Calendar, 
  FileText, 
  X, 
  Building2,
  Users,
  AlertTriangle,
  Sparkles,
  Copy,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function PublicationDetails({ 
  publication, 
  isDark, 
  categoryLabels, 
  urgencyConfig,
  onClose,
  onToggleStar
}) {
  const category = categoryLabels[publication.category] || categoryLabels.outros;
  const urgency = urgencyConfig[publication.urgency] || urgencyConfig.media;
  const CategoryIcon = category.icon;
  const UrgencyIcon = urgency.icon;

  const copyContent = () => {
    navigator.clipboard.writeText(publication.content || publication.ai_summary);
    toast.success("Conteúdo copiado!");
  };

  return (
    <div className={`sticky top-24 rounded-xl border overflow-hidden ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${category.color}-500/10`}>
            <CategoryIcon className={`w-4 h-4 text-${category.color}-500`} />
          </div>
          <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {category.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleStar}
            className={publication.is_starred ? 'text-yellow-500' : ''}
          >
            {publication.is_starred ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Urgency Alert */}
        {publication.urgency === 'alta' && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">Atenção: Publicação Urgente</span>
            </div>
            {publication.deadline_detected && (
              <p className="text-sm mt-1 text-red-400">
                Prazo: {format(new Date(publication.deadline_detected), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {publication.title}
          </h2>
        </div>

        {/* Meta Info */}
        <div className={`grid grid-cols-2 gap-3 text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>{publication.court || publication.source}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {publication.publication_date && format(new Date(publication.publication_date), "dd/MM/yyyy")}
            </span>
          </div>
          {publication.case_number && (
            <div className="col-span-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-mono">{publication.case_number}</span>
            </div>
          )}
        </div>

        {/* Parties */}
        {publication.parties_involved?.length > 0 && (
          <div>
            <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Users className="w-4 h-4" />
              Partes Envolvidas
            </h4>
            <div className="flex flex-wrap gap-2">
              {publication.parties_involved.map((party, i) => (
                <Badge key={i} variant="outline" className={`text-xs ${isDark ? 'border-neutral-700' : ''}`}>
                  {party}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {publication.ai_summary && (
          <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-slate-50'}`}>
            <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-4 h-4 text-purple-500" />
              Resumo da IA
            </h4>
            <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
              {publication.ai_summary}
            </p>
          </div>
        )}

        {/* AI Analysis */}
        {publication.ai_analysis && (
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              <Sparkles className="w-4 h-4" />
              Análise e Recomendações
            </h4>
            <div className={`text-sm prose prose-sm max-w-none ${isDark ? 'prose-invert text-blue-200' : 'text-blue-800'}`}>
              <ReactMarkdown>{publication.ai_analysis}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Original Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Conteúdo Original
            </h4>
            <Button variant="ghost" size="sm" onClick={copyContent}>
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>
          </div>
          <div className={`p-4 rounded-lg text-sm max-h-48 overflow-y-auto ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-slate-50 text-slate-700'}`}>
            {publication.content || "Conteúdo não disponível"}
          </div>
        </div>

        {/* Keywords */}
        {publication.keywords_matched?.length > 0 && (
          <div>
            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Palavras-chave Correspondentes
            </h4>
            <div className="flex flex-wrap gap-2">
              {publication.keywords_matched.map((kw, i) => (
                <Badge key={i} className="bg-purple-500/20 text-purple-500 border-0">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}