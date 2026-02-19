import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function MercadoPagoCheckout({ planId, onSuccess, theme = 'light' }) {
  const isDark = theme === 'dark';
  const [step, setStep] = useState('form'); // form, loading, redirect, error
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    email: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatCPF = (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  };

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      setError('CPF inválido');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Email inválido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    setStep('loading');

    try {
      // ✅ Criar preferência no backend
      const response = await base44.functions.invoke('createCheckoutPreference', {
        planId,
        payerData: formData
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao criar checkout');
      }

      // ✅ Redirecionar para Mercado Pago
      setStep('redirect');
      window.location.href = response.data.checkoutUrl;

    } catch (err) {
      console.error('Erro:', err);
      setError(err.message || 'Erro ao processar pagamento');
      setStep('error');
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className={`p-8 text-center rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
        <p className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Redirecionando para Mercado Pago...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Dados do Pagador
      </h3>

      {error && (
        <div className={`p-4 rounded-lg mb-4 flex gap-2 ${isDark ? 'bg-red-900/20 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Nome Completo */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
            Nome Completo *
          </label>
          <Input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="João da Silva"
            required
            className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}
          />
        </div>

        {/* CPF */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
            CPF *
          </label>
          <Input
            type="text"
            name="cpf"
            value={formData.cpf}
            onChange={handleCPFChange}
            placeholder="123.456.789-10"
            required
            maxLength="14"
            className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}
          />
        </div>

        {/* Email */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
            Email *
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="seu@email.com"
            required
            className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Ir para Pagamento'
          )}
        </Button>
      </div>

      <p className={`text-xs mt-4 text-center ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
        Seus dados são transmitidos com segurança via HTTPS
      </p>
    </form>
  );
}