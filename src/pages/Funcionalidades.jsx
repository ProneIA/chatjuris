import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Scale, 
  Sparkles, 
  FileText, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  CalendarDays, 
  BookOpen, 
  BookTemplate,
  Search,
  Zap,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const features = [
  {
    icon: Sparkles,
    title: "Assistente IA Jurídico",
    description: "Inteligência artificial especializada em direito brasileiro. Tire dúvidas, pesquise jurisprudência e receba orientações em segundos.",
    highlight: true
  },
  {
    icon: FileText,
    title: "LEXIA - Análise de Documentos",
    description: "Envie contratos, petições e documentos para análise automática. Identifique riscos, cláusulas importantes e receba sugestões de melhoria."
  },
  {
    icon: FolderOpen,
    title: "Gestão de Processos",
    description: "Organize todos os seus casos em um só lugar. Acompanhe prazos, andamentos e nunca perca uma deadline importante."
  },
  {
    icon: Users,
    title: "Cadastro de Clientes",
    description: "Mantenha informações de clientes organizadas e acessíveis. Histórico completo de atendimentos e documentos."
  },
  {
    icon: CheckSquare,
    title: "Gestão de Tarefas",
    description: "Crie e acompanhe tarefas do escritório. Defina prioridades, prazos e responsáveis para cada atividade."
  },
  {
    icon: CalendarDays,
    title: "Calendário Inteligente",
    description: "Agenda integrada com lembretes automáticos. Nunca mais perca uma audiência ou prazo processual."
  },
  {
    icon: BookOpen,
    title: "Pesquisa de Jurisprudência",
    description: "Busque decisões de tribunais de forma rápida e inteligente. Encontre precedentes relevantes para seus casos."
  },
  {
    icon: BookTemplate,
    title: "Templates de Documentos",
    description: "Biblioteca de modelos de petições, contratos e documentos jurídicos prontos para personalizar."
  },
  {
    icon: Users,
    title: "Trabalho em Equipe",
    description: "Colabore com sua equipe em tempo real. Compartilhe casos, documentos e tarefas de forma segura."
  }
];

export default function Funcionalidades() {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl("LandingPage")} className="flex items-center gap-2">
            <Scale className="w-7 h-7 text-gray-900" />
            <span className="text-xl font-semibold text-gray-900">Juris</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to={createPageUrl("QuemSomos")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Quem somos
            </Link>
            <Link to={createPageUrl("Funcionalidades")} className="text-sm font-medium text-gray-900">
              Funcionalidades
            </Link>
            <button onClick={handleLogin} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </button>
            <Button onClick={handleLogin} className="bg-gray-900 text-white hover:bg-gray-800">
              Teste grátis
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            Tudo que você precisa para sua prática jurídica
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Ferramentas poderosas de IA combinadas com gestão completa do escritório em uma única plataforma.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
            <Zap className="w-5 h-5 mr-2" />
            Começar teste grátis
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`p-6 rounded-xl border transition-all hover:shadow-lg ${
                  feature.highlight 
                    ? 'bg-gray-900 text-white border-gray-900' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <feature.icon className={`w-10 h-10 mb-4 ${feature.highlight ? 'text-white' : 'text-gray-900'}`} />
                <h3 className={`text-lg font-medium mb-2 ${feature.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${feature.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-12 text-center">Por que escolher o Juris?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Rápido e Eficiente</h3>
              <p className="text-gray-600">Economize horas de trabalho com automação inteligente de tarefas repetitivas.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Seguro e Confiável</h3>
              <p className="text-gray-600">Seus dados protegidos com criptografia e infraestrutura de nível empresarial.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">IA Especializada</h3>
              <p className="text-gray-600">Inteligência artificial treinada especificamente para o direito brasileiro.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Experimente gratuitamente
          </h2>
          <p className="text-gray-400 mb-8">
            Comece com 5 ações de IA grátis por dia. Sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleLogin} size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
              Criar conta grátis
            </Button>
            <Link to={createPageUrl("Pricing")}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Ver planos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={createPageUrl("LandingPage")} className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-gray-900" />
            <span className="font-medium text-gray-900">Juris</span>
          </Link>
          <p className="text-sm text-gray-500">© 2024 Juris. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}