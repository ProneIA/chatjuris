import React from "react";
import { Link } from "react-router-dom";
import AffiliateTracker from "@/components/subscription/AffiliateTracker";
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

  const handleFreeTrial = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard") + "?trial=true");
  };

  React.useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        window.location.href = createPageUrl("Dashboard");
      }
    };
    checkAuth();
  }, []);

  const goToPricing = () => {
    window.location.href = createPageUrl("Pricing");
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
    <div className="min-h-screen w-full bg-white">
      <AffiliateTracker />
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        ::-webkit-scrollbar-thumb {
          background: #d4d4d4;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a3a3a3;
        }
      `}</style>

      {/* Hero Section */}
      <section 
        className="min-h-screen w-full relative overflow-hidden"
        style={{
          backgroundImage: `url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690e408daf48e0f633c6cf3a/ec0dffc16_Gemini_Generated_Image_72n7ph72n7ph72n7.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navegação */}
          <nav className="w-full px-4 sm:px-6 md:px-12 py-4 sm:py-6 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Juris
            </span>
            
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link 
                to={createPageUrl("QuemSomos")}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Quem somos
              </Link>
              <Link 
                to={createPageUrl("Funcionalidades")}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Funcionalidades
              </Link>
              <button 
                onClick={handleLogin}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Entrar
              </button>
              <button 
                onClick={handleFreeTrial}
                className="px-5 lg:px-6 py-2.5 text-sm font-medium bg-white text-gray-900 rounded-none border-0 hover:bg-gray-100 transition-all"
              >
                Teste grátis por 7 dias
              </button>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <button 
                onClick={handleLogin}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Entrar
              </button>
              <button 
                onClick={handleFreeTrial}
                className="px-4 py-2 text-sm font-medium bg-white text-gray-900 rounded-none border-0 hover:bg-gray-100 transition-all"
              >
                Teste Grátis
              </button>
            </div>
          </nav>

          {/* Título centralizado */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight leading-tight">
                Direito Tradicional.
              </h1>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-tight mt-1 sm:mt-2">
                Soluções Modernas.
              </h1>
              
              <div className="w-16 sm:w-20 h-0.5 bg-white mx-auto mt-6 sm:mt-8" />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 sm:mt-10">
                <button 
                  onClick={handleFreeTrial}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium bg-white text-gray-900 rounded-none border-0 hover:bg-gray-100 transition-all"
                >
                  Teste grátis por 7 dias
                </button>
                <button 
                  onClick={goToPricing}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium bg-transparent text-white border border-white rounded-none hover:bg-white hover:text-gray-900 transition-all"
                >
                  Ver planos
                </button>
              </div>
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
      <section id="vantagens" className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header da seção */}
          <div className="text-center mb-12 sm:mb-20">
            <p className="text-gray-500 uppercase tracking-widest text-xs sm:text-sm mb-3 sm:mb-4">
              Por que escolher o Juris
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-4 sm:mb-6 px-2">
              Tudo que seu escritório precisa.
              <span className="block font-semibold mt-1 sm:mt-2">Em uma única plataforma.</span>
            </h2>
            <div className="w-12 sm:w-16 h-0.5 bg-gray-900 mx-auto" />
          </div>

          {/* Grid de vantagens */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-20">
            {vantagens.map((vantagem, index) => {
              const Icon = vantagem.icon;
              return (
                <div 
                  key={index}
                  className="p-6 sm:p-8 border border-gray-200 hover:border-gray-400 transition-all group active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 flex items-center justify-center mb-4 sm:mb-6 group-hover:border-gray-900 transition-colors">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 sm:mb-3">
                    {vantagem.titulo}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {vantagem.descricao}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="border border-gray-200 p-6 sm:p-10 lg:p-12 text-center">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-900 mb-3 sm:mb-4">
              Pronto para transformar seu escritório?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de advogados que já economizam tempo e aumentam sua produtividade com o Juris.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button 
                onClick={handleFreeTrial}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium bg-gray-900 text-white rounded-none border-0 hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                Teste grátis por 7 dias
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLogin}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium border border-gray-300 text-gray-900 rounded-none hover:border-gray-900 transition-all"
              >
                Já tenho conta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Benefícios */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-gray-500 uppercase tracking-widest text-xs sm:text-sm mb-3 sm:mb-4">
                Solução Completa
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-4 sm:mb-6">
                Do primeiro atendimento
                <span className="block font-semibold mt-1 sm:mt-2">até a sentença final.</span>
              </h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-6 sm:mb-8">
                O Juris foi desenvolvido por advogados, para advogados. Entendemos as dores do dia a dia e criamos uma ferramenta que realmente resolve seus problemas.
              </p>
              
              <ul className="space-y-3 sm:space-y-4">
                {[
                  "Geração automática de documentos jurídicos",
                  "Controle de prazos processuais",
                  "Gestão de clientes e honorários",
                  "Pesquisa de jurisprudência com IA",
                  "Calendário integrado com lembretes"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-gray-700">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-gray-200 bg-white p-6 sm:p-8 lg:p-10">
              <div className="text-center">
                <p className="text-gray-500 text-xs sm:text-sm mb-2">A partir de</p>
                <p className="text-4xl sm:text-5xl font-light text-gray-900 mb-2">
                  R$ 99<span className="text-xl sm:text-2xl">,90</span>
                </p>
                <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8">/mês</p>
                
                <button 
                  onClick={goToPricing}
                  className="inline-block w-full px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium bg-gray-900 text-white rounded-none border-0 hover:bg-gray-800 transition-all"
                >
                  Ver planos
                </button>
                
                <p className="text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4">
                  Cancele quando quiser. Sem multas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 md:px-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
          <span className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            Juris
          </span>
          <p className="text-gray-500 text-xs sm:text-sm order-3 sm:order-2">
            © 2024 Juris. Todos os direitos reservados.
          </p>
          <Link 
            to={createPageUrl("ContactPublic")}
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors order-2 sm:order-3"
          >
            Contato
          </Link>
        </div>
      </footer>
    </div>
  );
}