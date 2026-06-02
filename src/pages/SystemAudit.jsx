import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Play, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  Info, Clock, Database, Lock, Zap, Scale, Activity,
  ChevronDown, ChevronUp, History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  CRITICAL: { dotColor: "var(--danger)",  label: "CRÍTICO", badgeClass: "badge-error" },
  HIGH:     { dotColor: "var(--warn)",    label: "ALTO",    badgeClass: "badge-warning" },
  MEDIUM:   { dotColor: "var(--warn)",    label: "MÉDIO",   badgeClass: "badge-warning" },
  LOW:      { dotColor: "var(--info)",    label: "BAIXO",   badgeClass: "badge-info" },
};

const STATUS_CONFIG = {
  OK:         { icon: CheckCircle2, color: "var(--success)", bg: "var(--success-bg)", label: "OK" },
  ERROR:      { icon: XCircle,      color: "var(--danger)",  bg: "var(--danger-bg)",  label: "ERRO" },
  RISK:       { icon: AlertTriangle,color: "var(--warn)",    bg: "var(--warn-bg)",    label: "RISCO" },
  WARNING:    { icon: AlertTriangle,color: "var(--warn)",    bg: "var(--warn-bg)",    label: "ATENÇÃO" },
  SLOW:       { icon: Clock,        color: "var(--warn)",    bg: "var(--warn-bg)",    label: "LENTO" },
  ATTENTION:  { icon: AlertTriangle,color: "var(--warn)",    bg: "var(--warn-bg)",    label: "ATENÇÃO" },
  SAFE:       { icon: CheckCircle2, color: "var(--success)", bg: "var(--success-bg)", label: "SEGURO" },
  COMPLIANT:  { icon: CheckCircle2, color: "var(--success)", bg: "var(--success-bg)", label: "CONFORME" },
  ISSUE:      { icon: XCircle,      color: "var(--danger)",  bg: "var(--danger-bg)",  label: "PROBLEMA" },
};

function StatusBadge({ value }) {
  if (!value) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.OK;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      background: cfg.bg, color: cfg.color
    }}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ScoreMeter({ score }) {
  const color = score >= 85 ? "var(--success)" : score >= 65 ? "var(--warn)" : "var(--danger)";
  const circumference = 2 * Math.PI * 52;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: 28, fontWeight: 700, color }}>{score}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color }}>
        {score >= 85 ? "Sistema Saudável" : score >= 65 ? "Atenção Requerida" : "Problemas Críticos"}
      </span>
    </div>
  );
}

function IssueItem({ issue }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[issue.level] || SEVERITY_CONFIG.LOW;

  return (
    <div
      style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', background: 'var(--main-bg)' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: cfg.dotColor }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{issue.category}</p>
        </div>
        <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
        {expanded ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
              <p>{issue.detail}</p>
              {issue.ts && (
                <p style={{ fontSize: 11, marginTop: 8, color: 'var(--text-muted)' }}>
                  {format(new Date(issue.ts), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SystemAudit() {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [filterLevel, setFilterLevel] = useState("ALL");

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => setAuthChecked(true));
  }, []);

  const { data: auditHistory = [] } = useQuery({
    queryKey: ["system-audit-history"],
    queryFn: () => base44.entities.SystemAuditLog.list("-created_date", 20),
    enabled: !!user && user.role === "admin",
  });

  const runMutation = useMutation({
    mutationFn: () => base44.functions.invoke("systemAudit", { trigger: "manual" }),
    onSuccess: (res) => {
      if (res.data?.success) {
        setLastResult(res.data);
        qc.invalidateQueries({ queryKey: ["system-audit-history"] });
        const score = res.data.report?.overall_system_health;
        if (score >= 85) toast.success(`Auditoria concluída — Score: ${score}/100`);
        else if (score >= 65) toast.warning(`Auditoria concluída — Score: ${score}/100. Verificar problemas.`);
        else toast.error(`Auditoria concluída — Score: ${score}/100. Ação necessária!`);
      }
    },
    onError: () => toast.error("Erro ao executar auditoria"),
  });

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <Lock className="w-10 h-10 animate-pulse" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 280, padding: 32 }}>
          <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--danger)' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Acesso Negado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Módulo exclusivo para administradores.</p>
        </div>
      </div>
    );
  }

  const report = lastResult?.report;
  const issues = lastResult?.issues || [];
  const filteredIssues = filterLevel === "ALL" ? issues : issues.filter(i => i.level === filterLevel);

  const domainSections = [
    { key: "routes_status",      label: "Rotas",            icon: Activity },
    { key: "auth_security",      label: "Auth / Segurança", icon: Lock },
    { key: "database_integrity", label: "Banco de Dados",   icon: Database },
    { key: "performance",        label: "Performance",      icon: Zap },
    { key: "security",           label: "Segurança",        icon: Shield },
    { key: "lgpd_compliance",    label: "LGPD",             icon: Scale },
  ];

  const lastAudit = auditHistory[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', background: 'var(--main-bg)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield className="w-5 h-5" style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Auditoria do Sistema</h1>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Verificação automatizada de integridade, segurança e conformidade LGPD
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastAudit && !report && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Última: {format(new Date(lastAudit.created_date), "dd/MM HH:mm", { locale: ptBR })} — Score {lastAudit.result_score}
              </span>
            )}
            <Button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="btn-primary gap-2"
            >
              {runMutation.isPending
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Auditando...</>
                : <><Play className="w-4 h-4" /> Executar Auditoria</>
              }
            </Button>
          </div>
        </div>
      </div>

      {/* LGPD notice */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 24px', background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Info className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            A auditoria trabalha apenas com <strong>metadados estruturais, contagens e permissões</strong>. Não acessa conteúdo de processos, documentos jurídicos, textos da IA ou dados pessoais.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Estado inicial */}
        {!report && !runMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: 48, textAlign: 'center', background: 'var(--main-bg)' }}>
            <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--border)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Nenhuma auditoria em andamento
            </h2>
            <p style={{ fontSize: 13, marginBottom: 24, color: 'var(--text-secondary)' }}>
              Execute a auditoria manualmente ou aguarde a execução automática semanal.
            </p>
            <Button onClick={() => runMutation.mutate()} className="btn-primary gap-2">
              <Play className="w-4 h-4" /> Executar Agora
            </Button>
          </motion.div>
        )}

        {/* Loading state */}
        {runMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: 40, textAlign: 'center', background: 'var(--main-bg)' }}>
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              Auditoria em andamento...
            </h2>
            <div className="space-y-1 mt-4">
              {["Verificando integridade do banco de dados", "Analisando logs de segurança", "Medindo performance das queries", "Verificando conformidade LGPD"].map((step, i) => (
                <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}
                  style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  ↳ {step}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resultado */}
        {report && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Score + domain cards */}
            <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: 24, background: 'var(--main-bg)' }}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ScoreMeter score={report.overall_system_health} />
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                  {domainSections.map(({ key, label, icon: Icon }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</p>
                        <StatusBadge value={report[key]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumo de issues */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { level: "CRITICAL", label: "Críticos",  count: report.issue_summary?.critical, bg: 'var(--danger-bg)',  color: 'var(--danger)',  border: 'var(--danger-border)' },
                { level: "HIGH",     label: "Altos",     count: report.issue_summary?.high,     bg: 'var(--warn-bg)',    color: 'var(--warn)',    border: 'var(--warn-border)' },
                { level: "MEDIUM",   label: "Médios",    count: report.issue_summary?.medium,   bg: 'var(--warn-bg)',    color: '#7a6010',       border: 'var(--warn-border)' },
                { level: "LOW",      label: "Baixos",    count: report.issue_summary?.low,      bg: 'var(--info-bg)',    color: 'var(--info)',    border: 'var(--info-border)' },
              ].map(({ level, label, count, bg, color, border }) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(filterLevel === level ? "ALL" : level)}
                  style={{
                    padding: 16, borderRadius: 'var(--radius-md)',
                    border: `1px solid ${border}`, textAlign: 'center',
                    background: bg, cursor: 'pointer',
                    outline: filterLevel === level ? `2px solid ${color}` : 'none',
                    outlineOffset: 2,
                    transition: 'all var(--transition)'
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color }}>{count || 0}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color }}>{label}</div>
                </button>
              ))}
            </div>

            {/* Lista de problemas */}
            <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--main-bg)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                  {filteredIssues.length} Problema(s) {filterLevel !== "ALL" ? `[${filterLevel}]` : "encontrado(s)"}
                </h3>
                {filterLevel !== "ALL" && (
                  <button onClick={() => setFilterLevel("ALL")} style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>
                    Ver todos
                  </button>
                )}
              </div>
              <div style={{ padding: 16, maxHeight: 500, overflowY: 'auto' }} className="space-y-2">
                {filteredIssues.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--success)' }} />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum problema nesta categoria!</p>
                  </div>
                ) : (
                  filteredIssues.map((issue, i) => (
                    <IssueItem key={i} issue={issue} />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Histórico */}
        {auditHistory.length > 0 && (
          <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--main-bg)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <h3 style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Histórico de Auditorias</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {["Data", "Score", "DB", "Segurança", "LGPD", "Críticos", "Trigger"].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 16px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '8px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {format(new Date(log.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: log.result_score >= 85 ? 'var(--success)' : log.result_score >= 65 ? 'var(--warn)' : 'var(--danger)' }}>
                          {log.result_score}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}><StatusBadge value={log.database_integrity} /></td>
                      <td style={{ padding: '8px 16px' }}><StatusBadge value={log.security} /></td>
                      <td style={{ padding: '8px 16px' }}><StatusBadge value={log.lgpd_compliance} /></td>
                      <td style={{ padding: '8px 16px' }}>
                        {log.critical_issues > 0
                          ? <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{log.critical_issues}</span>
                          : <span style={{ color: 'var(--success)' }}>0</span>
                        }
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className={`badge ${log.trigger === "scheduled" ? "badge-neutral" : "badge-neutral"}`}>
                          {log.trigger === "scheduled" ? "automático" : "manual"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: 16, background: 'var(--surface)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <strong>SYSTEM AUDIT — JURIS</strong> · Acesso exclusivo admin · Dados 100% estruturais e anonimizados ·
            Nenhum dado pessoal, jurídico ou de usuário é acessado · Conforme <strong>LGPD (Lei 13.709/2018)</strong>
          </p>
        </div>
      </div>
    </div>
  );
}