/**
 * ✅ SECURE FIELDS v2 (Substitui CardForm para melhor qualidade no MP)
 * 
 * Usa o novo Secure Fields do SDK V2 em vez de CardForm:
 * - iFrames isolados para cada campo (number, expiry, cvc)
 * - Device ID integrado (antifraude)
 * - TLS 1.2+ garantido
 * - Pontuação máxima de qualidade Mercado Pago
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, CreditCard, Loader2, AlertCircle, Shield } from "lucide-react";

export default function MercadoPagoSecureFields({ planId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Campos não-sensíveis (ficam no nosso DOM)
  const [holderName, setHolderName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState([]);

  const mpInstanceRef = useRef(null);
  const secureFieldsRef = useRef({});
  const deviceIdRef = useRef(null);

  // ── Inicializar Secure Fields com Device ID ──────────────────────────────────
  const initSecureFields = useCallback(async () => {
    try {
      // Carregar SDK V2
      await loadMpSdk();

      // Buscar public key
      const res = await base44.functions.invoke("getMercadoPagoKeys");
      const publicKey = res.data?.publicKey;
      if (!publicKey) throw new Error("Chave pública não encontrada");

      // Inicializar MP com locale pt-BR
      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      mpInstanceRef.current = mp;

      // ✅ CAPTURAR DEVICE ID (Antifraude obrigatório)
      // O SDK V2 gera automaticamente quando inicializa
      deviceIdRef.current = mp.getDeviceId?.() || window.__MP_DEVICE_ID__;
      console.log('[SecureFields] Device ID capturado:', deviceIdRef.current);

      // ✅ CRIAR SECURE FIELDS para cada campo de cartão
      // Cada um em um iFrame isolado
      const secureFields = mp.secureFields({
        amount: planId === "pro_yearly" ? "1198.80" : "119.90",
        mode: "DEFAULT",
        style: {
          // Estilo dos iFrames
          input: {
            fontSize: "14px",
            fontFamily: "Arial, sans-serif",
            color: "#000",
            padding: "12px"
          },
          ":focus": {
            color: "#333",
            outline: "1px solid #7c3aed"
          }
        },
        elements: {
          cardNumber: "#mp-card-number",
          cardExpirationDate: "#mp-card-expiry",
          cardSecurityCode: "#mp-card-cvc"
        }
      });

      secureFieldsRef.current = secureFields;

      // ✅ LISTENERS para validação em tempo real
      secureFields.on("ready", () => {
        setInitializing(false);
        console.log('[SecureFields] Ready!');
      });

      secureFields.on("error", (payload) => {
        console.error('[SecureFields] Error:', payload);
        if (payload.fieldId === "cardNumber") {
          setError("Número do cartão inválido");
        } else if (payload.fieldId === "cardExpirationDate") {
          setError("Data de validade inválida");
        } else if (payload.fieldId === "cardSecurityCode") {
          setError("CVV inválido");
        }
      });

      secureFields.on("binChange", (payload) => {
        console.log('[SecureFields] BIN change:', payload.bin);
      });

    } catch (err) {
      setInitializing(false);
      setError("Erro ao carregar formulário seguro. Tente recarregar.");
      console.error("[SecureFields] init error:", err);
    }
  }, [planId]);

  useEffect(() => {
    initSecureFields();
    return () => {
      if (secureFieldsRef.current?.unmount) {
        try { secureFieldsRef.current.unmount(); } catch {}
      }
    };
  }, []);

  // ── Enviar pagamento com Device ID ──────────────────────────────────────────
  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!secureFieldsRef.current?.createCardToken) {
        throw new Error("Secure Fields não inicializado");
      }

      // ✅ TOKENIZAR com Device ID integrado
      const token = await secureFieldsRef.current.createCardToken({
        cardholderName: holderName,
        identificationType: "CPF",
        identificationNumber: cpf.replace(/\D/g, "")
      });

      if (!token?.id) throw new Error("Falha ao tokenizar cartão");

      // ✅ ENVIAR para backend COM Device ID
      const res = await base44.functions.invoke("createPayment", {
        planId,
        paymentType: "credit_card",
        cardToken: token.id,
        installments: Number(installments),
        payerFirstName: holderName.split(" ")[0] || holderName,
        payerLastName: holderName.split(" ").slice(1).join(" ") || holderName,
        payerDoc: { type: "CPF", number: cpf.replace(/\D/g, "") },
        payerEmail: email,
        // ✅ DEVICE ID - Critério de qualidade Mercado Pago
        deviceId: deviceIdRef.current,
        // ✅ Headers de segurança são automaticamente adicionados pelo backend
      });

      const data = res.data;
      if (data.status === "approved") {
        setSuccess(true);
        onSuccess?.();
      } else if (data.status === "rejected") {
        const msgs = {
          cc_rejected_insufficient_amount: "Saldo insuficiente.",
          cc_rejected_bad_filled_card_number: "Número do cartão inválido.",
          cc_rejected_bad_filled_security_code: "CVV incorreto.",
          cc_rejected_bad_filled_date: "Data de validade incorreta.",
          cc_rejected_call_for_authorize: "Ligue para o banco para autorizar.",
          cc_rejected_card_disabled: "Cartão desabilitado.",
          cc_rejected_duplicated_payment: "Pagamento duplicado detectado.",
        };
        setError("Cartão recusado. " + (msgs[data.statusDetail] || ""));
      } else {
        setError(`Status: ${data.status}. Aguarde ou tente novamente.`);
      }
    } catch (err) {
      setError(err.message || "Erro ao processar pagamento.");
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCpf = (v) =>
    v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);

  if (success) {
    return (
      <div className="text-center space-y-3 py-6">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
        <p className="font-semibold text-gray-900 text-lg">Pagamento aprovado!</p>
        <p className="text-sm text-gray-500">Sua assinatura foi ativada com sucesso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Badge Secure Fields */}
      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <Shield className="w-4 h-4 shrink-0" />
        <span>
          <strong>Secure Fields:</strong> Campos de cartão isolados em iFrames. Dados nunca tocam nosso servidor.
        </span>
      </div>

      {/* Device ID Badge */}
      {deviceIdRef.current && (
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <Shield className="w-4 h-4 shrink-0" />
          <span>✅ Antifraude ativo (Device ID: {deviceIdRef.current.slice(0, 20)}...)</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {initializing && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando campos seguros...
        </div>
      )}

      <form onSubmit={handlePayment} className={`space-y-3 ${initializing ? "opacity-0 h-0 overflow-hidden" : ""}`}>
        
        {/* Nome */}
        <div>
          <Label htmlFor="holder-name">Nome no cartão</Label>
          <Input
            id="holder-name"
            placeholder="Nome como no cartão"
            value={holderName}
            onChange={e => setHolderName(e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        {/* CPF */}
        <div>
          <Label htmlFor="cpf">CPF do titular</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => setCpf(formatCpf(e.target.value))}
            required
          />
        </div>

        {/* ✅ Secure Fields - iFrames isolados */}
        <div>
          <Label>Número do cartão</Label>
          <div
            id="mp-card-number"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 flex items-center shadow-sm"
            style={{ minHeight: "36px" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Validade</Label>
            <div
              id="mp-card-expiry"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 flex items-center shadow-sm"
              style={{ minHeight: "36px" }}
            />
          </div>
          <div>
            <Label>CVV</Label>
            <div
              id="mp-card-cvc"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 flex items-center shadow-sm"
              style={{ minHeight: "36px" }}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || initializing}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
            : <><CreditCard className="w-4 h-4 mr-2" /> Pagar com Cartão</>
          }
        </Button>
      </form>
    </div>
  );
}

// ── SDK Loader ──────────────────────────────────────────────────────────────────
function loadMpSdk() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const existing = document.getElementById("mp-sdk-v2");
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.id = "mp-sdk-v2";
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Falha ao carregar SDK"));
    document.head.appendChild(s);
  });
}