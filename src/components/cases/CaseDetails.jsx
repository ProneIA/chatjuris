import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Calendar, Scale, User, DollarSign, Building, AlertCircle, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "@/components/collaboration/CommentSection";
import ShareDialog from "@/components/collaboration/ShareDialog";
import { base44 } from "@/api/base44Client";

export default function CaseDetails({ caseData, onClose, onEdit }) {
  const [user, setUser] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-96 bg-white border-l border-slate-200 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Detalhes do Processo</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(caseData)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button onClick={() => setShowShareDialog(true)} variant="outline">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">{caseData.title}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              {caseData.status === 'new' && 'Novo'}
              {caseData.status === 'in_progress' && 'Em Andamento'}
              {caseData.status === 'waiting' && 'Aguardando'}
              {caseData.status === 'closed' && 'Fechado'}
            </Badge>
            <Badge variant="outline">
              {caseData.priority === 'urgent' && '🔴 Urgente'}
              {caseData.priority === 'high' && '🟠 Alta'}
              {caseData.priority === 'medium' && '🟡 Média'}
              {caseData.priority === 'low' && '🟢 Baixa'}
            </Badge>
          </div>
        </div>

        {caseData.description && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Descrição
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
              {caseData.description}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Informações do Processo
          </p>

          {caseData.case_number && (
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Número do Processo</p>
                <p className="font-medium text-slate-900">{caseData.case_number}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Cliente</p>
              <p className="font-medium text-slate-900">{caseData.client_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Área do Direito</p>
              <p className="font-medium text-slate-900 capitalize">{caseData.area}</p>
            </div>
          </div>

          {caseData.court && (
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Vara/Tribunal</p>
                <p className="font-medium text-slate-900">{caseData.court}</p>
              </div>
            </div>
          )}

          {caseData.opposing_party && (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Parte Contrária</p>
                <p className="font-medium text-slate-900">{caseData.opposing_party}</p>
              </div>
            </div>
          )}

          {caseData.value && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Valor da Causa</p>
                <p className="font-medium text-slate-900">
                  R$ {caseData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {caseData.start_date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Data de Início</p>
                <p className="font-medium text-slate-900">
                  {format(new Date(caseData.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}

          {caseData.deadline && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Prazo Importante</p>
                <p className="font-medium text-red-700">
                  {format(new Date(caseData.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>

        {caseData.shared_with?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Compartilhado com
            </p>
            <div className="flex flex-wrap gap-2">
              {caseData.shared_with.map((email) => (
                <Badge key={email} variant="secondary" className="text-xs">
                  {email}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <CommentSection entityType="case" entityId={caseData.id} />

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Sistema
          </p>
          <div className="text-sm text-slate-600 space-y-1">
            <p>
              Criado em: {format(new Date(caseData.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {caseData.created_by && <p>Por: {caseData.created_by}</p>}
          </div>
        </div>
      </div>

      {user && (
        <ShareDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          entity={caseData}
          entityType="case"
          user={user}
        />
      )}
    </motion.div>
  );
}