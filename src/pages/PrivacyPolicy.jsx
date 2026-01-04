import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy({ theme = 'light' }) {
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
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Política de Privacidade
            </h1>
          </div>

          <div className={`space-y-6 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
            <p className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>1. Introdução</h2>
              <p>
                O Juris está comprometido com a proteção da sua privacidade e dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>2. Dados Coletados</h2>
              <p className="mb-2">Coletamos os seguintes dados pessoais:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nome completo e email (dados cadastrais)</li>
                <li>CPF/CNPJ de clientes (apenas quando necessário)</li>
                <li>Informações de processos jurídicos</li>
                <li>Documentos e arquivos enviados</li>
                <li>Dados de uso da plataforma (logs de acesso)</li>
                <li>Informações de pagamento (processadas por terceiros seguros)</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>3. Finalidade do Tratamento</h2>
              <p className="mb-2">Utilizamos seus dados para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Prestar os serviços da plataforma</li>
                <li>Gerenciar sua conta e assinatura</li>
                <li>Processar pagamentos</li>
                <li>Melhorar nossos serviços</li>
                <li>Cumprir obrigações legais</li>
                <li>Enviar comunicações sobre o serviço</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>4. Base Legal (Art. 7º LGPD)</h2>
              <p className="mb-2">Tratamos seus dados com base em:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Consentimento expresso do titular</li>
                <li>Execução de contrato</li>
                <li>Cumprimento de obrigação legal</li>
                <li>Legítimo interesse</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>5. Compartilhamento de Dados</h2>
              <p className="mb-2">Seus dados podem ser compartilhados com:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Processadores de pagamento (Cakto, Mercado Pago)</li>
                <li>Provedores de infraestrutura (Base44, servidores cloud)</li>
                <li>Serviços de IA (OpenAI - com dados anonimizados)</li>
                <li>Autoridades, quando exigido por lei</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>6. Armazenamento e Segurança</h2>
              <p>
                Seus dados são armazenados em servidores seguros com criptografia. CPF/CNPJ são criptografados adicionalmente. 
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acessos não autorizados.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>7. Retenção de Dados</h2>
              <p>
                Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas, respeitando prazos legais aplicáveis. 
                Dados de processos jurídicos podem ser mantidos por até 5 anos após o encerramento, conforme exigências legais.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>8. Seus Direitos (Art. 18º LGPD)</h2>
              <p className="mb-2">Você tem direito a:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar anonimização, bloqueio ou eliminação</li>
                <li>Portabilidade de dados</li>
                <li>Informações sobre compartilhamento</li>
                <li>Revogar consentimento</li>
              </ul>
              <p className="mt-2">
                Para exercer seus direitos, acesse a página <Link to={createPageUrl("MyData")} className="text-blue-600 hover:underline">Meus Dados</Link> ou entre em contato conosco.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>9. Encarregado de Dados (DPO)</h2>
              <p>
                Para questões sobre privacidade e proteção de dados, entre em contato com nosso Encarregado:<br />
                Email: <a href="mailto:dpo@juris.app" className="text-blue-600 hover:underline">dpo@juris.app</a>
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>10. Cookies</h2>
              <p>
                Utilizamos cookies essenciais para o funcionamento da plataforma. Você pode gerenciar cookies nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>11. Alterações</h2>
              <p>
                Esta política pode ser atualizada. Notificaremos sobre mudanças significativas por email ou através da plataforma.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>12. Contato</h2>
              <p>
                Para dúvidas sobre esta política:<br />
                Email: <a href="mailto:contato@juris.app" className="text-blue-600 hover:underline">contato@juris.app</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}