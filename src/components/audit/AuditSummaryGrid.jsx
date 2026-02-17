import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Shield } from "lucide-react";

const STATUS_CONFIG = {
  OK: { label: "OK", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  PARTIAL: { label: "Parcial", color: "text-blue-500", bg: "bg-blue-500/10", icon: AlertTriangle },
  RISK: { label: "Risco", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
  CRITICAL: { label: "Crítico", color: "text-red-600", bg: "bg-red-600/10", icon: XCircle },
  ERROR: { label: "Erro", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
  WARNING: { label: "Atenção", color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle },
  SLOW: { label: "Lento", color: "text-orange-500", bg: "bg-orange-500/10", icon: AlertTriangle },
  ATTENTION: { label: "Atenção", color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle },
  SAFE: { label: "Seguro", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: Shield },
  COMPLIANT: { label: "Conforme", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  ISSUE: { label: "Problema", color: "text-amber-500", bg: "bg-amber-500/10", icon: AlertTriangle },
  VIOLATION: { label: "Violação", color: "text-red-600", bg: "bg-red-600/10", icon: XCircle },
};

const LABELS = {
  routes_status: "Rotas",
  auth_security: "Autenticação",
  database_integrity: "Banco de Dados",
  performance: "Performance",
  security: "Segurança",
  lgpd_compliance: "LGPD",
};

export default function AuditSummaryGrid({ summary, isDark }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Object.entries(summary).map(([key, value]) => {
        const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.OK;
        const Icon = cfg.icon;
        return (
          <div
            key={key}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
              isDark ? "border-neutral-800 bg-neutral-800/50" : "border-slate-100 bg-slate-50"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div>
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>{LABELS[key] || key}</p>
              <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}