import React, { useState } from "react";
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
  ChevronDown
} from "lucide-react";

export default function AdvancedSearch({ 
  isDark, 
  onSearch, 
  publications = [],
  activeFilters,
  setActiveFilters
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchMode, setSearchMode] = useState("simple"); // simple, exact, boolean

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

  const matchesSearch = (pub, parsedQuery) => {
    const searchableText = [
      pub.title,
      pub.content,
      pub.ai_summary,
      pub.case_number,
      ...(pub.parties_involved || []),
      ...(pub.keywords_matched || [])
    ].filter(Boolean).join(' ').toLowerCase();

    if (parsedQuery.type === 'empty') return true;

    if (parsedQuery.type === 'exact') {
      return searchableText.includes(parsedQuery.phrase.toLowerCase());
    }

    if (parsedQuery.type === 'simple') {
      return parsedQuery.terms.every(term => searchableText.includes(term));
    }

    if (parsedQuery.type === 'boolean') {
      // AND: todos devem estar presentes
      const andMatch = parsedQuery.and.length === 0 || 
        parsedQuery.and.every(term => searchableText.includes(term));
      
      // OR: pelo menos um deve estar presente (se houver)
      const orMatch = parsedQuery.or.length === 0 || 
        parsedQuery.or.some(term => searchableText.includes(term));
      
      // NOT: nenhum pode estar presente
      const notMatch = parsedQuery.not.length === 0 || 
        !parsedQuery.not.some(term => searchableText.includes(term));

      return andMatch && orMatch && notMatch;
    }

    return true;
  };

  const applyFilters = () => {
    const parsedQuery = parseSearchQuery(searchQuery, searchMode);
    
    const filtered = publications.filter(pub => {
      // Filtro de busca
      if (!matchesSearch(pub, parsedQuery)) return false;

      // Filtro de data
      if (dateFrom && pub.publication_date < dateFrom) return false;
      if (dateTo && pub.publication_date > dateTo) return false;

      return true;
    });

    setActiveFilters({
      query: searchQuery,
      mode: searchMode,
      dateFrom,
      dateTo,
      count: filtered.length
    });

    onSearch(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setSearchMode("simple");
    setActiveFilters(null);
    onSearch(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
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

      {/* Active Filters Display */}
      {activeFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
            {activeFilters.count} resultados
          </span>
          {activeFilters.query && (
            <Badge variant="secondary" className={isDark ? 'bg-neutral-700' : ''}>
              "{activeFilters.query}"
              <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => { setSearchQuery(""); applyFilters(); }} />
            </Badge>
          )}
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