import React from "react";
import { XCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SEVERITY_CONFIG = {
  CRITICAL: { color: "text-red-600", bg: "bg-red-50 border-red-200", badgeCls: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
  HIGH: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", badgeCls: "bg-orange-100 text-orange-700 border-orange-300", icon: AlertTriangle },
  MEDIUM: { color: "text-amber-600", bg: "bg-amber-50 border-amber-100", badgeCls: "bg-amber-100 text-amber-700 border-amber-200", icon: Info },
  LOW: { color: "text-blue-600", bg: "bg-blue-50 border-blue-100", badgeCls: "bg-blue-100 text-blue-700 border-blue-200", icon: Info },
};

const SEVERITY_CONFIG_DARK = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-950/30 border-red-900", badgeCls: "bg-red-900/40 text-red-400 border-red-800", icon: XCircle },
  HIGH: { color: "text-orange-400", bg: "bg-orange-950/30 border-orange-900", badgeCls: "bg-orange-900/40 text-orange-400 border-orange-800", icon: AlertTriangle },
  MEDIUM: { color: "text-amber-400", bg: "bg-amber-950/20 border-amber-900", badgeCls: "bg-amber-900/40 text-amber-400 border-amber-800", icon: Info },
  LOW: { color: "text-blue-400", bg: "bg-blue-950/20 border-blue-900", badgeCls: "bg-blue-900/40 text-blue-400 border-blue-800", icon: Info },
};

export default function AuditIssueList({ issues, isDark }) {
  const sorted = [...issues].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });

  return (
    <div className="space-y-2">
      {sorted.map((issue, i) => {
        const configs = isDark ? SEVERITY_CONFIG_DARK : SEVERITY_CONFIG;
        const cfg = configs[issue.severity] || configs.LOW;
        const Icon = cfg.icon;

        return (
          <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${cfg.bg}`}>
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${cfg.color} font-medium`}>{issue.message}</p>
              {(issue.entity || issue.area || issue.field) && (
                <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                  {[issue.entity, issue.area, issue.field && `campo: ${issue.field}`].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <Badge variant="outline" className={`shrink-0 text-xs ${cfg.badgeCls}`}>
              {issue.severity}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}