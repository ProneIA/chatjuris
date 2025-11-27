import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, StarOff, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function PublicationCard({ 
  publication, 
  isDark, 
  categoryLabels, 
  urgencyConfig,
  onSelect,
  onToggleStar,
  isSelected,
  index
}) {
  const category = categoryLabels[publication.category] || categoryLabels.outros;
  const urgency = urgencyConfig[publication.urgency] || urgencyConfig.media;
  const CategoryIcon = category.icon;
  const UrgencyIcon = urgency.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? isDark ? 'bg-neutral-800 border-purple-500' : 'bg-purple-50 border-purple-300'
          : isDark ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700' : 'bg-white border-slate-200 hover:border-slate-300'
      } ${!publication.is_read ? 'ring-2 ring-purple-500/20' : ''}`}
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
              <span className="w-2 h-2 rounded-full bg-purple-500" />
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

            {/* Deadline */}
            {publication.deadline_detected && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Prazo: {format(new Date(publication.deadline_detected), "dd/MM")}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className={`font-medium line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {publication.title}
          </h3>

          {/* Summary */}
          <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            {publication.ai_summary || publication.content?.substring(0, 150)}
          </p>

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
              <span className="truncate max-w-[150px]">
                Proc: {publication.case_number}
              </span>
            )}
          </div>
        </div>

        {/* Star Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className={`shrink-0 ${publication.is_starred ? 'text-yellow-500' : isDark ? 'text-neutral-500' : 'text-slate-400'}`}
        >
          {publication.is_starred ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
        </Button>
      </div>
    </motion.div>
  );
}