import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TemplateDetails({ template, onClose, onEdit, onDelete, onToggleFavorite }) {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-96 bg-white border-l border-slate-200 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Detalhes do Template</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(template)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onToggleFavorite(!template.is_favorite)}
            className={template.is_favorite ? "text-yellow-600" : ""}
          >
            <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-yellow-600' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (confirm('Deseja realmente excluir este template?')) {
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
          <h3 className="text-xl font-bold text-slate-900 mb-3">{template.name}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge>{template.category}</Badge>
            <Badge variant="outline">{template.area}</Badge>
          </div>
        </div>

        {template.description && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Descrição
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
              {template.description}
            </p>
          </div>
        )}

        {template.variables?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Variáveis ({template.variables.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((variable, index) => (
                <Badge key={index} variant="secondary">
                  {variable}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Conteúdo do Template
          </p>
          <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
              {template.content}
            </pre>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Informações do Sistema
          </p>
          <div className="text-sm text-slate-600 space-y-1">
            <p>
              Criado em: {format(new Date(template.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {template.created_by && <p>Por: {template.created_by}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}