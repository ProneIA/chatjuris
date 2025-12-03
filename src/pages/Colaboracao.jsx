import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users2, 
  FolderOpen, 
  Crown,
  ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";

export default function Colaboracao() {
  const items = [
    { title: "Equipes", url: createPageUrl("Teams"), icon: Users2, description: "Gerencie membros, permissões e grupos de trabalho.", proBadge: true },
    { title: "Área de Trabalho", url: createPageUrl("TeamWorkspace"), icon: FolderOpen, description: "Espaço compartilhado para arquivos e projetos.", proBadge: true },
    { title: "Minha Assinatura", url: createPageUrl("MySubscription"), icon: Crown, description: "Gerencie seu plano, faturas e limites de uso." },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900">Colaboração</h1>
          <p className="text-gray-500 mt-2">Recursos para trabalhar em equipe e gerenciar sua conta.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <Link key={index} to={item.url}>
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white p-6 border border-gray-200 hover:border-gray-300 transition-all h-full group relative overflow-hidden"
              >
                {item.proBadge && (
                  <div className="absolute top-4 right-4 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">PRO</div>
                )}
                
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