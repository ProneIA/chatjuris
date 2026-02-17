import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Play, RefreshCw, AlertTriangle, CheckCircle2, XCircle,
  Info, Clock, Database, Lock, Zap, Scale, DollarSign, Activity,
  ChevronDown, ChevronUp, History, BarChart2, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  CRITICAL: { color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500", label: "CRÍTICO" },
  HIGH:     { color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500", label: "ALTO" },
  MEDIUM:   { color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500", label: "MÉDIO" },
  LOW:      { color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-400", label: "BAIXO" },
};

const STATUS_CONFIG = {
  OK:         { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "OK" },
  ERROR:      { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50",     label: "ERRO" },
  RISK:       { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50",  label: "RISCO" },
  WARNING:    { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50",  label: "ATENÇÃO" },
  SLOW:       { icon: Clock,        color: "text-orange-500",  bg: "bg-orange-50",  label: "LENTO" },
  ATTENTION:  { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50",  label: "ATENÇÃO" },
  SAFE:       { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "SEGURO" },
  COMPLIANT:  { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "CONFORME" },
  ISSUE:      { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50",     label: "PROBLEMA" },
};

function StatusBadge({ value }) {
  if (!value) return <span className="text-gray-400 text-xs">—</span>;
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.OK;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ScoreMeter({ score, isDark }) {
  const color = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 52;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke={isDark ? "#262626" : "#e2e8f0"} strokeWidth="10" />
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
          <span className={`text-3xl font-bold`} style={{ color }}>{score}</span>
          <span className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>/100</span>
        </div>
      </div>
      <span className={`text-sm font-medium ${score >= 85 ? "text-emerald-500" : score >= 65 ? "text-amber-500" : "text-red-500"}`}>
        {score >= 85 ? "Sistema Saudável" : score >= 65 ? "Atenção Requerida" : "Problemas Críticos"}
      </span>
    </div>
  );
}

function IssueItem({ issue, isDark }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[issue.level] || SEVERITY_CONFIG.LOW;

  return (
    <div
      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
        isDark ? "bg-neutral-900 border-neutral-800 hover:border-neutral-700" : "bg-white border-slate-100 hover:border-slate-200"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}>{issue.title}</p>
          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>{issue.category}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-3 border-t text-sm ${isDark ? "border-neutral-800 text-neutral-400" : "border-slate-100 text-slate-600"}`}>
              <p className="mt-2">{issue.detail}</p>
              {issue.ts && (
                <p className={`text-xs mt-2 ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
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

export default function SystemAudit({ theme = "light" }) {
  const isDark = theme === "dark";
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [filterLevel, setFilterLevel] = useState("ALL");

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => setAuthChecked(true));
  }, []);

  const { data: auditHistory = [], isLoading: loadingHistory } = useQuery({
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

  // ─── Guards ──────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-950" : "bg-gray-50"}`}>
        <Lock className="w-10 h-10 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-xs mx-auto p-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-500 text-sm">Módulo exclusivo para administradores.</p>
        </div>
      </div>
    );
  }

  const report = lastResult?.report;
  const issues = lastResult?.issues || [];
  const filteredIssues = filterLevel === "ALL" ? issues : issues.filter(i => i.level === filterLevel);

  const domainSections = [
    { key: "routes_status",    label: "Rotas",           icon: Activity },
    { key: "auth_security",   label: "Auth / Segurança", icon: Lock },
    { key: "database_integrity", label: "Banco de Dados", icon: Database },
    { key: "performance",     label: "Performance",      icon: Zap },
    { key: "security",        label: "Segurança",        icon: Shield },
    { key: "lgpd_compliance", label: "LGPD",             icon: Scale },
  ];

  const lastAudit = auditHistory[0];

  return (
    <div className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-slate-50"}`}>
      {/* Header */}
      <div className={`border-b px-6 py-5 ${isDark ? "bg-black border-neutral-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Auditoria do Sistema
              </h1>
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                Verificação automatizada de integridade, segurança e conformidade LGPD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastAudit && !report && (
              <span className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                Última: {format(new Date(lastAudit.created_date), "dd/MM HH:mm", { locale: ptBR })} — Score {lastAudit.result_score}
              </span>
            )}
            <Button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
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
      <div className={`border-b px-6 py-2 ${isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-violet-50 border-violet-100"}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <p className={`text-xs ${isDark ? "text-neutral-400" : "text-violet-700"}`}>
            A auditoria trabalha apenas com <strong>metadados estruturais, contagens e permissões</strong>. Não acessa conteúdo de processos, documentos jurídicos, textos da IA ou dados pessoais.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Estado inicial sem auditoria */}
        {!report && !runMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`rounded-xl border p-12 text-center ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-slate-200"}`}>
            <Shield className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-neutral-700" : "text-slate-300"}`} />
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Nenhuma auditoria em andamento
            </h2>
            <p className={`text-sm mb-6 ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
              Execute a auditoria manualmente ou aguarde a execução automática semanal.
            </p>
            <Button onClick={() => runMutation.mutate()} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Play className="w-4 h-4" /> Executar Agora
            </Button>
          </motion.div>
        )}

        {/* Loading state */}
        {runMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`rounded-xl border p-10 text-center ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-white border-slate-200"}`}>
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-violet-500 animate-spin" />
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Auditoria em andamento...
            </h2>
            <div className="space-y-1 text-sm text-slate-400 mt-4">
              {["Verificando integridade do banco de dados", "Analisando logs de segurança", "Medindo performance das queries", "Verificando conformidade LGPD", "Auditando integridade financeira"].map((step, i) => (
                <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}
                  className={isDark ? "text-neutral-500" : "text-slate-500"}>
                  ↳ {step}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resultado da auditoria */}
        {report && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Score + domain cards */}
            <div className={`rounded-xl border p-6 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ScoreMeter score={report.overall_system_health} isDark={isDark} />
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                  {domainSections.map(({ key, label, icon: Icon }) => (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? "border-neutral-800 bg-neutral-800/50" : "border-slate-100 bg-slate-50"}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
                      <div>
                        <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>{label}</p>
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
                { level: "CRITICAL", label: "Críticos", count: report.issue_summary?.critical, color: "text-red-600 bg-red-50 border-red-200" },
                { level: "HIGH",     label: "Altos",    count: report.issue_summary?.high,     color: "text-orange-600 bg-orange-50 border-orange-200" },
                { level: "MEDIUM",   label: "Médios",   count: report.issue_summary?.medium,   color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
                { level: "LOW",      label: "Baixos",   count: report.issue_summary?.low,      color: "text-blue-600 bg-blue-50 border-blue-200" },
              ].map(({ level, label, count, color }) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(filterLevel === level ? "ALL" : level)}
                  className={`p-4 rounded-xl border text-center transition-all ${color} ${filterLevel === level ? "ring-2 ring-offset-1 ring-current" : ""}`}
                >
                  <div className="text-2xl font-bold">{count || 0}</div>
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>

            {/* Lista de problemas */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-neutral-800" : "border-slate-100"}`}>
                <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
                  {filteredIssues.length} Problema(s) {filterLevel !== "ALL" ? `[${filterLevel}]` : "encontrado(s)"}
                </h3>
                {filterLevel !== "ALL" && (
                  <button onClick={() => setFilterLevel("ALL")} className="text-xs text-violet-500 hover:underline">
                    Ver todos
                  </button>
                )}
              </div>
              <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                {filteredIssues.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                    <p className={`text-sm ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                      Nenhum problema nesta categoria!
                    </p>
                  </div>
                ) : (
                  filteredIssues.map((issue, i) => (
                    <IssueItem key={i} issue={issue} isDark={isDark} />
                  ))
                )}
              </div>
            </div>

            {/* Detalhes técnicos */}
            {report.details?.performance && (
              <div className={`rounded-xl border p-4 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
                <h3 className={`font-semibold text-sm mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>Performance</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className={isDark ? "text-neutral-400" : "text-slate-600"}>
                    Tempo médio de resposta: <strong>{report.details.performance.avg_response_ms}ms</strong>
                  </span>
                  <span className={isDark ? "text-neutral-400" : "text-slate-600"}>
                    Queries lentas: <strong>{report.details.performance.slow_queries?.length || 0}</strong>
                  </span>
                  {report.details.financial?.summary && (
                    <>
                      <span className={isDark ? "text-neutral-400" : "text-slate-600"}>
                        Total assinaturas: <strong>{report.details.financial.summary.total}</strong>
                      </span>
                      <span className={isDark ? "text-neutral-400" : "text-slate-600"}>
                        Ativas: <strong className="text-emerald-500">{report.details.financial.summary.active}</strong>
                      </span>
                      <span className={isDark ? "text-neutral-400" : "text-slate-600"}>
                        Trial: <strong className="text-blue-500">{report.details.financial.summary.trial}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Histórico */}
        {auditHistory.length > 0 && (
          <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${isDark ? "border-neutral-800" : "border-slate-100"}`}>
              <History className={`w-4 h-4 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
              <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Histórico de Auditorias</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b text-xs ${isDark ? "border-neutral-800 text-neutral-500" : "border-slate-100 text-slate-400"}`}>
                    <th className="text-left px-4 py-2 font-medium">Data</th>
                    <th className="text-left px-4 py-2 font-medium">Score</th>
                    <th className="text-left px-4 py-2 font-medium">DB</th>
                    <th className="text-left px-4 py-2 font-medium">Segurança</th>
                    <th className="text-left px-4 py-2 font-medium">LGPD</th>
                    <th className="text-left px-4 py-2 font-medium">Críticos</th>
                    <th className="text-left px-4 py-2 font-medium">Trigger</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHistory.map(log => (
                    <tr key={log.id} className={`border-b text-sm ${isDark ? "border-neutral-800/50 hover:bg-neutral-800/30" : "border-slate-50 hover:bg-slate-50"}`}>
                      <td className={`px-4 py-2 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                        {format(new Date(log.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`font-bold text-sm ${log.result_score >= 85 ? "text-emerald-500" : log.result_score >= 65 ? "text-amber-500" : "text-red-500"}`}>
                          {log.result_score}
                        </span>
                      </td>
                      <td className="px-4 py-2"><StatusBadge value={log.database_integrity} /></td>
                      <td className="px-4 py-2"><StatusBadge value={log.security} /></td>
                      <td className="px-4 py-2"><StatusBadge value={log.lgpd_compliance} /></td>
                      <td className="px-4 py-2">
                        {log.critical_issues > 0
                          ? <span className="font-bold text-red-500">{log.critical_issues}</span>
                          : <span className="text-emerald-500">0</span>
                        }
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.trigger === "scheduled"
                            ? isDark ? "bg-violet-900/50 text-violet-300" : "bg-violet-100 text-violet-700"
                            : isDark ? "bg-neutral-800 text-neutral-400" : "bg-slate-100 text-slate-500"
                        }`}>
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
        <div className={`rounded-xl border p-4 ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
          <p className={`text-xs text-center ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
            <strong>SYSTEM AUDIT — JURIS</strong> · Acesso exclusivo admin · Dados 100% estruturais e anonimizados ·
            Nenhum dado pessoal, jurídico ou de usuário é acessado · Conforme <strong>LGPD (Lei 13.709/2018)</strong>
          </p>
        </div>
      </div>
    </div>
  );
}