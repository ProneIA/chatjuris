import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Sparkles, Loader2, Calendar, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { format, addHours, addDays, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AIScheduler({ cases, clients, events, connections, onSchedule, onClose }) {
  const [selectedCase, setSelectedCase] = useState("");
  const [analysisType, setAnalysisType] = useState("full");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const hasActiveConnection = connections.some(c => c.is_active);
  const defaultConnection = connections.find(c => c.is_default) || connections.find(c => c.is_active);

  const handleAnalyze = async () => {
    if (!selectedCase && analysisType !== 'general') return;

    setIsAnalyzing(true);
    setSuggestions(null);

    try {
      const caseData = cases.find(c => c.id === selectedCase);
      const clientData = caseData ? clients.find(c => c.id === caseData.client_id) : null;

      let prompt = `Você é um assistente jurídico especializado em gestão de tempo e agendamento para advogados.

TAREFA: Analisar o caso e sugerir eventos de calendário otimizados.

`;

      if (analysisType === 'full' && caseData) {
        prompt += `INFORMAÇÕES DO CASO:
- Título: ${caseData.title}
- Número: ${caseData.case_number || 'N/A'}
- Cliente: ${clientData?.name || caseData.client_name}
- Área: ${caseData.area}
- Status: ${caseData.status}
- Prioridade: ${caseData.priority}
- Prazo: ${caseData.deadline ? format(new Date(caseData.deadline), "dd/MM/yyyy") : 'Não definido'}
- Descrição: ${caseData.description || 'N/A'}

`;
      } else if (analysisType === 'deadline' && caseData) {
        prompt += `FOCO: Análise de prazos e lembretes
- Prazo Principal: ${caseData.deadline ? format(new Date(caseData.deadline), "dd/MM/yyyy") : 'Não definido'}
- Prioridade: ${caseData.priority}

`;
      }

      prompt += `HORÁRIO DE TRABALHO: 09:00 - 18:00 (Segunda a Sexta)
EVENTOS JÁ AGENDADOS HOJE: ${events.filter(e => {
  const today = new Date();
  const eventDate = new Date(e.start_time);
  return eventDate.toDateString() === today.toDateString();
}).length} eventos

${customInstructions ? `INSTRUÇÕES ADICIONAIS DO USUÁRIO: ${customInstructions}\n` : ''}

IMPORTANTE: Retorne EXATAMENTE um JSON com o seguinte formato (sem markdown, apenas o JSON puro):

{
  "analysis": "Análise detalhada do caso e necessidades de agendamento (2-3 parágrafos)",
  "events": [
    {
      "title": "Título do evento",
      "description": "Descrição detalhada",
      "event_type": "meeting|deadline|research|hearing|consultation|team_sync",
      "suggested_date": "YYYY-MM-DD",
      "suggested_time": "HH:MM",
      "duration_minutes": 60,
      "priority": "low|medium|high|urgent",
      "reasoning": "Por que este evento é importante e por que este horário"
    }
  ]
}

SUGESTÕES DE EVENTOS:
1. Se houver prazo importante: criar lembrete 7 dias antes, 3 dias antes, e 1 dia antes
2. Para casos urgentes: agendar reunião de estratégia o mais breve possível
3. Para casos complexos: bloquear tempo de pesquisa (2-3 horas)
4. Para consultas com cliente: sugerir horários de manhã (10h) ou tarde (14h-16h)
5. Evitar horários já ocupados
6. Respeitar horário comercial

IMPORTANTE: 
- Sugira entre 2-5 eventos relevantes
- Seja específico nos horários e durações
- Priorize eventos mais urgentes para datas mais próximas
- Use event_type correto: meeting, deadline, research, hearing, consultation, team_sync`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            analysis: { type: "string" },
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  event_type: { type: "string" },
                  suggested_date: { type: "string" },
                  suggested_time: { type: "string" },
                  duration_minutes: { type: "number" },
                  priority: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response);
    } catch (error) {
      console.error("Erro ao analisar:", error);
      alert("Erro ao analisar caso. Tente novamente.");
    }

    setIsAnalyzing(false);
  };

  const handleScheduleEvent = (suggestion) => {
    const [hours, minutes] = suggestion.suggested_time.split(':');
    const startDate = setMinutes(setHours(new Date(suggestion.suggested_date), parseInt(hours)), parseInt(minutes));
    const endDate = addHours(startDate, suggestion.duration_minutes / 60);

    const eventData = {
      title: suggestion.title,
      description: suggestion.description,
      event_type: suggestion.event_type,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      priority: suggestion.priority,
      status: "scheduled",
      case_id: selectedCase || undefined,
      calendar_provider: defaultConnection?.provider || 'local'
    };

    onSchedule(eventData);
  };

  const eventTypeColors = {
    meeting: "bg-blue-100 text-blue-800",
    deadline: "bg-red-100 text-red-800",
    research: "bg-purple-100 text-purple-800",
    hearing: "bg-orange-100 text-orange-800",
    consultation: "bg-green-100 text-green-800",
    team_sync: "bg-indigo-100 text-indigo-800",
    other: "bg-gray-100 text-gray-800"
  };

  const eventTypeLabels = {
    meeting: "Reunião",
    deadline: "Prazo",
    research: "Pesquisa",
    hearing: "Audiência",
    consultation: "Consulta",
    team_sync: "Sincronização",
    other: "Outro"
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Agendamento Inteligente com IA</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Deixe a IA sugerir os melhores horários para seus compromissos
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {!hasActiveConnection && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Calendário não conectado</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Para sincronização automática, conecte seu Google Calendar ou Outlook nas configurações.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Configuration */}
          {!suggestions && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Tipo de Análise</label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Análise Completa - Todas as necessidades</SelectItem>
                    <SelectItem value="deadline">Foco em Prazos - Lembretes e alertas</SelectItem>
                    <SelectItem value="meetings">Foco em Reuniões - Cliente e equipe</SelectItem>
                    <SelectItem value="research">Foco em Pesquisa - Blocos de tempo</SelectItem>
                    <SelectItem value="general">Análise Geral - Todos os casos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {analysisType !== 'general' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Selecione o Processo</label>
                  <Select value={selectedCase} onValueChange={setSelectedCase}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um processo para analisar" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title} - {c.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Instruções Adicionais (Opcional)</label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ex: Prefiro reuniões pela manhã, evitar sextas-feiras, priorizar cliente X..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!selectedCase && analysisType !== 'general')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar e Sugerir Eventos
                  </>
                )}
              </Button>
            </div>
          )}

          {/* AI Suggestions */}
          <AnimatePresence>
            {suggestions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Analysis Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Análise da IA
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {suggestions.analysis}
                  </p>
                </div>

                {/* Suggested Events */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Eventos Sugeridos ({suggestions.events?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {suggestions.events?.map((event, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-slate-900">{event.title}</h4>
                              <Badge className={eventTypeColors[event.event_type]}>
                                {eventTypeLabels[event.event_type]}
                              </Badge>
                              <Badge variant="outline">
                                {event.priority === 'urgent' && '🔥 Urgente'}
                                {event.priority === 'high' && 'Alta'}
                                {event.priority === 'medium' && 'Média'}
                                {event.priority === 'low' && 'Baixa'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(event.suggested_date), "d 'de' MMMM", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.suggested_time} ({event.duration_minutes} min)
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleScheduleEvent(event)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                          >
                            Agendar
                          </Button>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                          <span className="font-medium">💡 Justificativa da IA:</span> {event.reasoning}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setSuggestions(null)}
                  className="w-full"
                >
                  Nova Análise
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}