import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsOfService({ theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <Link to={createPageUrl("Settings")} className={`inline-flex items-center gap-2 mb-6 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className={`rounded-xl border p-8 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Termos de Uso
            </h1>
          </div>

          <div className={`space-y-6 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
            <p className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o Juris, você concorda com estes Termos de Uso e com nossa Política de Privacidade. 
                Se não concordar, não use a plataforma.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>2. Descrição do Serviço</h2>
              <p>
                O Juris é uma plataforma SaaS para gestão jurídica com recursos de IA, voltada para advogados e escritórios de advocacia. 
                Oferecemos ferramentas de organização, automação e análise jurídica.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>3. Cadastro e Conta</h2>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Você deve fornecer informações verdadeiras e atualizadas</li>
                <li>É responsável pela segurança da sua senha</li>
                <li>Não pode compartilhar sua conta</li>
                <li>Deve ter no mínimo 18 anos ou capacidade legal</li>
                <li>Deve ser advogado inscrito na OAB ou escritório regularizado</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>4. Planos e Pagamento</h2>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Oferecemos planos Gratuito e Profissional</li>
                <li>Os preços estão descritos na página de assinatura</li>
                <li>Pagamentos são processados por terceiros (Cakto, Mercado Pago)</li>
                <li>Renovação automática, salvo cancelamento</li>
                <li>Sem reembolso para planos mensais já utilizados</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>5. Uso Aceitável</h2>
              <p className="mb-2">Você concorda em NÃO:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Usar a plataforma para fins ilegais</li>
                <li>Violar direitos de terceiros</li>
                <li>Fazer engenharia reversa ou tentar hackear o sistema</li>
                <li>Sobrecarregar a infraestrutura</li>
                <li>Revender ou redistribuir o serviço</li>
                <li>Usar para spam ou atividades maliciosas</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>6. Propriedade Intelectual</h2>
              <p>
                Todo conteúdo da plataforma (código, design, marca) é propriedade do Juris. 
                Você mantém os direitos sobre os dados que insere na plataforma.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>7. IA e Limitações</h2>
              <p>
                Os recursos de IA são auxiliares e não substituem aconselhamento jurídico profissional. 
                Você é responsável por revisar e validar todo conteúdo gerado pela IA antes de usar.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>8. Disponibilidade</h2>
              <p>
                Buscamos manter o serviço disponível 99.9% do tempo, mas podem ocorrer interrupções para manutenção. 
                Não garantimos disponibilidade ininterrupta.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>9. Limitação de Responsabilidade</h2>
              <p>
                O Juris não se responsabiliza por danos indiretos, perda de lucros ou dados decorrentes do uso da plataforma. 
                Nossa responsabilidade está limitada ao valor pago nos últimos 12 meses.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>10. Cancelamento</h2>
              <p>
                Você pode cancelar sua assinatura a qualquer momento. O acesso permanece até o fim do período pago. 
                Podemos suspender ou encerrar contas que violem estes termos.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>11. Modificações</h2>
              <p>
                Podemos alterar estes termos. Mudanças significativas serão notificadas com 30 dias de antecedência. 
                O uso continuado após as mudanças implica em aceitação.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>12. Lei Aplicável</h2>
              <p>
                Estes termos são regidos pelas leis brasileiras. 
                Foro: Comarca de São Paulo/SP.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>13. Contato</h2>
              <p>
                Dúvidas sobre estes termos:<br />
                Email: <a href="mailto:contato@juris.app" className="text-blue-600 hover:underline">contato@juris.app</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}