import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Scale, 
  Sparkles, 
  FileText, 
  Users, 
  Shield,
  ArrowRight,
  Check,
  BarChart3,
  Layers,
  Lock,
  MessageCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AISupportChat from "../components/landing/AISupportChat";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const features = [
    {
      icon: Sparkles,
      title: "IA Jurídica Avançada",
      description: "Assistente inteligente especializado em Direito brasileiro."
    },
    {
      icon: FileText,
      title: "Geração de Documentos",
      description: "Crie petições, contratos e pareceres em minutos."
    },
    {
      icon: BarChart3,
      title: "Análise LEXIA",
      description: "Análise profunda de documentos com identificação de riscos."
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Organize clientes, processos e prazos."
    },
    {
      icon: Lock,
      title: "Segurança Total",
      description: "Dados protegidos com criptografia e LGPD."
    },
    {
      icon: Layers,
      title: "Integração Completa",
      description: "Conecte calendários, equipes e fluxos."
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
      features: ["IA ilimitada", "Clientes ilimitados", "Processos ilimitados", "LEXIA Análise", "Jurisprudência", "Suporte prioritário"],
      cta: "Assinar agora",
      highlighted: true
    }
  ];

  return (
    <div className="bg-black text-white font-light min-h-screen">
      {/* Hero Section with Background Image */}
      <section 
        className="relative min-h-screen flex flex-col"
        style={{
          backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690e408daf48e0f633c6cf3a/0f8c5f3e3_image.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 z-0" />

        {/* Navigation */}
        <nav className="relative z-10 w-full px-6 md:px-12 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <span className="text-2xl font-semibold tracking-tight text-white">Juris</span>

            {/* Action Button */}
            <button 
              onClick={handleLogin}
              className="px-6 py-2.5 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-all"
            >
              Entrar
            </button>
          </div>
        </nav>

        {/* Hero Content - Centered */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-tight mb-6">
              Direito Tradicional.<br />
              <span className="font-semibold">Soluções Modernas.</span>
            </h1>
            
            {/* Underline */}
            <div className="w-24 h-1 bg-white mx-auto rounded-full mb-8" />
            
            <p className="text-white/80 text-lg md:text-xl font-light max-w-2xl mx-auto mb-10">
              Reduza 80% da burocracia com inteligência artificial especializada em Direito brasileiro.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleLogin}
                className="px-8 py-3 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                Começar grátis
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => document.getElementById('recursos').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 text-sm font-medium border border-white/50 text-white rounded-md hover:bg-white/10 transition-all"
              >
                Ver demonstração
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative z-10 flex justify-center pb-8"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "80%", label: "Redução de tempo" },
              { value: "10k+", label: "Usuários ativos" },
              { value: "24/7", label: "Suporte disponível" },
              { value: "99.9%", label: "Disponibilidade" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-light mb-2">{stat.value}</p>
                <p className="text-gray-500 font-extralight text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 bg-gradient-to-b from-black to-gray-950">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-indigo-400 font-extralight tracking-[0.3em] uppercase text-xs mb-4">
              Recursos
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-gray-500 text-lg font-extralight max-w-2xl mx-auto">
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
                  transition={{ delay: idx * 0.05 }}
                  className="p-6 rounded-xl border border-white/10 bg-white/5 hover:border-indigo-500/30 hover:bg-indigo-950/10 transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-light mb-2">{feature.title}</h3>
                  <p className="text-gray-500 font-extralight text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-24 bg-gray-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <p className="text-purple-400 font-extralight tracking-[0.3em] uppercase text-xs mb-4">
                Quem Somos
              </p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
                Feito para advogados que valorizam seu tempo
              </h2>
              <p className="text-gray-400 font-extralight text-lg mb-8 leading-relaxed">
                Nossa plataforma combina inteligência artificial de ponta com profundo conhecimento jurídico brasileiro.
              </p>
              
              <div className="space-y-4">
                {[
                  "Geração automática de petições e recursos",
                  "Pesquisa de jurisprudência inteligente",
                  "Análise de contratos com identificação de riscos",
                  "Gestão completa de processos e prazos"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-gray-300 font-extralight">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-2xl" />
                <div className="relative bg-gray-900/80 border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-300 text-sm font-extralight">
                          Gere uma petição inicial de danos morais...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                        <FileText className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-4">
                        <p className="text-gray-300 text-sm font-extralight">
                          ✓ Petição gerada com 3 fundamentos e 5 jurisprudências.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-purple-400 font-extralight tracking-[0.3em] uppercase text-xs mb-4">
              Preços
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
              Simples e transparente
            </h2>
            <p className="text-gray-500 text-lg font-extralight">
              Comece grátis, evolua quando quiser
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-8 rounded-2xl border transition-all duration-300 ${
                  plan.highlighted 
                    ? "border-indigo-500/50 bg-gradient-to-br from-indigo-950/30 to-purple-950/30" 
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {plan.highlighted && (
                  <div className="text-xs font-extralight tracking-[0.2em] uppercase text-indigo-400 mb-4">
                    Recomendado
                  </div>
                )}
                <h3 className="text-2xl font-light mb-1">{plan.name}</h3>
                <p className="text-gray-500 font-extralight text-sm mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-5xl font-light">{plan.price}</span>
                  <span className="text-gray-500 font-extralight">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-400 font-extralight text-sm">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={handleLogin}
                  className={`w-full py-3 rounded-md font-light text-sm transition-all ${
                    plan.highlighted
                      ? "bg-white text-black hover:bg-gray-100"
                      : "border border-white/20 text-white hover:bg-white/5"
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
      <section className="py-24 bg-gradient-to-r from-indigo-950/30 via-purple-950/30 to-indigo-950/30">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              Pronto para <span className="text-indigo-400">transformar</span> sua advocacia?
            </h2>
            <p className="text-gray-500 text-lg font-extralight mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de advogados que já economizam horas por dia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleLogin}
                className="px-8 py-3 text-sm font-light bg-white text-black rounded-md hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                Começar grátis agora
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowChat(true)}
                className="px-8 py-3 text-sm font-light border border-white/20 text-white rounded-md hover:bg-white/5 transition-all inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com suporte
              </button>
            </div>
            <p className="text-gray-600 text-xs font-extralight mt-6">
              Sem cartão de crédito • 5 ações grátis por dia • Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-black">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center">
                <Scale className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-light">Juris IA</span>
            </div>
            
            <div className="flex items-center gap-8 text-xs text-gray-500 font-extralight">
              <a href="#" className="hover:text-white transition-colors">Termos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <Link to={createPageUrl("Contact")} className="hover:text-white transition-colors">Contato</Link>
            </div>

            <p className="text-xs text-gray-600 font-extralight">
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