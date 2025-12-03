import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users2, FolderOpen, Crown, ChevronRight } from "lucide-react";

const colaboracaoItems = [
  { title: "Equipes", description: "Gerencie membros da equipe", url: createPageUrl("Teams"), icon: Users2, proBadge: true },
  { title: "Área de Trabalho", description: "Espaço colaborativo da equipe", url: createPageUrl("TeamWorkspace"), icon: FolderOpen, proBadge: true },
  { title: "Minha Assinatura", description: "Gerencie seu plano e pagamentos", url: createPageUrl("MySubscription"), icon: Crown },
];

export default function ColaboracaoHub({ theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Colaboração
          </h1>
          <p className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Trabalhe em equipe e gerencie sua assinatura
          </p>
        </div>

        <div className="grid gap-4">
          {colaboracaoItems.map((item) => {
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