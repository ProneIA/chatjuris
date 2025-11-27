import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scale, Users, Target, Award, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function QuemSomos() {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            Transformando a advocacia com inteligência artificial
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Somos uma equipe apaixonada por tecnologia e direito, dedicada a criar ferramentas que simplificam o trabalho jurídico.
          </p>
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-light text-gray-900 mb-6">Nossa Missão</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Democratizar o acesso à tecnologia jurídica avançada, permitindo que advogados de todos os portes aumentem sua produtividade e ofereçam serviços de maior qualidade aos seus clientes.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Acreditamos que a inteligência artificial pode ser uma aliada poderosa na prática jurídica, automatizando tarefas repetitivas e permitindo que os profissionais foquem no que realmente importa: a estratégia e o atendimento ao cliente.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <Target className="w-8 h-8 text-gray-900 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Foco no Cliente</h3>
                <p className="text-sm text-gray-600">Desenvolvemos soluções pensadas nas necessidades reais dos advogados.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <Sparkles className="w-8 h-8 text-gray-900 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Inovação</h3>
                <p className="text-sm text-gray-600">Utilizamos as mais avançadas tecnologias de IA do mercado.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <Users className="w-8 h-8 text-gray-900 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Colaboração</h3>
                <p className="text-sm text-gray-600">Facilitamos o trabalho em equipe com ferramentas colaborativas.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <Award className="w-8 h-8 text-gray-900 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Excelência</h3>
                <p className="text-sm text-gray-600">Comprometidos com a qualidade em cada detalhe.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-8 text-center">Nossa História</h2>
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <p>
              O Juris nasceu da percepção de que o setor jurídico brasileiro precisava de uma solução tecnológica que realmente entendesse as particularidades do direito nacional.
            </p>
            <p>
              Fundado por uma equipe de desenvolvedores e advogados, combinamos expertise técnica com conhecimento jurídico profundo para criar uma plataforma que fala a linguagem do direito brasileiro.
            </p>
            <p>
              Hoje, ajudamos advogados em todo o Brasil a trabalhar de forma mais inteligente, economizando tempo em tarefas rotineiras e focando no que realmente importa: seus clientes e casos.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            Pronto para transformar sua prática jurídica?
          </h2>
          <p className="text-gray-400 mb-8">
            Comece gratuitamente e descubra como a IA pode ajudar no seu dia a dia.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
            Começar gratuitamente
          </Button>
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