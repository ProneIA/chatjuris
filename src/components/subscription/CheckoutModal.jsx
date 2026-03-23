import React, { useState, useEffect, useRef } from "react";
import { X, CreditCard, Shield, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * CheckoutModal — Mercado Pago CardPayment Brick (somente cartão de crédito)
 *
 * Props:
 *  plan     — { id, name, amount, installments, billingLabel }
 *  onClose  — callback para fechar
 */
export default function CheckoutModal({ plan, onClose }) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [step, setStep]       = useState("form"); // "form" | "loading" | "brick" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const brickRef = useRef(null);

  // Pré-preenche email do usuário logado
  useEffect(() => {
    base44.auth.me().then(u => { if (u?.email) setEmail(u.email); if (u?.full_name) setName(u.full_name); }).catch(() => {});
    return () => { destroyBrick(); };
  }, []);

  const destroyBrick = async () => {
    if (brickRef.current) {
      try { await brickRef.current.unmount(); } catch (_) {}
      brickRef.current = null;
    }
  };

  const loadMPScript = () =>
    new Promise((resolve, reject) => {
      if (window.MercadoPago) return resolve();
      const s = document.createElement("script");
      s.src = "https://sdk.mercadopago.com/js/v2";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

  const initBrick = async (mpPublicKey) => {
    await destroyBrick();
    await loadMPScript();

    const mp = new window.MercadoPago(mpPublicKey, { locale: "pt-BR" });
    const builder = mp.bricks();

    brickRef.current = await builder.create("cardPayment", "mp-brick-container", {
      initialization: {
        amount: plan.amount,
        payer: { email },
      },
      customization: {
        paymentMethods: {
          types: {
            included: ["credit_card"],
            excluded: ["debit_card", "ticket", "bank_transfer", "wallet_purchase"],
          },
          maxInstallments: plan.installments,
        },
        visual: {
          style: {
            theme: "default",
            customVariables: {
              baseColor: "#191970",
              buttonBackground: "#191970",
              buttonTextColor: "#ffffff",
            },
          },
        },
      },
      callbacks: {
        onReady: () => { setStep("brick"); },
        onSubmit: async (formData) => {
          /**
           * Payload enviado a /api/process_payment:
           * {
           *   card_token:         formData.token,
           *   installments:       formData.installments,
           *   payment_method_id:  formData.payment_method_id,
           *   issuer_id:          formData.issuer_id,
           *   transaction_amount: plan.amount,
           *   description:        plan.name,
           *   plan_id:            plan.id,
           *   payer: { email, first_name, last_name },
           *   // anuais: configurar free_payer=true no backend MP SDK
           * }
           */
          try {
            const res = await fetch("/api/process_payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                card_token:         formData.token,
                installments:       formData.installments,
                payment_method_id:  formData.payment_method_id,
                issuer_id:          formData.issuer_id,
                transaction_amount: plan.amount,
                description:        plan.name,
                plan_id:            plan.id,
                payer: {
                  email,
                  first_name: name.split(" ")[0] || name,
                  last_name:  name.split(" ").slice(1).join(" ") || "",
                },
              }),
            });
            const data = await res.json();
            await destroyBrick();
            setStep(res.ok && data.status === "approved" ? "success" : "error");
            if (!(res.ok && data.status === "approved")) {
              setErrorMsg(data.message || "Pagamento não aprovado. Tente outro cartão.");
            }
          } catch (_) {
            await destroyBrick();
            setErrorMsg("Erro de conexão. Verifique sua internet e tente novamente.");
            setStep("error");
          }
        },
        onError: (err) => {
          console.error("MP Brick error:", err);
          setErrorMsg("Erro no checkout. Tente novamente.");
          setStep("error");
        },
      },
    });
  };

  const handleProceed = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStep("loading");
    try {
      // Busca a public key do backend (não expõe no frontend)
      const res = await base44.functions.invoke("getMercadoPagoPublicKey", {});
      const publicKey = res?.data?.publicKey;
      if (!publicKey) throw new Error("Chave pública não disponível");
      // Aguarda o React renderizar o container no DOM antes de montar o Brick
      setTimeout(() => initBrick(publicKey), 150);
    } catch (err) {
      setErrorMsg("Não foi possível iniciar o checkout. Tente novamente.");
      setStep("error");
    }
  };

  const handleRetry = async () => {
    setErrorMsg("");
    setStep("form");
  };

  const s = { // inline style helpers
    label: { display: "block", fontFamily: "'Oswald', sans-serif", fontSize: ".63rem", textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(255,255,255,.5)", marginBottom: ".4rem" },
    input: { width: "100%", padding: ".75rem 1rem", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "#fff", fontFamily: "sans-serif", fontSize: ".9rem", outline: "none", boxSizing: "border-box", borderRadius: 0 },
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0d0d1a", border: "1px solid rgba(200,168,75,.3)", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>

        {/* Header */}
        <div style={{ padding: "1.4rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".58rem", textTransform: "uppercase", letterSpacing: ".18em", color: "#C8A84B", margin: "0 0 .2rem" }}>Assinar Agora</p>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.15rem", textTransform: "uppercase", color: "#fff", margin: 0 }}>{plan.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)" }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Resumo do plano */}
        <div style={{ margin: "1.25rem 1.75rem", background: "rgba(200,168,75,.07)", border: "1px solid rgba(200,168,75,.2)", padding: ".9rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: ".72rem", margin: "0 0 .15rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>{plan.billingLabel}</p>
            <p style={{ color: "#C8A84B", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.6rem", margin: 0 }}>
              R$ {plan.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            {plan.installments > 1 && (
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: ".7rem", margin: ".15rem 0 0" }}>em até {plan.installments}x sem juros</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".35rem", color: "rgba(255,255,255,.25)", fontSize: ".68rem" }}>
            <Lock style={{ width: 11, height: 11 }} />
            <span style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Seguro</span>
          </div>
        </div>

        <div style={{ padding: "0 1.75rem 1.75rem" }}>

          {/* STEP: form */}
          {step === "form" && (
            <form onSubmit={handleProceed}>
              <div style={{ marginBottom: ".9rem" }}>
                <label style={s.label}>Nome completo</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Dr. João Silva" style={s.input}
                  onFocus={e => e.target.style.borderColor = "#C8A84B"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.14)"} />
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={s.label}>E-mail</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@escritorio.com.br" style={s.input}
                  onFocus={e => e.target.style.borderColor = "#C8A84B"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.14)"} />
              </div>
              <button type="submit"
                style={{ width: "100%", padding: ".95rem", background: "#191970", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".1em", borderRadius: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = "#C8A84B"}
                onMouseLeave={e => e.currentTarget.style.background = "#191970"}
              >
                <CreditCard style={{ width: 14, height: 14, display: "inline", marginRight: ".45rem", verticalAlign: "middle" }} />
                Continuar para pagamento →
              </button>
            </form>
          )}

          {/* STEP: loading */}
          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <div style={{ width: 36, height: 36, border: "3px solid rgba(200,168,75,.3)", borderTop: "3px solid #C8A84B", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "rgba(255,255,255,.4)", fontFamily: "'Oswald', sans-serif", fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".12em" }}>Carregando checkout seguro...</p>
            </div>
          )}

          {/* STEP: brick (rendered while loading too, hidden until onReady) */}
          <div id="mp-brick-container" style={{ display: step === "brick" ? "block" : "none" }} />

          {/* Security badge (brick visible) */}
          {step === "brick" && (
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".45rem", color: "rgba(255,255,255,.22)", fontSize: ".68rem" }}>
              <Shield style={{ width: 11, height: 11 }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Pagamento processado pelo Mercado Pago · SSL 256-bit</span>
            </div>
          )}

          {/* STEP: success */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: 56, height: 56, background: "rgba(74,222,128,.1)", border: "2px solid #4ade80", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "1.6rem" }}>✓</div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", textTransform: "uppercase", color: "#fff", marginBottom: ".6rem" }}>Pagamento Aprovado!</h3>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>
                Bem-vindo ao Juris. Você receberá um e-mail de confirmação em breve.
              </p>
              <button onClick={onClose} style={{ padding: ".7rem 2rem", background: "#C8A84B", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em", borderRadius: 0 }}>
                Acessar plataforma →
              </button>
            </div>
          )}

          {/* STEP: error */}
          {step === "error" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: 56, height: 56, background: "rgba(239,68,68,.1)", border: "2px solid #ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "1.6rem" }}>✕</div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.05rem", textTransform: "uppercase", color: "#fff", marginBottom: ".6rem" }}>Pagamento não aprovado</h3>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>{errorMsg}</p>
              <button onClick={handleRetry} style={{ padding: ".7rem 2rem", background: "#191970", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em", borderRadius: 0 }}>
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}