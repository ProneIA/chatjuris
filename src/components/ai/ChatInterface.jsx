import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, X, Sparkles, Scale, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import MessageBubble from "./MessageBubble";
import LegalDocumentGeneratorInterface from "./LegalDocumentGeneratorInterface";
import CaseSummarizerDialog from "./CaseSummarizerDialog";
import AdvancedDocumentAnalyzer from "./AdvancedDocumentAnalyzer";
import { usePlanAccess } from "../common/PlanGuard";
import AIUsageIndicator from "./AIUsageIndicator";

export default function ChatInterface({ conversation, onUpdate }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showCaseSummarizer, setShowCaseSummarizer] = useState(false);
  const [showAdvancedAnalyzer, setShowAdvancedAnalyzer] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { canUseAI } = usePlanAccess();

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Conversation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onUpdate();
    },
  });

  const incrementAIUsage = async () => {
    try {
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        ai_requests_count: (user.ai_requests_count || 0) + 1
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    } catch (error) {
      console.error("Failed to update AI usage:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({ url: file_url, name: file.name, type: file.type });
      
      if (conversation.mode === "document_analyzer") {
        setShowAdvancedAnalyzer(true);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    }
    setUploadingFile(false);
  };

  const handleAdvancedAnalysis = async (analysisType, secondaryFile) => {
    if (!uploadedFile) return;

    const aiAccess = canUseAI();
    if (!aiAccess.allowed) {
      alert(`Você atingiu o limite de ${aiAccess.limit} requisições de IA este mês. Faça upgrade para o plano Pro!`);
      return;
    }

    const prompts = {
      compare: `Você é um assistente jurídico especializado. Compare os seguintes documentos em DETALHES:

DOCUMENTO 1: ${uploadedFile.name}
DOCUMENTO 2: ${secondaryFile?.name || 'Segundo documento'}

Forneça uma análise COMPLETA:

**📊 RESUMO EXECUTIVO DA COMPARAÇÃO**
- Tipo de documentos comparados
- Propósito de cada documento
- Principais diferenças encontradas

**🔍 ANÁLISE DETALHADA DAS DIFERENÇAS**
- Diferenças em cláusulas
- Diferenças em valores, datas e prazos
- Diferenças em termos e condições
- Alterações de responsabilidades

**⚠️ PONTOS DE ATENÇÃO**
- Cláusulas presentes em um documento mas ausentes no outro
- Conflitos ou contradições entre os documentos
- Riscos jurídicos das diferenças encontradas

**💡 RECOMENDAÇÕES**
- Qual documento é mais favorável e por quê
- Sugestões de harmonização
- Ações recomendadas

Seja extremamente DETALHADO e TÉCNICO.`,

      inconsistencies: `Você é um especialista em análise de contratos. Analise este documento e identifique TODAS as inconsistências:

DOCUMENTO: ${uploadedFile.name}

Forneça análise COMPLETA:

**🔍 INCONSISTÊNCIAS IDENTIFICADAS**
Liste todas as inconsistências encontradas:
- Contradições internas
- Cláusulas conflitantes
- Termos indefinidos ou ambíguos
- Referências cruzadas incorretas

**⚠️ ANÁLISE DE RISCOS**
Para cada inconsistência:
- Nível de risco (baixo/médio/alto)
- Impacto jurídico potencial
- Consequências práticas

**🛡️ VULNERABILIDADES JURÍDICAS**
- Brechas contratuais
- Cláusulas potencialmente nulas
- Pontos sujeitos a interpretação judicial

**💡 SUGESTÕES DE CORREÇÃO**
Para cada inconsistência:
- Redação sugerida para correção
- Justificativa da alteração
- Impacto da correção

**📋 RESUMO EXECUTIVO**
- Total de inconsistências encontradas
- Nível geral de risco do documento
- Prioridade de correções

Seja EXTREMAMENTE MINUCIOSO e TÉCNICO.`,

      extract_clauses: `Você é um especialista em análise contratual. Extraia e classifique TODAS as cláusulas deste documento:

DOCUMENTO: ${uploadedFile.name}

Forneça análise ESTRUTURADA:

**📋 CLÁUSULAS PRINCIPAIS**
Liste e analise:

**1. CLÁUSULAS DE OBJETO**
- Descrição do objeto contratual
- Especificações técnicas
- Escopo de entrega

**2. CLÁUSULAS FINANCEIRAS**
- Valores e formas de pagamento
- Multas e penalidades
- Reajustes e correções

**3. CLÁUSULAS DE PRAZO**
- Prazos de execução
- Prazos de vigência
- Condições de prorrogação

**4. CLÁUSULAS DE RESPONSABILIDADE**
- Obrigações de cada parte
- Responsabilidades civis
- Garantias oferecidas

**5. CLÁUSULAS DE RESCISÃO**
- Condições de rescisão
- Penalidades aplicáveis
- Procedimentos de término

**6. CLÁUSULAS DE FORO E LEI APLICÁVEL**
- Foro competente
- Lei aplicável
- Resolução de conflitos

**7. CLÁUSULAS ESPECIAIS**
- Cláusulas de confidencialidade
- Cláusulas de não concorrência
- Outras cláusulas relevantes

**⚖️ ANÁLISE JURÍDICA**
Para cada cláusula principal:
- Validade jurídica
- Abusividade (se aplicável)
- Conformidade com legislação

**💡 OBSERVAÇÕES IMPORTANTES**
- Cláusulas críticas que merecem atenção
- Cláusulas faltantes mas recomendadas
- Sugestões de melhorias

Extraia e analise TODAS as cláusulas detalhadamente.`,

      generate_opinion: `Você é um advogado experiente. Gere um PARECER JURÍDICO INICIAL completo sobre este documento:

DOCUMENTO: ${uploadedFile.name}

Estruture o parecer profissionalmente:

**I. RELATÓRIO**
- Identificação do documento analisado
- Objetivo da análise
- Metodologia utilizada

**II. FUNDAMENTAÇÃO**

**1. Análise do Objeto**
- Natureza jurídica do documento
- Partes envolvidas e qualificação
- Objeto contratual e suas características

**2. Análise das Cláusulas**
- Cláusulas essenciais presentes
- Cláusulas acessórias
- Análise de cada cláusula relevante

**3. Conformidade Legal**
- Adequação ao Código Civil
- Adequação ao CDC (se aplicável)
- Outras legislações pertinentes

**4. Vícios e Irregularidades**
- Vícios formais identificados
- Vícios materiais identificados
- Cláusulas potencialmente abusivas

**5. Riscos Jurídicos**
- Riscos contratuais
- Riscos processuais
- Exposição patrimonial

**III. CONCLUSÃO**
- Parecer sobre validade jurídica
- Viabilidade de execução
- Nível de risco geral (baixo/médio/alto)

**IV. RECOMENDAÇÕES**
1. Alterações urgentes necessárias
2. Melhorias sugeridas
3. Documentação complementar recomendada
4. Providências jurídicas aconselhadas

**V. RESSALVAS**
- Limitações da análise
- Informações adicionais necessárias

Forneça parecer COMPLETO, TÉCNICO e PROFISSIONAL.`
    };

    const titles = {
      compare: "Comparação Detalhada de Documentos",
      inconsistencies: "Análise de Inconsistências",
      extract_clauses: "Extração e Análise de Cláusulas",
      generate_opinion: "Parecer Jurídico Inicial"
    };

    const userMessage = {
      role: "user",
      content: `📄 ${titles[analysisType]}: ${uploadedFile.name}${secondaryFile ? ` vs ${secondaryFile.name}` : ''}`,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...conversation.messages, userMessage];
    
    await updateConversationMutation.mutateAsync({
      id: conversation.id,
      data: {
        messages: updatedMessages,
        last_message_at: new Date().toISOString()
      }
    });

    setShowAdvancedAnalyzer(false);
    setIsGenerating(true);

    try {
      const fileUrls = [uploadedFile.url];
      if (secondaryFile) fileUrls.push(secondaryFile.url);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[analysisType],
        file_urls: fileUrls
      });

      const assistantResponse = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: [...updatedMessages, assistantResponse],
          last_message_at: new Date().toISOString()
        }
      });

      await incrementAIUsage();
    } catch (error) {
      console.error("Erro ao analisar documento:", error);
      alert("Erro ao analisar o documento. Tente novamente.");
    }

    setIsGenerating(false);
  };

  const handleSummarizeCase = async (caseData) => {
    const aiAccess = canUseAI();
    if (!aiAccess.allowed) {
      alert(`Você atingiu o limite de ${aiAccess.limit} requisições de IA este mês. Faça upgrade para o plano Pro!`);
      return;
    }

    setShowCaseSummarizer(false);
    setIsGenerating(true);

    try {
      const userMessage = {
        role: "user",
        content: `Analisar e resumir processo: ${caseData.title || caseData.case_number || 'Processo'}`,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...conversation.messages, userMessage];
      
      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: updatedMessages,
          last_message_at: new Date().toISOString()
        }
      });

      const prompt = `Você é um assistente jurídico especializado em análise de processos judiciais brasileiros.

INFORMAÇÕES DO PROCESSO:
${caseData.case_number ? `Número do Processo: ${caseData.case_number}` : ''}
${caseData.title ? `Título: ${caseData.title}` : ''}
${caseData.area ? `Área do Direito: ${caseData.area}` : ''}
${caseData.court ? `Vara/Tribunal: ${caseData.court}` : ''}
${caseData.client_name ? `Cliente: ${caseData.client_name}` : ''}
${caseData.opposing_party ? `Parte Contrária: ${caseData.opposing_party}` : ''}
${caseData.description ? `Descrição:\n${caseData.description}` : ''}
${caseData.value ? `Valor da Causa: R$ ${caseData.value}` : ''}
${caseData.status ? `Status: ${caseData.status}` : ''}
${caseData.priority ? `Prioridade: ${caseData.priority}` : ''}
${caseData.start_date ? `Data de Início: ${caseData.start_date}` : ''}
${caseData.deadline ? `Prazo: ${caseData.deadline}` : ''}

TAREFA:
Analise este processo judicial e forneça um resumo estruturado e profissional.

Use linguagem técnica jurídica apropriada, mas mantenha clareza e objetividade.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const assistantResponse = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: [...updatedMessages, assistantResponse],
          last_message_at: new Date().toISOString()
        }
      });

      await incrementAIUsage();
    } catch (error) {
      console.error("Erro ao resumir caso:", error);
    }

    setIsGenerating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;

    const aiAccess = canUseAI();
    if (!aiAccess.allowed) {
      alert(`Você atingiu o limite de ${aiAccess.limit} requisições de IA este mês. Faça upgrade para o plano Pro!`);
      return;
    }

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...conversation.messages, userMessage];
    
    await updateConversationMutation.mutateAsync({
      id: conversation.id,
      data: {
        messages: updatedMessages,
        last_message_at: new Date().toISOString()
      }
    });

    setInput("");
    setIsGenerating(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: input,
        add_context_from_internet: false
      });
      
      const assistantResponse = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: [...updatedMessages, assistantResponse],
          last_message_at: new Date().toISOString()
        }
      });

      await incrementAIUsage();
    } catch (error) {
      console.error("Erro ao gerar resposta:", error);
    }

    setIsGenerating(false);
  };

  if (conversation.mode === "legal_document_generator") {
    return <LegalDocumentGeneratorInterface conversation={conversation} onUpdate={onUpdate} />;
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-white/30 dark:to-slate-900/30">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <AIUsageIndicator />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {conversation.messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
        </AnimatePresence>

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {uploadedFile && conversation.mode === 'document_analyzer' 
                    ? 'Analisando documento...' 
                    : 'Gerando resposta...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4">
        {conversation.mode === 'assistant' && !uploadedFile && (
          <Button
            onClick={() => setShowCaseSummarizer(true)}
            variant="outline"
            className="w-full mb-3 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300"
          >
            <Scale className="w-4 h-4 mr-2" />
            Resumir Processo Judicial
          </Button>
        )}

        {conversation.mode === "document_analyzer" && uploadedFile && showAdvancedAnalyzer && (
          <AdvancedDocumentAnalyzer
            primaryFile={uploadedFile}
            onAnalyze={handleAdvancedAnalysis}
            onClose={() => {
              setUploadedFile(null);
              setShowAdvancedAnalyzer(false);
            }}
            isAnalyzing={isGenerating}
          />
        )}

        {uploadedFile && !showAdvancedAnalyzer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-green-900 dark:text-green-200 truncate">{uploadedFile.name}</p>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">Carregado</Badge>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Documento pronto para análise avançada
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-green-100 dark:hover:bg-green-900/50"
                onClick={() => {
                  setUploadedFile(null);
                  setShowAdvancedAnalyzer(false);
                }}
              >
                <X className="w-4 h-4 text-green-600 dark:text-green-400" />
              </Button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
            onChange={handleFileUpload}
          />
          
          {conversation.mode === "document_analyzer" && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="shrink-0 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              {uploadingFile ? (
                <Loader2 className="w-4 h-4 animate-spin text-green-600 dark:text-green-400" />
              ) : (
                <Paperclip className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
            </Button>
          )}

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              conversation.mode === "document_analyzer"
                ? uploadedFile 
                  ? "Faça uma pergunta sobre o documento..."
                  : "Faça upload de um documento para começar a análise..."
                : "Digite sua mensagem..."
            }
            className="flex-1 min-h-[60px] max-h-[200px] resize-none rounded-2xl border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:ring-blue-400 dark:bg-slate-800 dark:text-slate-100"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <Button
            type="submit"
            disabled={(!input.trim() && !uploadedFile) || isGenerating}
            className="shrink-0 h-[60px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
          {conversation.mode === "document_analyzer" && !uploadedFile
            ? "Faça upload de PDF, DOCX ou imagem para análise jurídica avançada"
            : "Pressione Enter para enviar, Shift+Enter para nova linha"}
        </p>
      </div>

      <CaseSummarizerDialog
        open={showCaseSummarizer}
        onClose={() => setShowCaseSummarizer(false)}
        cases={cases}
        onSummarize={handleSummarizeCase}
      />
    </div>
  );
}