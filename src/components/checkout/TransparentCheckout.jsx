import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle2, CreditCard, Smartphone, QrCode, Copy, RefreshCw } from "lucide-react";

// ============ CONSTANTS ============
const PLAN_AMOUNTS = {
  pro_monthly: 119.90,
  pro_yearly: 1198.80
};

// ============ COUPON SECTION ============
function CouponSection({ planId, onApply, isDark }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('validateCoupon', { couponCode: code.trim().toUpperCase(), planId });
    setLoading(false);
    if (res.data?.valid) {
      setApplied({ code: code.trim().toUpperCase(), discount: res.data.discount, discountType: res.data.discount_type, finalAmount: res.data.final_amount });
      onApply({ code: code.trim().toUpperCase(), discount: res.data.discount, discountType: res.data.discount_type, finalAmount: res.data.final_amount });
    } else {
      setError(res.data?.error || 'Cupom inválido ou expirado.');
      setApplied(null);
      onApply(null);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setCode('');
    setError(null);
    onApply(null);
  };

  return (
    <div className={`p-3 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
      <p className={`text-xs font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>Cupom de desconto</p>
      {applied ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
              {applied.code} — {applied.discountType === 'percent' ? `${applied.discount}% OFF` : `R$ ${applied.discount.toFixed(2).replace('.', ',')} OFF`}
            </span>
          </div>
          <button onClick={handleRemove} className={`text-xs underline ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Remover</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: MENSAL50OFF"
            className={`text-sm ${isDark ? 'bg-neutral-700 border-neutral-600 text-white' : ''}`}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
          />
          <Button variant="outline" size="sm" onClick={handleApply} disabled={loading || !code.trim()} className="shrink-0">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aplicar'}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ============ HELPERS ============
function formatCPF(v) {
  const c = v.replace(/\D/g, '');
  if (c.length <= 3) return c;
  if (c.length <= 6) return `${c.slice(0,3)}.${c.slice(3)}`;
  if (c.length <= 9) return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6)}`;
  return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9,11)}`;
}

function formatCardNumber(v) {
  const c = v.replace(/\D/g, '').slice(0, 16);
  return c.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(v) {
  const c = v.replace(/\D/g, '').slice(0, 4);
  if (c.length > 2) return `${c.slice(0,2)}/${c.slice(2)}`;
  return c;
}

// ============ CARD BRAND DETECTOR ============
function getCardBrand(number) {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'master';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5)/.test(n)) return 'discover';
  if (/^(?:2131|1800|35)/.test(n)) return 'jcb';
  if (/^3(?:0[0-5]|[68])/.test(n)) return 'diners';
  if (/^(606282|3841)/.test(n)) return 'hipercard';
  if (/^(38|60)/.test(n)) return 'hipercard';
  if (/^636368/.test(n)) return 'elo';
  if (/^(4011|4312|4389|4514|4576|5041|5067|5090|6277|6362|6516|6550)/.test(n)) return 'elo';
  return null;
}

// MP card brand -> payment_method_id
const BRAND_TO_METHOD = {
  visa: 'visa',
  master: 'master',
  amex: 'amex',
  elo: 'elo',
  hipercard: 'hipercard',
  diners: 'diners',
  jcb: 'jcb',
};

// ============ PIX SECTION ============
function PixPaymentSection({ planId, payerData, onSuccess, isDark }) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(null);

  const createPixPayment = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('createTransparentPayment', {
      planId,
      paymentMethod: 'pix',
      payerData
    });

    if (!res.data.success) {
      setError(res.data.error || 'Erro ao gerar PIX');
      setLoading(false);
      return;
    }

    setPixData(res.data.pix);
    setPaymentId(res.data.paymentId);
    setPolling(true);
    setLoading(false);
  };

  useEffect(() => {
    if (!polling || !paymentId) return;

    pollingRef.current = setInterval(async () => {
      const res = await base44.functions.invoke('checkPaymentStatus', { paymentId });
      if (res.data.status === 'approved') {
        clearInterval(pollingRef.current);
        onSuccess();
      } else if (res.data.status === 'rejected' || res.data.status === 'cancelled') {
        clearInterval(pollingRef.current);
        setError('Pagamento não aprovado.');
        setPolling(false);
      }
    }, 5000);

    return () => clearInterval(pollingRef.current);
  }, [polling, paymentId]);

  const copyCode = () => {
    navigator.clipboard.writeText(pixData.qrCodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pixData) {
    return (
      <div className="space-y-4">
        {error && <ErrorBox message={error} isDark={isDark} />}
        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
          Gere o QR Code PIX e pague com qualquer banco. A confirmação é automática em segundos.
        </p>
        <Button onClick={createPixPayment} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Gerando PIX...</> : <><QrCode className="w-4 h-4 mr-2" />Gerar QR Code PIX</>}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border-2 border-green-500 text-center ${isDark ? 'bg-neutral-800' : 'bg-green-50'}`}>
        {pixData.qrCode ? (
          <img
            src={`data:image/png;base64,${pixData.qrCode}`}
            alt="QR Code PIX"
            className="mx-auto w-48 h-48 mb-3"
          />
        ) : (
          <div className={`w-48 h-48 mx-auto flex items-center justify-center rounded-lg ${isDark ? 'bg-neutral-700' : 'bg-gray-100'}`}>
            <QrCode className="w-16 h-16 text-green-500" />
          </div>
        )}
        <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>
          Escaneie o QR Code com seu banco
        </p>
        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Válido por 24 horas
        </p>
      </div>

      {pixData.qrCodeText && (
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Código PIX Copia e Cola:</p>
          <p className={`text-xs break-all font-mono ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{pixData.qrCodeText.slice(0,40)}...</p>
          <Button variant="outline" size="sm" onClick={copyCode} className="mt-2 w-full">
            {copied ? <><CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />Copiado!</> : <><Copy className="w-3 h-3 mr-1" />Copiar código</>}
          </Button>
        </div>
      )}

      <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-blue-50'}`}>
        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
        <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-blue-700'}`}>Aguardando confirmação do pagamento...</p>
      </div>
    </div>
  );
}

// ============ CARD SECTION ============
function CardPaymentSection({ planId, payerData, cardType, onSuccess, isDark }) {
  const [mp, setMp] = useState(null);
  const [mpReady, setMpReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [installments, setInstallments] = useState(1);
  const isCredit = cardType === 'credit_card';
  const planAmount = PLAN_AMOUNTS[planId];
  const maxInstallments = planId === 'pro_yearly' ? 12 : 1;

  // Carregar SDK MercadoPago
  useEffect(() => {
    const loadMP = async () => {
      const keyRes = await base44.functions.invoke('getMercadoPagoPublicKey', {});
      const publicKey = keyRes.data?.publicKey;
      if (!publicKey) return;

      if (!document.getElementById('mp-sdk')) {
        const script = document.createElement('script');
        script.id = 'mp-sdk';
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
          const mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
          setMp(mpInstance);
          setMpReady(true);
        };
        document.head.appendChild(script);
      } else if (window.MercadoPago) {
        const mpInstance = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        setMp(mpInstance);
        setMpReady(true);
      }
    };
    loadMP();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!mpReady || !mp) {
      setError('SDK não carregado. Aguarde um momento.');
      return;
    }

    setLoading(true);

    const expiryParts = cardData.expiry.split('/');
    const month = expiryParts[0];
    const year = expiryParts[1] ? `20${expiryParts[1]}` : '';

    const cardNumber = cardData.number.replace(/\s/g, '');
    const brand = getCardBrand(cardNumber);
    const paymentMethodId = BRAND_TO_METHOD[brand] || 'master';

    // Gerar token do cartão via SDK (client-side)
    const tokenData = await mp.createCardToken({
      cardNumber,
      cardholderName: cardData.name,
      cardExpirationMonth: month,
      cardExpirationYear: year,
      securityCode: cardData.cvv,
      identificationType: 'CPF',
      identificationNumber: payerData.cpf.replace(/\D/g, '')
    });

    if (tokenData.error || !tokenData.id) {
      setError(tokenData.message || 'Erro ao tokenizar cartão. Verifique os dados.');
      setLoading(false);
      return;
    }

    const res = await base44.functions.invoke('createTransparentPayment', {
      planId,
      paymentMethod: cardType,
      payerData,
      cardToken: tokenData.id,
      installments: isCredit ? installments : 1
    });

    setLoading(false);

    if (!res.data.success) {
      setError(res.data.error || 'Pagamento recusado. Verifique os dados do cartão.');
      return;
    }

    if (res.data.status === 'approved') {
      onSuccess();
    } else if (res.data.status === 'pending' || res.data.status === 'in_process') {
      setError('Pagamento em análise. Você será notificado em breve.');
    } else {
      setError(`Pagamento recusado: ${res.data.statusDetail || 'verifique os dados.'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorBox message={error} isDark={isDark} />}

      {/* Número do cartão */}
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Número do Cartão *</label>
        <Input
          value={cardData.number}
          onChange={e => setCardData(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          required
          className={isDark ? 'bg-neutral-800 border-neutral-700 text-white font-mono' : 'font-mono'}
        />
      </div>

      {/* Nome no cartão */}
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Nome no Cartão *</label>
        <Input
          value={cardData.name}
          onChange={e => setCardData(p => ({ ...p, name: e.target.value.toUpperCase() }))}
          placeholder="NOME COMO NO CARTÃO"
          required
          className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
        />
      </div>

      {/* Validade + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Validade *</label>
          <Input
            value={cardData.expiry}
            onChange={e => setCardData(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
            placeholder="MM/AA"
            maxLength={5}
            required
            className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>CVV *</label>
          <Input
            value={cardData.cvv}
            onChange={e => setCardData(p => ({ ...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))}
            placeholder="123"
            maxLength={4}
            required
            className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
          />
        </div>
      </div>

      {/* Parcelamento — apenas crédito anual */}
      {isCredit && maxInstallments > 1 && (
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Parcelamento</label>
          <select
            value={installments}
            onChange={e => setInstallments(parseInt(e.target.value))}
            className={`w-full border rounded-md px-3 py-2 text-sm ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            {Array.from({ length: maxInstallments }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>
                {n}x {n === 1 ? 'sem juros' : 'com juros do MP'}
                {n === 1 ? ` — R$ ${planAmount.toFixed(2).replace('.', ',')}` : ''}
              </option>
            ))}
          </select>
          {installments > 1 && (
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Juros calculados pelo Mercado Pago. Valor final exibido na tela de pagamento.
            </p>
          )}
        </div>
      )}

      {!mpReady && (
        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          <Loader2 className="inline w-3 h-3 animate-spin mr-1" />Carregando SDK...
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !mpReady}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processando...</>
          : <><CreditCard className="w-4 h-4 mr-2" />Pagar R$ {planAmount.toFixed(2).replace('.', ',')}</>
        }
      </Button>
    </form>
  );
}

// ============ ERROR BOX ============
function ErrorBox({ message, isDark }) {
  return (
    <div className={`p-3 rounded-lg flex gap-2 text-sm ${isDark ? 'bg-red-900/20 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ============ PAYER DATA FORM ============
function PayerDataForm({ data, onChange, isDark }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Nome Completo *</label>
        <Input
          value={data.fullName}
          onChange={e => onChange({ ...data, fullName: e.target.value })}
          placeholder="João da Silva"
          required
          className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>CPF *</label>
        <Input
          value={data.cpf}
          onChange={e => onChange({ ...data, cpf: formatCPF(e.target.value) })}
          placeholder="123.456.789-10"
          maxLength={14}
          required
          className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Email *</label>
        <Input
          value={data.email}
          onChange={e => onChange({ ...data, email: e.target.value })}
          placeholder="seu@email.com"
          type="email"
          required
          className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
        />
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function TransparentCheckout({ planId, user, onSuccess, theme = 'light' }) {
  const isDark = theme === 'dark';
  const [activeMethod, setActiveMethod] = useState('pix');
  const [payerStep, setPayerStep] = useState(true); // true = mostrar form pagador
  const [payerData, setPayerData] = useState({
    fullName: user?.full_name || '',
    cpf: '',
    email: user?.email || ''
  });
  const [payerError, setPayerError] = useState(null);
  const [couponData, setCouponData] = useState(null);

  const methods = [
    { id: 'pix', label: 'PIX', icon: QrCode, color: 'text-green-500' },
    { id: 'credit_card', label: 'Crédito', icon: CreditCard, color: 'text-blue-500' },
    { id: 'debit_card', label: 'Débito', icon: Smartphone, color: 'text-purple-500' }
  ];

  const validatePayer = () => {
    if (!payerData.fullName.trim()) { setPayerError('Nome completo obrigatório'); return false; }
    if (payerData.cpf.replace(/\D/g, '').length !== 11) { setPayerError('CPF inválido'); return false; }
    if (!payerData.email.includes('@')) { setPayerError('Email inválido'); return false; }
    setPayerError(null);
    return true;
  };

  const handlePayerNext = () => {
    if (validatePayer()) setPayerStep(false);
  };

  if (payerStep) {
    return (
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>1. Dados do Pagador</h3>
        <PayerDataForm data={payerData} onChange={setPayerData} isDark={isDark} />
        {payerError && <ErrorBox message={payerError} isDark={isDark} />}
        <div className="mt-4">
          <CouponSection planId={planId} onApply={setCouponData} isDark={isDark} />
        </div>
        <Button onClick={handlePayerNext} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          Continuar para Pagamento →
        </Button>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setPayerStep(true)} className={`text-xs underline ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          ← Editar dados
        </button>
        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>|</span>
        <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>{payerData.email}</span>
      </div>

      <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>2. Forma de Pagamento</h3>

      {/* Seleção de método */}
      <div className="flex gap-2 mb-5">
        {methods.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMethod(m.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-xs font-medium transition-all ${
              activeMethod === m.id
                ? isDark ? 'bg-neutral-700 border-purple-500 text-white' : 'bg-purple-50 border-purple-500 text-purple-700'
                : isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <m.icon className={`w-5 h-5 ${activeMethod === m.id ? m.color : ''}`} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Cupom aplicado */}
      {couponData && (
        <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            Cupom <strong>{couponData.code}</strong> aplicado — {couponData.discountType === 'percent' ? `${couponData.discount}% de desconto` : `R$ ${couponData.discount.toFixed(2).replace('.', ',')} de desconto`}
          </span>
        </div>
      )}

      {/* Conteúdo do método selecionado */}
      {activeMethod === 'pix' && (
        <PixPaymentSection planId={planId} payerData={{ ...payerData, couponCode: couponData?.code }} onSuccess={onSuccess} isDark={isDark} />
      )}
      {(activeMethod === 'credit_card' || activeMethod === 'debit_card') && (
        <CardPaymentSection
          key={activeMethod}
          planId={planId}
          payerData={{ ...payerData, couponCode: couponData?.code }}
          cardType={activeMethod}
          onSuccess={onSuccess}
          isDark={isDark}
        />
      )}

      <p className={`text-xs mt-4 text-center ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
        🔒 Pagamento seguro · Dados criptografados · Antifraude habilitado
      </p>
    </div>
  );
}