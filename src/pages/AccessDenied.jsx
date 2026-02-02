import React from "react";
import { motion } from "framer-motion";
import { Shield, CreditCard, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AccessDenied() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const checkoutUrl = "https://pay.hotmart.com/SEU_PRODUTO_HOTMART_AQUI";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Acesso Restrito
          </h1>

          {user && (
            <p className="text-center text-purple-200 mb-6">
              Olá, <span className="font-semibold">{user.full_name}</span>
            </p>
          )}

          <p className="text-lg text-center text-purple-100 mb-8">
            Este aplicativo é exclusivo para assinantes. Para ter acesso completo a todas as funcionalidades, você precisa realizar a assinatura.
          </p>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">Acesso Ilimitado</h3>
                <p className="text-sm text-purple-200">Todas as funcionalidades sem restrições</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">Assistente IA Avançado</h3>
                <p className="text-sm text-purple-200">Análise jurídica com inteligência artificial</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">Gestão Completa</h3>
                <p className="text-sm text-purple-200">Processos, clientes, documentos e financeiro</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">10+ Calculadoras Jurídicas</h3>
                <p className="text-sm text-purple-200">Trabalhista, cível, tributária e muito mais</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <a 
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
                <CreditCard className="w-5 h-5 mr-2" />
                Assinar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>

            {user && (
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Sair da Conta
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-purple-300 mt-6">
            Após realizar o pagamento, você terá acesso imediato ao sistema
          </p>
        </div>
      </motion.div>
    </div>
  );
}