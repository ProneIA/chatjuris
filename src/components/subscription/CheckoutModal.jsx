import React, { useState, useEffect, useRef } from "react";
import { X, CreditCard, Shield, Lock } from "lucide-react";

// ─── MP Public Key (substitua pela sua chave real) ───────────────────────────
const MP_PUBLIC_KEY = "APP_USR-your-public-key-here";

/**
 * CheckoutModal — inicializa o Mercado Pago CardPayment Brick
 * dentro de um modal ao selecionar um plano.
 *
 * Props:
 *  plan     — objeto com { id, name, amount, installments, billingLabel }
 *  onClose  — callback para fechar o modal
 */
export default function CheckoutModal({ plan, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("form"); // "form" | "brick" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const brickControllerRef = useRef(null);
  const brickMounted = useRef(false);

  // Destruir brick ao desmontar o modal
  useEffect(() => {
    return () => {
      destroyBrick();
    };
  }, []);

  const destroyBrick = async () => {
    if (brickControllerRef.current) {
      try { await brickControllerRef.current.unmount(); } catch (_) {}
      brickControllerRef.current = null;
    }
    brickMounted.current = false;
  };

  const initBrick = async () => {
    // Carrega o SDK do MP se ainda não foi carregado
    if (!window.MercadoPago) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    await destroyBrick();

    const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
    const bricksBuilder = mp.bricks();

    // Configuração do CardPayment Brick
    // Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/card-payment-brick
    brickControllerRef.current = await bricksBuilder.create(
      "cardPayment",
      "mp-brick-container",
      {
        initialization: {
          amount: plan.amount,
          // Para planos anuais, habilita parcelamento até 12x sem juros (free_payer)
          payer: { email },
        },
        customization: {
          paymentMethods: {
            types: {
              included: ["credit_card"],   // SOMENTE cartão de crédito
              excluded: ["debit_card", "ticket", "bank_transfer", "wallet_purchase"],
            },
            // Planos mensais = 1x, planos anuais = até 12x sem juros
            maxInstallments: plan.installments,
            ...(plan.installments > 1 && {
              // Juros absorvidos pelo vendedor (free_payer = true no backend)
            }),
          },
          visual: {
            style: {
              theme: "default",
              customVariables: {
                baseColor: "#191970",
                buttonBackground: "#191970",
                buttonTextColor: "#ffffff",
                fontFamily: "'Oswald', sans-serif",
              },
            },
          },
        },
        callbacks: {
          onReady: () => {
            brickMounted.current = true;
          },
          onSubmit: async (cardFormData) => {
            /**
             * cardFormData contém:
             * {
             *   token: string,           — card token gerado pelo MP
             *   issuer_id: string,
             *   payment_method_id: string,
             *   transaction_amount: number,
             *   installments: number,
             *   payer: { email: string }
             * }
             *
             * Enviar ao backend em /api/process_payment:
             * {
             *   card_token: cardFormData.token,
             *   installments: cardFormData.installments,
             *   payment_method_id: cardFormData.payment_method_id,
             *   issuer_id: cardFormData.issuer_id,
             *   transaction_amount: plan.amount,
             *   description: plan.name,
             *   payer: { email, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") },
             *   plan_id: plan.id,
             *   // Para anuais: free_payer: true (configurar no backend MP SDK)
             * }
             */
            try {
              const res = await fetch("/api/process_payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  card_token: cardFormData.token,
                  installments: cardFormData.installments,
                  payment_method_id: cardFormData.payment_method_id,
                  issuer_id: cardFormData.issuer_id,
                  transaction_amount: plan.amount,
                  description: plan.name,
                  payer: {
                    email,
                    first_name: name.split(" ")[0] || name,
                    last_name: name.split(" ").slice(1).join(" ") || "",
                  },
                  plan_id: plan.id,
                }),
              });

              const data = await res.json();

              if (res.ok && data.status === "approved") {
                await destroyBrick();
                setStep("success");
              } else {
                setErrorMsg(data.message || "Pagamento não aprovado. Tente outro cartão.");
                setStep("error");
              }
            } catch (err) {
              setErrorMsg("Erro de conexão. Verifique sua internet e tente novamente.");
              setStep("error");
            }
          },
          onError: (error) => {
            console.error("MP Brick error:", error);
          },
        },
      }
    );
  };

  const handleProceed = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setStep("brick");
    // Aguarda o React renderizar o container "mp-brick-container" antes de iniciar o brick
    // requestAnimationFrame garante que o DOM já foi pintado
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        await initBrick();
        setLoading(false);
      });
    });
  };

  const handleRetry = async () => {
    setErrorMsg("");
    setLoading(true);
    setStep("brick");
    setTimeout(async () => {
      await initBrick();
      setLoading(false);
    }, 100);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.72)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d0d1a",
        border: "1px solid rgba(200,168,75,.3)",
        width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{
          padding: "1.5rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".6rem", textTransform: "uppercase", letterSpacing: ".18em", color: "#C8A84B", margin: "0 0 .25rem" }}>
              Assinar Agora
            </p>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", textTransform: "uppercase", color: "#fff", margin: 0 }}>
              {plan.name}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", padding: ".25rem" }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Resumo do plano */}
        <div style={{
          margin: "1.5rem 2rem",
          background: "rgba(200,168,75,.07)",
          border: "1px solid rgba(200,168,75,.2)",
          padding: "1rem 1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".75rem", margin: "0 0 .2rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>
              {plan.billingLabel}
            </p>
            <p style={{ color: "#C8A84B", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.8rem", margin: 0 }}>
              R$ {plan.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            {plan.installments > 1 && (
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: ".72rem", margin: ".2rem 0 0", fontFamily: "'Oswald', sans-serif" }}>
                em até {plan.installments}x sem juros
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".4rem", color: "rgba(255,255,255,.3)", fontSize: ".7rem" }}>
            <Lock style={{ width: 12, height: 12 }} />
            <span style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Seguro</span>
          </div>
        </div>

        <div style={{ padding: "0 2rem 2rem" }}>

          {/* STEP 1 — Dados do cliente */}
          {(step === "form") && (
            <form onSubmit={handleProceed}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontFamily: "'Oswald', sans-serif", fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(255,255,255,.5)", marginBottom: ".4rem" }}>
                  Nome completo
                </label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder="Dr. João Silva"
                  style={{ width: "100%", padding: ".75rem 1rem", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", fontFamily: "DM Sans, sans-serif", fontSize: ".9rem", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#C8A84B"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.12)"}
                />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontFamily: "'Oswald', sans-serif", fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(255,255,255,.5)", marginBottom: ".4rem" }}>
                  E-mail
                </label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="joao@escritorio.com.br"
                  style={{ width: "100%", padding: ".75rem 1rem", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", fontFamily: "DM Sans, sans-serif", fontSize: ".9rem", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#C8A84B"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.12)"}
                />
              </div>
              <button type="submit"
                style={{ width: "100%", padding: "1rem", background: "#191970", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".85rem", textTransform: "uppercase", letterSpacing: ".1em", transition: "background .2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#C8A84B"}
                onMouseLeave={e => e.currentTarget.style.background = "#191970"}
              >
                <CreditCard style={{ width: 15, height: 15, display: "inline", marginRight: ".5rem", verticalAlign: "middle" }} />
                Continuar para pagamento →
              </button>
            </form>
          )}

          {/* STEP 2 — Brick do MP */}
          {step === "brick" && (
            <div>
              {loading && (
                <div style={{ textAlign: "center", padding: "3rem 0", color: "rgba(255,255,255,.4)", fontFamily: "'Oswald', sans-serif", fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".1em" }}>
                  Carregando checkout seguro...
                </div>
              )}
              <div id="mp-brick-container" style={{ minHeight: loading ? 0 : 200 }} />
              {!loading && (
                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", color: "rgba(255,255,255,.25)", fontSize: ".7rem" }}>
                  <Shield style={{ width: 12, height: 12 }} />
                  <span style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>
                    Pagamento processado pelo Mercado Pago · SSL 256-bit
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Sucesso */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: 60, height: 60, background: "rgba(74,222,128,.1)", border: "2px solid #4ade80", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <span style={{ fontSize: "1.8rem" }}>✓</span>
              </div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.3rem", textTransform: "uppercase", color: "#fff", marginBottom: ".75rem" }}>
                Pagamento Aprovado!
              </h3>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: ".875rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                Bem-vindo ao Juris. Você receberá um e-mail de confirmação em breve com os dados de acesso.
              </p>
              <button onClick={onClose}
                style={{ padding: ".75rem 2rem", background: "#C8A84B", color: "#000", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".1em" }}>
                Acessar plataforma →
              </button>
            </div>
          )}

          {/* STEP 4 — Erro */}
          {step === "error" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: 60, height: 60, background: "rgba(239,68,68,.1)", border: "2px solid #ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <span style={{ fontSize: "1.8rem" }}>✕</span>
              </div>
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", color: "#fff", marginBottom: ".75rem" }}>
                Pagamento não aprovado
              </h3>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: ".875rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                {errorMsg}
              </p>
              <button onClick={handleRetry}
                style={{ padding: ".75rem 2rem", background: "#191970", color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".1em" }}>
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}