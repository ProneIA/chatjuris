import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ExternalLink, Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Settings } from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";

const inputStyle = { background: "#0d1117", border: "1px solid #1e2740", color: "#e8eaf0", padding: ".6rem .85rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".85rem", outline: "none", width: "100%" };
const labelStyle = { display: "block", fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".3rem", fontWeight: 600 };

function ApiCard({ title, description, logo, docsUrl, contractUrl, apiKeyField, perfil, onSave, onTest }) {
  const [key, setKey] = useState(perfil?.[apiKeyField] || "");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | "ok" | "fail"

  useEffect(() => {
    setKey(perfil?.[apiKeyField] || "");
  }, [perfil, apiKeyField]);

  const isConfigured = !!(perfil?.[apiKeyField]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ [apiKeyField]: key.trim() });
    setSaving(false);
  };

  const handleTest = async () => {
    if (!key.trim()) return;
    setTesting(true);
    setTestResult(null);
    const result = await onTest(apiKeyField, key.trim());
    setTestResult(result ? "ok" : "fail");
    setTesting(false);
  };

  return (
    <div style={{ background: "#161b27", border: "1px solid #1e2740" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1e2740", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <div style={{ width: 36, height: 36, background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Key style={{ width: 16, height: 16, color: "#C9A84C" }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".9rem", color: "#e8eaf0", margin: 0 }}>{title}</h3>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".75rem", color: "#8892a4", margin: "2px 0 0" }}>{description}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          {isConfigured ? (
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".7rem", color: "#4ade80", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
              <CheckCircle2 style={{ width: 13, height: 13 }} /> Configurado
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".7rem", color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>
              <XCircle style={{ width: 13, height: 13 }} /> Não configurado
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>API Key</label>
          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              style={{ ...inputStyle, paddingRight: "2.5rem" }}
              placeholder="Cole sua API Key aqui..."
              value={key}
              onChange={e => setKey(e.target.value)}
            />
            <button
              onClick={() => setShowKey(s => !s)}
              style={{ position: "absolute", right: ".6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5568", padding: 0 }}
            >
              {showKey ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
          <button onClick={handleSave} disabled={saving || !key.trim()}
            style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".55rem 1.1rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: saving || !key.trim() ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".78rem", opacity: saving || !key.trim() ? .6 : 1 }}>
            {saving ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : null}
            Salvar
          </button>
          <button onClick={handleTest} disabled={testing || !key.trim()}
            style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".55rem 1.1rem", background: "transparent", border: "1px solid #1e2740", color: "#8892a4", cursor: testing || !key.trim() ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: ".78rem", opacity: testing || !key.trim() ? .6 : 1 }}>
            {testing ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : null}
            Testar conexão
          </button>
          {contractUrl && (
            <a href={contractUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", fontSize: ".75rem", color: "#C9A84C", fontFamily: "'IBM Plex Sans', sans-serif", textDecoration: "none" }}>
              <ExternalLink style={{ width: 12, height: 12 }} /> Contratar
            </a>
          )}
          {docsUrl && (
            <a href={docsUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", fontSize: ".75rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif", textDecoration: "none" }}>
              <ExternalLink style={{ width: 12, height: 12 }} /> Documentação
            </a>
          )}
        </div>
        {testResult === "ok" && (
          <div style={{ display: "flex", alignItems: "center", gap: ".4rem", color: "#4ade80", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem" }}>
            <CheckCircle2 style={{ width: 13, height: 13 }} /> Conexão bem-sucedida!
          </div>
        )}
        {testResult === "fail" && (
          <div style={{ display: "flex", alignItems: "center", gap: ".4rem", color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".78rem" }}>
            <XCircle style={{ width: 13, height: 13 }} /> Falha na conexão. Verifique a API Key.
          </div>
        )}
      </div>
    </div>
  );
}

export default function JusTrackConfiguracoes() {
  const queryClient = useQueryClient();

  const { data: perfis = [] } = useQuery({
    queryKey: ["perfilOAB"],
    queryFn: () => base44.entities.PerfilOAB.list("-created_date", 1),
  });
  const perfil = perfis[0] || null;

  const handleSave = async (fields) => {
    if (perfil?.id) {
      await base44.entities.PerfilOAB.update(perfil.id, fields);
    } else {
      await base44.entities.PerfilOAB.create({ numeroOAB: "", seccional: "SP", ...fields });
    }
    queryClient.invalidateQueries({ queryKey: ["perfilOAB"] });
  };

  const handleTest = async (field, apiKey) => {
    if (field === "juditApiKey") {
      try {
        // Testa chamando um endpoint simples da Judit
        const res = await fetch("https://requests.judit.io/api/oab?oab_number=12345&uf=SP", {
          headers: { "api-key": apiKey, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        return res.status !== 401 && res.status !== 403;
      } catch {
        return false;
      }
    }
    if (field === "escavadorApiKey") {
      try {
        const res = await fetch("https://api.escavador.com/api/v2/advogados/oab/SP/12345", {
          headers: { "Authorization": `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8000),
        });
        return res.status !== 401 && res.status !== 403;
      } catch {
        return false;
      }
    }
    return false;
  };

  return (
    <JusTrackLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".25rem" }}>
            <Settings style={{ width: 18, height: 18, color: "#C9A84C" }} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.6rem", color: "#C9A84C", margin: 0 }}>
              Configurações
            </h1>
          </div>
          <p style={{ color: "#8892a4", fontSize: ".85rem", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Integre APIs jurídicas externas para expandir a cobertura de busca
          </p>
        </div>

        {/* Seção APIs Externas */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".8rem", color: "#8892a4", textTransform: "uppercase", letterSpacing: ".12em", margin: 0 }}>
              APIs Externas
            </h2>
            <div style={{ flex: 1, height: 1, background: "#1e2740" }} />
          </div>

          <div style={{ background: "rgba(201,168,76,.04)", border: "1px solid rgba(201,168,76,.15)", padding: ".85rem 1.25rem", marginBottom: "1.25rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem", color: "#C9A84C", lineHeight: 1.5 }}>
            💡 A API pública do DataJud (CNJ) <strong>não suporta</strong> busca por número de OAB. Para buscar processos pelo número da OAB, é necessário uma API jurídica especializada. Configure abaixo para habilitar essa funcionalidade.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ApiCard
              title="Judit"
              description="Busca por OAB, CPF, CNPJ com cobertura nacional. Recomendado para advogados."
              apiKeyField="juditApiKey"
              perfil={perfil}
              onSave={handleSave}
              onTest={handleTest}
              contractUrl="https://judit.io"
              docsUrl="https://docs.judit.io"
            />

            <ApiCard
              title="Escavador"
              description="Monitoramento de processos, publicações e diário oficial."
              apiKeyField="escavadorApiKey"
              perfil={perfil}
              onSave={handleSave}
              onTest={handleTest}
              contractUrl="https://api.escavador.com"
              docsUrl="https://api.escavador.com/docs"
            />
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </JusTrackLayout>
  );
}