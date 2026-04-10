import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Smartphone, Settings } from "lucide-react";

export default function WhatsAppConnect() {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [error, setError] = useState(null);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);

  const handleConnect = async () => {
    setLoadingConnect(true);
    setError(null);
    setQrCode(null);
    setStatus(null);
    try {
      const res = await base44.functions.invoke("connectWhatsapp", {});
      if (res.data?.qr_code) {
        setQrCode(res.data.qr_code);
      } else {
        setError("Não foi possível obter o QR Code. Verifique a configuração da Evolution API.");
      }
    } catch (e) {
      setError(e.message || "Erro ao conectar.");
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleConfigureWebhook = async () => {
    setLoadingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await base44.functions.invoke("configureWebhook", {});
      setWebhookResult(res.data);
    } catch (e) {
      setWebhookResult({ error: e.message });
    } finally {
      setLoadingWebhook(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoadingCheck(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("checkWhatsappStatus", {});
      const st = res.data?.status || "disconnected";
      setStatus(st);
      if (st === "connected") {
        await base44.functions.invoke("setupEvolutionWebhook", {}).catch(() => {});
      }
    } catch (e) {
      setError(e.message || "Erro ao verificar status.");
    } finally {
      setLoadingCheck(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", padding: "1.25rem 1.5rem" }} className="flex items-center gap-3">
          <Smartphone className="w-5 h-5" style={{ color: "var(--primary)" }} />
          <h1 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text)", margin: 0 }}>
            Configurar WhatsApp
          </h1>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          {/* Botão conectar */}
          {!qrCode && status !== "connected" && (
            <Button
              onClick={handleConnect}
              disabled={loadingConnect}
              className="btn-primary w-full justify-center"
              style={{ minHeight: 44 }}
            >
              {loadingConnect ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loadingConnect ? "Gerando QR Code..." : "Conectar WhatsApp"}
            </Button>
          )}

          {/* QR Code */}
          {qrCode && status !== "connected" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <img
                src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                style={{ width: 240, height: 240, border: "1px solid var(--border)" }}
              />
              <p style={{ fontSize: ".82rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
                Abra o WhatsApp → três pontos → <strong>Aparelhos conectados</strong> → Conectar aparelho
              </p>
              <Button
                onClick={handleCheckStatus}
                disabled={loadingCheck}
                className="btn-ghost w-full justify-center"
                style={{ minHeight: 44 }}
              >
                {loadingCheck ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loadingCheck ? "Verificando..." : "Já escaneei o QR Code"}
              </Button>

              <button
                onClick={handleConnect}
                disabled={loadingConnect}
                style={{ fontSize: ".75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                {loadingConnect ? "Gerando novo QR..." : "Gerar novo QR Code"}
              </button>
            </div>
          )}

          {/* Status conectado */}
          {status === "connected" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <CheckCircle2 className="w-12 h-12" style={{ color: "#16a34a" }} />
              <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#16a34a", textTransform: "uppercase", letterSpacing: ".05em", textAlign: "center" }}>
                WhatsApp conectado com sucesso!
              </p>
              <Link
                to="/AgentSettings"
                className="btn-primary w-full justify-center"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", justifyContent: "center" }}
              >
                <Settings className="w-4 h-4" />
                Configurar Agente →
              </Link>
            </div>
          )}

          {/* Status desconectado (após checar) */}
          {status === "disconnected" && (
            <p style={{ fontSize: ".82rem", color: "#dc2626", textAlign: "center" }}>
              WhatsApp ainda não conectado. Escaneie o QR Code e tente novamente.
            </p>
          )}

          {/* Configurar Webhook */}
          <div className="w-full" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <Button
              onClick={handleConfigureWebhook}
              disabled={loadingWebhook}
              className="btn-ghost w-full justify-center"
              style={{ minHeight: 44 }}
            >
              {loadingWebhook ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loadingWebhook ? "Configurando..." : "Configurar Webhook"}
            </Button>
            {webhookResult && (
              <pre style={{ marginTop: "0.75rem", fontSize: ".72rem", color: "var(--text-muted)", background: "var(--surface-2, #f4f4f6)", border: "1px solid var(--border)", padding: "0.75rem", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {JSON.stringify(webhookResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Erro */}
          {error && (
            <p style={{ fontSize: ".82rem", color: "#dc2626", textAlign: "center" }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}