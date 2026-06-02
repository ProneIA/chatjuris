import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Info,
  ChevronDown, ChevronRight, ArrowLeft, FileText,
  Lock, Database, Users, Globe, Eye, Settings,
  AlertCircle, Clock, TrendingUp, Zap, Award,
  Building, Scale, Key, Server, RefreshCw, Download
} from "lucide-react";

const SCORE = 58;

const riskColor = (level) => {
  if (level === "CRÍTICO") return "badge-error";
  if (level === "ALTO") return "badge-warning";
  if (level === "MÉDIO") return "badge-warning";
  if (level === "BAIXO") return "badge-success";
  return "badge-neutral";
};

const statusIcon = (status) => {
  if (status === "OK") return <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--success)' }} />;
  if (status === "PARCIAL") return <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--warn)' }} />;
  if (status === "FALHA") return <XCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--danger)' }} />;
  return <Info className="w-4 h-4 shrink-0" style={{ color: 'var(--info)' }} />;
};

const Section = ({ id, icon: Icon, title, color, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: 'var(--main-bg)', cursor: 'pointer', border: 'none', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        {open ? <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>{children}</div>}
    </div>
  );
};

const CheckItem = ({ status, label, detail }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }} className="last:border-0">
    {statusIcon(status)}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</p>
      {detail && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{detail}</p>}
    </div>
    <span className={`badge ${riskColor(status === "FALHA" ? "CRÍTICO" : status === "PARCIAL" ? "MÉDIO" : "BAIXO")}`}>
      {status}
    </span>
  </div>
);

const RiskItem = ({ level, title, detail, impact }) => {
  const style = level === "CRÍTICO"
    ? { background: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: '#B91C1C' }
    : level === "ALTO"
    ? { background: 'var(--warn-bg)', borderColor: 'var(--warn-border)', color: '#7a6010' }
    : level === "MÉDIO"
    ? { background: 'var(--warn-bg)', borderColor: 'var(--warn-border)', color: '#7a6010' }
    : { background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: '#166534' };
  return (
    <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid', marginBottom: 12, ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 13 }}>{title}</p>
          <p style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{detail}</p>
          {impact && <p style={{ fontSize: 11, marginTop: 4, fontWeight: 500, opacity: 0.9 }}>⚠ Impacto: {impact}</p>}
        </div>
        <span className={`badge ${riskColor(level)}`}>{level}</span>
      </div>
    </div>
  );
};

const ActionItem = ({ priority, title, detail, deadline }) => {
  const borderColor = priority === 1 ? 'var(--danger)' : priority === 2 ? 'var(--warn)' : 'var(--info)';
  const bg = priority === 1 ? 'var(--danger-bg)' : priority === 2 ? 'var(--warn-bg)' : 'var(--info-bg)';
  return (
    <div style={{ borderLeft: `4px solid ${borderColor}`, padding: 16, borderRadius: '0 var(--radius-md) var(--radius-md) 0', marginBottom: 12, background: bg }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.6, color: 'var(--text-primary)' }}>Prioridade {priority}</span>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{title}</p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{detail}</p>
        </div>
        {deadline && (
          <span style={{ fontSize: 11, background: 'var(--main-bg)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock className="w-3 h-3" />{deadline}
          </span>
        )}
      </div>
    </div>
  );
};

export default function LGPDAudit() {
  const scoreColor = SCORE >= 70 ? 'var(--success)' : SCORE >= 50 ? 'var(--warn)' : 'var(--danger)';
  const scoreLabel = SCORE >= 70 ? "Intermediário-Avançado" : SCORE >= 50 ? "Intermediário" : "Inicial-Intermediário";
  const scoreGradientClass = SCORE >= 70 ? "from-green-500 to-emerald-400" : SCORE >= 50 ? "from-yellow-500 to-orange-400" : "from-red-500 to-orange-500";

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4 }}>
              <Link to={createPageUrl("Dashboard")} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Link>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              Auditoria LGPD — Juris SaaS Jurídico
            </h1>
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
              Lei nº 13.709/2018 · Relatório gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 'var(--radius-md)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--warn)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#7a6010' }}>Auditoria Interna</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-1 card flex flex-col items-center justify-center text-center">
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>Score LGPD</p>
            <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor }}>{SCORE}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>/ 100</div>
            <div style={{ width: '100%', marginTop: 16, height: 8, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
              <div className={`h-full rounded-full bg-gradient-to-r ${scoreGradientClass}`} style={{ width: `${SCORE}%` }} />
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, marginTop: 8, color: scoreColor }}>{scoreLabel}</p>
          </div>
          <div className="md:col-span-3 card">
            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <FileText className="w-5 h-5" style={{ color: 'var(--info)' }} /> Sumário Executivo
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12 }}>
              O <strong>Juris</strong> é uma plataforma SaaS jurídica multi-tenant que trata categorias diversas de dados pessoais — incluindo <strong>dados potencialmente sensíveis</strong> de clientes e partes processuais — com relevante risco de violação ao sigilo profissional da advocacia (Estatuto da OAB, Lei 8.906/94).
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12 }}>
              A auditoria identificou <strong>avanços significativos</strong>: política de privacidade publicada, termos de uso presentes, modal de consentimento LGPD implementado, trilha de auditoria (AuditLog) funcional, sistema de exclusão de dados do titular (Art. 18º, VI) e portabilidade (Art. 18º, V) operacionais.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              Por outro lado, foram detectadas <strong>vulnerabilidades críticas</strong>: CPF/CNPJ criptografado apenas com Base64 (sem criptografia real), ausência de MFA/2FA, ROPA não formalizado, ausência de Plano de Resposta a Incidentes documentado, transmissão de dados não anonimizados à OpenAI sem DPA explícito.
            </p>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: "Itens Conformes", value: "22", bg: 'var(--success-bg)', color: 'var(--success)' },
                { label: "Parcialmente Conformes", value: "15", bg: 'var(--warn-bg)', color: 'var(--warn)' },
                { label: "Não Conformes", value: "11", bg: 'var(--danger-bg)', color: 'var(--danger)' },
              ].map((s, i) => (
                <div key={i} style={{ borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center', background: s.bg }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, marginTop: 2, color: s.color }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 1. Mapeamento de Dados */}
        <Section id="mapeamento" icon={Database} title="1. Mapeamento de Dados (Data Map)" color="bg-[var(--info-bg)] text-[var(--info)]" defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pontos de Coleta Identificados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)', fontWeight: 600 }}>Origem / Ponto de Coleta</th>
                      <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)', fontWeight: 600 }}>Dado Coletado</th>
                      <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)', fontWeight: 600 }}>Classificação</th>
                      <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)', fontWeight: 600 }}>Armazenamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Cadastro / Login (OAuth)", "Nome, e-mail, foto de perfil", "Pessoal — Identificação", "Base44 DB / Auth"],
                      ["Cadastro de Cliente (Client entity)", "Nome, CPF/CNPJ, e-mail, telefone, endereço", "Pessoal + Financeiro", "Base44 DB"],
                      ["Processo Judicial (Case entity)", "Nº processo, partes, tribunal, valor, estratégia", "Processual + Sigiloso", "Base44 DB"],
                      ["Documentos (LegalDocument)", "Petições, contratos, pareceres, arquivos PDF/DOCX", "Processual + Sensível", "Base44 Storage + DB"],
                      ["Conversas com IA (Conversation)", "Prompts, histórico, estratégias jurídicas", "Sigiloso / Estratégico", "Base44 DB + OpenAI API"],
                      ["Honorários / Despesas (ClientPayment, Despesa)", "Valores, datas, formas de pagamento", "Financeiro", "Base44 DB"],
                      ["Calendário / Eventos (CalendarEvent)", "Datas, locais, participantes, processo relacionado", "Pessoal + Processual", "Base44 DB"],
                      ["Portal do Cliente (ClientPortalAccess)", "Token de acesso, histórico de visualização", "Pessoal + Acesso", "Base44 DB"],
                      ["Afiliados (Affiliate)", "Nome, CPF/dados bancários para comissão", "Pessoal + Financeiro", "Base44 DB"],
                      ["Logs de Auditoria (AuditLog)", "E-mail, IP, ação, timestamp", "Pessoal + Comportamental", "Base44 DB"],
                      ["Pagamentos (HotmartTransaction, MP)", "Dados de pagamento, plano, valor", "Financeiro", "Hotmart / MercadoPago / Cakto"],
                      ["Monitoramento de Diário (DiaryMonitoring)", "Nomes de partes, nº de processos para monitorar", "Processual", "Base44 DB + API Externa"],
                    ].map(([origem, dado, classif, armazen], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'var(--main-bg)' : 'var(--surface)' }}>
                        <td style={{ padding: 8, border: '1px solid var(--border)' }}>{origem}</td>
                        <td style={{ padding: 8, border: '1px solid var(--border)' }}>{dado}</td>
                        <td style={{ padding: 8, border: '1px solid var(--border)' }}>
                          <span className={`badge ${
                            classif.includes("Sensível") || classif.includes("Sigiloso") ? "badge-error" :
                            classif.includes("Processual") ? "badge-neutral" :
                            classif.includes("Financeiro") ? "badge-warning" :
                            "badge-info"
                          }`}>{classif}</span>
                        </td>
                        <td style={{ padding: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{armazen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fluxo de Dados</h3>
              <div style={{ background: 'var(--main-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span className="badge badge-info">Advogado (Usuário)</span>
                  <span>→ insere dados →</span>
                  <span className="badge badge-neutral">Base44 Frontend (React)</span>
                  <span>→ API calls →</span>
                  <span className="badge badge-neutral">Base44 Backend (DB + Functions)</span>
                  <span>→ processamento →</span>
                  <span className="badge badge-neutral">OpenAI API (EUA) 🌍</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span className="badge badge-info">Advogado (Usuário)</span>
                  <span>→ pagamento →</span>
                  <span className="badge badge-warning">Hotmart / MercadoPago / Cakto</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-success">Cliente Final (Parte)</span>
                  <span>→ seus dados inseridos pelo advogado →</span>
                  <span className="badge badge-neutral">Base44 DB (sem ciência direta)</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠ Sem consentimento próprio</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. Bases Legais */}
        <Section id="bases" icon={Scale} title="2. Bases Legais (Art. 7º e 11 LGPD)" color="bg-[var(--surface)] text-[var(--text-primary)]">
          <div className="space-y-4">
            <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 13, color: '#7a6010' }}>
              <strong>⚠ Atenção:</strong> A plataforma trata dados de <strong>terceiros (partes processuais)</strong> que nunca deram consentimento diretamente ao Juris. A base legal deve ser <strong>execução de contrato</strong> ou <strong>legítimo interesse</strong> do advogado.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>Operação de Tratamento</th>
                    <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>Base Legal Declarada</th>
                    <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>Base Legal Adequada</th>
                    <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Cadastro e autenticação do advogado", "Consentimento", "Execução de contrato (Art. 7º, V)", "PARCIAL"],
                    ["Gestão de processos e clientes", "Consentimento", "Execução de contrato + Legítimo Interesse (Art. 7º, V e IX)", "PARCIAL"],
                    ["Dados de partes processuais (3ºs)", "Não mapeado", "Exercício regular de direitos (Art. 7º, VI) + Legítimo Interesse", "FALHA"],
                    ["Envio de dados à OpenAI para IA", "Não declarado", "Legítimo interesse + cláusula contratual + DPA obrigatório", "FALHA"],
                    ["Processamento de pagamentos", "Execução de contrato", "Execução de contrato (Art. 7º, V)", "OK"],
                    ["Logs e trilhas de auditoria", "Não declarado", "Cumprimento de obrigação legal (Art. 7º, II) + Legítimo Interesse", "PARCIAL"],
                    ["Cookies e localStorage", "Consentimento implícito", "Consentimento expresso para não-essenciais (Art. 7º, I)", "PARCIAL"],
                  ].map(([op, declarada, adequada, status], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--main-bg)' : 'var(--surface)' }}>
                      <td style={{ padding: 8, border: '1px solid var(--border)', fontWeight: 500 }}>{op}</td>
                      <td style={{ padding: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{declarada}</td>
                      <td style={{ padding: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{adequada}</td>
                      <td style={{ padding: 8, border: '1px solid var(--border)' }}>{statusIcon(status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 13 }} className="text-[var(--info)]">
              <strong>💡 Recomendação estratégica:</strong> Incluir nos Termos de Uso cláusula explícita sobre o papel do advogado como <strong>Controlador</strong> e o Juris como <strong>Operador</strong> (Art. 5º, VI e VII LGPD).
            </div>
          </div>
        </Section>

        {/* 3. Documentação e Governança */}
        <Section id="governanca" icon={FileText} title="3. Documentação e Governança" color="bg-[var(--surface)] text-[var(--text-primary)]">
          <div className="space-y-3">
            <CheckItem status="OK" label="Política de Privacidade publicada" detail="Disponível em /PrivacyPolicy — cobre Art. 18º, dados coletados, finalidades e DPO." />
            <CheckItem status="OK" label="Termos de Uso publicados" detail="Disponível em /TermsOfService. Falta cláusula de DPA Controlador/Operador." />
            <CheckItem status="OK" label="Modal de Consentimento LGPD (UserConsent)" detail="Implementado no Layout com registro em banco de dados. Funcional." />
            <CheckItem status="OK" label="Encarregado de Dados (DPO) identificado" detail="E-mail dpo@juris.app declarado na PP. Necessita nomeação formal documentada." />
            <CheckItem status="FALHA" label="ROPA — Registro de Operações de Tratamento" detail="Não identificado nenhum documento formal (exigido pelo art. 37 LGPD)." />
            <CheckItem status="FALHA" label="RIPD — Relatório de Impacto à Proteção de Dados" detail="Plataforma trata dados em larga escala com perfil de risco elevado (art. 38 LGPD)." />
            <CheckItem status="FALHA" label="Plano de Resposta a Incidentes (PRI)" detail="Não identificado. A LGPD exige comunicação à ANPD e titulares em até 72h (art. 48)." />
            <CheckItem status="FALHA" label="DPA com terceiros (OpenAI, Hotmart, MercadoPago, Cakto)" detail="Não há evidência de contratos de proteção de dados com operadores terceiros." />
          </div>
        </Section>

        {/* 4. Segurança da Informação */}
        <Section id="seguranca" icon={Lock} title="4. Segurança da Informação" color="bg-[var(--danger-bg)] text-[var(--danger)]">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: 13 }}>Controles Técnicos</h3>
                <CheckItem status="PARCIAL" label="Criptografia em trânsito (HTTPS/TLS)" detail="Assumida via Base44/Deno deploy. Verificar certificado e HSTS." />
                <CheckItem status="FALHA" label="Criptografia em repouso — CPF/CNPJ" detail="CRÍTICO: encryptCPF usa apenas Base64. Usar AES-256-GCM." />
                <CheckItem status="FALHA" label="MFA / 2FA para usuários" detail="Não implementado. Para plataforma com dados sigilosos de advocacia, MFA é essencial." />
                <CheckItem status="OK" label="RBAC — Controle de Acesso por Role" detail="Implementado: roles admin/user. RLS nas entidades por created_by/user_id." />
                <CheckItem status="OK" label="Trilha de Auditoria (AuditLog)" detail="Entidade AuditLog funcional com user_email, action, entity_type, IP." />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: 13 }}>Gestão e Processos</h3>
                <CheckItem status="FALHA" label="Criptografia em repouso — CPF/CNPJ" detail="CRÍTICO: encryptCPF usa apenas Base64. Usar AES-256-GCM." />
                <CheckItem status="FALHA" label="Proteção contra enumeração de IDs" detail="IDs potencialmente previsíveis — risco de scraping entre tenants." />
                <CheckItem status="PARCIAL" label="Segredos (Secrets) gerenciados" detail="API keys via Secrets do Base44. Verificar rotação periódica." />
                <CheckItem status="FALHA" label="Headers de segurança HTTP" detail="CSP, X-Frame-Options, HSTS — validar no servidor." />
              </div>
            </div>
            <RiskItem level="CRÍTICO" title="CPF/CNPJ protegido apenas com Base64" detail="A função encryptCPF.js usa btoa() — codificação simples, facilmente reversível. Não atende ao art. 46 LGPD." impact="Multa ANPD + responsabilidade civil" />
            <RiskItem level="CRÍTICO" title="Ausência de MFA em plataforma com dados sigilosos" detail="Uma senha comprometida expõe todos os dados do escritório." impact="Violação de sigilo profissional + LGPD art. 46" />
            <RiskItem level="ALTO" title="Risco de enumeração de IDs / Cross-tenant scraping" detail="Se IDs forem previsíveis, usuário malicioso pode tentar acessar dados de outros tenants." impact="Vazamento entre tenants + violação grave LGPD" />
          </div>
        </Section>

        {/* 5. Direitos dos Titulares */}
        <Section id="direitos" icon={Users} title="5. Direitos dos Titulares (Art. 18 LGPD)" color="bg-[var(--success-bg)] text-[var(--success)]">
          <div className="space-y-3">
            <CheckItem status="OK" label="Acesso aos dados (Art. 18, I-II)" detail="Página /MyData implementada. Função exportUserData.js retorna todos os dados do usuário em JSON." />
            <CheckItem status="PARCIAL" label="Correção de dados (Art. 18, III)" detail="Usuário pode editar perfil em /Settings. Sem canal formal para 'solicitação de correção'." />
            <CheckItem status="OK" label="Portabilidade (Art. 18, V)" detail="exportUserData.js implementado com referência ao Art. 18º inciso II LGPD." />
            <CheckItem status="FALHA" label="Canal formal de exercício de direitos" detail="Apenas e-mail mencionado. Recomendado: formulário estruturado com SLA de 15 dias." />
            <CheckItem status="PARCIAL" label="Titular = parte processual (3º sem conta)" detail="Pessoas cujos dados foram cadastrados por advogados não têm como exercer seus direitos." />
          </div>
        </Section>

        {/* 6. Terceiros */}
        <Section id="terceiros" icon={Globe} title="6. Terceiros, Integrações e Transferência Internacional" color="bg-[var(--surface)] text-[var(--text-primary)]">
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>Terceiro</th>
                  <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>Dados Compartilhados</th>
                  <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>País</th>
                  <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>DPA?</th>
                  <th style={{ textAlign: 'left', padding: 8, border: '1px solid var(--border)' }}>Risco</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["OpenAI (GPT)", "Prompts com dados processuais, estratégias, nomes", "EUA 🇺🇸", "Não verificado", "CRÍTICO"],
                  ["Base44 (infra)", "Todos os dados — BD, auth, storage, functions", "EUA/Cloud 🌍", "Contrato de uso", "MÉDIO"],
                  ["Hotmart", "Nome, e-mail, dados de pagamento, plano", "EUA/BR 🇧🇷", "Não verificado", "MÉDIO"],
                  ["MercadoPago", "Dados de pagamento, CPF (potencial)", "AR/BR 🇧🇷", "Não verificado", "MÉDIO"],
                  ["Stripe", "Dados de pagamento (secrets configurados)", "EUA 🇺🇸", "Stripe DPA disponível", "MÉDIO"],
                  ["Google OAuth (login)", "Nome, e-mail, foto de perfil", "EUA 🇺🇸", "Google TOS/DPA", "BAIXO"],
                ].map(([terceiro, dados, pais, dpa, risco], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--main-bg)' : 'var(--surface)' }}>
                    <td style={{ padding: 8, border: '1px solid var(--border)', fontWeight: 600 }}>{terceiro}</td>
                    <td style={{ padding: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{dados}</td>
                    <td style={{ padding: 8, border: '1px solid var(--border)' }}>{pais}</td>
                    <td style={{ padding: 8, border: '1px solid var(--border)' }}>{dpa}</td>
                    <td style={{ padding: 8, border: '1px solid var(--border)' }}>
                      <span className={`badge ${riskColor(risco)}`}>{risco}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 13, color: '#B91C1C' }}>
            <strong>⚠ Transferência Internacional — Art. 33 LGPD:</strong> Dados enviados à OpenAI (EUA) configuram transferência internacional. É necessário garantir nível adequado de proteção.
          </div>
        </Section>

        {/* 7. Plano de Ação */}
        <Section id="plano" icon={TrendingUp} title="7. Plano de Ação Priorizado" color="bg-[var(--warn-bg)] text-[var(--warn)]">
          <div className="space-y-1">
            <div style={{ marginBottom: 12, padding: 12, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontWeight: 700, color: '#B91C1C', fontSize: 13, marginBottom: 4 }}>🚨 AÇÃO IMEDIATA (0–30 dias)</h3>
            </div>
            <ActionItem priority={1} title="Corrigir criptografia de CPF/CNPJ" detail="Substituir Base64 por AES-256-GCM com chave derivada (HKDF/PBKDF2) via Web Crypto API." deadline="0–15 dias" />
            <ActionItem priority={1} title="Implementar anonimização de PII antes da OpenAI" detail="Criar filtro que substitui CPFs, nomes, nºs de processo por tokens antes de enviar prompts." deadline="0–20 dias" />
            <ActionItem priority={1} title="Criar Plano de Resposta a Incidentes (PRI)" detail="Documento com: identificação, contenção, notificação ANPD (72h), comunicação a titulares." deadline="0–30 dias" />

            <div style={{ marginBottom: 12, marginTop: 16, padding: 12, background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontWeight: 700, color: '#7a6010', fontSize: 13, marginBottom: 4 }}>⚡ CURTO PRAZO (30–90 dias)</h3>
            </div>
            <ActionItem priority={2} title="Elaborar ROPA (Registro de Operações de Tratamento)" detail="Documento por operação: dados tratados, finalidade, base legal, terceiros, retenção." deadline="30–60 dias" />
            <ActionItem priority={2} title="Implementar MFA/2FA" detail="Autenticação de dois fatores para login na plataforma." deadline="45–90 dias" />
            <ActionItem priority={2} title="Assinar DPAs com OpenAI, Hotmart, MercadoPago" detail="Exigir e assinar Data Processing Agreements com todos os operadores." deadline="30–60 dias" />

            <div style={{ marginBottom: 12, marginTop: 16, padding: 12, background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }} className="text-[var(--info)]">📅 MÉDIO PRAZO (90–180 dias)</h3>
            </div>
            <ActionItem priority={3} title="Implementar canal formal de exercício de direitos" detail="Formulário estruturado em /MyData com protocolo, confirmação automática e SLA de 15 dias." deadline="90–120 dias" />
            <ActionItem priority={3} title="Realizar Pentest e revisão de segurança" detail="Contratar empresa especializada para teste de penetração focado em isolamento multi-tenant." deadline="120–180 dias" />
          </div>
        </Section>

        {/* Footer */}
        <div className="card text-center">
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Este relatório é uma auditoria interna baseada na análise do código-fonte da plataforma Juris. Não substitui consultoria jurídica especializada em LGPD.
            <br />Referências: LGPD (Lei 13.709/2018) · ANPD · Estatuto da OAB (Lei 8.906/94) · Código de Ética OAB · GDPR (comparativo)
          </p>
        </div>
      </div>
    </div>
  );
}