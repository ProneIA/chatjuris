import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Calculator, Newspaper, BookOpen, BookTemplate, CalendarDays, ArrowRight, Scale } from "lucide-react";

export default function Ferramentas({ theme = 'light' }) {
  const isDark = theme === 'dark';
  
  const items = [
    { title: "Gerador de Peças", url: createPageUrl("DocumentGenerator"), icon: FileText, badge: "IA", description: "Crie documentos jurídicos em segundos com Inteligência Artificial." },
    { title: "Calculadora Jurídica", url: createPageUrl("LegalCalculator"), icon: Calculator, description: "Cálculos trabalhistas, cíveis e atualizações monetárias." },
    { title: "Monitor de Diários", url: createPageUrl("DiaryMonitor"), icon: Newspaper, badge: "NOVO", description: "Acompanhe publicações em diários oficiais automaticamente." },
    { title: "Jurisprudência", url: createPageUrl("Jurisprudence"), icon: BookOpen, proBadge: true, description: "Pesquisa inteligente de jurisprudência unificada." },
    { title: "Templates", url: createPageUrl("Templates"), icon: BookTemplate, proBadge: true, description: "Modelos prontos e personalizáveis para seu escritório." },
    { title: "Calendário", url: createPageUrl("Calendar"), icon: CalendarDays, proBadge: true, description: "Gestão de prazos, audiências e compromissos." },
  ];

  return (
    <div className={`min-h-screen p-6 md:p-12 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-light mb-4">Ferramentas</h1>
          <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Utilitários poderosos para otimizar sua rotina jurídica.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link 
              key={item.title} 
              to={item.url}
              className={`group p-6 border rounded-xl transition-all hover:shadow-lg ${
                isDark 
                  ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'bg-neutral-800 text-white group-hover:bg-neutral-700' : 'bg-gray-100 text-gray-900 group-hover:bg-gray-200'
                }`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  {item.proBadge && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200 text-gray-600'
                    }`}>PRO</span>
                  )}
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-medium mb-2 flex items-center gap-2">
                {item.title}
                <ArrowRight className={`w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}