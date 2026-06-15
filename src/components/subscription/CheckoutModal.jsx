import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertCircle, CheckCircle2, Lock, CreditCard, Shield } from "lucide-react";

const ANNUAL_PLAN_IDS = ["starter_yearly", "pro_yearly", "escritorio_yearly"];
const BRICK_CONTAINER_ID = "mp-cardpayment-brick";

const getValidInstallments = (totalPrice) => {
  const maxInstallments = 12;
  const MIN_INSTALLMENT = 5.00;
  const valid = [];
  for (let i = 1; i <= maxInstallments; i++) {
    const installmentValue = totalPrice / i;
    if (installmentValue >= MIN_INSTALLMENT) {
      valid.push({ count: i, value: installmentValue });
    }
  }
  return valid;
};

async function loadMPSDK() {
  if (window.MercadoPago) return;
  await new Promise((resolve, reject) => {
    if (document.getElementById("mp-sdk-script")) { resolve(); return; }
    const s = document.createElement("script");
    s.id = "mp-sdk-script";
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Falha ao carregar o SDK do Mercado Pago."));
    document.head.appendChild(s);
  });
  let i = 0;
  while (!window.MercadoPago && i++ < 50) {
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!window.MercadoPago) throw new Error("SDK do Mercado Pago não inicializou.");
}

async function getDeviceId() {
  if (window.MP_DEVICE_SESSION_ID) return window.MP_DEVICE_SESSION_ID;
  if (!document.getElementById("mp-device-fp")) {
    const s = document.createElement("script");
    s.id = "mp-device-fp";
    s.src = "https://www.mercadopago.com/v2/security.js";
    s.setAttribute("view", "checkout");
    s.setAttribute("output", "deviceId");
    document.head.appendChild(s);
  }
  let i = 0;
  while (!window.MP_DEVICE_SESSION_ID && i++ < 60) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return window.MP_DEVICE_SESSION_ID || null;
}

export default function CheckoutModal({ plan, onClose }) {
  const [uiState, setUiState] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [paymentId, setPaymentId] = useState(null);
  const [brickError, setBrickError] = useState(null);
  const [isLoadingBrick, setIsLoadingBrick] = useState(true);

  const mountedRef = useRef(false);
  const brickRef = useRef(null);
  const processingRef = useRef(false);

  const isAnnual = ANNUAL_PLAN_IDS.includes(plan?.id);
  const fmt = (v) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const destroyBrick = async () => {
    if (brickRef.current) {
      try { await brickRef.current.unmount(); } catch (_) {}
      brickRef.current = null;
    }
  };

  const initBrick = async () => {
    try {
      setIsLoadingBrick(true);
      setBrickError(null);
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(window.location.pathname); return; }

      const res = await base44.functions.invoke("getMercadoPagoPublicKey", {});
      const publicKey = res?.data?.public_key;
      if (!publicKey) throw new Error("Chave pública do Mercado Pago não encontrada. Configure a função getMercadoPagoPublicKey.");

      if (!mountedRef.current) return;

      const deviceIdPromise = getDeviceId();

      await loadMPSDK();
      if (!mountedRef.current) return;

      await destroyBrick();
      if (!mountedRef.current) return;

      let container = null;
      for (let i = 0; i < 20; i++) {
        container = document.getElementById(BRICK_CONTAINER_ID);
        if (container) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!container) throw new Error("Container do formulário não encontrado no DOM.");

      const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      const brickController = await bricksBuilder.create("cardPayment", BRICK_CONTAINER_ID, {
        initialization: {
          amount: plan.amount,
          ...(isAnnual && { installments: getValidInstallments(plan.amount).length }),
        },
        customization: {
          paymentMethods: {
            maxInstallments: isAnnual ? getValidInstallments(plan.amount).length : 1,
            minInstallments: 1,
          },
          visual: {
            style: { theme: "default" },
            hideFormTitle: true,
            hidePaymentButton: false,
          },
        },
        callbacks: {
          onReady: () => {
            if (mountedRef.current) {
              setIsLoadingBrick(false);
              setUiState("ready");
            }
          },
          onSubmit: async (formData) => {
            if (!mountedRef.current || processingRef.current) return;
            processingRef.current = true;
            setUiState("processing");

            try {
              const deviceId = await deviceIdPromise;
              const installments = isAnnual ? (Number(formData.installments) || 1) : 1;

              const response = await base44.functions.invoke("processPayment", {
                token: formData.token,
                installments,
                payment_method_id: formData.payment_method_id,
                issuer_id: formData.issuer_id || null,
                plan_id: plan.id,
                payer: formData.payer,
                device_id: deviceId || window.MP_DEVICE_SESSION_ID || null,
              });

              if (!mountedRef.current) return;

              const d = response?.data;
              if (d?.status === "approved") {
                setPaymentId(d?.id);
                setUiState("success");
                setTimeout(() => { window.location.href = "/Dashboard"; }, 4000);
              } else {
                const msg = d?.message || "Pagamento não aprovado. Verifique os dados do cartão e tente novamente.";
                setErrorMsg(msg);
                setRetryCount((c) => c + 1);
                setUiState("error");
              }
            } catch (err) {
              if (mountedRef.current) {
                setErrorMsg(err.message || "Erro ao processar pagamento. Tente novamente.");
                setRetryCount((c) => c + 1);
                setUiState("error");
              }
            } finally {
              processingRef.current = false;
            }
          },
          onError: (err) => {
            if (!mountedRef.current) return;
            const isCritical = !err?.cause?.every?.((c) => c?.code === "non_critical");
            if (!isCritical) return;
            console.error("[CardPayment Brick] erro:", err);
            setErrorMsg("Erro ao inicializar o formulário de pagamento.");
            setUiState("error");
          },
        },
      });

      brickRef.current = brickController;
    } catch (err) {
      console.error('Brick init error:', err);
      if (mountedRef.current) {
        setIsLoadingBrick(false);
        setBrickError('Erro ao carregar o checkout. Tente recarregar a página.');
        setUiState("error");
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    mountedRef.current = true;
    processingRef.current = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 100));
      if (!isMounted) return;
      const container = document.getElementById(BRICK_CONTAINER_ID);
      if (!container) return;
      if (mountedRef.current) initBrick();
    };

    run();

    return () => {
      isMounted = false;
      mountedRef.current = false;
      destroyBrick();
    };
  }, [plan?.id]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape" && uiState !== "processing") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, uiState]);

  const handleRetry = async () => {
    setErrorMsg("");
    setBrickError(null);
    setUiState("loading");
    processingRef.current = false;
    await destroyBrick();
    setTimeout(() => { if (mountedRef.current) initBrick(); }, 150);
  };

  const canClose = uiState !== "processing";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget && canClose) onClose(); }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} />

      <div style={{ position: "relative", zIndex: 1, background: "#fff", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}>

        <div style={{ padding: "1.25rem 1.5rem 1rem", borderBottom: "1px solid #e0e0ea", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".6rem", textTransform: "uppercase", letterSpacing: ".15em", color: "#777", margin: "0 0 .15rem" }}>
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
              <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.35rem", color: "#0B1120", margin: 0, lineHeight: 1 }}>
                R$ {fmt(plan.amount)}
              </p>
              <p style={{ fontSize: ".65rem", color: "#aaa", margin: ".1rem 0 0" }}>{plan.period || "/mês"}</p>
            </div>
            <button
              onClick={() => { if (canClose) onClose(); }}
              disabled={!canClose}
              style={{ background: "none", border: "none", cursor: canClose ? "pointer" : "not-allowed", padding: ".25rem", color: "#bbb", display: "flex", opacity: canClose ? 1 : 0.3 }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {uiState !== "success" && (
          <div style={{ padding: ".9rem 1.5rem", background: "#f8f8fc", borderBottom: "1px solid #e0e0ea" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".4rem" }}>
              <span style={{ fontSize: ".72rem", color: "#888", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em" }}>Resumo do Pedido</span>
              <div style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "#4ade80", fontSize: ".68rem" }}>
                <Lock style={{ width: 10, height: 10 }} />
                <span>Pagamento seguro</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: ".82rem", color: "#0a0a0a", fontWeight: 600 }}>{plan.name}</span>
              <span style={{ fontSize: ".82rem", color: "#0a0a0a", fontWeight: 700, fontFamily: "'Oswald', sans-serif" }}>
                R$ {fmt(plan.amount)}{isAnnual ? " /ano" : " à vista"}
              </span>
            </div>
          </div>
        )}

        <div style={{ padding: "1.25rem 1.5rem" }}>

          {uiState === "loading" && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <Loader2 style={{ width: 28, height: 28, color: "#0B1120", margin: "0 auto .75rem", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#6b6b80", fontSize: ".82rem" }}>Carregando formulário seguro...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {uiState === "processing" && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <Loader2 style={{ width: 32, height: 32, color: "#0B1120", margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#0a0a0a", fontWeight: 700, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", marginBottom: ".5rem" }}>Processando Pagamento</p>
              <p style={{ color: "#6b6b80", fontSize: ".8rem" }}>Não feche esta janela.</p>
            </div>
          )}

          {uiState === "success" && (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ width: 56, height: 56, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: "#4ade80" }} />
              </div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", textTransform: "uppercase", color: "#0a0a0a", marginBottom: ".5rem" }}>
                Pagamento Aprovado!
              </h3>
              {paymentId && (
                <p style={{ fontSize: ".72rem", color: "#aaa", marginBottom: ".75rem" }}>Pedido: #{paymentId}</p>
              )}
              <p style={{ color: "#6b6b80", fontSize: ".85rem", marginBottom: "1.5rem" }}>
                Plano <strong>{plan.name}</strong> ativado com sucesso.
              </p>
              <p style={{ fontSize: ".75rem", color: "#aaa", marginBottom: "1.5rem" }}>Redirecionando para o painel...</p>
              <button
                onClick={() => { window.location.href = "/Dashboard"; }}
                style={{ background: "#0B1120", color: "#fff", border: "none", padding: ".9rem 2rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em" }}
              >
                Acessar Painel →
              </button>
            </div>
          )}

          {uiState === "error" && (
            <div style={{ paddingBottom: "1rem" }}>
              <div style={{ display: "flex", gap: ".75rem", background: "#fef2f2", border: "1px solid #fecaca", padding: "1rem", marginBottom: "1.25rem" }}>
                <AlertCircle style={{ width: 18, height: 18, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ color: "#7f1d1d", fontSize: ".85rem", margin: "0 0 .3rem", fontWeight: 600 }}>Pagamento não realizado</p>
                  <p style={{ color: "#991b1b", fontSize: ".8rem", margin: 0 }}>{errorMsg}</p>
                </div>
              </div>
              {retryCount >= 3 && (
                <p style={{ fontSize: ".78rem", color: "#6b6b80", textAlign: "center", marginBottom: "1rem" }}>
                  Muitas tentativas. Tente outro cartão ou fale com o suporte.
                </p>
              )}
              <button
                onClick={handleRetry}
                style={{ background: "#0B1120", color: "#fff", border: "none", padding: ".9rem 2rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em", width: "100%" }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {brickError && uiState !== "success" && uiState !== "processing" && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ color: "#7f1d1d", fontSize: ".82rem", marginBottom: ".75rem" }}>{brickError}</p>
              <button
                onClick={handleRetry}
                style={{ background: "#0B1120", color: "#fff", border: "none", padding: ".7rem 1.5rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".1em" }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Container do Brick — SEMPRE NO DOM, key força remontagem ao trocar plano */}
          <div
            key={plan?.id}
            id={BRICK_CONTAINER_ID}
            style={{
              display: uiState === "ready" ? "block" : "none",
              minHeight: 320,
            }}
          />

          {(uiState === "ready" || uiState === "loading") && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f0f0f5" }}>
              {[
                { icon: Shield, label: "SSL 256-bit" },
                { icon: CreditCard, label: "Mercado Pago" },
                { icon: Lock, label: "Dados criptografados" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "#bbb", fontSize: ".68rem" }}>
                  <Icon style={{ width: 11, height: 11 }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}