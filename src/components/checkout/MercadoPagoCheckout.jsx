/**
 * MercadoPagoCheckout
 * - Carrega SDK MercadoPago.js V2 (gera Device ID automático para antifraude)
 * - Suporte a Pix e Cartão de Crédito
 * - Envia first_name, last_name e device_id ao backend
 * - PUBLIC KEY fica apenas no frontend (via getMercadoPagoKeys)
 * - ACCESS TOKEN fica apenas no backend (createPayment)
 */
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, Copy, Loader2, QrCode, CreditCard, AlertCircle, RefreshCw } from "lucide-react";

const PLANS = {
  pro_monthly: { name: "Plano Mensal", price: "R$ 119,90/mês" },
  pro_yearly:  { name: "Plano Anual",  price: "R$ 1.198,80/ano" }
};

// Carrega o SDK MercadoPago.js V2 e resolve com a instância mp
function loadMpSdk(publicKey) {
  return new Promise((resolve, reject) => {
    const init = () => {
      // O SDK V2 injeta window.MercadoPago e gera o device ID automaticamente
      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      resolve(mp);
    };

    if (window.MercadoPago) return init();

    if (document.getElementById("mp-sdk-v2")) {
      // Script já está carregando, aguardar
      document.getElementById("mp-sdk-v2").addEventListener("load", init);
      return;
    }

    const script = document.createElement("script");
    script.id = "mp-sdk-v2";
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = init;
    script.onerror = () => reject(new Error("Falha ao carregar SDK MercadoPago"));
    document.head.appendChild(script);
  });
}

export default function MercadoPagoCheckout({ planId, onSuccess, onError }) {
  const [tab, setTab] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mpInstance, setMpInstance] = useState(null);
  const [deviceId, setDeviceId] = useState("");

  // Pix state
  const [pixData, setPixData] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixPolling, setPixPolling] = useState(false);

  // Card state
  const [cardForm, setCardForm] = useState({
    cardNumber: "", expiry: "", cvv: "",
    holderName: "", firstName: "", lastName: "",
    cpf: "", installments: 1
  });
  const [cardResult, setCardResult] = useState(null);

  const plan = PLANS[planId];

  // ── Inicializar SDK e capturar Device ID ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("getMercadoPagoKeys");
        const publicKey = res.data?.publicKey;
        if (!publicKey || cancelled) return;

        const mp = await loadMpSdk(publicKey);
        if (cancelled) return;
        setMpInstance(mp);

        // O SDK V2 adiciona automaticamente um cookie/header com device_id.
        // Capturamos via getDeviceId() se disponível, senão lemos o cookie mp_device_session_id.
        if (typeof mp.getDeviceId === "function") {
          const did = mp.getDeviceId();
          setDeviceId(did || "");
        } else {
          // fallback: ler cookie gerado pelo SDK
          const match = document.cookie.match(/mp_device_session_id=([^;]+)/);
          if (match) setDeviceId(match[1]);
        }
      } catch (e) {
        console.warn("[MP] Falha ao inicializar SDK:", e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Helpers de formatação ─────────────────────────────────────────────────
  const formatCard   = (v) => v.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (v) => v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
  const formatCpf    = (v) => v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
  const sanitize     = (s) => String(s || "").trim().replace(/[<>]/g, "");

  // ── PIX ──────────────────────────────────────────────────────────────────
  const handleGeneratePix = async () => {
    setLoading(true);
    setError(null);
    setPixData(null);
    try {
      const res = await base44.functions.invoke("createPayment", {
        planId,
        paymentType: "pix",
        deviceId: deviceId || undefined
      });
      const data = res.data;
      if (data.pix) {
        setPixData({ ...data.pix, paymentId: data.paymentId });
        startPixPolling(data.paymentId);
      } else {
        setError(data.error || "Não foi possível gerar o Pix. Tente novamente.");
      }
    } catch (e) {
      setError(e.message || "Erro ao gerar Pix.");
      onError?.(e);
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (!pixData?.qrText) return;
    navigator.clipboard.writeText(pixData.qrText);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const startPixPolling = (paymentId) => {
    setPixPolling(true);
    let attempts = 0;
    const MAX = 60;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await base44.entities.Payment.filter({ mp_payment_id: String(paymentId) });
        if (res.length > 0 && res[0].status === "approved") {
          clearInterval(interval);
          setPixPolling(false);
          onSuccess?.();
        }
        if (attempts >= MAX) {
          clearInterval(interval);
          setPixPolling(false);
        }
      } catch { /* ignore */ }
    }, 10000);
  };

  // ── CARTÃO ────────────────────────────────────────────────────────────────
  const handleCardPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCardResult(null);

    // Validar nome e sobrenome
    const firstName = sanitize(cardForm.firstName);
    const lastName  = sanitize(cardForm.lastName);

    if (!firstName || !lastName) {
      setError("Informe o nome e o sobrenome do titular do cartão.");
      setLoading(false);
      return;
    }

    try {
      const mp = mpInstance || await (async () => {
        const res = await base44.functions.invoke("getMercadoPagoKeys");
        return loadMpSdk(res.data?.publicKey);
      })();

      const [expMonth, expYear] = cardForm.expiry.split("/");

      const tokenResult = await mp.createCardToken({
        cardNumber:           cardForm.cardNumber.replace(/\s/g, ""),
        cardholderName:       `${firstName} ${lastName}`,
        cardExpirationMonth:  expMonth?.trim(),
        cardExpirationYear:   `20${expYear?.trim()}`,
        securityCode:         cardForm.cvv,
        identificationType:   "CPF",
        identificationNumber: cardForm.cpf.replace(/\D/g, "")
      });

      if (!tokenResult?.id) throw new Error("Falha ao tokenizar cartão");

      const res = await base44.functions.invoke("createPayment", {
        planId,
        paymentType:  "credit_card",
        cardToken:    tokenResult.id,
        installments: Number(cardForm.installments),
        payerDoc:     { type: "CPF", number: cardForm.cpf.replace(/\D/g, "") },
        payerName:    { firstName, lastName },
        deviceId:     deviceId || undefined
      });

      const data = res.data;
      setCardResult(data);
      if (data.status === "approved") onSuccess?.();

    } catch (e) {
      setError(e.message || "Erro ao processar cartão.");
      onError?.(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo do plano */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex justify-between items-center">
        <div>
          <p className="font-semibold text-purple-900">{plan?.name}</p>
          <p className="text-sm text-purple-700">{plan?.price}</p>
        </div>
        <CheckCircle className="w-6 h-6 text-purple-600" />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="pix" className="flex-1 gap-2">
            <QrCode className="w-4 h-4" /> Pix
          </TabsTrigger>
          <TabsTrigger value="card" className="flex-1 gap-2">
            <CreditCard className="w-4 h-4" /> Cartão
          </TabsTrigger>
        </TabsList>

        {/* ── PIX ── */}
        <TabsContent value="pix" className="pt-4 space-y-4">
          {!pixData ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">Gere um QR Code Pix e pague em segundos. Expira em 30 minutos.</p>
              <Button onClick={handleGeneratePix} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
                  : <><QrCode className="w-4 h-4 mr-2" /> Gerar QR Code Pix</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              {pixData.qrCode && (
                <img
                  src={`data:image/png;base64,${pixData.qrCode}`}
                  alt="QR Code Pix"
                  className="w-48 h-48 mx-auto border rounded-lg"
                />
              )}
              {pixData.qrText && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Ou use o código copia e cola:</p>
                  <div className="bg-gray-50 border rounded-lg p-3 text-xs font-mono break-all text-left text-gray-700 max-h-20 overflow-y-auto">
                    {pixData.qrText}
                  </div>
                  <Button variant="outline" size="sm" onClick={copyPix} className="w-full gap-2">
                    {pixCopied
                      ? <><CheckCircle className="w-4 h-4 text-green-600" /> Copiado!</>
                      : <><Copy className="w-4 h-4" /> Copiar código Pix</>}
                  </Button>
                </div>
              )}
              {pixPolling && (
                <div className="flex items-center justify-center gap-2 text-sm text-purple-600 bg-purple-50 rounded-lg p-3">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>
              )}
              <p className="text-xs text-gray-400">
                Expira às {new Date(pixData.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setPixData(null)} className="text-gray-400 text-xs">
                Gerar novo código
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── CARTÃO ── */}
        <TabsContent value="card" className="pt-4">
          {cardResult?.status === "approved" ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-semibold text-gray-900">Pagamento aprovado!</p>
              <p className="text-sm text-gray-500">Sua assinatura foi ativada com sucesso.</p>
            </div>
          ) : (
            <form onSubmit={handleCardPayment} className="space-y-3">
              {/* Nome e Sobrenome separados */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input id="firstName" placeholder="Nome" value={cardForm.firstName}
                    onChange={e => setCardForm(p => ({ ...p, firstName: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input id="lastName" placeholder="Sobrenome" value={cardForm.lastName}
                    onChange={e => setCardForm(p => ({ ...p, lastName: e.target.value }))} required />
                </div>
              </div>
              <div>
                <Label htmlFor="cardNumber">Número do cartão</Label>
                <Input id="cardNumber" placeholder="0000 0000 0000 0000" value={cardForm.cardNumber}
                  onChange={e => setCardForm(p => ({ ...p, cardNumber: formatCard(e.target.value) }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiry">Validade</Label>
                  <Input id="expiry" placeholder="MM/AA" value={cardForm.expiry}
                    onChange={e => setCardForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} required />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" maxLength={4} value={cardForm.cvv}
                    onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "") }))} required />
                </div>
              </div>
              <div>
                <Label htmlFor="cpf">CPF do titular</Label>
                <Input id="cpf" placeholder="000.000.000-00" value={cardForm.cpf}
                  onChange={e => setCardForm(p => ({ ...p, cpf: formatCpf(e.target.value) }))} required />
              </div>
              <div>
                <Label htmlFor="installments">Parcelas</Label>
                <select id="installments" className="w-full border rounded-md px-3 py-2 text-sm"
                  value={cardForm.installments} onChange={e => setCardForm(p => ({ ...p, installments: e.target.value }))}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n}x {n === 1 ? "sem juros" : ""}</option>
                  ))}
                </select>
              </div>

              {cardResult && cardResult.status !== "approved" && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Pagamento {cardResult.status === "rejected" ? "recusado" : "pendente"}.{" "}
                  {cardResult.statusDetail === "cc_rejected_insufficient_amount" && "Saldo insuficiente."}
                  {cardResult.statusDetail === "cc_rejected_bad_filled_card_number" && "Número do cartão inválido."}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12">
                {loading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                  : <><CreditCard className="w-4 h-4 mr-2" /> Pagar com Cartão</>}
              </Button>
            </form>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-gray-400">🔒 Pagamento seguro via Mercado Pago</p>
    </div>
  );
}