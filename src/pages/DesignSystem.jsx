import React, { useState } from "react";
import {
  Palette, Type, Square, MousePointer, Tag, Layout, AlertCircle,
  CheckCircle2, Info, AlertTriangle, Zap, FileText, Users, Settings
} from "lucide-react";

const Section = ({ title, children }) => (
  <div className="app-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
    {children}
  </div>
);

const Label = ({ children }) => (
  <p className="text-label" style={{ margin: 0, marginBottom: 8 }}>{children}</p>
);

const Swatch = ({ bg, border, label, token }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
    <div style={{ width: 56, height: 56, borderRadius: "var(--r-md)", background: bg, border: border || "1px solid var(--border)" }} />
    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>{label}</p>
    <p style={{ fontSize: 10, color: "var(--text-3)", margin: 0, fontFamily: "monospace" }}>{token}</p>
  </div>
);

export default function DesignSystem() {
  const [activeTab, setActiveTab] = useState("cores");

  const tabs = [
    { id: "cores", label: "Cores" },
    { id: "tipografia", label: "Tipografia" },
    { id: "botoes", label: "Botões" },
    { id: "badges", label: "Badges" },
    { id: "cards", label: "Cards" },
    { id: "estados", label: "Estados" },
    { id: "proibido", label: "❌ Proibido" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--text-1)", letterSpacing: "-0.02em", margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-light)", border: "1px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Palette style={{ width: 18, height: 18, color: "var(--accent)" }} />
          </div>
          Design System
        </h1>
        <p style={{ marginTop: 4, color: "var(--text-2)", fontSize: 13, margin: 0 }}>
          Regras visuais obrigatórias para todas as páginas do Juris.IA
        </p>
      </div>

      {/* Alert */}
      <div style={{ padding: "12px 16px", background: "var(--blue-bg)", border: "1px solid var(--blue-bd)", borderRadius: "var(--r-md)", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Info style={{ width: 16, height: 16, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: "#1e40af", margin: 0, lineHeight: 1.6 }}>
          <strong>Todo componente novo deve seguir este guia.</strong> Nenhuma cor hardcoded, nenhum roxo/purple, nenhum dark mode. Use sempre os tokens CSS definidos em <code style={{ fontFamily: "monospace", background: "rgba(59,130,246,.1)", padding: "1px 4px", borderRadius: 4 }}>globals.css</code>.
        </p>
      </div>

      {/* Tabs */}
      <div className="app-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "13px 16px", fontSize: 13, fontWeight: 500, border: "none", background: "none", cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-2)",
              marginBottom: -1, whiteSpace: "nowrap", transition: "all .15s",
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── CORES ── */}
          {activeTab === "cores" && (
            <>
              <div>
                <Label>Fundos de Página</Label>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <Swatch bg="#F1F5F9" label="Página (bg)" token="var(--bg)" />
                  <Swatch bg="#F8FAFC" label="Superfície" token="var(--surface)" />
                  <Swatch bg="#FFFFFF" label="Card / Modal" token="var(--card)" />
                </div>
              </div>
              <div>
                <Label>Textos</Label>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <Swatch bg="#0F172A" label="Texto Primário" token="var(--text-1)" />
                  <Swatch bg="#475569" label="Texto Secundário" token="var(--text-2)" />
                  <Swatch bg="#94A3B8" label="Texto Muted" token="var(--text-3)" />
                </div>
              </div>
              <div>
                <Label>Accent (único azul primário)</Label>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <Swatch bg="#3B82F6" label="Accent" token="var(--accent)" border="none" />
                  <Swatch bg="#2563EB" label="Accent Hover" token="var(--accent-hover)" border="none" />
                  <Swatch bg="#EFF6FF" label="Accent Light" token="var(--accent-light)" />
                </div>
              </div>
              <div>
                <Label>Sidebar</Label>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <Swatch bg="#0B1120" label="Navy (sidebar)" token="var(--navy)" border="none" />
                  <Swatch bg="#141E35" label="Navy-2 (hover)" token="var(--navy-2)" border="none" />
                  <Swatch bg="#1E2D4A" label="Navy-3 (ativo)" token="var(--navy-3)" border="none" />
                </div>
              </div>
              <div>
                <Label>Status (sempre trio: cor + fundo + borda)</Label>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "var(--r-md)", background: "#F0FDF4", border: "1px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 style={{ color: "#22C55E", width: 22, height: 22 }} />
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "var(--text-1)" }}>Verde</p>
                    <p style={{ fontSize: 10, margin: 0, color: "var(--text-3)", fontFamily: "monospace" }}>--green / --green-bg / --green-bd</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "var(--r-md)", background: "#FEFCE8", border: "1px solid #FDE047", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertTriangle style={{ color: "#EAB308", width: 22, height: 22 }} />
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "var(--text-1)" }}>Amarelo</p>
                    <p style={{ fontSize: 10, margin: 0, color: "var(--text-3)", fontFamily: "monospace" }}>--yellow / --yellow-bg / --yellow-bd</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "var(--r-md)", background: "#FFF1F2", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertCircle style={{ color: "#EF4444", width: 22, height: 22 }} />
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "var(--text-1)" }}>Vermelho</p>
                    <p style={{ fontSize: 10, margin: 0, color: "var(--text-3)", fontFamily: "monospace" }}>--red / --red-bg / --red-bd</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "var(--r-md)", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Info style={{ color: "#3B82F6", width: 22, height: 22 }} />
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "var(--text-1)" }}>Azul/Info</p>
                    <p style={{ fontSize: 10, margin: 0, color: "var(--text-3)", fontFamily: "monospace" }}>--blue / --blue-bg / --blue-bd</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TIPOGRAFIA ── */}
          {activeTab === "tipografia" && (
            <>
              <div>
                <Label>Hierarquia de Texto</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20, background: "var(--surface)", borderRadius: "var(--r-lg)", border: "1px solid var(--border)" }}>
                  <div>
                    <h1 className="text-heading">Título de Página (text-heading)</h1>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>Syne 22px / 700 / letterSpacing -0.02em / .text-heading</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Título de Seção/Card</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>Inter 15px / 600</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: "var(--text-1)", margin: 0 }}>Texto de corpo padrão</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>Inter 14px / 400</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>Texto secundário / descrições</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>Inter 13px / var(--text-2)</p>
                  </div>
                  <div>
                    <p className="text-label">Label Uppercase (text-label)</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>Inter 11px / 600 / uppercase / .text-label</p>
                  </div>
                  <div>
                    <p className="text-stat">2.481</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>Syne 28px / 700 / .text-stat (métricas/KPIs)</p>
                  </div>
                  <div>
                    <p className="text-muted">Texto desabilitado / muted</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace", marginTop: 2 }}>Inter / var(--text-3) / .text-muted</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── BOTÕES ── */}
          {activeTab === "botoes" && (
            <>
              <div>
                <Label>Variantes de Botão</Label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn btn-primary"><Zap style={{ width: 14, height: 14 }} /> Primário</button>
                  <button className="btn btn-secondary"><Settings style={{ width: 14, height: 14 }} /> Secundário</button>
                  <button className="btn btn-danger"><AlertCircle style={{ width: 14, height: 14 }} /> Perigo</button>
                  <button className="btn btn-ghost">Ghost</button>
                </div>
              </div>
              <div>
                <Label>Código Obrigatório</Label>
                <pre style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, fontSize: 12, color: "var(--text-1)", overflowX: "auto", margin: 0 }}>
{`<button className="btn btn-primary">Ação Principal</button>
<button className="btn btn-secondary">Cancelar</button>
<button className="btn btn-danger">Excluir</button>
<button className="btn btn-ghost">Ver mais</button>`}
                </pre>
              </div>
              <div style={{ padding: "12px 16px", background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: "var(--r-md)" }}>
                <p style={{ fontSize: 13, color: "#991b1b", margin: 0 }}>
                  <strong>❌ Nunca use:</strong> bg-purple-600, bg-green-500, bg-emerald-*, bg-violet-*, ou qualquer cor fora do sistema.
                </p>
              </div>
            </>
          )}

          {/* ── BADGES ── */}
          {activeTab === "badges" && (
            <>
              <div>
                <Label>Todas as Variantes</Label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-green">Ativo</span>
                  <span className="badge badge-red">Expirado</span>
                  <span className="badge badge-yellow">Pendente</span>
                  <span className="badge badge-blue">Info</span>
                  <span className="badge badge-neutral">Neutro</span>
                </div>
              </div>
              <div>
                <Label>Código Obrigatório</Label>
                <pre style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, fontSize: 12, color: "var(--text-1)", overflowX: "auto", margin: 0 }}>
{`<span className="badge badge-green">Ativo</span>
<span className="badge badge-red">Erro</span>
<span className="badge badge-yellow">Aviso</span>
<span className="badge badge-blue">Info</span>
<span className="badge badge-neutral">Neutro</span>`}
                </pre>
              </div>
            </>
          )}

          {/* ── CARDS ── */}
          {activeTab === "cards" && (
            <>
              <div>
                <Label>Card Padrão (app-card)</Label>
                <div className="app-card" style={{ padding: 20, maxWidth: 360 }}>
                  <p style={{ fontSize: 14, color: "var(--text-1)", margin: 0 }}>Conteúdo do card padrão</p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>Descrição secundária do card</p>
                </div>
              </div>
              <div>
                <Label>Card com Hover (card [data-hover])</Label>
                <div className="card" data-hover style={{ padding: 20, maxWidth: 360 }}>
                  <p style={{ fontSize: 14, color: "var(--text-1)", margin: 0 }}>Card interativo com hover</p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6 }}>Eleva com sombra ao passar o mouse</p>
                </div>
              </div>
              <div>
                <Label>Card Selecionado/Ativo</Label>
                <div style={{ padding: 20, maxWidth: 360, background: "var(--accent-light)", border: "1.5px solid var(--accent)", borderRadius: "var(--r-lg)", boxShadow: "0 0 0 3px var(--accent-glow)" }}>
                  <p style={{ fontSize: 14, color: "var(--text-1)", margin: 0 }}>Este card está selecionado</p>
                  <p style={{ fontSize: 13, color: "var(--accent)", marginTop: 6 }}>Borda accent + fundo accent-light</p>
                </div>
              </div>
              <div>
                <Label>Card KPI / Métrica</Label>
                <div className="app-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, maxWidth: 240 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--blue-bg)", border: "1px solid var(--blue-bd)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users style={{ width: 18, height: 18, color: "var(--accent)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", margin: 0, lineHeight: 1 }}>128</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0, marginTop: 2 }}>Total de Clientes</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── ESTADOS ── */}
          {activeTab === "estados" && (
            <>
              <div>
                <Label>Loading (Skeleton)</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
                  <div className="skeleton" style={{ height: 16, width: "60%" }} />
                  <div className="skeleton" style={{ height: 16, width: "80%" }} />
                  <div className="skeleton" style={{ height: 80 }} />
                </div>
              </div>
              <div>
                <Label>Empty State</Label>
                <div style={{ textAlign: "center", padding: "40px 24px", background: "var(--surface)", border: "1px dashed var(--border-2)", borderRadius: "var(--r-lg)", maxWidth: 400 }}>
                  <FileText style={{ width: 36, height: 36, margin: "0 auto 12px", color: "var(--text-3)" }} />
                  <p style={{ fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Nenhum item encontrado</p>
                  <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Crie um novo item para começar</p>
                </div>
              </div>
              <div>
                <Label>Alertas de Feedback</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 500 }}>
                  <div style={{ padding: "10px 14px", background: "var(--green-bg)", border: "1px solid var(--green-bd)", borderRadius: "var(--r-md)", display: "flex", gap: 8, alignItems: "center" }}>
                    <CheckCircle2 style={{ width: 15, height: 15, color: "var(--green)", flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>Operação realizada com sucesso.</p>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--yellow-bg)", border: "1px solid var(--yellow-bd)", borderRadius: "var(--r-md)", display: "flex", gap: 8, alignItems: "center" }}>
                    <AlertTriangle style={{ width: 15, height: 15, color: "var(--yellow)", flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#854d0e", margin: 0 }}>Atenção: verifique os dados antes de continuar.</p>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: "var(--r-md)", display: "flex", gap: 8, alignItems: "center" }}>
                    <AlertCircle style={{ width: 15, height: 15, color: "var(--red)", flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#991b1b", margin: 0 }}>Erro ao processar a solicitação.</p>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--blue-bg)", border: "1px solid var(--blue-bd)", borderRadius: "var(--r-md)", display: "flex", gap: 8, alignItems: "center" }}>
                    <Info style={{ width: 15, height: 15, color: "var(--accent)", flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#1e40af", margin: 0 }}>Informação importante para o usuário.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── PROIBIDO ── */}
          {activeTab === "proibido" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { errado: "bg-purple-600, bg-violet-*, bg-purple-*", certo: "btn btn-primary (azul var(--accent))" },
                { errado: "bg-neutral-900, bg-neutral-800, bg-gray-900", certo: "Não há dark mode — use var(--card) ou var(--surface)" },
                { errado: "text-white em cards/conteúdo", certo: "color: var(--text-1) ou var(--text-2)" },
                { errado: "border-neutral-700, border-neutral-800", certo: "border: 1px solid var(--border)" },
                { errado: "bg-white rounded-xl shadow-md", certo: 'className="app-card"' },
                { errado: "#XXXXXX (cor hardcoded em JSX)", certo: "Tokens CSS: var(--accent), var(--text-1), etc." },
                { errado: "theme='dark' / isDark prop", certo: "Remover — não existe modo escuro na interface interna" },
                { errado: "bg-green-500, bg-emerald-500 em botões", certo: "btn btn-primary (único botão de ação)" },
                { errado: "text-2xl, text-3xl sem font-display", certo: 'style={{ fontFamily: "var(--font-display)", fontSize: 22 }}' },
                { errado: "Gradientes coloridos em headers de cards", certo: "background: var(--card) ou var(--surface)" },
              ].map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: "var(--r-md)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", margin: 0, marginBottom: 4 }}>❌ ERRADO</p>
                    <code style={{ fontSize: 12, color: "#991b1b", fontFamily: "monospace" }}>{item.errado}</code>
                  </div>
                  <div style={{ padding: "10px 14px", background: "var(--green-bg)", border: "1px solid var(--green-bd)", borderRadius: "var(--r-md)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#166534", margin: 0, marginBottom: 4 }}>✅ CERTO</p>
                    <code style={{ fontSize: 12, color: "#166534", fontFamily: "monospace" }}>{item.certo}</code>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}