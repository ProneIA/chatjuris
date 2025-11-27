import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function AICalculatorAssistant({ isDark, calculatorType, currentData }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getContextPrompt = () => {
    const contexts = {
      juros: `Você é um especialista em cálculos de juros e correção monetária para processos judiciais brasileiros.
Conhece profundamente:
- Taxa SELIC (art. 406 CC e Lei 9.065/95)
- IPCA-E para precatórios (EC 113/2021)
- INPC para benefícios previdenciários
- TR para FGTS e poupança
- Juros de mora (1% ao mês - art. 406 CC)
- Juros compensatórios e moratórios
- Súmulas do STJ sobre juros (Súmula 254, 379, etc.)
- Manual de Cálculos da Justiça Federal`,

      trabalhista: `Você é um especialista em cálculos trabalhistas conforme CLT e normas do TST.
Conhece profundamente:
- Verbas rescisórias (art. 477 CLT)
- Aviso prévio proporcional (Lei 12.506/2011)
- Férias e 1/3 constitucional (art. 7º, XVII CF)
- 13º salário (Lei 4.090/62)
- FGTS e multa 40% (Lei 8.036/90)
- Horas extras e adicional (art. 59 CLT)
- Adicional noturno (art. 73 CLT)
- DSR sobre variáveis
- Multa art. 467 e 477 CLT
- Seguro-desemprego
- Reforma Trabalhista (Lei 13.467/2017)`,

      honorarios: `Você é um especialista em honorários advocatícios conforme CPC/2015 e Estatuto da OAB.
Conhece profundamente:
- Honorários de sucumbência (art. 85 CPC)
- Honorários contratuais (art. 22 EOAB)
- Tabela de honorários da OAB de cada estado
- Honorários recursais (§11, art. 85 CPC)
- Honorários em causas contra Fazenda Pública
- Súmula 14 STJ sobre honorários
- Honorários em execução fiscal`,

      prazos: `Você é um especialista em prazos processuais do CPC/2015 e legislações especiais.
Conhece profundamente:
- Contagem em dias úteis (art. 219 CPC)
- Prazos em dobro (Fazenda, Defensoria, litisconsortes)
- Suspensão de prazos (art. 220 CPC - recesso)
- Feriados forenses
- Prazos JEC (Lei 9.099/95)
- Prazos trabalhistas (CLT)
- Prazos criminais (CPP)
- Intimação eletrônica (Lei 11.419/2006)`,

      custas: `Você é um especialista em custas judiciais e despesas processuais.
Conhece profundamente:
- Tabelas de custas dos TJs estaduais
- Custas na Justiça Federal
- Taxa judiciária
- Preparo recursal
- Porte de remessa e retorno
- Justiça gratuita (art. 98 CPC)
- Custas em JEC
- Depósito recursal trabalhista`,

      atualizacao: `Você é um especialista em atualização monetária de valores judiciais.
Conhece profundamente:
- Índices oficiais (IPCA, INPC, IGP-M, TR, SELIC)
- Correção de precatórios (EC 113/2021)
- Atualização de débitos fiscais
- Correção de benefícios do INSS
- Manual de Cálculos da Justiça Federal
- Tabelas práticas dos Tribunais
- Súmulas sobre correção monetária`,

      indenizacao: `Você é um especialista em cálculo de indenizações.
Conhece profundamente:
- Danos morais (parâmetros STJ)
- Danos materiais e lucros cessantes
- Danos estéticos
- Pensão por morte e invalidez
- Indenização por acidente de trabalho
- Responsabilidade civil objetiva e subjetiva`,

      previdenciario: `Você é um especialista em cálculos previdenciários do INSS.
Conhece profundamente:
- RMI (Renda Mensal Inicial)
- Salário de benefício
- Fator previdenciário
- Regras de transição (EC 103/2019)
- Revisão da vida toda
- DIB e DIP
- Atrasados do INSS
- Correção de benefícios`,

      liquidacao: `Você é um especialista em liquidação de sentença.
Conhece profundamente:
- Liquidação por cálculos (art. 509 CPC)
- Liquidação por arbitramento
- Liquidação por artigos
- Impugnação ao cumprimento
- Execução de título judicial
- Atualização do débito exequendo`
    };

    return contexts[calculatorType] || contexts.juros;
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const contextData = currentData ? `\n\nDados atuais do cálculo:\n${JSON.stringify(currentData, null, 2)}` : '';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${getContextPrompt()}

Responda de forma clara, objetiva e fundamentada juridicamente.
Use markdown para formatar a resposta.
Cite artigos de lei, súmulas e jurisprudências quando relevante.
Se necessário, apresente exemplos de cálculo passo a passo.
${contextData}

Pergunta do advogado: ${question}`,
        add_context_from_internet: true
      });

      setResponse(result);
    } catch (error) {
      setResponse("Erro ao processar sua pergunta. Tente novamente.");
    }

    setIsLoading(false);
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
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <h3 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Assistente de Cálculos
          </h3>
          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
            Tire dúvidas sobre cálculos e fundamentação legal
          </p>
        </div>
      </div>

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