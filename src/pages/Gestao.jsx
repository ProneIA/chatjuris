import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, Users2, FolderOpen, FileText, CheckSquare, ArrowRight } from "lucide-react";

export default function Gestao({ theme = 'light' }) {
  const isDark = theme === 'dark';
  
  const items = [
    { title: "Clientes", url: createPageUrl("Clients"), icon: Users, description: "Gerencie sua base de clientes, contatos e histórico." },
    { title: "Portal do Cliente", url: createPageUrl("ClientPortal"), icon: Users2, description: "Área exclusiva para seus clientes acompanharem processos." },
    { title: "Processos", url: createPageUrl("Cases"), icon: FolderOpen, description: "Organize e acompanhe todos os seus processos jurídicos." },
    { title: "Documentos", url: createPageUrl("DocumentsEnhanced"), icon: FileText, description: "Gestão inteligente de documentos e arquivos." },
    { title: "Tarefas", url: createPageUrl("Tasks"), icon: CheckSquare, description: "Controle de prazos e tarefas da equipe." },
  ];

  return (
    <div className={`min-h-screen p-6 md:p-12 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-light mb-4">Gestão</h1>
          <p className={`text-lg ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Ferramentas completas para gerenciar seu escritório e processos.
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
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                isDark ? 'bg-neutral-800 text-white group-hover:bg-neutral-700' : 'bg-gray-100 text-gray-900 group-hover:bg-gray-200'
              }`}>
                <item.icon className="w-6 h-6" />
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