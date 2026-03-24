import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertCircle, CheckCircle2, Lock, CreditCard, Shield } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CheckoutModal — Mercado Pago Bricks (somente cartão de crédito)
   - Parcelamento apenas para planos anuais (adv_yearly, empresa_yearly)
   - Planos mensais: apenas à vista
   - Autenticação verificada antes de exibir
   ═══════════════════════════════════════════════════════════ */

const ANNUAL_PLAN_IDS = ["adv_yearly", "empresa_yearly"];

function getInstallmentOptions(plan) {
  if (ANNUAL_PLAN_IDS.includes(plan.id)) {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: i === 0
        ? `1x de R$ ${plan.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (à vista)`
        : `${i + 1}x de R$ ${(plan.amount / (i + 1)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros`,
    }));
  }
  return [{ value: 1, label: `1x de R$ ${plan.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (à vista)` }];
}

async function getMPDeviceId() {
  return new Promise((resolve) => {
    if (window.MP_DEVICE_SESSION_ID) return resolve(window.MP_DEVICE_SESSION_ID);
    const scriptId = "mp-device-fingerprint";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.mercadopago.com/v2/security.js";
      script.setAttribute("view", "checkout");
      script.setAttribute("output", "deviceId");
      document.head.appendChild(script);
    }
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.MP_DEVICE_SESSION_ID) { clearInterval(interval); resolve(window.MP_DEVICE_SESSION_ID); }
      else if (attempts >= 50) { clearInterval(interval); resolve(null); }
    }, 100);
  });
}

export default function CheckoutModal({ plan, onClose, containerId = "mp-brick-container" }) {
  const [status, setStatus] = useState("loading"); // loading | ready | processing | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [paymentId, setPaymentId] = useState(null);
  const brickRef = useRef(null);
  const mountedRef = useRef(false);
  const deviceIdRef = useRef(null);
  const processingRef = useRef(false); // evita double-submit

  const isAnnual = ANNUAL_PLAN_IDS.includes(plan.id);
  const installmentOptions = getInstallmentOptions(plan);
  const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const parcela = plan.amount / selectedInstallments;

  const initBrick = async () => {
    try {
      // 1. Verificar autenticação
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      // 2. Buscar public key do backend
      const res = await base44.functions.invoke("getMercadoPagoPublicKey", {});
      const publicKey = res?.data?.public_key;
      if (!publicKey) throw new Error("Chave pública não encontrada");

      // 3. Device ID (antifraude)
      const deviceId = await getMPDeviceId();
      deviceIdRef.current = deviceId;

      if (!mountedRef.current) return;

      // 4. Inicializar MP
      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      // Tornar o container visível ANTES de montar o Brick
      setStatus("ready");

      // Aguardar o DOM atualizar com o container visível
      await new Promise(resolve => setTimeout(resolve, 400));
      if (!mountedRef.current) return;

      const container = document.getElementById(containerId);
      if (!container) throw new Error("Container do Brick não encontrado");

      // 5. Desmontar brick anterior se existir
      if (brickRef.current) {
        await brickRef.current.unmount?.();
        brickRef.current = null;
      }

      // 6. Montar Payment Brick — apenas cartão de crédito
      const brickController = await bricksBuilder.create("payment", containerId, {
        initialization: {
          amount: plan.amount,
          preferenceId: null,
        },
        customization: {
          paymentMethods: {
            creditCard: "all",
            maxInstallments: isAnnual ? 12 : 1,
          },
          visual: {
            style: {
              theme: "default",
              customVariables: { baseColor: "#191970" },
            },
            hideFormTitle: true,
            hidePaymentButton: isAnnual, // escondemos o botão se for anual (selecionamos parcelas antes)
          },
        },
        callbacks: {
          onReady: () => {
            // status já foi setado antes da montagem
          },
          onSubmit: async ({ selectedPaymentMethod, formData }) => {
            if (!mountedRef.current || processingRef.current) return;
            processingRef.current = true;
            setStatus("processing");

            try {
              const response = await base44.functions.invoke("lexiaProcessPayment", {
                token: formData.token,
                installments: isAnnual ? selectedInstallments : 1,
                payment_method_id: formData.payment_method_id,
                issuer_id: formData.issuer_id,
                transaction_amount: plan.amount,
                description: plan.name,
                plan_id: plan.id,
                payer: formData.payer,
                device_id: deviceIdRef.current || window.MP_DEVICE_SESSION_ID || null,
              });

              if (!mountedRef.current) return;

              const d = response?.data;
              if (d?.status === "approved") {
                setPaymentId(d?.id);
                setStatus("success");
                // Redirecionar após 4s
                setTimeout(() => { window.location.href = "/Dashboard"; }, 4000);
              } else {
                setErrorMsg(d?.message || "Pagamento não aprovado. Verifique os dados do cartão.");
                setRetryCount(c => c + 1);
                setStatus("error");
              }
            } catch (err) {
              if (mountedRef.current) {
                setErrorMsg(err.message || "Erro ao processar pagamento.");
                setRetryCount(c => c + 1);
                setStatus("error");
              }
            } finally {
              processingRef.current = false;
            }
          },
          onError: (err) => {
            if (!mountedRef.current) return;
            if (err?.cause?.some?.(c => c?.code === "non_critical")) return;
            console.error("Brick error:", err);
            setErrorMsg("Erro ao inicializar o formulário de pagamento.");
            setStatus("error");
          },
        },
      });

      brickRef.current = brickController;
    } catch (err) {
      if (mountedRef.current) {
        setErrorMsg(err.message || "Erro ao carregar checkout.");
        setStatus("error");
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    initBrick();
    return () => {
      mountedRef.current = false;
      brickRef.current?.unmount?.();
      brickRef.current = null;
    };
  }, [plan?.id]);

  // Fechar com Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && status !== "processing") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, status]);

  const handleRetry = () => {
    setStatus("loading");
    setErrorMsg("");
    processingRef.current = false;
    setTimeout(() => initBrick(), 100);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget && status !== "processing") onClose(); }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />

      <div style={{ position: "relative", zIndex: 1, background: "#fff", width: "100%", maxWidth: "500px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem 1rem", borderBottom: "1px solid #e0e0ea", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".6rem", textTransform: "uppercase", letterSpacing: ".15em", color: "#191970", margin: "0 0 .15rem" }}>
              Assinar Plano
            </p>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#0a0a0a", margin: "0 0 .15rem", textTransform: "uppercase" }}>
              {plan.name}
            </h2>
            <p style={{ fontSize: ".72rem", color: "#aaa", margin: 0 }}>
              {isAnnual ? "Cobrança anual · até 12x sem juros" : "Cobrança mensal · pagamento à vista"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.35rem", color: "#191970", margin: 0, lineHeight: 1 }}>
                R$ {fmt(plan.amount)}
              </p>
              <p style={{ fontSize: ".65rem", color: "#aaa", margin: ".1rem 0 0" }}>{plan.period || "/mês"}</p>
            </div>
            <button
              onClick={() => { if (status !== "processing") onClose(); }}
              style={{ background: "none", border: "none", cursor: status === "processing" ? "not-allowed" : "pointer", padding: ".25rem", color: "#bbb", display: "flex", opacity: status === "processing" ? 0.3 : 1 }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Resumo do pedido */}
        {status !== "success" && (
          <div style={{ padding: "1rem 1.5rem", background: "#f8f8fc", borderBottom: "1px solid #e0e0ea" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
              <span style={{ fontSize: ".78rem", color: "#6b6b80", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em" }}>Resumo do Pedido</span>
              <div style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "#4ade80", fontSize: ".68rem" }}>
                <Lock style={{ width: 10, height: 10 }} />
                <span>Pagamento seguro</span>
              </div>
            </div>

            {/* Parcelamento — só para anuais */}
            {isAnnual ? (
              <div>
                <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: ".68rem", color: "#6b6b80", display: "block", marginBottom: ".25rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Parcelamento (sem juros)
                    </label>
                    <select
                      value={selectedInstallments}
                      onChange={e => setSelectedInstallments(Number(e.target.value))}
                      disabled={status === "processing"}
                      style={{ width: "100%", padding: ".5rem .75rem", border: "1px solid #e0e0ea", background: "#fff", fontSize: ".82rem", fontFamily: "'Oswald', sans-serif", color: "#0a0a0a", cursor: "pointer", outline: "none" }}
                    >
                      {installmentOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedInstallments > 1 && (
                  <p style={{ fontSize: ".72rem", color: "#191970", margin: ".4rem 0 0", fontWeight: 600 }}>
                    Total: R$ {fmt(plan.amount)} em {selectedInstallments}x de R$ {fmt(parcela)} sem juros
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".82rem", color: "#0a0a0a", fontWeight: 600 }}>{plan.name}</span>
                <span style={{ fontSize: ".82rem", color: "#0a0a0a", fontWeight: 700, fontFamily: "'Oswald', sans-serif" }}>
                  R$ {fmt(plan.amount)} à vista
                </span>
              </div>
            )}
          </div>
        )}

        {/* Corpo */}
        <div style={{ padding: "1.25rem 1.5rem" }}>

          {/* Loading */}
          {status === "loading" && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <Loader2 style={{ width: 28, height: 28, color: "#191970", margin: "0 auto .75rem", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#6b6b80", fontSize: ".82rem" }}>Carregando formulário de pagamento seguro...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Processing */}
          {status === "processing" && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <Loader2 style={{ width: 32, height: 32, color: "#191970", margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#0a0a0a", fontWeight: 700, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: ".5rem" }}>Processando Pagamento</p>
              <p style={{ color: "#6b6b80", fontSize: ".8rem" }}>Por favor, aguarde. Não feche esta janela.</p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ width: 56, height: 56, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "#4ade80" }} />
              </div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", textTransform: "uppercase", color: "#0a0a0a", marginBottom: ".5rem" }}>
                Pagamento Aprovado!
              </h3>
              {paymentId && (
                <p style={{ fontSize: ".72rem", color: "#aaa", marginBottom: ".75rem" }}>
                  Pedido: #{paymentId}
                </p>
              )}
              <p style={{ color: "#6b6b80", fontSize: ".85rem", marginBottom: "1.5rem" }}>
                Seu plano <strong>{plan.name}</strong> foi ativado. Você receberá um e-mail de confirmação.
              </p>
              <p style={{ fontSize: ".75rem", color: "#aaa", marginBottom: "1.5rem" }}>Redirecionando para o painel em instantes...</p>
              <button
                onClick={() => window.location.href = "/Dashboard"}
                style={{ background: "#191970", color: "#fff", border: "none", padding: ".9rem 2rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em" }}
              >
                Acessar Painel →
              </button>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div style={{ padding: "1.5rem 0" }}>
              <div style={{ display: "flex", gap: ".75rem", background: "#fef2f2", border: "1px solid #fecaca", padding: "1rem", marginBottom: "1.25rem" }}>
                <AlertCircle style={{ width: 18, height: 18, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: "#7f1d1d", fontSize: ".85rem", margin: "0 0 .3rem", fontWeight: 600 }}>Pagamento não realizado</p>
                  <p style={{ color: "#991b1b", fontSize: ".8rem", margin: 0 }}>{errorMsg}</p>
                </div>
              </div>
              {retryCount >= 3 && (
                <p style={{ fontSize: ".78rem", color: "#6b6b80", textAlign: "center", marginBottom: "1rem" }}>
                  Muitas tentativas falhas. Tente outro cartão ou entre em contato com o suporte.
                </p>
              )}
              <button
                onClick={handleRetry}
                style={{ background: "#191970", color: "#fff", border: "none", padding: ".9rem 2rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em", width: "100%" }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Container do Brick — sempre no DOM, oculto nos outros estados */}
          <div
            id={containerId}
            style={{
              display: (status === "ready") ? "block" : "none",
            }}
          />

          {/* Para planos anuais com parcelamento: botão de confirmar externo ao Brick */}
          {status === "ready" && isAnnual && (
            <button
              onClick={() => brickRef.current?.getFormData?.().then(data => {
                if (data) brickRef.current?.submit?.();
              }).catch(() => brickRef.current?.submit?.())}
              style={{ marginTop: "1rem", width: "100%", background: "#191970", color: "#fff", border: "none", padding: "1rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".1em" }}
            >
              Confirmar Pagamento — {selectedInstallments}x de R$ {fmt(parcela)} →
            </button>
          )}

          {/* Badge de segurança */}
          {(status === "ready" || status === "loading") && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "#aaa", fontSize: ".68rem" }}>
                <Shield style={{ width: 11, height: 11 }} />
                <span>SSL 256-bit</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "#aaa", fontSize: ".68rem" }}>
                <CreditCard style={{ width: 11, height: 11 }} />
                <span>Mercado Pago</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "#aaa", fontSize: ".68rem" }}>
                <Lock style={{ width: 11, height: 11 }} />
                <span>Dados criptografados</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}