import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  Sparkles, 
  FileText, 
  Users, 
  Shield,
  ArrowRight,
  Check,
  Zap,
  MessageCircle,
  Sun,
  Moon,
  BarChart3,
  Layers,
  Lock,
  ChevronDown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AISupportChat from "../components/landing/AISupportChat";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  // Orbital animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    let rotation = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius - 20, centerX, centerY, radius + 60);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
      gradient.addColorStop(0.8, 'rgba(139, 92, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Main dark circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();

      // Glowing ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Animated orbital ring
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      
      // Draw orbital path with gradient effect
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const x = Math.cos(angle) * (radius + 15);
        const y = Math.sin(angle) * (radius + 15) * 0.3;
        
        const opacity = (Math.sin(angle + rotation * 2) + 1) / 2 * 0.5 + 0.1;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.fill();
      }
      
      ctx.restore();

      // Inner subtle glow
      const innerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      innerGlow.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
      innerGlow.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();

      rotation += 0.005;
      requestAnimationFrame(draw);
    };

    draw();
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border border-indigo-500/50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              </div>
              <span className="text-lg font-light tracking-tight">Juris IA</span>
            </div>

            <div className="hidden md:flex items-center gap-10">
              <a href="#recursos" className="text-gray-400 hover:text-white transition-colors text-sm font-light">
                Recursos
              </a>
              <a href="#solucoes" className="text-gray-400 hover:text-white transition-colors text-sm font-light">
                Soluções
              </a>
              <a href="#precos" className="text-gray-400 hover:text-white transition-colors text-sm font-light">
                Preços
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              {isAuthenticated ? (
                <Link to={createPageUrl("Dashboard")}>
                  <button className="bg-white text-black text-sm font-light rounded-md px-4 py-2 hover:bg-gray-100 transition-all">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="bg-white text-black text-sm font-light rounded-md px-4 py-2 hover:bg-gray-100 transition-all"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Divider Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
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
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter mb-6 leading-[1.1]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Transforme
                </span>{" "}
                sua advocacia com precisão
              </h1>
              <p className="text-gray-300 text-xl md:text-2xl mb-8 max-w-lg font-extralight tracking-wide leading-relaxed">
                Reduza 80% da burocracia com inteligência artificial especializada em Direito brasileiro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleLogin}
                  className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-gray-100 transition-all"
                >
                  Começar grátis
                </button>
                <button 
                  onClick={() => document.getElementById('recursos').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-transparent border border-gray-700 text-white rounded-md px-6 py-3 hover:bg-white/5 transition-all"
                >
                  Ver demonstração
                </button>
              </div>
            </motion.div>

            {/* Right Content - Orbital Canvas */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="md:w-1/2 relative flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
                <canvas 
                  ref={canvasRef}
                  width={500}
                  height={500}
                  className="relative z-10"
                  style={{ width: '400px', height: '400px' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-16" />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
              >
                <p className="text-4xl md:text-5xl font-light mb-1 tracking-tight">{stat.value}</p>
                <p className="text-gray-400 font-extralight text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/5 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-6 rounded-xl border border-gray-800/50 bg-black/30 hover:border-indigo-500/30 hover:bg-indigo-950/5 transition-all duration-500"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-light mb-2 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-500 font-extralight text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solucoes" className="py-24 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <p className="text-purple-400 font-extralight tracking-[0.3em] uppercase text-xs mb-4">
                Soluções
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
                <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
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
                          Gere uma petição inicial de danos morais para o caso do cliente João Silva...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                        <FileText className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-4">
                        <p className="text-gray-300 text-sm font-extralight">
                          ✓ Petição gerada com sucesso! Incluídos 3 fundamentos jurídicos e 5 jurisprudências relevantes.
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
      <section id="precos" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/5 to-black" />
        
        <div className="container mx-auto px-6 relative z-10">
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
                    ? "border-indigo-500/50 bg-gradient-to-br from-indigo-950/20 to-purple-950/20" 
                    : "border-gray-800/50 bg-black/30 hover:border-gray-700"
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
                  <span className="text-5xl font-light tracking-tight">{plan.price}</span>
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
                      : "bg-transparent border border-gray-700 text-white hover:bg-white/5"
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
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 via-purple-950/20 to-indigo-950/20" />
        
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
            <p className="text-gray-500 text-lg font-extralight mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de advogados que já economizam horas por dia com o Juris IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleLogin}
                className="bg-white text-black font-light rounded-md px-8 py-3 hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                Começar grátis agora
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowChat(true)}
                className="bg-transparent border border-gray-700 text-white rounded-md px-8 py-3 hover:bg-white/5 transition-all inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com suporte
              </button>
            </div>
            <p className="text-gray-600 text-sm font-extralight mt-6">
              Sem cartão de crédito • 5 ações grátis por dia • Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-indigo-500/50 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
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