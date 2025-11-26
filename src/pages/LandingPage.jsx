import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  Sparkles, 
  FileText, 
  Users, 
  Clock, 
  Shield,
  ArrowRight,
  Check,
  Zap,
  MessageCircle,
  Sun,
  Moon,
  ChevronRight,
  BarChart3,
  Globe,
  Layers,
  Lock
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AISupportChat from "../components/landing/AISupportChat";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const stats = [
    { value: "80%", label: "Redução de tempo" },
    { value: "10k+", label: "Usuários ativos" },
    { value: "24/7", label: "Suporte disponível" },
    { value: "99.9%", label: "Disponibilidade" }
  ];

  const features = [
    {
      icon: Sparkles,
      title: "IA Jurídica Avançada",
      description: "Assistente inteligente especializado em Direito brasileiro com respostas precisas."
    },
    {
      icon: FileText,
      title: "Geração de Documentos",
      description: "Crie petições, contratos e pareceres em minutos com qualidade profissional."
    },
    {
      icon: BarChart3,
      title: "Análise LEXIA",
      description: "Análise profunda de documentos com identificação de riscos e cláusulas críticas."
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Organize clientes, processos e prazos em uma plataforma unificada."
    },
    {
      icon: Lock,
      title: "Segurança Total",
      description: "Dados protegidos com criptografia de ponta e conformidade LGPD."
    },
    {
      icon: Layers,
      title: "Integração Completa",
      description: "Conecte calendários, equipes e fluxos de trabalho perfeitamente."
    }
  ];

  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "/mês",
      description: "Para começar",
      features: ["5 ações de IA por dia", "Até 3 clientes", "Até 3 processos", "Suporte por email"],
      cta: "Começar grátis",
      highlighted: false
    },
    {
      name: "Profissional",
      price: "R$ 49,99",
      period: "/mês",
      description: "Para profissionais",
      features: ["IA ilimitada", "Clientes ilimitados", "Processos ilimitados", "LEXIA Análise de docs", "Jurisprudência", "Suporte prioritário"],
      cta: "Assinar agora",
      highlighted: true
    }
  ];

  return (
    <div className="bg-black text-white font-light min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-light tracking-tight">Juris IA</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-gray-400 hover:text-white transition-colors font-extralight">
                Recursos
              </a>
              <a href="#precos" className="text-gray-400 hover:text-white transition-colors font-extralight">
                Preços
              </a>
              <a href="#sobre" className="text-gray-400 hover:text-white transition-colors font-extralight">
                Sobre
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {isAuthenticated ? (
                <Link to={createPageUrl("Dashboard")}>
                  <button className="bg-white text-black font-light rounded-md px-5 py-2 hover:bg-opacity-90 transition-all">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="bg-white text-black font-light rounded-md px-5 py-2 hover:bg-opacity-90 transition-all"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-black z-0" />
        
        <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="md:w-1/2 mb-12 md:mb-0 md:pr-12"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Transforme
                </span>{" "}
                sua prática jurídica
              </h1>
              <p className="text-gray-300 text-xl md:text-2xl mb-8 max-w-lg font-extralight tracking-wide">
                Reduza 80% da burocracia com inteligência artificial especializada em Direito brasileiro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleLogin}
                  className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  Começar grátis
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => document.getElementById('recursos').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-transparent border border-gray-700 rounded-md px-6 py-3 hover:bg-white/5 transition-all"
                >
                  Ver recursos
                </button>
              </div>
            </motion.div>

            {/* Right Content - Orbital Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:w-1/2 relative"
            >
              <div className="relative h-[350px] w-[350px] md:h-[500px] md:w-[500px] mx-auto">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-[100px]" />
                
                {/* Main orbital circle - glowing border effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        "0 0 60px rgba(99,102,241,0.5), inset 0 0 60px rgba(0,0,0,0.8)",
                        "0 0 80px rgba(139,92,246,0.6), inset 0 0 80px rgba(0,0,0,0.9)",
                        "0 0 60px rgba(99,102,241,0.5), inset 0 0 60px rgba(0,0,0,0.8)"
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full bg-black border-2 border-indigo-500/50"
                    style={{
                      background: "radial-gradient(circle at center, #000 0%, #000 70%, transparent 100%)"
                    }}
                  />
                </div>

                {/* Rotating ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-full border border-indigo-500/20" />
                </motion.div>

                {/* Orbiting dot */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-[300px] h-[300px] md:w-[420px] md:h-[420px] relative">
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
                  </div>
                </motion.div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute top-12 right-8 md:top-16 md:right-12 bg-black/90 border border-gray-800 rounded-lg p-3 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-gray-300 font-extralight">IA Processando...</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="absolute bottom-16 left-4 md:bottom-20 md:left-8 bg-black/90 border border-gray-800 rounded-lg p-3 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-300 font-extralight">Documento gerado</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [-8, 8, -8], x: [5, -5, 5] }}
                  transition={{ duration: 7, repeat: Infinity }}
                  className="absolute top-1/2 right-0 md:right-4 transform -translate-y-1/2 bg-black/90 border border-gray-800 rounded-lg p-3 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-300 font-extralight">Petição pronta</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-16" />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
              >
                <p className="text-4xl font-light mb-1 tracking-tight">{stat.value}</p>
                <p className="text-gray-400 font-extralight">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/10 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-indigo-400 font-light tracking-widest uppercase text-sm mb-4">
              Recursos
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-gray-400 text-lg font-extralight max-w-2xl mx-auto">
              Ferramentas poderosas projetadas para o profissional jurídico moderno
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group p-6 rounded-xl border border-gray-800 bg-black/50 hover:border-indigo-500/50 hover:bg-indigo-950/10 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 font-extralight">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-purple-400 font-light tracking-widest uppercase text-sm mb-4">
              Preços
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              Simples e transparente
            </h2>
            <p className="text-gray-400 text-lg font-extralight">
              Comece grátis, evolua quando quiser
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-8 rounded-2xl border ${
                  plan.highlighted 
                    ? "border-indigo-500/50 bg-gradient-to-br from-indigo-950/30 to-purple-950/30" 
                    : "border-gray-800 bg-black/50"
                }`}
              >
                {plan.highlighted && (
                  <div className="text-xs font-light tracking-widest uppercase text-indigo-400 mb-4">
                    Recomendado
                  </div>
                )}
                <h3 className="text-2xl font-light mb-2">{plan.name}</h3>
                <p className="text-gray-400 font-extralight mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-5xl font-light tracking-tight">{plan.price}</span>
                  <span className="text-gray-400 font-extralight">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300 font-extralight">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={handleLogin}
                  className={`w-full py-3 rounded-md font-light transition-all ${
                    plan.highlighted
                      ? "bg-white text-black hover:bg-opacity-90"
                      : "bg-transparent border border-gray-700 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/30 via-purple-950/30 to-indigo-950/30" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              Pronto para{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                transformar
              </span>{" "}
              sua advocacia?
            </h2>
            <p className="text-gray-400 text-lg font-extralight mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de advogados que já economizam horas por dia com o Juris IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleLogin}
                className="bg-white text-black font-light rounded-md px-8 py-4 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Começar grátis agora
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowChat(true)}
                className="bg-transparent border border-gray-700 rounded-md px-8 py-4 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com suporte
              </button>
            </div>
            <p className="text-gray-500 text-sm font-extralight mt-6">
              ✓ Sem cartão de crédito &nbsp; ✓ 5 ações grátis por dia &nbsp; ✓ Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-light">Juris IA</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-gray-400 font-extralight">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <Link to={createPageUrl("Contact")} className="hover:text-white transition-colors">Contato</Link>
            </div>

            <p className="text-sm text-gray-500 font-extralight">
              © 2024 Juris IA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Support Chat */}
      <AISupportChat isOpen={showChat} onClose={() => setShowChat(false)} onOpen={() => setShowChat(true)} />
    </div>
  );
}