import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Lock, RefreshCw, Play, CheckCircle2, AlertTriangle,
  XCircle, Info, Clock, Database, BarChart2, FileText,
  Activity, Eye, ChevronDown, ChevronRight, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AuditIssueList from "@/components/audit/AuditIssueList";
import AuditHealthGauge from "@/components/audit/AuditHealthGauge";
import AuditSummaryGrid from "@/components/audit/AuditSummaryGrid";
import AuditHistoryTable from "@/components/audit/AuditHistoryTable";

export default function SystemAudit({ theme = "light" }) {
  const isDark = theme === "dark";
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [expandedIssues, setExpandedIssues] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => setAuthChecked(true));
  }, []);

  const { data: auditHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ["system-audit-history"],
    queryFn: () => base44.entities.SystemAuditLog.list("-created_date", 20),
    enabled: !!user && user.role === "admin",
  });

  const runAudit = async () => {
    setIsRunning(true);
    setLastReport(null);
    try {
      const res = await base44.functions.invoke("runSystemAudit", { trigger_type: "manual" });
      if (res.data?.error) throw new Error(res.data.error);
      setLastReport(res.data);
      refetchHistory();
    } catch (e) {
      alert(`Erro ao executar auditoria: ${e.message}`);
    }
    setIsRunning(false);
  };

  // ── Bloqueio de acesso ───────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-950" : "bg-gray-50"}`}>
        <Lock className="w-10 h-10 animate-pulse text-gray-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm p-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-500">Módulo exclusivo para administradores do sistema.</p>
        </div>
      </div>
    );
  }

  const report = lastReport;
  const latestHistory = auditHistory[0];

  return (
    <div className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-slate-50"}`}>

      {/* Header */}
      <div className={`border-b px-6 py-5 ${isDark ? "bg-black border-neutral-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Auditoria de Sistema
              </h1>
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                Protocolo automatizado de verificação de integridade · JURIS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {latestHistory && (
              <span className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                Última execução: {format(new Date(latestHistory.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            )}
            <Button
              onClick={runAudit}
              disabled={isRunning}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isRunning ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Auditando...</>
              ) : (
                <><Play className="w-4 h-4" /> Executar Auditoria</>
              )}
            </Button>
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              <Lock className="w-3 h-3 mr-1" />ADMIN ONLY
            </Badge>
          </div>
        </div>
      </div>

      {/* LGPD Notice */}
      <div className={`border-b px-6 py-2.5 ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-amber-50 border-amber-100"}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className={`text-xs ${isDark ? "text-neutral-400" : "text-amber-700"}`}>
            A auditoria verifica apenas <strong>estrutura, permissões e integridade técnica</strong>.
            Nenhum conteúdo de usuário, documento jurídico, texto de IA ou dado pessoal é acessado, exibido ou armazenado.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Running state */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl border p-6 ${isDark ? "bg-indigo-950/30 border-indigo-800" : "bg-indigo-50 border-indigo-200"}`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                </div>
                <div>
                  <p className={`font-semibold ${isDark ? "text-white" : "text-indigo-900"}`}>Auditoria em andamento...</p>
                  <p className={`text-sm mt-1 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                    Verificando estrutura de entidades, integridade referencial, conformidade LGPD e segurança...
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {["Entidades", "Integridade DB", "Conformidade LGPD", "Segurança"].map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-indigo-900/40" : "bg-white"}`}>
                    <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />
                    <span className={isDark ? "text-indigo-300" : "text-indigo-700"}>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resultado */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score + Summary */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className={`md:col-span-1 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
                  <CardContent className="pt-6">
                    <AuditHealthGauge score={report.overall_system_health} isDark={isDark} />
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Tempo de execução</span>
                        <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{report.execution_time_ms}ms</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Entidades auditadas</span>
                        <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{report.entities_audited}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={isDark ? "text-neutral-400" : "text-slate-500"}>Total de problemas</span>
                        <span className={`font-medium ${report.issue_counts?.total > 0 ? "text-amber-500" : isDark ? "text-white" : "text-slate-900"}`}>
                          {report.issue_counts?.total || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`md:col-span-2 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-base ${isDark ? "text-white" : "text-slate-900"}`}>Status por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AuditSummaryGrid summary={report.summary} isDark={isDark} />
                  </CardContent>
                </Card>
              </div>

              {/* Contadores por severidade */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Críticos", count: report.issue_counts?.critical, color: "red", icon: XCircle },
                  { label: "Alta Severidade", count: report.issue_counts?.high, color: "orange", icon: AlertTriangle },
                  { label: "Médios", count: report.issue_counts?.medium, color: "yellow", icon: Info },
                  { label: "Baixos", count: report.issue_counts?.low, color: "blue", icon: Info },
                ].map(({ label, count, color, icon: Icon }) => (
                  <div key={label} className={`p-4 rounded-xl border ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>{label}</span>
                      <Icon className={`w-4 h-4 text-${color}-500`} />
                    </div>
                    <p className={`text-3xl font-semibold ${count > 0 ? `text-${color}-500` : isDark ? "text-white" : "text-slate-900"}`}>
                      {count || 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* Issues List */}
              {report.issues?.length > 0 && (
                <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setExpandedIssues(!expandedIssues)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-base flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Problemas Encontrados ({report.issues.length})
                      </CardTitle>
                      {expandedIssues ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedIssues && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <CardContent className="pt-0">
                          <AuditIssueList issues={report.issues} isDark={isDark} />
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}

              {report.issues?.length === 0 && (
                <div className={`rounded-xl border p-6 text-center ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-emerald-50 border-emerald-100"}`}>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                  <p className={`font-semibold ${isDark ? "text-white" : "text-emerald-900"}`}>Sistema íntegro</p>
                  <p className={`text-sm mt-1 ${isDark ? "text-neutral-500" : "text-emerald-600"}`}>Nenhum problema encontrado nesta auditoria.</p>
                </div>
              )}

              {/* Security checks */}
              {report.security_checks?.length > 0 && (
                <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
                  <CardHeader>
                    <CardTitle className={`text-base flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                      <Shield className="w-4 h-4 text-green-500" />
                      Verificações de Segurança da Plataforma
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {report.security_checks.map((c, i) => (
                      <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg ${isDark ? "bg-neutral-800/50" : "bg-slate-50"}`}>
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-800"}`}>{c.check}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>{c.note}</p>
                        </div>
                        <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 text-xs shrink-0">OK</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Histórico */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className={isDark ? "bg-neutral-900" : "bg-white border"}>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />Histórico de Auditorias
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Info className="w-4 h-4" />O que é auditado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
              <CardContent className="p-0">
                <AuditHistoryTable history={auditHistory} isDark={isDark} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <AuditInfoPanel isDark={isDark} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className={`rounded-xl border p-4 ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
          <p className={`text-xs text-center ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
            <strong>SYSTEM AUDIT — JURIS</strong> · Dados 100% estruturais e anonimizados ·
            Nenhum conteúdo jurídico ou pessoal é acessado · Conformidade <strong>LGPD (Lei 13.709/2018)</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuditInfoPanel({ isDark }) {
  const sections = [
    {
      icon: Database,
      title: "A) Estrutura de Entidades",
      items: ["Verificação de campos obrigatórios", "Detecção de campos sensíveis expostos", "Contagem de registros por entidade"],
    },
    {
      icon: Shield,
      title: "B) Autenticação e Segurança",
      items: ["Verificação de RLS nas entidades", "Autenticação JWT (plataforma)", "Rate limiting (plataforma)", "HTTPS enforced (plataforma)"],
    },
    {
      icon: Database,
      title: "C) Integridade Referencial",
      items: ["Processos sem cliente vinculado", "Tarefas sem título", "Assinaturas ativas com datas expiradas", "Usuários sem registro de assinatura"],
    },
    {
      icon: Activity,
      title: "D) Performance",
      items: ["Tempo de execução da auditoria", "Acessibilidade das entidades principais"],
    },
    {
      icon: Lock,
      title: "E) Conformidade LGPD",
      items: ["Logs de auditoria sem CPF/CNPJ/senhas", "Tamanho dos payloads nos logs admin", "Ausência de dados jurídicos nos logs"],
    },
    {
      icon: FileText,
      title: "F) Registros e Rastreabilidade",
      items: ["Cada auditoria é registrada na entidade SystemAuditLog", "Relatório inclui apenas dados estruturais", "Nenhum conteúdo de usuário é armazenado"],
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {sections.map(({ icon: Icon, title, items }) => (
        <Card key={title} className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              <Icon className="w-4 h-4 text-indigo-500" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {items.map(item => (
                <li key={item} className={`flex items-center gap-2 text-xs ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}