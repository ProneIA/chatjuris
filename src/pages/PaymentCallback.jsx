import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentCallback() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || params.get("collection_status");
  const paymentId = params.get("payment_id") || params.get("collection_id");

  useEffect(() => {
    if (status === "approved") {
      const t = setTimeout(() => navigate("/Dashboard"), 3000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  if (status === "approved") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: "1rem" }}>✅</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "0 0 .5rem" }}>Pagamento Aprovado!</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: "2rem" }}>
            Sua assinatura foi ativada com sucesso. Redirecionando para o painel...
          </p>
          <div style={{ width: 40, height: 4, background: "#1A3A5C", borderRadius: 2, margin: "0 auto", animation: "progress 3s linear forwards" }} />
          <style>{`@keyframes progress { from { width: 0 } to { width: 200px } }`}</style>
        </div>
      </div>
    );
  }

  if (status === "pending" || status === "in_process") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: "1rem" }}>⏳</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "0 0 .5rem" }}>Pagamento em Análise</h1>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: "1.5rem" }}>
            Seu pagamento está sendo processado. Você receberá um e-mail de confirmação assim que for aprovado.
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: "2rem" }}>
            ID do pagamento: <strong>{paymentId}</strong>
          </p>
          <button
            onClick={() => navigate("/Dashboard")}
            style={{ background: "#1A3A5C", color: "#fff", border: "none", padding: ".75rem 2rem", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Ir para o Painel
          </button>
        </div>
      </div>
    );
  }

  // failure ou qualquer outro status
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 56, marginBottom: "1rem" }}>❌</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "0 0 .5rem" }}>Pagamento não concluído</h1>
        <p style={{ color: "#64748b", fontSize: 15, marginBottom: "2rem" }}>
          Ocorreu um problema com seu pagamento. Nenhuma cobrança foi realizada.
        </p>
        <button
          onClick={() => navigate("/Pricing")}
          style={{ background: "#1A3A5C", color: "#fff", border: "none", padding: ".75rem 2rem", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}