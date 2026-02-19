import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CheckoutSuccess({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('validating'); // validating, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const validatePayment = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const preferenceId = searchParams.get('preference_id');
        const paymentId = searchParams.get('payment_id');

        if (!paymentId) {
          setStatus('error');
          setMessage('Pagamento não encontrado. Você será redirecionado...');
          setTimeout(() => navigate(createPageUrl('Pricing')), 3000);
          return;
        }

        // ✅ Validar status do pagamento
        const response = await base44.functions.invoke('validatePaymentStatus', {
          preferenceId,
          paymentId
        });

        if (response.data.approved) {
          setStatus('success');
          setMessage('Seu pagamento foi confirmado com sucesso!');
          setTimeout(() => navigate(createPageUrl('Dashboard')), 2000);
        } else {
          setStatus('error');
          setMessage(`Pagamento ${response.data.status}. Tente novamente.`);
          setTimeout(() => navigate(createPageUrl('Pricing')), 3000);
        }

      } catch (error) {
        console.error('Erro ao validar:', error);
        setStatus('error');
        setMessage('Erro ao validar pagamento. Você será redirecionado...');
        setTimeout(() => navigate(createPageUrl('Pricing')), 3000);
      }
    };

    validatePayment();
  }, [searchParams, navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full p-8 rounded-xl border text-center ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
        }`}
      >
        {status === 'validating' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <h1 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Validando Pagamento
            </h1>
            <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
              Aguarde um momento enquanto validamos seu pagamento...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            </motion.div>
            <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Parabéns!
            </h1>
            <p className={`mb-4 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              {message}
            </p>
            {user && (
              <p className={`text-sm mb-6 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                Olá, {user.full_name}! Você será redirecionado ao painel...
              </p>
            )}
            <Button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              Ir para o Painel
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className={`text-xl font-semibold mb-2 text-red-600`}>
              Erro na Validação
            </h1>
            <p className={`mb-6 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              {message}
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Pricing'))}
              variant="outline"
              className="w-full"
            >
              Voltar aos Planos
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}