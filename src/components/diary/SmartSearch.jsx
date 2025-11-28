import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Hash, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Filter,
  Sparkles,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

// Dicionário de sinônimos jurídicos expandido
const SYNONYM_DICTIONARY = {
  // Processos e procedimentos
  'licitação': ['licitações', 'concorrência', 'pregão', 'certame', 'edital', 'tomada de preços', 'convite', 'leilão', 'dispensa', 'inexigibilidade'],
  'contrato': ['contratos', 'acordo', 'ajuste', 'parceria', 'convênio', 'termo', 'aditivo', 'contratação'],
  'processo': ['processos', 'autos', 'procedimento', 'expediente', 'feito'],
  
  // Atos judiciais
  'sentença': ['sentenças', 'sentenciado', 'julgamento', 'julgado', 'condenação', 'absolvição'],
  'decisão': ['decisões', 'decidido', 'determinação', 'deliberação', 'resolução'],
  'despacho': ['despachos', 'despachado', 'ordenado'],
  'acórdão': ['acórdãos', 'acordam', 'câmara', 'turma', 'colegiado'],
  
  // Comunicações
  'intimação': ['intimações', 'intimado', 'intimando', 'intimar', 'notificação', 'notificado'],
  'citação': ['citações', 'citado', 'citar', 'citando'],
  'publicação': ['publicações', 'publicado', 'publicar', 'divulgação'],
  
  // Recursos
  'recurso': ['recursos', 'recorrer', 'recorrido', 'recorrente', 'apelação', 'agravo', 'embargos'],
  'apelação': ['apelações', 'apelar', 'apelado', 'apelante'],
  'agravo': ['agravos', 'agravar', 'agravante', 'agravado'],
  'embargo': ['embargos', 'embargar', 'embargado', 'embargante'],
  
  // Partes
  'autor': ['autora', 'autores', 'requerente', 'demandante', 'exequente', 'impetrante'],
  'réu': ['ré', 'réus', 'requerido', 'demandado', 'executado', 'impetrado'],
  'advogado': ['advogados', 'advogada', 'procurador', 'patrono', 'defensor', 'causídico'],
  
  // Prazos e valores
  'prazo': ['prazos', 'termo', 'vencimento', 'dias', 'fatal', 'improrrogável'],
  'pagamento': ['pagamentos', 'pagar', 'pago', 'quitação', 'adimplemento', 'depósito'],
  'precatório': ['precatórios', 'requisição', 'rpv', 'requisitório', 'crédito'],
  'multa': ['multas', 'astreintes', 'penalidade', 'sanção', 'cominação'],
  
  // Medidas
  'tutela': ['tutelas', 'liminar', 'antecipação', 'cautelar', 'urgência', 'provisória'],
  'penhora': ['penhoras', 'penhorado', 'constrição', 'bloqueio', 'arresto'],
  'execução': ['execuções', 'executar', 'executado', 'executivo', 'cumprimento'],
  
  // Status
  'arquivamento': ['arquivado', 'arquivar', 'arquivo', 'baixa'],
  'trânsito': ['transitado', 'transitar', 'trânsito em julgado', 'irrecorrível'],
  'suspensão': ['suspenso', 'suspender', 'sobrestado', 'sobrestamento'],
};

// Regex para padrões de números de processo
const PROCESS_NUMBER_PATTERNS = [
  // CNJ: 0000000-00.0000.0.00.0000
  /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g,
  // Tradicional: 0000.000.000000/0000-00
  /\d{4}\.\d{3}\.\d{6}\/\d{4}-\d{2}/g,
  // Variação: 000.000.000000/0000-00
  /\d{3}\.\d{3}\.\d{6}\/\d{4}-\d{2}/g,
  // Simples: 0000000/0000
  /\d{6,7}\/\d{4}/g,
  // Com barras: 0000/0000
  /\d{4,7}\/\d{4}(?:-\d{1,2})?/g,
  // Administrativo: 00000.000000/0000-00
  /\d{5}\.\d{6}\/\d{4}-\d{2}/g,
];

// Função para extrair números de processo do texto
function extractProcessNumbers(text, nearPosition, radius = 200) {
  if (!text) return [];
  
  const start = Math.max(0, nearPosition - radius);
  const end = Math.min(text.length, nearPosition + radius);
  const searchArea = text.substring(start, end);
  
  const found = new Set();
  
  for (const pattern of PROCESS_NUMBER_PATTERNS) {
    const matches = searchArea.matchAll(pattern);
    for (const match of matches) {
      found.add(match[0]);
    }
  }
  
  return Array.from(found);
}

// Função para buscar termos com sinônimos
function searchWithSynonyms(text, searchTerms) {
  if (!text || !searchTerms.length) return { matches: [], totalCount: 0 };
  
  const lowerText = text.toLowerCase();
  const matches = [];
  let totalCount = 0;
  
  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase().trim();
    if (lowerTerm.length < 2) continue;
    
    // Busca direta
    let index = 0;
    while ((index = lowerText.indexOf(lowerTerm, index)) !== -1) {
      matches.push({
        term: lowerTerm,
        position: index,
        original: term,
        type: 'direct'
      });
      totalCount++;
      index++;
    }
    
    // Busca por sinônimos
    for (const [key, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
      const allTerms = [key, ...synonyms];
      
      // Se o termo de busca está relacionado a esta entrada
      if (allTerms.some(t => t.includes(lowerTerm) || lowerTerm.includes(t))) {
        for (const syn of allTerms) {
          if (syn === lowerTerm) continue; // Já buscou diretamente
          
          let synIndex = 0;
          while ((synIndex = lowerText.indexOf(syn, synIndex)) !== -1) {
            matches.push({
              term: syn,
              position: synIndex,
              original: term,
              type: 'synonym',
              synonymOf: key
            });
            totalCount++;
            synIndex++;
          }
        }
      }
    }
  }
  
  return { matches, totalCount };
}

// Função para extrair contexto ao redor de uma posição
function extractContext(text, position, radius = 150) {
  if (!text) return "";
  
  const start = Math.max(0, position - radius);
  const end = Math.min(text.length, position + radius);
  
  let context = text.substring(start, end);
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

// Componente principal de busca inteligente
export default function SmartSearch({ 
  isDark, 
  publications = [],
  onResultsFound,
  onSelectProcess
}) {
  const [searchTerms, setSearchTerms] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedProcess, setExpandedProcess] = useState(null);

  const performSearch = () => {
    if (!searchTerms.trim()) return;
    
    setIsSearching(true);
    
    const terms = searchTerms.split(',').map(t => t.trim()).filter(Boolean);
    const processGroups = new Map();
    
    for (const pub of publications) {
      const fullText = [
        pub.title,
        pub.content,
        pub.original_content,
        pub.ai_summary,
        pub.ai_analysis,
        ...(pub.parties_involved || []),
        ...(pub.keywords_matched || [])
      ].filter(Boolean).join(' ');
      
      const { matches, totalCount } = searchWithSynonyms(fullText, terms);
      
      if (matches.length === 0) continue;
      
      // Para cada match, tenta encontrar número de processo próximo
      for (const match of matches) {
        const processNumbers = extractProcessNumbers(fullText, match.position, 300);
        const context = extractContext(fullText, match.position, 200);
        
        // Se encontrou número de processo
        if (processNumbers.length > 0) {
          for (const procNum of processNumbers) {
            if (!processGroups.has(procNum)) {
              processGroups.set(procNum, {
                processNumber: procNum,
                publications: [],
                matches: [],
                totalOccurrences: 0
              });
            }
            
            const group = processGroups.get(procNum);
            
            // Adiciona publicação se ainda não está
            if (!group.publications.find(p => p.id === pub.id)) {
              group.publications.push(pub);
            }
            
            group.matches.push({
              term: match.term,
              originalSearch: match.original,
              type: match.type,
              synonymOf: match.synonymOf,
              context,
              publicationId: pub.id,
              publicationTitle: pub.title
            });
            
            group.totalOccurrences++;
          }
        } else {
          // Sem número de processo identificado - agrupa por publicação
          const fallbackKey = `pub_${pub.id}`;
          if (!processGroups.has(fallbackKey)) {
            processGroups.set(fallbackKey, {
              processNumber: pub.case_number || 'Não identificado',
              publications: [pub],
              matches: [],
              totalOccurrences: 0,
              isUnidentified: true
            });
          }
          
          const group = processGroups.get(fallbackKey);
          group.matches.push({
            term: match.term,
            originalSearch: match.original,
            type: match.type,
            synonymOf: match.synonymOf,
            context,
            publicationId: pub.id,
            publicationTitle: pub.title
          });
          group.totalOccurrences++;
        }
      }
    }
    
    // Converte para array e ordena por número de ocorrências
    const resultsArray = Array.from(processGroups.values())
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences);
    
    setResults({
      searchTerms: terms,
      totalProcesses: resultsArray.filter(r => !r.isUnidentified).length,
      totalMatches: resultsArray.reduce((sum, r) => sum + r.totalOccurrences, 0),
      groups: resultsArray
    });
    
    setIsSearching(false);
    
    if (onResultsFound) {
      onResultsFound(resultsArray);
    }
  };

  const clearSearch = () => {
    setSearchTerms("");
    setResults(null);
    setExpandedProcess(null);
    if (onResultsFound) onResultsFound(null);
  };

  const copyProcessNumber = (num) => {
    navigator.clipboard.writeText(num);
    toast.success("Número copiado!");
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
      {/* Search Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pesquisa Inteligente com Sinônimos
          </h3>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
            <Input
              placeholder="Digite termos separados por vírgula: licitação, contrato, precatório..."
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}
            />
          </div>
          {results && (
            <Button variant="ghost" size="icon" onClick={clearSearch}>
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button 
            onClick={performSearch}
            disabled={!searchTerms.trim() || isSearching}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>

        {/* Info about synonyms */}
        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
          A busca inclui automaticamente sinônimos jurídicos. Ex: "licitação" também busca "pregão", "certame", "edital".
        </p>
      </div>

      {/* Results */}
      {results && (
        <div className={`border-t ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          {/* Summary */}
          <div className={`p-4 ${isDark ? 'bg-neutral-800/50' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className="bg-purple-500/20 text-purple-500 border-0">
                  {results.totalProcesses} processo{results.totalProcesses !== 1 ? 's' : ''} identificado{results.totalProcesses !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className={isDark ? 'border-neutral-600' : ''}>
                  {results.totalMatches} ocorrência{results.totalMatches !== 1 ? 's' : ''} total
                </Badge>
              </div>
              <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                Termos: {results.searchTerms.join(', ')}
              </div>
            </div>
          </div>

          {/* Process Groups */}
          <div className="max-h-[400px] overflow-y-auto">
            {results.groups.map((group, idx) => (
              <div 
                key={idx}
                className={`border-b last:border-b-0 ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}
              >
                {/* Group Header */}
                <div 
                  className={`p-4 cursor-pointer transition-colors ${
                    expandedProcess === idx
                      ? isDark ? 'bg-neutral-800' : 'bg-slate-100'
                      : isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setExpandedProcess(expandedProcess === idx ? null : idx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        group.isUnidentified
                          ? isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                          : isDark ? 'bg-purple-500/10' : 'bg-purple-50'
                      }`}>
                        {group.isUnidentified ? (
                          <AlertCircle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                        ) : (
                          <Hash className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {group.processNumber}
                          </span>
                          {!group.isUnidentified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyProcessNumber(group.processNumber);
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          {group.publications.length} publicação(ões) • {group.totalOccurrences} ocorrência(s)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {[...new Set(group.matches.map(m => m.term))].slice(0, 3).map((term, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                      {expandedProcess === idx ? (
                        <ChevronUp className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedProcess === idx && (
                  <div className={`px-4 pb-4 space-y-3 ${isDark ? 'bg-neutral-800/30' : 'bg-slate-50/50'}`}>
                    {/* Unique matches with context */}
                    {group.matches.slice(0, 5).map((match, mIdx) => (
                      <div 
                        key={mIdx}
                        className={`p-3 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-white border border-slate-200'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${
                            match.type === 'synonym'
                              ? 'bg-amber-500/20 text-amber-600 border-0'
                              : 'bg-green-500/20 text-green-600 border-0'
                          }`}>
                            {match.type === 'synonym' ? `Sinônimo de "${match.synonymOf}"` : 'Termo direto'}
                          </Badge>
                          <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                            encontrado: <strong>"{match.term}"</strong>
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                          {match.context}
                        </p>
                        <div className={`mt-2 text-xs ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                          Fonte: {match.publicationTitle}
                        </div>
                      </div>
                    ))}
                    
                    {group.matches.length > 5 && (
                      <p className={`text-xs text-center ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                        ... e mais {group.matches.length - 5} ocorrência(s)
                      </p>
                    )}

                    {/* Action to view publications */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onSelectProcess && onSelectProcess(group)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver publicações deste processo
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}