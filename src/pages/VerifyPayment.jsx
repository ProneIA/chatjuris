import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function VerifyPayment() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("payment_id");
  const [status, setStatus] = useState("checking"); // checking | approved | failed

  useEffect(() => {
    if (!paymentId) {
      navigate("/Pricing");
      return;
    }

    base44.functions.invoke("checkPaymentStatus", { payment_id: paymentId })
      .then((res) => {
        const s = res?.data?.status;
        if (s === "approved" || s === "active") {
          setStatus("approved");
          setTimeout(() => navigate("/Dashboard"), 2500);
        } else {
          setStatus("failed");
          setTimeout(() => navigate("/Pricing"), 3000);
        }
      })
      .catch(() => {
        setStatus("failed");
        setTimeout(() => navigate("/Pricing"), 3000);
      });
  }, [paymentId, navigate]);

  if (status === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "4px solid #e2e8f0", borderTopColor: "#1A3A5C", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "#64748b", fontSize: 15 }}>Verificando seu pagamento...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: "1rem" }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: ".5rem" }}>Pagamento Confirmado!</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Redirecionando para o painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: ".5rem" }}>Pagamento não encontrado</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Redirecionando para os planos...</p>
      </div>
    </div>
  );
}