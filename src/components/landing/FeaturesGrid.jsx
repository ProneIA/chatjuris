import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Search, 
  Users, 
  Calendar,
  Shield,
  Zap,
  FolderOpen,
  Sparkles,
  BookOpen,
  MessageSquare,
  BarChart3,
  Clock
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Assistente IA Avançado",
    description: "Gere documentos, tire dúvidas jurídicas e receba orientações em tempo real com nossa IA especializada em Direito brasileiro.",
    color: "from-blue-500 to-cyan-500",
    highlight: true
  },
  {
    icon: FileText,
    title: "Gerador de Documentos",
    description: "Crie petições, contratos, pareceres e mais de 20 tipos de documentos jurídicos em minutos, não horas.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Search,
    title: "Análise LEXIA",
    description: "Nossa IA analisa contratos e documentos complexos, identificando riscos, cláusulas importantes e pontos de atenção.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: BookOpen,
    title: "Pesquisa de Jurisprudência",
    description: "Encontre jurisprudências relevantes dos tribunais superiores em segundos com busca inteligente.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Organize todos os seus clientes em um só lugar com histórico completo e documentação centralizada.",
    color: "from-blue-600 to-indigo-600"
  },
  {
    icon: FolderOpen,
    title: "Controle de Processos",
    description: "Acompanhe o status de todos os seus casos, prazos e movimentações de forma visual e intuitiva.",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: Calendar,
    title: "Calendário Inteligente",
    description: "Integre com Google Calendar, receba lembretes de prazos e organize sua agenda automaticamente.",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados protegidos com criptografia de ponta a ponta e conformidade total com a LGPD.",
    color: "from-slate-600 to-slate-800"
  },
  {
    icon: Zap,
    title: "Workspace de Equipes",
    description: "Colabore com sua equipe em tempo real, compartilhe documentos e divida tarefas de forma eficiente.",
    color: "from-yellow-500 to-orange-500"
  }
];

export default function FeaturesGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={`h-full border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              feature.highlight ? "ring-2 ring-blue-500 ring-offset-2" : ""
            }`}>
              <CardContent className="p-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}