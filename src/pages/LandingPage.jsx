import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  Sparkles, 
  FileText, 
  Users, 
  Clock, 
  Shield,
  ArrowRight,
  Check,
  Star,
  Zap,
  MessageCircle,
  Calculator,
  ChevronDown,
  Play,
  Trophy,
  TrendingUp,
  Building2,
  X
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PriceSimulator from "../components/landing/PriceSimulator";
import TestimonialsCarousel from "../components/landing/TestimonialsCarousel";
import AISupportChat from "../components/landing/AISupportChat";
import FeaturesGrid from "../components/landing/FeaturesGrid";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const stats = [
    { value: "80%", label: "Redução de tempo" },
    { value: "10k+", label: "Documentos gerados" },
    { value: "500+", label: "Advogados ativos" },
    { value: "4.9", label: "Avaliação média", icon: Star }
  ];

  const logos = [
    "OAB", "CFOAB", "AASP", "IASP", "ABAdv"
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">Juris IA</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Recursos
              </a>
              <a href="#precos" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Preços
              </a>
              <a href="#depoimentos" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Depoimentos
              </a>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to={createPageUrl("Dashboard")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                    Acessar Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLogin} className="hidden sm:inline-flex">
                    Entrar
                  </Button>
                  <Button 
                    onClick={handleLogin}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                  >
                    Comece Grátis
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-blue-100 text-blue-700 mb-6 px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Inteligência Artificial Jurídica
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                Reduza sua{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Burocracia Jurídica
                </span>{" "}
                em 80%
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
                A plataforma de IA mais avançada para advogados. Gere documentos, 
                analise contratos e pesquise jurisprudência em segundos, não horas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-lg px-8 py-6 shadow-xl shadow-blue-500/25"
                >
                  Comece Grátis Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-6 border-2"
                  onClick={() => document.getElementById('precos').scrollIntoView({ behavior: 'smooth' })}
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Simule Seu Preço
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Dados Protegidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Suporte 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-purple-600" />
                  <span>Cancele quando quiser</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-1 shadow-2xl">
                <div className="bg-white rounded-[22px] p-6">
                  <div className="bg-slate-900 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="space-y-2 text-sm font-mono">
                      <p className="text-blue-400">// Assistente IA</p>
                      <p className="text-green-400">&gt; Gerando petição inicial...</p>
                      <p className="text-white">✓ Documento gerado em 12 segundos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-slate-700">Documentos</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <Sparkles className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-slate-700">IA Avançada</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Documento salvo</p>
                    <p className="text-[10px] text-slate-500">Agora mesmo</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">80% mais rápido</p>
                    <p className="text-[10px] text-slate-500">que métodos tradicionais</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">{stat.value}</p>
                  {stat.icon && <stat.icon className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                </div>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Partner Logos */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500 mb-6">Reconhecido por profissionais de</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {logos.map((logo, idx) => (
                <div key={idx} className="text-xl font-bold text-slate-400">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-purple-100 text-purple-700 mb-4">Recursos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Ferramentas poderosas de IA projetadas especificamente para o profissional jurídico brasileiro
            </p>
          </motion.div>

          <FeaturesGrid />
        </div>
      </section>

      {/* Price Simulator Section */}
      <section id="precos" className="py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-blue-500/20 text-blue-400 mb-4">Simulador de Preços</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Calcule Seu Investimento em 30 Segundos
            </h2>
            <p className="text-lg text-slate-400">
              Transparência total. Sem surpresas. Veja exatamente quanto vai pagar.
            </p>
          </motion.div>

          <PriceSimulator onSubscribe={handleLogin} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-green-100 text-green-700 mb-4">Depoimentos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              O que Advogados Dizem Sobre Nós
            </h2>
            <p className="text-lg text-slate-600">
              Mais de 500 profissionais já transformaram sua prática jurídica
            </p>
          </motion.div>

          <TestimonialsCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Pronto para Transformar sua Prática Jurídica?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Comece grátis hoje e veja a diferença em minutos, não semanas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-100 text-lg px-8 py-6"
              >
                Começar Grátis Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar com Suporte
              </Button>
            </div>
            <p className="text-sm text-white/60 mt-6">
              ✓ Sem cartão de crédito &nbsp; ✓ 5 ações grátis por dia &nbsp; ✓ Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">Juris IA</span>
              </div>
              <p className="text-slate-400 text-sm">
                A plataforma de IA mais avançada para profissionais do Direito.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#recursos" className="hover:text-white">Recursos</a></li>
                <li><a href="#precos" className="hover:text-white">Preços</a></li>
                <li><a href="#depoimentos" className="hover:text-white">Depoimentos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to={createPageUrl("Contact")} className="hover:text-white">Contato</Link></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © 2024 Juris IA. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* AI Support Chat Widget */}
      <AISupportChat isOpen={showChat} onClose={() => setShowChat(false)} onOpen={() => setShowChat(true)} />
    </div>
  );
}