/**
 * PCI DSS Compliant Card Form usando o CardForm oficial do Mercado Pago SDK V2.
 *
 * ✅ SEGURO: Os campos de número, CVV e validade são renderizados em iFrames
 *    hospedados pelo Mercado Pago — os dados do cartão NUNCA tocam o servidor da aplicação.
 *
 * Fluxo PCI-compliant:
 *   1. SDK MP renderiza iFrames seguros para número, CVV e validade
 *   2. Usuário preenche direto nos iFrames do MP (domínio mercadopago.com)
 *   3. SDK tokeniza no lado do MP e retorna apenas um `cardToken` opaco
 *   4. Frontend envia APENAS o token (sem dados sensíveis) para o backend
 *   5. Backend usa o token para criar o pagamento via API
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, CreditCard, Loader2, AlertCircle, Shield } from "lucide-react";

export default function MercadoPagoCardForm({ planId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Campos não-sensíveis (ficam no nosso DOM, ok pelo PCI)
  const [holderName, setHolderName] = useState("");
  const [cpf, setCpf] = useState("");
  const [installments, setInstallments] = useState(1);
  const [issuer, setIssuer] = useState(null);
  const [installmentOptions, setInstallmentOptions] = useState([]);

  const cardFormRef = useRef(null);
  const mountedRef = useRef(false);

  // ── Inicializar CardForm ──────────────────────────────────────────────────
  const initCardForm = useCallback(async () => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    try {
      // Garantir que o SDK está carregado
      await loadMpSdk();

      // Buscar public key no backend
      const res = await base44.functions.invoke("getMercadoPagoKeys");
      const publicKey = res.data?.publicKey;
      if (!publicKey) throw new Error("Chave pública não encontrada");

      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

      // CardForm cria iFrames seguros automaticamente nos containers abaixo
      cardFormRef.current = mp.cardForm({
        amount: planId === "pro_yearly" ? "1198.80" : "119.90",
        autoMount: true,
        form: {
          id: "mp-card-form",
          cardholderName: {
            id: "mp-cardholder-name",   // nosso input (nome não é dado sensível)
            placeholder: "Nome como no cartão"
          },
          cardNumber: {
            id: "mp-card-number",       // iFrame seguro MP
            placeholder: "0000 0000 0000 0000"
          },
          expirationDate: {
            id: "mp-card-expiry",       // iFrame seguro MP
            placeholder: "MM/AA"
          },
          securityCode: {
            id: "mp-card-cvv",          // iFrame seguro MP
            placeholder: "CVV"
          },
          installments: { id: "mp-installments" },
          identificationType: { id: "mp-id-type" },
          identificationNumber: {
            id: "mp-cpf",               // nosso input (CPF não é dado de cartão)
            placeholder: "000.000.000-00"
          },
          issuer: { id: "mp-issuer" }
        },
        callbacks: {
          onFormMounted: (err) => {
            setInitializing(false);
            if (err) {
              setError("Erro ao carregar formulário seguro.");
              console.error("[MP CardForm] onFormMounted error:", err);
            }
          },
          onIdentificationTypesReceived: () => {},
          onPaymentMethodsReceived: (err, methods) => {
            if (!err && methods?.length > 0) setIssuer(methods[0]);
          },
          onInstallmentsReceived: (err, data) => {
            if (!err && data?.payer_costs?.length > 0) {
              setInstallmentOptions(data.payer_costs);
              setInstallments(data.payer_costs[0]?.installments || 1);
            }
          },
          onCardTokenReceived: (err, token) => {
            if (err) {
              setError("Erro na tokenização do cartão: " + (err.message || JSON.stringify(err)));
              setLoading(false);
              return;
            }
            // Token recebido — agora enviar para o backend (NUNCA dados do cartão em si)
            handleBackendPayment(token);
          },
          onSubmit: (event) => {
            event.preventDefault();
            setLoading(true);
            setError(null);
          },
          onFetching: (resource) => {
            setLoading(true);
            return () => setLoading(false);
          }
        }
      });

    } catch (err) {
      setInitializing(false);
      setError("Não foi possível inicializar o formulário de cartão. Tente recarregar a página.");
      console.error("[MP CardForm] init error:", err);
    }
  }, [planId]);

  useEffect(() => {
    initCardForm();
    return () => {
      // Limpar CardForm ao desmontar
      if (cardFormRef.current?.unmount) {
        try { cardFormRef.current.unmount(); } catch {}
      }
      mountedRef.current = false;
    };
  }, []);

  // ── Enviar token para o backend ──────────────────────────────────────────
  const handleBackendPayment = async (cardToken) => {
    try {
      const formData = cardFormRef.current?.getCardFormData?.() || {};

      const res = await base44.functions.invoke("createPayment", {
        planId,
        paymentType: "credit_card",
        cardToken: cardToken,
        installments: Number(formData.installments || installments),
        payerFirstName: holderName.split(" ")[0] || holderName,
        payerLastName: holderName.split(" ").slice(1).join(" ") || holderName,
        payerDoc: {
          type: "CPF",
          number: cpf.replace(/\D/g, "")
        }
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
        setError("Cartão recusado. " + (msgs[data.statusDetail] || `Motivo: ${data.statusDetail}`));
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
      {/* Badge PCI */}
      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <Shield className="w-4 h-4 shrink-0" />
        <span><strong>PCI DSS compliant:</strong> dados do cartão são capturados diretamente pelo Mercado Pago em campos seguros (iFrame). Nunca passam pelo nosso servidor.</span>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {initializing && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando formulário seguro...
        </div>
      )}

      {/* O ID "mp-card-form" é o ID que o CardForm precisa para montar os iFrames */}
      <form id="mp-card-form" className={`space-y-3 ${initializing ? "opacity-0 h-0 overflow-hidden" : ""}`}>

        {/* Nome do titular — campo nosso, ok pelo PCI */}
        <div>
          <Label htmlFor="mp-cardholder-name">Nome no cartão</Label>
          <input
            id="mp-cardholder-name"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            placeholder="Nome como no cartão"
            value={holderName}
            onChange={e => setHolderName(e.target.value)}
          />
        </div>

        {/* Número do cartão — iFrame seguro do MP */}
        <div>
          <Label>Número do cartão</Label>
          <div
            id="mp-card-number"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 flex items-center shadow-sm"
            style={{ minHeight: "36px" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Validade — iFrame seguro do MP */}
          <div>
            <Label>Validade</Label>
            <div
              id="mp-card-expiry"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 flex items-center shadow-sm"
              style={{ minHeight: "36px" }}
            />
          </div>
          {/* CVV — iFrame seguro do MP */}
          <div>
            <Label>CVV</Label>
            <div
              id="mp-card-cvv"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 flex items-center shadow-sm"
              style={{ minHeight: "36px" }}
            />
          </div>
        </div>

        {/* CPF — campo nosso, não é dado de cartão */}
        <div>
          <Label htmlFor="mp-cpf">CPF do titular</Label>
          <input
            id="mp-cpf"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => setCpf(formatCpf(e.target.value))}
          />
        </div>

        {/* Campos ocultos necessários pelo CardForm */}
        <select id="mp-installments" className="hidden" />
        <select id="mp-id-type" className="hidden" />
        <select id="mp-issuer" className="hidden" />

        {/* Parcelas visíveis se houver opções do MP */}
        {installmentOptions.length > 1 && (
          <div>
            <Label>Parcelas</Label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={installments}
              onChange={e => setInstallments(Number(e.target.value))}
            >
              {installmentOptions.map(opt => (
                <option key={opt.installments} value={opt.installments}>
                  {opt.installments}x de R$ {opt.installment_amount?.toFixed(2).replace(".", ",")}
                  {opt.installments === 1 ? " (sem juros)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

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

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    s.onerror = () => reject(new Error("Falha ao carregar SDK MercadoPago"));
    document.head.appendChild(s);
  });
}