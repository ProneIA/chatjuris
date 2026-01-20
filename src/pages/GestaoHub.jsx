import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Users2, FolderOpen, FileText, ChevronRight } from "lucide-react";

const gestaoItems = [
  { title: "Clientes", description: "Gerencie seus clientes e contatos", url: createPageUrl("Clients"), icon: Users },
  { title: "Portal do Cliente", description: "Acesso e comunicação com clientes", url: createPageUrl("ClientPortal"), icon: Users2 },
  { title: "Processos", description: "Acompanhe casos e processos", url: createPageUrl("Cases"), icon: FolderOpen },
  { title: "Documentos", description: "Gerencie documentos jurídicos", url: createPageUrl("DocumentsEnhanced"), icon: FileText },
];

export default function GestaoHub({ theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestão
          </h1>
          <p className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Gerencie clientes, processos e documentos
          </p>
        </div>

        <div className="grid gap-4">
          {gestaoItems.map((item) => {
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
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
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