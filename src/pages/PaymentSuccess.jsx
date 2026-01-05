import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Loader2 } from "lucide-react";
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

    // Verificar status do pagamento
    const checkPayment = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const subs = await base44.entities.Subscription.filter({ user_id: user.id });
          const subscription = subs[0];

          if (subscription && subscription.status === "active") {
            setStatus("success");
            setMessage("Pagamento confirmado! Bem-vindo ao Juris Pro!");
          } else {
            setStatus("pending");
            setMessage("Seu pagamento está sendo processado. Você receberá uma confirmação em breve.");
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage("Erro ao verificar pagamento. Entre em contato com o suporte.");
      }
    };

    setTimeout(checkPayment, 2000);
  }, []);

  const handleContinue = () => {
    navigate(createPageUrl("Dashboard"));
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">🎉 Pagamento Aprovado!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button 
              onClick={handleContinue}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Começar a usar o Juris Pro
            </Button>
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