import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertCircle, CheckCircle2, Lock } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CheckoutModal — Mercado Pago Bricks (Payment Brick)
   Usado por: pages/Pricing e pages/LexIA
   ═══════════════════════════════════════════════════════════ */

/** Injeta o script de device fingerprint do MP e retorna o device_id */
async function getMPDeviceId(publicKey) {
  return new Promise((resolve) => {
    // Script já carregado — pegar device_id direto
    if (window.MP_DEVICE_SESSION_ID) {
      return resolve(window.MP_DEVICE_SESSION_ID);
    }

    // Injetar script de fingerprint se ainda não foi
    const scriptId = "mp-device-fingerprint";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.mercadopago.com/v2/security.js`;
      script.setAttribute("view", "checkout");
      script.setAttribute("output", "deviceId");
      document.head.appendChild(script);
    }

    // Aguardar até 5s pelo device_id
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.MP_DEVICE_SESSION_ID) {
        clearInterval(interval);
        resolve(window.MP_DEVICE_SESSION_ID);
      } else if (attempts >= 50) {
        clearInterval(interval);
        resolve(null); // fallback: continua sem device_id
      }
    }, 100);
  });
}

export default function CheckoutModal({ plan, onClose, containerId = "mp-brick-container" }) {
  const [status, setStatus] = useState("loading"); // loading | ready | processing | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const brickRef = useRef(null);
  const mountedRef = useRef(false);
  const deviceIdRef = useRef(null);

  const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  useEffect(() => {
    mountedRef.current = true;
    let brickController = null;

    const init = async () => {
      try {
        // 1. Buscar public key
        const res = await base44.functions.invoke("getMercadoPagoPublicKey", {});
        const publicKey = res?.data?.public_key;
        if (!publicKey) throw new Error("Chave pública não encontrada");

        // 2. Capturar device ID (antifraude obrigatório pelo MP)
        const deviceId = await getMPDeviceId(publicKey);
        deviceIdRef.current = deviceId;

        // 3. Carregar SDK MP
        if (!window.MercadoPago) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://sdk.mercadopago.com/js/v2";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Falha ao carregar SDK do Mercado Pago"));
            document.head.appendChild(script);
          });
        }

        if (!mountedRef.current) return;

        // 3. Inicializar MP e Bricks
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks();

        // 4. Aguardar container estar no DOM
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mountedRef.current) return;

        const container = document.getElementById(containerId);
        if (!container) throw new Error("Container do Brick não encontrado");

        setStatus("ready");

        // 5. Montar Payment Brick
        brickController = await bricksBuilder.create("payment", containerId, {
          initialization: {
            amount: plan.amount,
            preferenceId: null,
          },
          customization: {
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
            },
            visual: {
              style: {
                theme: "default",
                customVariables: {
                  baseColor: "#191970",
                },
              },
              hideFormTitle: true,
            },
          },
          callbacks: {
            onReady: () => {
              if (mountedRef.current) setStatus("ready");
            },
            onSubmit: async ({ selectedPaymentMethod, formData }) => {
              if (!mountedRef.current) return;
              setStatus("processing");
              try {
                const response = await base44.functions.invoke("lexiaProcessPayment", {
                  planId: plan.id,
                  planName: plan.name,
                  amount: plan.amount,
                  installments: plan.installments || 1,
                  paymentData: formData,
                  device_id: deviceIdRef.current || window.MP_DEVICE_SESSION_ID || null,
                });

                if (!mountedRef.current) return;

                const d = response?.data;
                if (d?.success || d?.status === "approved") {
                  setStatus("success");
                } else {
                  setErrorMsg(d?.message || "Pagamento não aprovado. Verifique os dados do cartão.");
                  setStatus("error");
                }
              } catch (err) {
                if (mountedRef.current) {
                  setErrorMsg(err.message || "Erro ao processar pagamento.");
                  setStatus("error");
                }
              }
            },
            onError: (err) => {
              if (!mountedRef.current) return;
              // Ignorar erros não críticos (validação de campo)
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

    init();

    return () => {
      mountedRef.current = false;
      if (brickRef.current) {
        brickRef.current.unmount?.();
        brickRef.current = null;
      }
    };
  }, [plan?.id]);

  // Fechar com Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} />

      <div style={{ position: "relative", zIndex: 1, background: "#fff", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}>
        {/* Header */}
        <div style={{ padding: "1.5rem 1.75rem 1rem", borderBottom: "1px solid #e0e0ea", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".15em", color: "#191970", margin: "0 0 .2rem" }}>
              Assinar Plano
            </p>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#0a0a0a", margin: 0, textTransform: "uppercase" }}>
              {plan.name}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#191970", margin: 0, lineHeight: 1 }}>
                R$ {fmt(plan.amount)}
              </p>
              <p style={{ fontSize: ".7rem", color: "#aaa", margin: ".15rem 0 0" }}>{plan.period || "/mês"}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: ".25rem", color: "#aaa", display: "flex" }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: "1.5rem 1.75rem" }}>

          {/* Estado: loading */}
          {status === "loading" && (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Loader2 style={{ width: 32, height: 32, color: "#191970", margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#6b6b80", fontSize: ".85rem" }}>Carregando formulário de pagamento...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Estado: processing */}
          {status === "processing" && (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Loader2 style={{ width: 32, height: 32, color: "#191970", margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#0a0a0a", fontWeight: 600, marginBottom: ".5rem" }}>Processando pagamento...</p>
              <p style={{ color: "#6b6b80", fontSize: ".82rem" }}>Por favor, aguarde. Não feche esta janela.</p>
            </div>
          )}

          {/* Estado: success */}
          {status === "success" && (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <CheckCircle2 style={{ width: 48, height: 48, color: "#4ade80", margin: "0 auto 1rem" }} />
              <h3 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.3rem", textTransform: "uppercase", color: "#0a0a0a", marginBottom: ".75rem" }}>
                Pagamento Aprovado!
              </h3>
              <p style={{ color: "#6b6b80", fontSize: ".9rem", marginBottom: "2rem" }}>
                Seu plano <strong>{plan.name}</strong> foi ativado com sucesso. Você receberá um e-mail de confirmação.
              </p>
              <button
                onClick={() => window.location.href = "/Dashboard"}
                style={{ background: "#191970", color: "#fff", border: "none", padding: "1rem 2rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".1em" }}
              >
                Acessar Painel →
              </button>
            </div>
          )}

          {/* Estado: error */}
          {status === "error" && (
            <div style={{ padding: "2rem 1rem" }}>
              <div style={{ display: "flex", gap: ".75rem", background: "#fef2f2", border: "1px solid #fecaca", padding: "1rem", marginBottom: "1.5rem" }}>
                <AlertCircle style={{ width: 20, height: 20, color: "#ef4444", flexShrink: 0 }} />
                <p style={{ color: "#7f1d1d", fontSize: ".85rem", margin: 0 }}>{errorMsg}</p>
              </div>
              <button
                onClick={() => { setStatus("loading"); setErrorMsg(""); window.location.reload(); }}
                style={{ background: "#191970", color: "#fff", border: "none", padding: ".9rem 2rem", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".1em", width: "100%" }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Container do Brick — sempre no DOM, visível após pronto */}
          <div
            id={containerId}
            style={{ visibility: status === "ready" ? "visible" : "hidden", minHeight: status === "ready" ? "auto" : 0 }}
          />

          {/* Segurança */}
          {(status === "ready" || status === "loading") && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", marginTop: "1rem", color: "#aaa", fontSize: ".72rem" }}>
              <Lock style={{ width: 12, height: 12 }} />
              <span>Pagamento seguro via Mercado Pago · SSL 256-bit</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}