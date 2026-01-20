import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Calendar,
  DollarSign,
  Building2,
  Users,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "@/components/collaboration/CommentSection";

export default function CaseDetails({ caseData, onClose, onEdit, isPage = false, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const areaLabels = {
    civil: "Cível",
    criminal: "Criminal",
    trabalhista: "Trabalhista",
    tributario: "Tributário",
    familia: "Família",
    empresarial: "Empresarial",
    consumidor: "Consumidor",
    previdenciario: "Previdenciário",
    outros: "Outros"
  };

  const statusLabels = {
    new: "Novo",
    in_progress: "Em andamento",
    waiting: "Aguardando",
    closed: "Concluído",
    archived: "Arquivado"
  };

  const priorityLabels = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente"
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
    waiting: "bg-purple-100 text-purple-800 border-purple-200",
    closed: "bg-green-100 text-green-800 border-green-200",
    archived: "bg-gray-100 text-gray-800 border-gray-200"
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    urgent: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={isDark ? 'text-white hover:bg-neutral-800' : ''}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {caseData.title}
              </h1>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Processo #{caseData.case_number || 'N/A'}
              </p>
            </div>
          </div>
          <Button
            onClick={onEdit}
            variant="outline"
            className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className={statusColors[caseData.status]}>
            {statusLabels[caseData.status]}
          </Badge>
          <Badge variant="outline" className={priorityColors[caseData.priority]}>
            {priorityLabels[caseData.priority]}
          </Badge>
          <Badge variant="outline" className={isDark ? 'border-neutral-700 text-neutral-300' : ''}>
            {areaLabels[caseData.area]}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <TabsTrigger value="overview" className={isDark ? 'data-[state=active]:bg-neutral-800' : ''}>
              <FileText className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="comments" className={isDark ? 'data-[state=active]:bg-neutral-800' : ''}>
              <Users className="w-4 h-4 mr-2" />
              Comentários
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Informações do Processo
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Cliente
                  </p>
                  <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {caseData.client_name || 'N/A'}
                  </p>
                </div>

                {caseData.court && (
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Vara/Tribunal
                    </p>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {caseData.court}
                    </p>
                  </div>
                )}

                {caseData.opposing_party && (
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      Parte Contrária
                    </p>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {caseData.opposing_party}
                    </p>
                  </div>
                )}

                {caseData.start_date && (
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Data de Início
                    </p>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {format(new Date(caseData.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {caseData.deadline && (
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Prazo
                    </p>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {format(new Date(caseData.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {caseData.value && (
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Valor da Causa
                    </p>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(caseData.value)}
                    </p>
                  </div>
                )}
              </div>

              {caseData.description && (
                <div className="mt-6">
                  <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Descrição
                  </p>
                  <p className={`mt-2 whitespace-pre-wrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {caseData.description}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <CommentSection
                entityType="case"
                entityId={caseData.id}
                theme={theme}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}