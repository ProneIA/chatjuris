import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { 
  Scale, 
  FileText, 
  Users, 
  Calendar, 
  Brain, 
  Shield, 
  Clock, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const features = [
    {
      icon: Brain,
      title: "Inteligência Artificial",
      description: "Geração automática de documentos jurídicos com IA avançada, economizando horas de trabalho."
    },
    {
      icon: FileText,
      title: "Gestão de Documentos",
      description: "Organize petições, contratos e pareceres em um único lugar seguro e acessível."
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastre e acompanhe todos os seus clientes e processos de forma centralizada."
    },
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Nunca perca um prazo. Calendário integrado com lembretes automáticos."
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia de ponta e conformidade LGPD."
    },
    {
      icon: TrendingUp,
      title: "Relatórios e Métricas",
      description: "Acompanhe o desempenho do escritório com dashboards intuitivos."
    }
  ];

  const benefits = [
    "Reduza 80% do tempo em tarefas repetitivas",
    "Acesse de qualquer lugar, a qualquer hora",
    "Suporte especializado em português",
    "Atualizações constantes sem custo adicional",
    "Integração com calendário Google e Outlook",
    "Backup automático de todos os dados"
  ];

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Custom Scrollbar Styles */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #888;
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
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Navegação */}
          <nav className="w-full px-6 md:px-12 py-6 flex items-center justify-between">
            <span className="text-2xl font-semibold text-white tracking-tight">
              Juris
            </span>
            
            <button 
              onClick={handleLogin}
              className="px-6 py-2.5 text-sm font-medium bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-all"
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
                className="inline-block mt-10 px-8 py-3.5 text-base font-medium bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-all"
              >
                Assinar agora
              </Link>

              {/* Scroll indicator */}
              <div className="mt-16 animate-bounce">
                <div className="w-6 h-10 border-2 border-white/50 rounded-full mx-auto flex justify-center pt-2">
                  <div className="w-1 h-2 bg-white/70 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por que escolher Juris */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">
              Por que escolher o Juris
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900">
              Tudo que seu escritório precisa,
            </h2>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mt-1">
              em uma única plataforma.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-8 border border-gray-200 rounded-lg hover:border-gray-400 transition-all group"
              >
                <feature.icon className="w-8 h-8 text-gray-900 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-24 px-6 md:px-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">
                Vantagens exclusivas
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-2">
                Simplifique sua rotina.
              </h2>
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-8">
                Maximize seus resultados.
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                O Juris foi desenvolvido por advogados para advogados. 
                Entendemos as necessidades do dia a dia jurídico e criamos 
                uma solução que realmente funciona.
              </p>
              
              <Link 
                to={createPageUrl("Plans")}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all"
              >
                Começar agora
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-gray-900 shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 md:px-12 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles className="w-10 h-10 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
            Pronto para transformar
          </h2>
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            seu escritório?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de advogados que já estão economizando tempo 
            e aumentando a produtividade com o Juris.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={createPageUrl("Plans")}
              className="px-8 py-3.5 text-base font-medium bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-all"
            >
              Ver planos
            </Link>
            <button 
              onClick={handleLogin}
              className="px-8 py-3.5 text-base font-medium border border-white text-white rounded-md hover:bg-white/10 transition-all"
            >
              Entrar na plataforma
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-semibold text-white">Juris</span>
          <p className="text-gray-500 text-sm">
            © 2024 Juris. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}