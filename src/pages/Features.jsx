import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, 
  FileText, 
  Users, 
  Calendar, 
  Search, 
  FolderOpen, 
  BookOpen, 
  Shield,
  Zap,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Features() {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const mainFeatures = [
    {
      icon: Sparkles,
      title: "Assistente IA JURIS",
      description: "Inteligência artificial especializada em direito brasileiro. Tire dúvidas, pesquise jurisprudência e receba orientações precisas.",
      highlights: ["Respostas instantâneas", "Especializado em direito BR", "Disponível 24/7"]
    },
    {
      icon: FileText,
      title: "LEXIA - Análise de Documentos",
      description: "Upload de documentos jurídicos para análise completa com IA. Identifique riscos, cláusulas importantes e receba sugestões.",
      highlights: ["Análise automática", "Identificação de riscos", "Sugestões de melhoria"]
    },
    {
      icon: FolderOpen,
      title: "Gestão de Processos",
      description: "Organize todos os seus processos em um só lugar. Pastas personalizadas, filtros avançados e visão completa de cada caso.",
      highlights: ["Organização por pastas", "Status e prioridades", "Histórico completo"]
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastro completo de clientes com histórico de processos, documentos e comunicações.",
      highlights: ["Perfil completo", "Histórico integrado", "Comunicação centralizada"]
    },
    {
      icon: Calendar,
      title: "Calendário Inteligente",
      description: "Agenda integrada com prazos, audiências e compromissos. Nunca mais perca um prazo importante.",
      highlights: ["Lembretes automáticos", "Sincronização", "Visão por caso"]
    },
    {
      icon: BookOpen,
      title: "Pesquisa de Jurisprudência",
      description: "Acesso rápido a jurisprudências dos principais tribunais brasileiros com busca inteligente.",
      highlights: ["STF, STJ, TST", "Busca por palavras-chave", "Salvar favoritos"]
    }
  ];

  const additionalFeatures = [
    { icon: Shield, title: "Segurança de Dados", description: "Criptografia de ponta a ponta para proteger informações sensíveis." },
    { icon: Zap, title: "Geração de Documentos", description: "Crie petições, contratos e documentos com templates inteligentes." },
    { icon: Clock, title: "Controle de Prazos", description: "Alertas automáticos para nunca perder um prazo processual." },
    { icon: Users, title: "Trabalho em Equipe", description: "Colabore com sua equipe em tempo real nos processos." }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Nav */}
      <header className="bg-amber-800 text-white">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl("LandingPage")} className="text-xl font-bold tracking-tight">
            JURIS
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to={createPageUrl("AboutUs")} className="text-white/90 hover:text-white">
              Quem somos
            </Link>
            <Link to={createPageUrl("Features")} className="text-white/90 hover:text-white font-medium">
              Funcionalidades
            </Link>
            <Link to={createPageUrl("Contact")} className="text-white/90 hover:text-white">
              Contato
            </Link>
            <button onClick={handleLogin} className="text-white/90 hover:text-white">
              Entrar
            </button>
            <Button 
              onClick={handleLogin}
              className="bg-amber-500 hover:bg-amber-400 text-white font-medium px-6"
            >
              Teste grátis
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-amber-800 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-6">
            <span className="border-b-4 border-amber-400">Funcionalidades</span> que transformam
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Descubra todas as ferramentas que o Juris oferece para otimizar 
            sua rotina jurídica e aumentar sua produtividade.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index} 
                className={`flex flex-col md:flex-row gap-8 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-amber-700" />
                  </div>
                  <h3 className="text-2xl font-medium text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-amber-600" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
                    <feature.icon className="w-24 h-24 text-amber-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 text-center mb-12">E muito mais...</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 text-center mb-12">Compare os Planos</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="border border-gray-200 rounded-2xl p-8">
              <h3 className="text-xl font-medium text-gray-900 mb-2">Gratuito</h3>
              <p className="text-3xl font-light text-gray-900 mb-6">R$ 0 <span className="text-base text-gray-500">/mês</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  5 ações de IA por dia
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Até 3 clientes
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Até 3 processos
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Suporte por email
                </li>
              </ul>
              <Button 
                onClick={handleLogin}
                variant="outline"
                className="w-full"
              >
                Começar grátis
              </Button>
            </div>

            {/* Pro */}
            <div className="border-2 border-amber-500 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                Mais popular
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Profissional</h3>
              <p className="text-3xl font-light text-gray-900 mb-6">R$ 49,99 <span className="text-base text-gray-500">/mês</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                  <strong>Ações de IA ilimitadas</strong>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                  Clientes ilimitados
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                  Processos ilimitados
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                  Todas as funcionalidades
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                  Suporte prioritário
                </li>
              </ul>
              <Button 
                onClick={handleLogin}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Assinar Pro <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-amber-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-6">Experimente todas as funcionalidades</h2>
          <p className="text-white/80 mb-8">
            Comece grátis e descubra como o Juris pode transformar sua rotina.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-amber-500 hover:bg-amber-400 text-white font-medium px-8"
          >
            Criar conta grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400">© 2024 Juris. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to={createPageUrl("LandingPage")} className="text-gray-400 hover:text-white">Início</Link>
            <Link to={createPageUrl("AboutUs")} className="text-gray-400 hover:text-white">Quem somos</Link>
            <Link to={createPageUrl("Contact")} className="text-gray-400 hover:text-white">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}