import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  StarOff, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Eye,
  ExternalLink,
  Users,
  Hash,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

// Função para destacar termos de busca no texto
function highlightText(text, searchTerms = []) {
  if (!text || !searchTerms.length) return text;
  
  let result = text;
  searchTerms.forEach(term => {
    if (term && term.length > 1) {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<mark class="bg-yellow-300 text-black px-0.5 rounded">$1</mark>');
    }
  });
  
  return result;
}

// Extrai snippet do conteúdo original focando na área com matches
function getContextSnippet(content, searchTerms = [], maxLength = 300) {
  if (!content) return "";
  
  // Se não há termos de busca, retorna o início do texto
  if (!searchTerms.length) {
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
  
  // Encontra a primeira ocorrência de qualquer termo
  const lowerContent = content.toLowerCase();
  let firstMatchIndex = content.length;
  
  searchTerms.forEach(term => {
    if (term) {
      const index = lowerContent.indexOf(term.toLowerCase());
      if (index !== -1 && index < firstMatchIndex) {
        firstMatchIndex = index;
      }
    }
  });
  
  // Pega contexto ao redor do match
  const start = Math.max(0, firstMatchIndex - 50);
  const end = Math.min(content.length, firstMatchIndex + maxLength - 50);
  
  let snippet = content.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  return snippet;
}

export default function PublicationAccordion({ 
  publication, 
  isDark, 
  categoryLabels, 
  urgencyConfig,
  onToggleStar,
  onViewDetails,
  onMarkAsRead,
  isExpanded,
  onToggleExpand,
  searchTerms = [],
  index
}) {
  const category = categoryLabels[publication.category] || categoryLabels.outros;
  const urgency = urgencyConfig[publication.urgency] || urgencyConfig.media;
  const CategoryIcon = category.icon;
  const UrgencyIcon = urgency.icon;
  
  const contentSnippet = getContextSnippet(
    publication.content || publication.original_content, 
    searchTerms,
    400
  );
  
  const highlightedSnippet = highlightText(contentSnippet, searchTerms);
  const highlightedTitle = highlightText(publication.title, searchTerms);
  const highlightedSummary = highlightText(publication.ai_summary, searchTerms);

  const handleToggle = () => {
    if (!publication.is_read && onMarkAsRead) {
      onMarkAsRead();
    }
    onToggleExpand();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border overflow-hidden transition-all ${
        isExpanded
          ? isDark ? 'bg-neutral-800/80 border-purple-500/50 shadow-lg shadow-purple-500/10' : 'bg-white border-purple-300 shadow-lg'
          : isDark ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700' : 'bg-white border-slate-200 hover:border-slate-300'
      } ${!publication.is_read ? 'ring-2 ring-purple-500/20' : ''}`}
    >
      {/* Header - Always Visible */}
      <div 
        onClick={handleToggle}
        className="p-4 cursor-pointer"
      >
        <div className="flex items-start gap-4">
          {/* Category Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-${category.color}-500/10`}>
            <CategoryIcon className={`w-5 h-5 text-${category.color}-500`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Unread indicator */}
              {!publication.is_read && (
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              )}
              
              {/* Category Badge */}
              <Badge variant="outline" className={`text-xs border-${category.color}-500/30 text-${category.color}-500`}>
                {category.label}
              </Badge>

              {/* Urgency Badge */}
              <Badge className={`text-xs bg-${urgency.color}-500/20 text-${urgency.color}-500 border-0`}>
                <UrgencyIcon className="w-3 h-3 mr-1" />
                {urgency.label}
              </Badge>

              {/* Match Count */}
              {publication._matchCount > 0 && (
                <Badge className="text-xs bg-yellow-500/20 text-yellow-600 border-0">
                  {publication._matchCount} ocorrência{publication._matchCount > 1 ? 's' : ''}
                </Badge>
              )}

              {/* Deadline */}
              {publication.deadline_detected && (
                <Badge variant="outline" className="text-xs text-red-500 border-red-500/30">
                  <Calendar className="w-3 h-3 mr-1" />
                  Prazo: {format(new Date(publication.deadline_detected), "dd/MM")}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 
              className={`font-medium line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
              dangerouslySetInnerHTML={{ __html: highlightedTitle }}
            />

            {/* Summary (collapsed) */}
            {!isExpanded && (
              <p 
                className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}
                dangerouslySetInnerHTML={{ __html: highlightedSummary || contentSnippet.substring(0, 150) }}
              />
            )}

            {/* Meta */}
            <div className={`flex items-center gap-3 mt-2 text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {publication.source}
              </span>
              {publication.publication_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(publication.publication_date), "dd/MM/yyyy")}
                </span>
              )}
              {publication.case_number && (
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <Hash className="w-3 h-3" />
                  {publication.case_number}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar();
              }}
              className={`${publication.is_starred ? 'text-yellow-500' : isDark ? 'text-neutral-500' : 'text-slate-400'}`}
            >
              {publication.is_starred ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={isDark ? 'text-neutral-400' : 'text-slate-400'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Accordion */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 border-t ${isDark ? 'border-neutral-700' : 'border-slate-200'}`}>
              {/* AI Summary Section */}
              {publication.ai_summary && (
                <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                  <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    <Eye className="w-4 h-4" />
                    Resumo IA
                  </h4>
                  <p 
                    className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}
                    dangerouslySetInnerHTML={{ __html: highlightedSummary }}
                  />
                </div>
              )}

              {/* Original Content Snippet */}
              <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-slate-50'}`}>
                <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  <FileText className="w-4 h-4" />
                  Trecho do Conteúdo Original
                </h4>
                <p 
                  className={`text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}
                  dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
                />
              </div>

              {/* Parties and Keywords */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {publication.parties_involved && publication.parties_involved.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      <Users className="w-3 h-3" />
                      Partes Envolvidas
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {publication.parties_involved.slice(0, 3).map((party, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {party}
                        </Badge>
                      ))}
                      {publication.parties_involved.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{publication.parties_involved.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {publication.keywords_matched && publication.keywords_matched.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      <Hash className="w-3 h-3" />
                      Palavras-chave
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {publication.keywords_matched.map((kw, i) => (
                        <Badge key={i} className="text-xs bg-purple-500/20 text-purple-500 border-0">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className={`gap-2 ${isDark ? 'border-neutral-600 hover:bg-neutral-700' : ''}`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Detalhes Completos
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}