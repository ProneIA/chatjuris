import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scale, Users, Target, Award, ArrowLeft, Shield, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AboutUs() {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const team = [
    {
      name: "Equipe Jurídica",
      role: "Especialistas em Direito",
      description: "Advogados experientes que orientam o desenvolvimento das funcionalidades jurídicas."
    },
    {
      name: "Equipe de Tecnologia",
      role: "Desenvolvedores & IA",
      description: "Especialistas em inteligência artificial e desenvolvimento de software."
    },
    {
      name: "Equipe de Suporte",
      role: "Atendimento ao Cliente",
      description: "Profissionais dedicados a garantir a melhor experiência para nossos usuários."
    }
  ];

  const values = [
    { icon: Shield, title: "Segurança", description: "Seus dados protegidos com a mais alta tecnologia de criptografia." },
    { icon: Zap, title: "Inovação", description: "Sempre buscando as melhores soluções em inteligência artificial." },
    { icon: Heart, title: "Compromisso", description: "Dedicados ao sucesso dos profissionais do direito." },
    { icon: Target, title: "Excelência", description: "Qualidade em cada funcionalidade que desenvolvemos." }
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
            <Link to={createPageUrl("AboutUs")} className="text-white/90 hover:text-white font-medium">
              Quem somos
            </Link>
            <Link to={createPageUrl("Features")} className="text-white/90 hover:text-white">
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
            Quem <span className="border-b-4 border-amber-400">Somos</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Somos uma empresa de tecnologia dedicada a transformar a prática jurídica 
            através da inteligência artificial.
          </p>
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-6">Nossa Missão</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                O Juris nasceu com o objetivo de democratizar o acesso à tecnologia jurídica 
                de ponta. Acreditamos que todo profissional do direito merece ferramentas 
                que otimizem seu tempo e potencializem seus resultados.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Nossa plataforma combina inteligência artificial avançada com a expertise 
                de profissionais jurídicos para oferecer soluções que realmente fazem 
                diferença no dia a dia de advogados, escritórios e departamentos jurídicos.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <Scale className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                Tecnologia a Serviço do Direito
              </h3>
              <p className="text-gray-600">
                Utilizamos as mais recentes inovações em IA para criar ferramentas 
                intuitivas e poderosas que simplificam tarefas complexas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nossos Valores */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 text-center mb-12">Nossos Valores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossa Equipe */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 text-center mb-12">Nossa Equipe</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{member.name}</h3>
                <p className="text-amber-700 text-sm mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-amber-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-6">Pronto para transformar sua prática jurídica?</h2>
          <p className="text-white/80 mb-8">
            Junte-se a milhares de profissionais que já utilizam o Juris.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-amber-500 hover:bg-amber-400 text-white font-medium px-8"
          >
            Comece seu teste grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400">© 2024 Juris. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to={createPageUrl("LandingPage")} className="text-gray-400 hover:text-white">Início</Link>
            <Link to={createPageUrl("Features")} className="text-gray-400 hover:text-white">Funcionalidades</Link>
            <Link to={createPageUrl("Contact")} className="text-gray-400 hover:text-white">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}