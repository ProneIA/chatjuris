import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verificando seu pagamento...");

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    let attempts = 0;
    const maxAttempts = 6;
    
    // Verificar status do pagamento com retry
    const checkPayment = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const subs = await base44.entities.Subscription.filter({ user_id: user.id });
          const subscription = subs[0];

          if (subscription && subscription.status === "active" && subscription.plan === "pro") {
            setStatus("success");
            setMessage("Pagamento confirmado! Bem-vindo ao Juris Pro!");
            return true; // Sucesso, parar tentativas
          } else if (attempts >= maxAttempts) {
            setStatus("pending");
            setMessage("Seu pagamento está sendo processado. Você receberá uma confirmação em breve.");
            return true; // Parar tentativas
          }
        }
        return false; // Continuar tentando
      } catch (error) {
        if (attempts >= maxAttempts) {
          setStatus("error");
          setMessage("Erro ao verificar pagamento. Entre em contato com o suporte.");
          return true;
        }
        return false;
      }
    };

    // Verificar a cada 2 segundos, até 6 tentativas (12 segundos total)
    const interval = setInterval(async () => {
      attempts++;
      const shouldStop = await checkPayment();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 2000);

    // Primeira verificação imediata
    checkPayment().then(shouldStop => {
      if (shouldStop) {
        clearInterval(interval);
      }
    });

    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    navigate(createPageUrl("Dashboard"));
  };

  const handleCloseTab = () => {
    window.close();
    // Se não conseguir fechar (algumas restrições de navegadores), redirecionar
    setTimeout(() => {
      navigate(createPageUrl("Dashboard"));
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Aguarde...</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              🎉 Pagamento Concluído!
            </h1>
            <p className="text-lg text-gray-700 mb-2 font-medium">
              Sua assinatura foi ativada com sucesso
            </p>
            <p className="text-gray-600 mb-8">
              Todas as funcionalidades do plano Pro já estão disponíveis para você
            </p>

            <div className="space-y-3">
              <Button 
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Acessar Sistema Completo
              </Button>
              
              <Button 
                onClick={handleCloseTab}
                variant="outline"
                className="w-full py-6 text-base"
              >
                <X className="w-5 h-5 mr-2" />
                Fechar esta aba
              </Button>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✓ IA Ilimitada<br />
                ✓ Todos os recursos liberados<br />
                ✓ Suporte prioritário ativo
              </p>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-12 h-12 text-yellow-600 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">⏳ Processando...</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button 
              onClick={handleContinue}
              variant="outline"
              className="w-full"
            >
              Voltar ao Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Ops!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button 
              onClick={() => navigate(createPageUrl("Contact"))}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Falar com Suporte
            </Button>
          </>
        )}
      </div>
    </div>
  );
}