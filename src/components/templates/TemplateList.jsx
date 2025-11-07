import React from "react";
import { motion } from "framer-motion";
import { BookTemplate, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors = {
  peticao: "bg-blue-100 text-blue-800",
  recurso: "bg-purple-100 text-purple-800",
  contestacao: "bg-red-100 text-red-800",
  contrato: "bg-green-100 text-green-800",
  procuracao: "bg-yellow-100 text-yellow-800",
  parecer: "bg-indigo-100 text-indigo-800",
  memorando: "bg-pink-100 text-pink-800",
  outros: "bg-slate-100 text-slate-800"
};

export default function TemplateList({ templates, isLoading, onSelectTemplate, selectedTemplate }) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <BookTemplate className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Nenhum template encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectTemplate(template)}
          className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all ${
            selectedTemplate?.id === template.id
              ? 'border-blue-500 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <BookTemplate className="w-6 h-6 text-white" />
            </div>
            {template.is_favorite && (
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            )}
          </div>

          <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2">
            {template.name}
          </h3>

          {template.description && (
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
              {template.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Badge className={categoryColors[template.category]}>
              {template.category}
            </Badge>
            {template.area && (
              <Badge variant="outline" className="text-xs">
                {template.area}
              </Badge>
            )}
          </div>

          {template.variables?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                {template.variables.length} variáveis
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}