import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Calendar, 
  X, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";

export default function AdvancedSearch({ 
  isDark, 
  onSearch, 
  publications = [],
  activeFilters,
  setActiveFilters,
  onNavigateToMatch,
  groupByProcess = false
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchMode, setSearchMode] = useState("simple"); // simple, exact, boolean
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showGrouped, setShowGrouped] = useState(false);

  const parseSearchQuery = (query, mode) => {
    if (!query.trim()) return { type: 'empty' };

    if (mode === 'exact') {
      // Busca por frase exata
      return { type: 'exact', phrase: query.trim() };
    }

    if (mode === 'boolean') {
      // Parse de operadores booleanos
      const tokens = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < query.length; i++) {
        const char = query[i];
        if (char === '"') {
          inQuotes = !inQuotes;
          current += char;
        } else if (char === ' ' && !inQuotes) {
          if (current.trim()) tokens.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) tokens.push(current.trim());

      const parsed = {
        type: 'boolean',
        and: [],
        or: [],
        not: []
      };

      let nextOperator = 'and';
      for (const token of tokens) {
        const upperToken = token.toUpperCase();
        if (upperToken === 'AND' || upperToken === 'E') {
          nextOperator = 'and';
        } else if (upperToken === 'OR' || upperToken === 'OU') {
          nextOperator = 'or';
        } else if (upperToken === 'NOT' || upperToken === 'NÃO' || upperToken === 'NAO') {
          nextOperator = 'not';
        } else {
          // Remove aspas se for frase exata
          const cleanToken = token.replace(/^"|"$/g, '');
          parsed[nextOperator].push(cleanToken.toLowerCase());
          nextOperator = 'and';
        }
      }

      return parsed;
    }

    // Busca simples
    return { 
      type: 'simple', 
      terms: query.toLowerCase().split(/\s+/).filter(t => t.length > 0) 
    };
  };

  // Conta ocorrências de um termo no texto
  const countOccurrences = (text, term) => {
    if (!text || !term) return 0;
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  };

  const matchesSearch = (pub, parsedQuery) => {
    const searchableText = [
      pub.title,
      pub.content,
      pub.ai_summary,
      pub.case_number,
      ...(pub.parties_involved || []),
      ...(pub.keywords_matched || [])
    ].filter(Boolean).join(' ').toLowerCase();

    if (parsedQuery.type === 'empty') return { matches: true, count: 0 };

    let count = 0;

    if (parsedQuery.type === 'exact') {
      count = countOccurrences(searchableText, parsedQuery.phrase.toLowerCase());
      return { matches: count > 0, count };
    }

    if (parsedQuery.type === 'simple') {
      const allMatch = parsedQuery.terms.every(term => searchableText.includes(term));
      if (allMatch) {
        count = parsedQuery.terms.reduce((sum, term) => sum + countOccurrences(searchableText, term), 0);
      }
      return { matches: allMatch, count };
    }

    if (parsedQuery.type === 'boolean') {
      const andMatch = parsedQuery.and.length === 0 || 
        parsedQuery.and.every(term => searchableText.includes(term));
      const orMatch = parsedQuery.or.length === 0 || 
        parsedQuery.or.some(term => searchableText.includes(term));
      const notMatch = parsedQuery.not.length === 0 || 
        !parsedQuery.not.some(term => searchableText.includes(term));

      const matches = andMatch && orMatch && notMatch;
      if (matches) {
        count = [...parsedQuery.and, ...parsedQuery.or].reduce(
          (sum, term) => sum + countOccurrences(searchableText, term), 0
        );
      }
      return { matches, count };
    }

    return { matches: true, count: 0 };
  };

  const applyFilters = () => {
    const parsedQuery = parseSearchQuery(searchQuery, searchMode);
    
    let totalOccurrences = 0;
    const filtered = [];
    const processGroups = {};

    publications.forEach(pub => {
      const result = matchesSearch(pub, parsedQuery);
      
      if (!result.matches) return;
      if (dateFrom && pub.publication_date < dateFrom) return;
      if (dateTo && pub.publication_date > dateTo) return;

      // Adiciona contagem de ocorrências à publicação
      const pubWithCount = { ...pub, _matchCount: result.count };
      filtered.push(pubWithCount);
      totalOccurrences += result.count;

      // Agrupa por processo se tiver número
      if (pub.case_number) {
        const caseNum = pub.case_number.trim();
        if (!processGroups[caseNum]) {
          processGroups[caseNum] = { publications: [], totalMatches: 0 };
        }
        processGroups[caseNum].publications.push(pubWithCount);
        processGroups[caseNum].totalMatches += result.count;
      }
    });

    setCurrentMatchIndex(0);
    setActiveFilters({
      query: searchQuery,
      mode: searchMode,
      dateFrom,
      dateTo,
      count: filtered.length,
      totalOccurrences,
      processGroups: Object.entries(processGroups).map(([caseNum, data]) => ({
        caseNumber: caseNum,
        count: data.publications.length,
        totalMatches: data.totalMatches,
        publications: data.publications
      })).sort((a, b) => b.totalMatches - a.totalMatches)
    });

    onSearch(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setSearchMode("simple");
    setActiveFilters(null);
    setCurrentMatchIndex(0);
    setShowGrouped(false);
    onSearch(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const navigateMatch = (direction) => {
    if (!activeFilters || activeFilters.count === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % activeFilters.count;
    } else {
      newIndex = currentMatchIndex === 0 ? activeFilters.count - 1 : currentMatchIndex - 1;
    }
    setCurrentMatchIndex(newIndex);
    if (onNavigateToMatch) {
      onNavigateToMatch(newIndex);
    }
  };

  return (
    <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
          <Input
            placeholder={
              searchMode === 'exact' ? 'Digite a frase exata...' :
              searchMode === 'boolean' ? 'Ex: precatório AND pagamento NOT cancelado' :
              'Buscar publicações...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}
          />
        </div>

        <Select value={searchMode} onValueChange={setSearchMode}>
          <SelectTrigger className={`w-[140px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simples</SelectItem>
            <SelectItem value="exact">Frase Exata</SelectItem>
            <SelectItem value="boolean">Booleana</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={showHelp} onOpenChange={setShowHelp}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={isDark ? 'text-neutral-400' : ''}>
              <HelpCircle className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={`w-80 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}>
            <div className="space-y-3">
              <h4 className={`font-medium ${isDark ? 'text-white' : ''}`}>Dicas de Busca</h4>
              
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Busca Simples:</p>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Digite palavras separadas por espaço. Todas devem estar presentes.
                </p>
              </div>

              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Frase Exata:</p>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Busca a frase completa exatamente como digitada.
                </p>
              </div>

              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>Busca Booleana:</p>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  Use operadores AND, OR, NOT (ou E, OU, NÃO)
                </p>
                <div className={`text-xs mt-1 p-2 rounded ${isDark ? 'bg-neutral-700' : 'bg-slate-100'}`}>
                  <code>precatório AND pagamento</code><br/>
                  <code>"tutela urgência" OR liminar</code><br/>
                  <code>sentença NOT improcedente</code>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
          <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Período:</span>
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className={`w-[150px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}
          placeholder="De"
        />
        <span className={isDark ? 'text-neutral-500' : 'text-slate-400'}>até</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className={`w-[150px] ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}
          placeholder="Até"
        />

        <div className="flex-1" />

        <Button variant="outline" onClick={clearFilters} className={isDark ? 'border-neutral-700' : ''}>
          Limpar
        </Button>
        <Button onClick={applyFilters} className="bg-purple-600 hover:bg-purple-700">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </div>

      {/* Results Bar - Similar to Google PDF Search */}
      {activeFilters && activeFilters.query && (
        <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
          <div className="flex items-center gap-3">
            {/* Match Counter and Navigation */}
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${isDark ? 'bg-neutral-700' : 'bg-white border'}`}>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeFilters.count > 0 ? currentMatchIndex + 1 : 0}
              </span>
              <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                / {activeFilters.count}
              </span>
              {activeFilters.totalOccurrences > 0 && (
                <span className={`text-xs ml-2 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                  ({activeFilters.totalOccurrences} ocorrências)
                </span>
              )}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateMatch('prev')}
                disabled={activeFilters.count === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateMatch('next')}
                disabled={activeFilters.count === 0}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Term Display */}
            <Badge variant="secondary" className={`${isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
              "{activeFilters.query}"
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={clearFilters} />
            </Badge>
          </div>

          {/* Group by Process Toggle */}
          {activeFilters.processGroups && activeFilters.processGroups.length > 0 && (
            <Button
              variant={showGrouped ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGrouped(!showGrouped)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Agrupar por Processo ({activeFilters.processGroups.length})
            </Button>
          )}
        </div>
      )}

      {/* Grouped by Process View */}
      {showGrouped && activeFilters?.processGroups && (
        <div className={`p-4 rounded-lg border space-y-2 max-h-[300px] overflow-y-auto ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
            Publicações agrupadas por processo:
          </h4>
          {activeFilters.processGroups.map((group, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${isDark ? 'bg-neutral-700/50 border-neutral-600 hover:border-neutral-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              onClick={() => {
                const firstPub = group.publications[0];
                if (onNavigateToMatch && firstPub) {
                  onNavigateToMatch(firstPub.id);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`font-mono text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {group.caseNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={isDark ? 'border-neutral-500' : ''}>
                    {group.count} publicação{group.count > 1 ? 'ões' : ''}
                  </Badge>
                  <Badge className={`${isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                    {group.totalMatches} ocorrência{group.totalMatches > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Filters Tags */}
      {activeFilters && (activeFilters.dateFrom || activeFilters.dateTo || activeFilters.mode !== 'simple') && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.dateFrom && (
            <Badge variant="secondary" className={isDark ? 'bg-neutral-700' : ''}>
              De: {activeFilters.dateFrom}
            </Badge>
          )}
          {activeFilters.dateTo && (
            <Badge variant="secondary" className={isDark ? 'bg-neutral-700' : ''}>
              Até: {activeFilters.dateTo}
            </Badge>
          )}
          {activeFilters.mode !== 'simple' && (
            <Badge variant="outline" className={isDark ? 'border-purple-500 text-purple-400' : ''}>
              Modo: {activeFilters.mode === 'exact' ? 'Exato' : 'Booleano'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}