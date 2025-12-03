import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Users2, 
  FolderOpen, 
  FileText, 
  CheckSquare,
  ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";

export default function Gestao() {
  const items = [
    { title: "Clientes", url: createPageUrl("Clients"), icon: Users, description: "Gerencie sua base de clientes, contatos e históricos." },
    { title: "Portal do Cliente", url: createPageUrl("ClientPortal"), icon: Users2, description: "Área exclusiva para seus clientes acompanharem processos." },
    { title: "Processos", url: createPageUrl("Cases"), icon: FolderOpen, description: "Controle total dos seus processos judiciais e administrativos." },
    { title: "Documentos", url: createPageUrl("DocumentsEnhanced"), icon: FileText, description: "Gestão inteligente de documentos e arquivos." },
    { title: "Tarefas", url: createPageUrl("Tasks"), icon: CheckSquare, description: "Organize prazos, audiências e atividades do escritório." },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900">Gestão</h1>
          <p className="text-gray-500 mt-2">Ferramentas para administrar seu escritório e processos.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <Link key={index} to={item.url}>
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white p-6 border border-gray-200 hover:border-gray-300 transition-all h-full group"
              >
                <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-lg mb-4 group-hover:bg-gray-100 transition-colors">
                  <item.icon className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-sm text-gray-500">{item.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}