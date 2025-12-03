import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  Calculator, 
  Newspaper, 
  BookOpen, 
  BookTemplate, 
  CalendarDays,
  ArrowRight 
} from "lucide-react";
import { motion } from "framer-motion";

export default function Ferramentas() {
  const items = [
    { title: "Gerador de Peças", url: createPageUrl("DocumentGenerator"), icon: FileText, description: "Crie documentos jurídicos complexos com ajuda da IA.", badge: "IA" },
    { title: "Calculadora Jurídica", url: createPageUrl("LegalCalculator"), icon: Calculator, description: "Cálculos trabalhistas, cíveis e previdenciários precisos." },
    { title: "Monitor de Diários", url: createPageUrl("DiaryMonitor"), icon: Newspaper, description: "Acompanhe publicações e intimações em tempo real.", badge: "NOVO" },
    { title: "Jurisprudência", url: createPageUrl("Jurisprudence"), icon: BookOpen, description: "Pesquisa inteligente de decisões e acórdãos.", proBadge: true },
    { title: "Templates", url: createPageUrl("Templates"), icon: BookTemplate, description: "Banco de modelos editáveis para diversas áreas.", proBadge: true },
    { title: "Calendário", url: createPageUrl("Calendar"), icon: CalendarDays, description: "Agenda inteligente integrada aos seus prazos.", proBadge: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900">Ferramentas</h1>
          <p className="text-gray-500 mt-2">Utilitários poderosos para potencializar sua atuação jurídica.</p>
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
                {item.badge && (
                  <div className="absolute top-4 right-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{item.badge}</div>
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