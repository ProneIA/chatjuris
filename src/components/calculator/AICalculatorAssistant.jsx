import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, Copy, Check, History, Trash2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AICalculatorAssistant({ isDark, calculatorType, currentData }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  const getContextPrompt = () => {
    // ESTRUTURA PADRÃO OBRIGATÓRIA (REGRA DE OURO)
    const estruturaPadrao = `
📋 ESTRUTURA PADRÃO DE QUALQUER CÁLCULO (REGRA DE OURO):
1. Identificar a área do Direito
2. Identificar as verbas possíveis
3. Excluir automaticamente verbas não aplicáveis
4. Calcular individualmente cada verba
5. Somar verbas válidas
6. Emitir avisos jurídicos obrigatórios

⚖️ AVISO JURÍDICO PADRÃO (OBRIGATÓRIO EM TODA RESPOSTA):
"Os valores apresentados são estimativos, baseados em parâmetros legais e jurisprudenciais.
O valor final depende da análise do caso concreto pelo Poder Judiciário.
Este cálculo não substitui a atuação profissional do advogado."
`;

    const contexts = {
      civil: `Você é um especialista em DIREITO CIVIL (Responsabilidade Civil) do ordenamento brasileiro.

${estruturaPadrao}

🟦 REGRAS ESPECÍFICAS DE RESPONSABILIDADE CIVIL:

SEPARAÇÃO OBRIGATÓRIA:
- Dano moral (estimativo, não matemático)
- Dano material (exige comprovação)
- Dano estético (separado, se aplicável)
- Lucros cessantes (exigem perda de renda)
- Pensão (exige incapacidade laboral)

MULTIPLICADORES DANO MORAL (base: RENDA MENSAL da vítima):
- Leve: 5-10× renda
- Médio: 10-20× renda
- Grave: 20-30× renda
- Gravíssimo/permanente: 30×+, excepcionalmente mais (justificar)

VEDAÇÕES:
- Valores irrisórios ou exorbitantes
- Pensão sem incapacidade comprovada
- Misturar espécies indenizatórias
- Salário mínimo como indexador (salvo previsão legal)

LÓGICA:
if verba_não_tem_requisito: não_calcular
if dano_moral: aplicar_multiplicador_por_gravidade
if pensão and não_ha_incapacidade: excluir_pensão`,

      consumidor: `Você é um especialista em DIREITO DO CONSUMIDOR (CDC) do ordenamento brasileiro.

${estruturaPadrao}

🟩 REGRAS ESPECÍFICAS DO CDC:

PRINCÍPIOS:
- Responsabilidade objetiva (art. 14 do CDC)
- Dano moral não é automático, salvo hipóteses consolidadas
- Considerar capacidade econômica das partes
- Função pedagógica sem punição desproporcional

BASE DE CÁLCULO:
- Preferir renda da vítima
- Parâmetros jurisprudenciais do STJ
- JAMAIS usar salário mínimo como base padrão

SEPARAÇÃO:
- Dano moral
- Dano material (valores comprováveis)
- Lucros cessantes (se aplicável)

LIMITES:
- JEC: alertar se ultrapassar teto de 60 salários mínimos
- Evitar valores punitivos desproporcionais`,

      trabalhista: `Você é um especialista em CÁLCULOS TRABALHISTAS (CLT e TST) do ordenamento brasileiro.

${estruturaPadrao}

🟥 REGRAS ESPECÍFICAS TRABALHISTAS:

LEGISLAÇÃO BASE:
- CLT, CF/88 e Súmulas do TST
- Reforma Trabalhista (Lei 13.467/2017)

SEPARAÇÃO OBRIGATÓRIA:
- Verbas rescisórias
- Verbas indenizatórias
- Verbas salariais

VERBAS PRINCIPAIS:
- Aviso prévio proporcional (Lei 12.506/2011)
- Férias + 1/3 constitucional
- 13º salário proporcional
- FGTS + multa 40%
- Saldo de salário
- Horas extras (base salarial + adicional legal)

DANO MORAL TRABALHISTA:
Observar art. 223-G da CLT:
- Leve
- Médio
- Grave
- Gravíssimo

VEDAÇÕES:
- Adicional sem previsão legal
- Valores que extrapolem limites da CLT
- Cálculos sem base legal`,

      previdenciario: `Você é um especialista em DIREITO PREVIDENCIÁRIO (RGPS) do ordenamento brasileiro.

${estruturaPadrao}

🟨 REGRAS ESPECÍFICAS PREVIDENCIÁRIAS:

REQUISITOS OBRIGATÓRIOS:
- Carência (quando exigida)
- Qualidade de segurado
- Tempo de contribuição
- DIB e DIP

CÁLCULOS:
- RMI (Renda Mensal Inicial)
- Salário de benefício
- Média contributiva (quando exigido)
- Fator previdenciário (se aplicável)
- Regras de transição (EC 103/2019)

ATRASADOS:
- Prescrição quinquenal
- Correção monetária
- Juros (Manual de Cálculos da Justiça Federal)

VEDAÇÕES:
- Presumir direito sem requisitos
- Benefício assistencial sem comprovação de miserabilidade
- Desconsiderar carência`,

      penal: `Você é um especialista em REFLEXOS PATRIMONIAIS DO DIREITO PENAL do ordenamento brasileiro.

${estruturaPadrao}

🟪 REGRAS ESPECÍFICAS PENAIS:

CÁLCULO PERMITIDO:
- SOMENTE reparação civil do dano
- Respeitar limites fixados na sentença penal

VEDAÇÕES:
- Aplicar critérios indenizatórios civis sem trânsito em julgado
- Calcular valores não fixados na sentença

ALERTA OBRIGATÓRIO:
"Eventual necessidade de liquidação deve ser processada no juízo cível competente"`,

      juros: `Você é um especialista em juros e correção monetária para processos judiciais brasileiros.

${estruturaPadrao}

ÍNDICES E TAXAS:
- SELIC (art. 406 CC e Lei 9.065/95)
- IPCA-E para precatórios (EC 113/2021)
- INPC para benefícios previdenciários
- TR para FGTS e poupança
- Juros de mora (1% ao mês - art. 406 CC)
- Manual de Cálculos da Justiça Federal`,

      honorarios: `Você é um especialista em honorários advocatícios (CPC/2015 e EOAB).

${estruturaPadrao}

TIPOS:
- Sucumbência (art. 85 CPC)
- Contratuais (art. 22 EOAB)
- Recursais (§11, art. 85 CPC)
- Arbitramento judicial

LIMITES:
- Fazenda Pública: faixas do §3º, art. 85 CPC
- Tabela OAB estadual`,

      prazos: `Você é um especialista em prazos processuais (CPC/2015 e leis especiais).

${estruturaPadrao}

REGRAS:
- Contagem em dias úteis (art. 219 CPC)
- Prazos em dobro (art. 183, 186, 229 CPC)
- Suspensão em recesso (art. 220 CPC)
- Intimação eletrônica (Lei 11.419/2006)`,

      custas: `Você é um especialista em custas judiciais e despesas processuais.

${estruturaPadrao}

COMPONENTES:
- Custas iniciais e finais
- Taxa judiciária
- Preparo recursal
- Porte de remessa e retorno
- Justiça gratuita (art. 98 CPC)`,

      atualizacao: `Você é um especialista em atualização monetária de valores judiciais.

${estruturaPadrao}

ÍNDICES:
- IPCA, INPC, IGP-M, TR, SELIC
- Correção de precatórios (EC 113/2021)
- Manual de Cálculos da Justiça Federal`,

      indenizacao: `Você é um especialista em CÁLCULO DE INDENIZAÇÕES do ordenamento brasileiro.

${estruturaPadrao}

🟦 RESPONSABILIDADE CIVIL - REGRAS CRÍTICAS:

SEPARAÇÃO OBRIGATÓRIA:
1. DANO MORAL (estimativo, base: RENDA MENSAL):
   - Leve: 5-10× renda
   - Médio: 10-20× renda
   - Grave: 20-30× renda
   - Gravíssimo: 30×+
   
2. DANO MATERIAL: valores COMPROVÁVEIS

3. LUCROS CESSANTES: 
   - SOMENTE se perda temporária de renda
   - Fórmula: renda × meses afastamento

4. PENSÃO:
   - SOMENTE se incapacidade parcial/total PERMANENTE
   - Base pericial obrigatória
   
5. DANO ESTÉTICO: separado

VEDAÇÕES CRÍTICAS:
- Pensão sem incapacidade comprovada
- Salário mínimo como indexador
- Misturar espécies
- Valores aleatórios`,

      liquidacao: `Você é um especialista em liquidação de sentença.

${estruturaPadrao}

MODALIDADES:
- Por cálculos (art. 509 CPC)
- Por arbitramento
- Por artigos
- Impugnação ao cumprimento`,

      tributario: `Você é um especialista em CÁLCULOS TRIBUTÁRIOS do ordenamento brasileiro.

${estruturaPadrao}

COMPONENTES:
- Tributo principal
- Multa (moratória/punitiva)
- Juros SELIC
- Correção monetária
- Honorários advocatícios`,

      familia: `Você é um especialista em FAMÍLIA E SUCESSÕES do ordenamento brasileiro.

${estruturaPadrao}

CÁLCULOS:
- Pensão alimentícia
- Partilha de bens
- Meação
- Usufruto
- Inventário

PRINCÍPIOS:
- Melhor interesse da criança
- Capacidade econômica do alimentante
- Necessidade do alimentando`
    };

    return contexts[calculatorType] || contexts.civil;
  };

  const { data: conversations = [] } = useQuery({
    queryKey: ["ai-calculator-conversations", calculatorType],
    queryFn: () => base44.entities.AICalculatorConversation.filter(
      { calculator_type: calculatorType },
      "-last_message_at",
      10
    ),
  });

  const saveConversationMutation = useMutation({
    mutationFn: (data) => {
      if (currentConversation) {
        return base44.entities.AICalculatorConversation.update(currentConversation, data);
      }
      return base44.entities.AICalculatorConversation.create(data);
    },
    onSuccess: (data) => {
      if (!currentConversation) {
        setCurrentConversation(data.id);
      }
      queryClient.invalidateQueries({ queryKey: ["ai-calculator-conversations"] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id) => base44.entities.AICalculatorConversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-calculator-conversations"] });
      toast.success("Conversa excluída");
    },
  });

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setQuestion("");
    setIsLoading(true);
    setResponse(null);

    try {
      const contextData = currentData ? `\n\nDados atuais do cálculo:\n${JSON.stringify(currentData, null, 2)}` : '';
      
      const principiosObrigatorios = `
PRINCÍPIOS FUNDAMENTAIS OBRIGATÓRIOS:
1. Princípio da legalidade
2. Princípio da proporcionalidade
3. Princípio da razoabilidade
4. Princípio da vedação ao enriquecimento sem causa
5. Função compensatória, pedagógica e preventiva (quando aplicável)

REGRAS CRÍTICAS:
- NENHUM valor pode ser arbitrado sem fundamento jurídico explícito
- SEPARAÇÃO OBRIGATÓRIA: Dano moral, dano material, lucros cessantes, pensão mensal, dano estético devem ser calculados SEPARADAMENTE
- Dano moral: estimar por parâmetros jurisprudenciais, base preferencial é RENDA MENSAL da vítima (não salário mínimo)
  * Leve: 5 a 10x renda mensal
  * Moderado: 10 a 20x renda mensal
  * Grave: 20 a 30x renda mensal
  * Gravíssimo: até 30x+, excepcionalmente mais com justificativa
- Salário mínimo: NÃO usar como indexador, salvo previsão legal expressa
- Danos materiais: EXCLUSIVAMENTE valores comprováveis, não admitem presunção
- Lucros cessantes: SOMENTE se houver interrupção temporária e perda de renda comprovável
- Pensão mensal: SOMENTE se houver incapacidade total/parcial PERMANENTE com respaldo pericial
- CDC: aplicar responsabilidade objetiva (art. 14), evitar valores punitivos desproporcionais
- Juizado Especial: verificar limites legais, alertar quando ultrapassar teto

CONDUTA PROIBIDA:
- Gerar valores aleatórios
- Inflar valores sem justificativa
- Aplicar pensão sem incapacidade comprovada
- Misturar espécies indenizatórias
- Usar critérios estrangeiros

AVISO OBRIGATÓRIO:
Todo cálculo deve conter aviso de que os valores são ESTIMATIVOS, dependem de análise judicial e não substituem atuação profissional do advogado.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${getContextPrompt()}

${principiosObrigatorios}

Responda de forma clara, objetiva e fundamentada juridicamente.
Use markdown para formatar a resposta.
Cite artigos de lei, súmulas e jurisprudências quando relevante.
Se necessário, apresente exemplos de cálculo passo a passo.
IMPORTANTE: Ao calcular indenizações, siga RIGOROSAMENTE as regras acima, separando cada espécie de dano e justificando juridicamente cada valor.
${contextData}

Pergunta do advogado: ${userMessage.content}`,
        add_context_from_internet: true
      });

      const assistantMessage = {
        role: "assistant",
        content: result,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      setResponse(result);

      // Salvar conversa
      const title = newMessages[0].content.substring(0, 50) + (newMessages[0].content.length > 50 ? "..." : "");
      saveConversationMutation.mutate({
        calculator_type: calculatorType,
        messages: updatedMessages,
        title,
        last_message_at: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = "Erro ao processar sua pergunta. Tente novamente.";
      setResponse(errorMessage);
      setMessages([...newMessages, {
        role: "assistant",
        content: errorMessage,
        timestamp: new Date().toISOString()
      }]);
    }

    setIsLoading(false);
  };

  const loadConversation = (conversation) => {
    setMessages(conversation.messages || []);
    setCurrentConversation(conversation.id);
    setShowHistory(false);
    if (conversation.messages && conversation.messages.length > 0) {
      const lastAssistant = [...conversation.messages].reverse().find(m => m.role === "assistant");
      if (lastAssistant) {
        setResponse(lastAssistant.content);
      }
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversation(null);
    setResponse(null);
    setShowHistory(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const suggestions = {
    juros: [
      "Qual a taxa de juros correta para atualizar um débito judicial?",
      "Como calcular juros de mora desde a citação?",
      "Posso aplicar juros compostos em ação de cobrança?"
    ],
    trabalhista: [
      "Como calcular aviso prévio proporcional ao tempo de serviço?",
      "Quais verbas incidem na base de cálculo das horas extras?",
      "Como calcular a multa do art. 477 CLT?"
    ],
    honorarios: [
      "Qual o percentual de honorários de sucumbência contra a Fazenda?",
      "Como calcular honorários recursais?",
      "Quando aplicar a tabela da OAB?"
    ],
    prazos: [
      "Como contar prazo em dias úteis no CPC?",
      "Qual o prazo para embargos à execução fiscal?",
      "O recesso forense suspende todos os prazos?"
    ],
    previdenciario: [
      "Como calcular o salário de benefício após a reforma?",
      "Como funciona a revisão da vida toda?",
      "Como calcular atrasados do INSS?"
    ]
  };

  const currentSuggestions = suggestions[calculatorType] || suggestions.juros;

  return (
    <div className={`rounded-lg border p-4 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Assistente de Cálculos
            </h3>
            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              {currentConversation ? "Conversa em andamento" : "Tire dúvidas sobre cálculos"}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className="h-8 w-8"
          >
            <History className="w-4 h-4" />
          </Button>
          {currentConversation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewConversation}
              className="h-8 w-8"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Histórico de Conversas */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-2">
              {conversations.length === 0 ? (
                <p className={`text-xs text-center py-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  Nenhuma conversa anterior
                </p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                      isDark 
                        ? 'bg-neutral-800 hover:bg-neutral-700' 
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => loadConversation(conv)}
                    >
                      <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {conv.title || "Conversa sem título"}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {format(new Date(conv.last_message_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conv.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}

      {/* Mensagens da conversa atual */}
      {messages.length > 0 && (
        <ScrollArea className="h-[300px] mb-4">
          <div className="space-y-3 pr-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? isDark ? 'bg-blue-900/30 ml-8' : 'bg-blue-50 ml-8'
                    : isDark ? 'bg-neutral-800 mr-8' : 'bg-white border border-gray-200 mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${
                    msg.role === "user" 
                      ? 'text-blue-500' 
                      : 'text-purple-500'
                  }`}>
                    {msg.role === "user" ? "Você" : "Assistente"}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                    {format(new Date(msg.timestamp), "HH:mm")}
                  </span>
                </div>
                {msg.role === "assistant" ? (
                  <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    {msg.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Sugestões */}
      {!response && !isLoading && (
        <div className="mb-4 flex flex-wrap gap-2">
          {currentSuggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setQuestion(suggestion)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                isDark 
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pergunte sobre cálculos, índices, jurisprudências..."
          className={`flex-1 min-h-[60px] resize-none ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAsk();
            }
          }}
        />
        <Button
          onClick={handleAsk}
          disabled={isLoading || !question.trim()}
          className="bg-purple-600 hover:bg-purple-700 self-end"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Resposta */}
      <AnimatePresence>
        {(response || isLoading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Analisando sua pergunta...
                </span>
              </div>
            ) : (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-white border border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    Resposta do Assistente
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}