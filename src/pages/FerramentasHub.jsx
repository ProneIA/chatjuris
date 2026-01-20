import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Calculator, Newspaper, BookOpen, BookTemplate, CalendarDays, ChevronRight, Crown } from "lucide-react";

const ferramentasItems = [
  { title: "Gerador de Peças", description: "Crie documentos jurídicos com IA", url: createPageUrl("DocumentGenerator"), icon: FileText, badge: "IA" },
  { title: "Calculadora Jurídica", description: "Cálculos trabalhistas, juros e prazos", url: createPageUrl("LegalCalculator"), icon: Calculator },
  { title: "Monitor de Diários", description: "Acompanhe publicações oficiais", url: createPageUrl("DiaryMonitor"), icon: Newspaper, badge: "NOVO" },
  { title: "Jurisprudência", description: "Pesquise decisões e precedentes", url: createPageUrl("Jurisprudence"), icon: BookOpen, proBadge: true },
  { title: "Modelos de Peças", description: "Modelos de documentos prontos", url: createPageUrl("Templates"), icon: BookTemplate, proBadge: true },
  { title: "Calendário", description: "Agenda inteligente de compromissos", url: createPageUrl("Calendar"), icon: CalendarDays, proBadge: true },
];

export default function FerramentasHub({ theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Ferramentas
          </h1>
          <p className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Recursos para otimizar seu trabalho jurídico
          </p>
        </div>

        <div className="grid gap-4">
          {ferramentasItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center gap-4 p-4 sm:p-6 rounded-xl border transition-all ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-neutral-800' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </h3>
                    {item.proBadge && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        PRO
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}