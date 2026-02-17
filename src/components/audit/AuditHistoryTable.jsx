import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function ScoreBadge({ score }) {
  const color = score >= 85 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const Icon = score >= 85 ? CheckCircle2 : score >= 60 ? AlertTriangle : XCircle;
  return (
    <span className={`flex items-center gap-1.5 font-semibold ${color}`}>
      <Icon className="w-4 h-4" />{score}
    </span>
  );
}

export default function AuditHistoryTable({ history, isDark }) {
  if (!history.length) {
    return (
      <div className={`text-center py-12 text-sm ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
        Nenhuma auditoria executada ainda. Clique em "Executar Auditoria" para começar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b text-xs ${isDark ? "border-neutral-800 text-neutral-500" : "border-slate-100 text-slate-500"}`}>
            <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
            <th className="text-left px-4 py-3 font-medium">Score</th>
            <th className="text-left px-4 py-3 font-medium">Críticos</th>
            <th className="text-left px-4 py-3 font-medium">Altos</th>
            <th className="text-left px-4 py-3 font-medium">Banco de Dados</th>
            <th className="text-left px-4 py-3 font-medium">LGPD</th>
            <th className="text-left px-4 py-3 font-medium">Tipo</th>
            <th className="text-left px-4 py-3 font-medium">Executado por</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id} className={`border-b text-sm ${isDark ? "border-neutral-800/50" : "border-slate-50"}`}>
              <td className={`px-4 py-3 ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                {row.created_date ? format(new Date(row.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
              </td>
              <td className="px-4 py-3">
                <ScoreBadge score={row.result_score} />
              </td>
              <td className="px-4 py-3">
                <span className={row.critical_issues > 0 ? "text-red-500 font-semibold" : isDark ? "text-neutral-500" : "text-slate-400"}>
                  {row.critical_issues || 0}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={row.high_issues > 0 ? "text-orange-500 font-semibold" : isDark ? "text-neutral-500" : "text-slate-400"}>
                  {row.high_issues || 0}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={row.database_integrity} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={row.lgpd_compliance} />
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={`text-xs ${row.trigger_type === "scheduled" ? "text-purple-600 border-purple-200" : "text-blue-600 border-blue-200"}`}>
                  {row.trigger_type === "scheduled" ? "Automático" : "Manual"}
                </Badge>
              </td>
              <td className={`px-4 py-3 text-xs font-mono ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                {row.executed_by ? row.executed_by.split("@")[0] + "@…" : "system"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    OK: "bg-emerald-100 text-emerald-700 border-emerald-200",
    COMPLIANT: "bg-emerald-100 text-emerald-700 border-emerald-200",
    SAFE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    WARNING: "bg-amber-100 text-amber-700 border-amber-200",
    ISSUE: "bg-amber-100 text-amber-700 border-amber-200",
    ATTENTION: "bg-amber-100 text-amber-700 border-amber-200",
    ERROR: "bg-red-100 text-red-700 border-red-200",
    RISK: "bg-red-100 text-red-700 border-red-200",
    CRITICAL: "bg-red-100 text-red-700 border-red-200",
    VIOLATION: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status] || ""}`}>{status || "—"}</Badge>
  );
}