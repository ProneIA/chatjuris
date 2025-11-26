import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { 
  Scale, 
  FileText, 
  Clock, 
  Shield, 
  Users, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  ChevronDown
} from "lucide-react";

export default function LandingPage() {
  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const scrollToSection = () => {
    document.getElementById('vantagens')?.scrollIntoView({ behavior: 'smooth' });
  };

  const vantagens = [
    {
      icon: Sparkles,
      titulo: "Inteligência Artificial Jurídica",
      descricao: "Gere petições, contratos e pareceres em segundos com nossa IA treinada em milhares de documentos jurídicos."
    },
    {
      icon: Clock,
      titulo: "Economize 80% do Tempo",
      descricao: "Automatize tarefas repetitivas e foque no que realmente importa: seus clientes e estratégias."
    },
    {
      icon: FileText,
      titulo: "Gestão Completa de Processos",
      descricao: "Organize todos os seus casos, prazos e documentos em um único lugar, com alertas automáticos."
    },
    {
      icon: Shield,
      titulo: "Segurança Total",
      descricao: "Seus dados protegidos com criptografia de ponta e em conformidade total com a LGPD."
    },
    {
      icon: Users,
      titulo: "Colaboração em Equipe",
      descricao: "Compartilhe processos e documentos com sua equipe de forma segura e organizada."
    },
    {
      icon: Scale,
      titulo: "Jurisprudência Atualizada",
      descricao: "Acesse decisões dos principais tribunais e fortaleça suas teses com fundamentação sólida."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-black">
      {/* Custom Scrollbar Styles */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      {/* Hero Section */}
      <section 
        className="min-h-screen w-full relative"
        style={{
          backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690e408daf48e0f633c6cf3a/ec0dffc16_Gemini_Generated_Image_72n7ph72n7ph72n7.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navegação */}
          <nav className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
            <span className="text-2xl font-semibold text-white tracking-tight">
              Juris
            </span>
            
            <button 
              onClick={handleLogin}
              className="px-6 py-2.5 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-all"
            >
              Entrar
            </button>
          </nav>

          {/* Título centralizado */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-tight">
                Direito Tradicional.
              </h1>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-tight mt-2">
                Soluções Modernas.
              </h1>
              
              <div className="w-20 h-0.5 bg-white mx-auto mt-8" />

              <Link 
                to={createPageUrl("Plans")}
                className="inline-block mt-10 px-8 py-3.5 text-base font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-all"
              >
                Assinar agora
              </Link>
            </div>
          </div>

          {/* Indicador de scroll */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <button onClick={scrollToSection} className="text-white/70 hover:text-white transition-colors">
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
        </div>
      </section>

      {/* Seção de Vantagens */}
      <section id="vantagens" className="py-24 px-6 md:px-12 bg-black">
        <div className="max-w-6xl mx-auto">
          {/* Header da seção */}
          <div className="text-center mb-20">
            <p className="text-gray-500 uppercase tracking-widest text-sm mb-4">
              Por que escolher o Juris
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6">
              Tudo que seu escritório precisa.
              <span className="block font-semibold mt-2">Em uma única plataforma.</span>
            </h2>
            <div className="w-16 h-0.5 bg-white mx-auto" />
          </div>

          {/* Grid de vantagens */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {vantagens.map((vantagem, index) => {
              const Icon = vantagem.icon;
              return (
                <div 
                  key={index}
                  className="p-8 border border-gray-800 rounded-lg hover:border-gray-600 transition-all group"
                >
                  <div className="w-12 h-12 border border-gray-700 rounded-lg flex items-center justify-center mb-6 group-hover:border-white transition-colors">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3">
                    {vantagem.titulo}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {vantagem.descricao}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="border border-gray-800 rounded-lg p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-light text-white mb-4">
              Pronto para transformar seu escritório?
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de advogados que já economizam tempo e aumentam sua produtividade com o Juris.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to={createPageUrl("Plans")}
                className="px-8 py-3.5 text-base font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-all flex items-center gap-2"
              >
                Começar agora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={handleLogin}
                className="px-8 py-3.5 text-base font-medium border border-gray-700 text-white rounded-md hover:border-white transition-all"
              >
                Já tenho conta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Benefícios */}
      <section className="py-24 px-6 md:px-12 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gray-500 uppercase tracking-widest text-sm mb-4">
                Solução Completa
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                Do primeiro atendimento
                <span className="block font-semibold mt-2">até a sentença final.</span>
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                O Juris foi desenvolvido por advogados, para advogados. Entendemos as dores do dia a dia e criamos uma ferramenta que realmente resolve seus problemas.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Geração automática de documentos jurídicos",
                  "Controle de prazos processuais",
                  "Gestão de clientes e honorários",
                  "Pesquisa de jurisprudência com IA",
                  "Calendário integrado com lembretes"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-gray-800 rounded-lg p-10">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-2">A partir de</p>
                <p className="text-5xl font-light text-white mb-2">
                  R$ 49<span className="text-2xl">,99</span>
                </p>
                <p className="text-gray-500 text-sm mb-8">/mês</p>
                
                <Link 
                  to={createPageUrl("Plans")}
                  className="inline-block w-full px-8 py-4 text-base font-medium bg-white text-black rounded-md hover:bg-gray-100 transition-all"
                >
                  Ver planos
                </Link>
                
                <p className="text-gray-600 text-sm mt-4">
                  Cancele quando quiser. Sem multas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-black border-t border-gray-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xl font-semibold text-white tracking-tight">
            Juris
          </span>
          <p className="text-gray-600 text-sm">
            © 2024 Juris. Todos os direitos reservados.
          </p>
          <Link 
            to={createPageUrl("Contact")}
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            Contato
          </Link>
        </div>
      </footer>
    </div>
  );
}