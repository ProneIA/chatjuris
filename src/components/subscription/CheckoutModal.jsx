import React, { useState, useEffect, useRef } from "react";
import { X, Shield, Lock, CreditCard } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * CheckoutModal — Mercado Pago CardPayment Brick
 *
 * Props:
 *  plan     — { id, name, amount, installments, billingLabel }
 *  onClose  — callback para fechar o modal
 *  containerId — id único do container DOM (default: "mp-brick-container")
 */
export default function CheckoutModal({ plan, onClose, containerId = "mp-brick-container" }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [nameErr, setNameErr]   = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [step, setStep]         = useState("form"); // form | loading | brick | success | error
  const [errMsg, setErrMsg]     = useState("");

  const brickRef    = useRef(null);
  const mpKeyRef    = useRef(null);
  const emailRef    = useRef(email);
  const nameRef     = useRef(name);

  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { nameRef.current = name; }, [name]);

  // Pré-preenche dados do usuário logado
  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (u?.email) setEmail(u.email);
        if (u?.full_name) setName(u.full_name);
      })
      .catch(() => {});
    return () => { destroyBrick(); };
  }, []);

  const destroyBrick = async () => {
    if (brickRef.current) {
      try { await brickRef.current.unmount(); } catch (_) {}
      brickRef.current = null;
    }
  };

  const loadSDK = () =>
    new Promise((resolve, reject) => {
      if (window.MercadoPago) return resolve();
      const s = document.createElement("script");
      s.src = "https://sdk.mercadopago.com/js/v2";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Falha ao carregar SDK do Mercado Pago"));
      document.head.appendChild(s);
    });

  const initBrick = async (mpKey) => {
    await destroyBrick();
    await loadSDK();

    const mp = new window.MercadoPago(mpKey, { locale: "pt-BR" });
    const builder = mp.bricks();

    brickRef.current = await builder.create("cardPayment", containerId, {
      initialization: {
        amount: plan.amount,
        payer: { email: emailRef.current },
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
        onReady: () => {
          setStep("brick");
        },
        onSubmit: async (cardData) => {
          const nameParts = nameRef.current.trim().split(" ");
          try {
            const res = await base44.functions.invoke("lexiaProcessPayment", {
              token:              cardData.token,
              installments:       cardData.installments,
              payment_method_id:  cardData.payment_method_id,
              issuer_id:          cardData.issuer_id,
              transaction_amount: plan.amount,
              description:        `Plano ${plan.name} - Juris`,
              plan_id:            plan.id,
              payer: {
                email:      emailRef.current,
                first_name: nameParts[0] || "",
                last_name:  nameParts.slice(1).join(" ") || "",
                ...(cardData.payer?.identification && {
                  identification: {
                    type:   cardData.payer.identification.type || "CPF",
                    number: cardData.payer.identification.number,
                  },
                }),
              },
            });

            await destroyBrick();
            const status = res?.data?.status;

            if (status === "approved" || status === "in_process" || status === "pending") {
              setStep("success");
            } else {
              setErrMsg(res?.data?.message || "Pagamento não aprovado. Tente com outro cartão.");
              setStep("error");
            }
          } catch (_) {
            await destroyBrick();
            setErrMsg("Erro de conexão. Verifique sua internet e tente novamente.");
            setStep("error");
          }
        },
        onError: (e) => {
          // Apenas erros críticos de inicialização chegam aqui
          console.error("MP Brick onError:", e);
          if (e?.type === "non_critical") return; // ignorar erros de validação do formulário
          setErrMsg("Erro ao carregar o formulário de pagamento. Tente novamente.");
          setStep("error");
        },
      },
    });
  };

  const startCheckout = async () => {
    setStep("loading");
    try {
      if (!mpKeyRef.current) {
        const res = await base44.functions.invoke("getMercadoPagoPublicKey", {});
        mpKeyRef.current = res?.data?.publicKey;
      }
      if (!mpKeyRef.current) throw new Error("Chave pública indisponível");
      // Aguarda React renderizar o container antes do MP tentar montá-lo
      setTimeout(() => initBrick(mpKeyRef.current), 200);
    } catch (_) {
      setErrMsg("Não foi possível iniciar o checkout. Tente novamente.");
      setStep("error");
    }
  };

  const validate = () => {
    let ok = true;
    if (!name.trim()) { setNameErr("Insira seu nome completo."); ok = false; } else setNameErr("");
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRx.test(email)) { setEmailErr("Insira um e-mail válido."); ok = false; } else setEmailErr("");
    return ok;
  };

  const handleProceed = (e) => {
    e.preventDefault();
    if (!validate()) return;
    startCheckout();
  };

  const handleRetry = () => {
    setErrMsg("");
    setStep("form");
  };

  const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const S = {
    label: { display: "block", fontFamily: "'Oswald', sans-serif", fontSize: ".62rem", textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(255,255,255,.45)", marginBottom: ".4rem" },
    input: (err) => ({ width: "100%", padding: ".8rem 1rem", background: "rgba(255,255,255,.05)", border: `1px solid ${err ? "#f87171" : "rgba(255,255,255,.12)"}`, color: "#fff", fontSize: ".9rem", outline: "none", boxSizing: "border-box", borderRadius: 0, transition: "border-color .2s" }),
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
    >
      <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ background: "#0d0d1a", border: "1px solid rgba(200,168,75,.25)", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto", position: "relative" }}>

        {/* Header */}
        <div style={{ padding: "1.4rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".58rem", textTransform: "uppercase", letterSpacing: ".2em", color: "#C8A84B", margin: "0 0 .25rem" }}>Assinar Agora</p>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", textTransform: "uppercase", color: "#fff", margin: 0 }}>{plan.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", padding: ".25rem" }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Plan summary */}
        <div style={{ margin: "1.25rem 1.75rem", background: "rgba(200,168,75,.06)", border: "1px solid rgba(200,168,75,.18)", padding: ".9rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.35)", margin: "0 0 .2rem" }}>{plan.billingLabel}</p>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.8rem", color: "#C8A84B", margin: 0, lineHeight: 1 }}>
              R$ {fmt(plan.amount)}
            </p>
            {plan.installments > 1 && (
              <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: ".65rem", color: "rgba(255,255,255,.3)", margin: ".2rem 0 0" }}>em até {plan.installments}× sem juros</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "rgba(255,255,255,.2)", fontSize: ".65rem" }}>
            <Lock style={{ width: 11, height: 11 }} />
            <span style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Seguro</span>
          </div>
        </div>

        <div style={{ padding: "0 1.75rem 1.75rem" }}>

          {/* FORM */}
          {step === "form" && (
            <form onSubmit={handleProceed} noValidate>
              <div style={{ marginBottom: ".85rem" }}>
                <label style={S.label}>Nome completo</label>
                <input
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); setNameErr(""); }}
                  placeholder="Dr. João Silva"
                  style={S.input(nameErr)}
                  onFocus={e => e.target.style.borderColor = nameErr ? "#f87171" : "#C8A84B"}
                  onBlur={e => e.target.style.borderColor = nameErr ? "#f87171" : "rgba(255,255,255,.12)"}
                />
                {nameErr && <p style={{ fontSize: ".68rem", color: "#f87171", margin: ".3rem 0 0" }}>{nameErr}</p>}
              </div>
              <div style={{ marginBottom: "1.4rem" }}>
                <label style={S.label}>E-mail</label>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
                  placeholder="joao@escritorio.com.br"
                  style={S.input(emailErr)}
                  onFocus={e => e.target.style.borderColor = emailErr ? "#f87171" : "#C8A84B"}
                  onBlur={e => e.target.style.borderColor = emailErr ? "#f87171" : "rgba(255,255,255,.12)"}
                />
                {emailErr && <p style={{ fontSize: ".68rem", color: "#f87171", margin: ".3rem 0 0" }}>{emailErr}</p>}
              </div>
              <button
                type="submit"
                style={{ width: "100%", padding: "1rem", background: "#191970", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".1em", borderRadius: 0, transition: "background .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}
                onMouseEnter={e => e.currentTarget.style.background = "#C8A84B"}
                onMouseLeave={e => e.currentTarget.style.background = "#191970"}
              >
                <CreditCard style={{ width: 15, height: 15 }} />
                Continuar para pagamento →
              </button>
            </form>
          )}

          {/* LOADING */}
          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <div style={{ width: 36, height: 36, border: "3px solid rgba(200,168,75,.25)", borderTop: "3px solid #C8A84B", borderRadius: "50%", margin: "0 auto 1rem", animation: "co-spin 0.8s linear infinite" }} />
              <p style={{ fontFamily: "'Oswald', sans-serif", color: "rgba(255,255,255,.35)", fontSize: ".72rem", textTransform: "uppercase", letterSpacing: ".12em" }}>Carregando checkout seguro...</p>
            </div>
          )}

          {/* BRICK CONTAINER — sempre no DOM durante loading+brick para o MP encontrar o elemento */}
          <div
            id={containerId}
            style={{
              display: (step === "loading" || step === "brick") ? "block" : "none",
              visibility: step === "brick" ? "visible" : "hidden",
              minHeight: step === "brick" ? "auto" : "1px",
            }}
          />

          {/* Security note */}
          {step === "brick" && (
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem", color: "rgba(255,255,255,.18)", fontSize: ".65rem" }}>
              <Shield style={{ width: 11, height: 11 }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Mercado Pago · SSL 256-bit</span>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
              <div style={{ width: 64, height: 64, background: "rgba(74,222,128,.08)", border: "2px solid #4ade80", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "2rem" }}>✓</div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.3rem", textTransform: "uppercase", color: "#fff", marginBottom: ".6rem" }}>Pagamento Aprovado!</h3>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Bem-vindo ao Juris. Você receberá um e-mail de confirmação em breve.
              </p>
              <button
                onClick={onClose}
                style={{ padding: ".8rem 2.5rem", background: "#C8A84B", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em", borderRadius: 0 }}
              >
                Acessar plataforma →
              </button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
              <div style={{ width: 64, height: 64, background: "rgba(239,68,68,.08)", border: "2px solid #ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "2rem" }}>✕</div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", color: "#fff", marginBottom: ".6rem" }}>Pagamento não aprovado</h3>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".85rem", lineHeight: 1.7, marginBottom: "2rem" }}>{errMsg}</p>
              <button
                onClick={handleRetry}
                style={{ padding: ".8rem 2.5rem", background: "#191970", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".1em", borderRadius: 0, transition: "background .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#C8A84B"}
                onMouseLeave={e => e.currentTarget.style.background = "#191970"}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}