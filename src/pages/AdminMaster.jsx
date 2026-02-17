import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart2,
  Clock,
  RefreshCw,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Info,
  LogOut,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import MetricCard from "@/components/adminmaster/MetricCard";
import PlanDistributionChart from "@/components/adminmaster/PlanDistributionChart";

export default function AdminMaster({ theme = "light" }) {
  const isDark = theme === "dark";
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        setAuthChecked(true);
        // Registrar acesso (o backend também registra, mas fazemos aqui também para log imediato)
        if (u?.role !== "admin") {
          base44.entities.AuditLog.create({
            user_email: u?.email || "anonymous",
            action: "unauthorized_admin_master_access",
            entity_type: "SecurityAttempt",
            details: JSON.stringify({ timestamp: new Date().toISOString() })
          }).catch(() => {});
        }
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const {
    data: metrics,
    isLoading,
    refetch,
    dataUpdatedAt
  } = useQuery({
    queryKey: ["admin-master-metrics"],
    queryFn: async () => {
      const res = await base44.functions.invoke("adminMasterMetrics", { section: "overview" });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    enabled: !!user && user.role === "admin",
    refetchInterval: 5 * 60 * 1000, // Auto-refresh a cada 5 min
    staleTime: 2 * 60 * 1000,
  });

  // ─── Bloqueios de acesso ────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-950" : "bg-gray-50"}`}>
        <div className="text-center">
          <Lock className={`w-14 h-14 mx-auto mb-3 animate-pulse ${isDark ? "text-neutral-600" : "text-gray-400"}`} />
          <p className={isDark ? "text-neutral-400" : "text-gray-600"}>Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto p-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            Este módulo é exclusivo para administradores do sistema JURIS.
          </p>
          <Badge variant="outline" className="text-xs text-gray-500">
            Código de erro: 403 — Permissão insuficiente
          </Badge>
        </div>
      </div>
    );
  }

  // ─── UI Principal ───────────────────────────────────────────────────────────

  const u = metrics?.users;
  const fin = metrics?.financial;
  const prod = metrics?.product;
  const sys = metrics?.system;

  const formatBRL = (val) =>
    val != null
      ? `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

  return (
    <div className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-slate-50"}`}>
      {/* Header */}
      <div className={`border-b px-6 py-5 ${isDark ? "bg-black border-neutral-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                ADMIN MASTER
              </h1>
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                Painel analítico interno — dados agregados e anonimizados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dataUpdatedAt ? (
              <span className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                Atualizado {format(dataUpdatedAt, "HH:mm:ss", { locale: ptBR })}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Acesso Restrito
            </Badge>
          </div>
        </div>
      </div>

      {/* LGPD Notice */}
      <div className={`border-b px-6 py-2.5 ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-blue-50 border-blue-100"}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <p className={`text-xs ${isDark ? "text-neutral-400" : "text-blue-700"}`}>
            Este painel exibe <strong>exclusivamente dados estatísticos agregados e anonimizados</strong>, sem acesso a informações pessoais, processos, documentos ou conteúdo jurídico individual. Em conformidade com a LGPD.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={isDark ? "bg-neutral-900" : "bg-white border"}>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart2 className="w-4 h-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="w-4 h-4" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="product" className="gap-2">
              <TrendingUp className="w-4 h-4" /> Produto
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Activity className="w-4 h-4" /> Sistema
            </TabsTrigger>
            <TabsTrigger value="access_logs" className="gap-2">
              <Eye className="w-4 h-4" /> Logs de Acesso
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ── */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <LoadingGrid isDark={isDark} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard title="Total de Usuários" value={u?.total} subtitle="cadastrados" icon={Users} color="blue" isDark={isDark} />
                  <MetricCard title="Usuários Ativos" value={u?.active} subtitle="com assinatura vigente" icon={CheckCircle2} color="green" isDark={isDark} />
                  <MetricCard title="Novos (30 dias)" value={u?.new_last_30_days} subtitle="novos cadastros" icon={TrendingUp} color="purple" isDark={isDark} />
                  <MetricCard title="Inativos" value={u?.inactive} subtitle="sem assinatura" icon={AlertTriangle} color="amber" isDark={isDark} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <MetricCard title="MRR Estimado" value={formatBRL(fin?.mrr_estimated)} subtitle="receita recorrente mensal" icon={DollarSign} color="green" isDark={isDark} />
                  <MetricCard title="ARR Estimado" value={formatBRL(fin?.arr_estimated)} subtitle="receita recorrente anual" icon={DollarSign} color="indigo" isDark={isDark} />
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* ── FINANCEIRO ── */}
          <TabsContent value="financial" className="space-y-6">
            {isLoading ? (
              <LoadingGrid isDark={isDark} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <MetricCard title="MRR Estimado" value={formatBRL(fin?.mrr_estimated)} subtitle="mensal recorrente" icon={DollarSign} color="green" isDark={isDark} />
                  <MetricCard title="ARR Estimado" value={formatBRL(fin?.arr_estimated)} subtitle="anual recorrente" icon={DollarSign} color="indigo" isDark={isDark} />
                  <MetricCard
                    title="Crescimento (30d)"
                    value={fin?.growth_rate_percent != null ? `${fin.growth_rate_percent > 0 ? "+" : ""}${fin.growth_rate_percent}%` : "N/A"}
                    subtitle="vs. 30 dias anteriores"
                    icon={TrendingUp}
                    color={fin?.growth_rate_percent >= 0 ? "green" : "red"}
                    isDark={isDark}
                  />
                  <MetricCard title="Novas Assinaturas (30d)" value={fin?.subscriptions_last_30_days} subtitle="novos assinantes" icon={CheckCircle2} color="blue" isDark={isDark} />
                  <MetricCard title="Churn (30d)" value={fin?.churn_last_30_days} subtitle="cancelamentos/expirações" icon={AlertTriangle} color="red" isDark={isDark} />
                  <MetricCard
                    title="Taxa de Conversão"
                    value={fin?.conversion_rate_percent != null ? `${fin.conversion_rate_percent}%` : "N/A"}
                    subtitle="trial → pago"
                    icon={TrendingUp}
                    color="purple"
                    isDark={isDark}
                  />
                </div>

                <DisclaimerCard isDark={isDark} text="Valores de MRR/ARR são estimativas baseadas nos planos ativos. Não incluem descontos, reembolsos ou valores de pagadores únicos (vitalício)." />
              </motion.div>
            )}
          </TabsContent>

          {/* ── PRODUTO ── */}
          <TabsContent value="product" className="space-y-6">
            {isLoading ? (
              <LoadingGrid isDark={isDark} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
                    <CardHeader>
                      <CardTitle className={`text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                        Distribuição por Plano
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PlanDistributionChart distribution={prod?.plan_distribution} isDark={isDark} />
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <MetricCard title="Assinaturas Ativas" value={prod?.total_active_subscriptions} subtitle="únicas por usuário" icon={CheckCircle2} color="green" isDark={isDark} />

                    {prod?.plan_distribution && (
                      <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
                        <CardContent className="pt-5 space-y-3">
                          {[
                            { key: "trial", label: "Teste (7 dias)", color: "text-blue-500" },
                            { key: "monthly", label: "Mensal", color: "text-emerald-500" },
                            { key: "yearly", label: "Anual", color: "text-purple-500" },
                            { key: "lifetime", label: "Vitalício", color: "text-amber-500" },
                          ].map(({ key, label, color }) => {
                            const val = prod.plan_distribution[key] || 0;
                            const total = prod.total_active_subscriptions || 1;
                            const pct = Math.round((val / total) * 100);
                            return (
                              <div key={key}>
                                <div className="flex justify-between mb-1">
                                  <span className={`text-sm ${isDark ? "text-neutral-300" : "text-slate-700"}`}>{label}</span>
                                  <span className={`text-sm font-semibold ${color}`}>{val} ({pct}%)</span>
                                </div>
                                <div className={`h-1.5 rounded-full ${isDark ? "bg-neutral-800" : "bg-slate-100"}`}>
                                  <div
                                    className={`h-full rounded-full bg-current ${color}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* ── SISTEMA ── */}
          <TabsContent value="system" className="space-y-6">
            {isLoading ? (
              <LoadingGrid isDark={isDark} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="Erros (24h)"
                    value={sys?.errors_last_24h}
                    subtitle="eventos de erro registrados"
                    icon={AlertTriangle}
                    color={sys?.errors_last_24h > 10 ? "red" : "green"}
                    isDark={isDark}
                  />
                  <MetricCard title="Eventos de Auditoria (24h)" value={sys?.audit_events_last_24h} subtitle="ações registradas" icon={Activity} color="blue" isDark={isDark} />
                </div>

                {/* Ações Recentes — ANONIMIZADAS */}
                <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
                  <CardHeader>
                    <CardTitle className={`text-base ${isDark ? "text-white" : "text-slate-900"}`}>
                      Ações Recentes do Sistema
                      <span className={`ml-2 text-xs font-normal ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                        (anonimizadas — sem dados pessoais)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b text-xs ${isDark ? "border-neutral-800 text-neutral-500" : "border-slate-100 text-slate-500"}`}>
                            <th className="text-left px-4 py-3 font-medium">Ação</th>
                            <th className="text-left px-4 py-3 font-medium">Entidade</th>
                            <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(sys?.recent_actions || []).map((a, i) => (
                            <tr key={i} className={`border-b text-sm ${isDark ? "border-neutral-800/50" : "border-slate-50"}`}>
                              <td className={`px-4 py-2.5 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>{a.action}</td>
                              <td className={`px-4 py-2.5 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>{a.entity_type || "—"}</td>
                              <td className={`px-4 py-2.5 ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
                                {a.timestamp ? format(new Date(a.timestamp), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                              </td>
                            </tr>
                          ))}
                          {!sys?.recent_actions?.length && (
                            <tr>
                              <td colSpan={3} className={`px-4 py-8 text-center text-sm ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
                                Nenhuma ação recente
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <DisclaimerCard isDark={isDark} text="Dados de sistema são baseados nos logs de auditoria internos. Não contêm identificadores de usuários, conteúdo jurídico ou informações sensíveis." />
              </motion.div>
            )}
          </TabsContent>

          {/* ── LOGS DE ACESSO ── */}
          <TabsContent value="access_logs" className="space-y-6">
            {isLoading ? (
              <LoadingGrid isDark={isDark} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}>
                  <CardHeader>
                    <CardTitle className={`text-base flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                      <Lock className="w-4 h-4 text-red-500" />
                      Registro de Acessos ao Admin Master
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b text-xs ${isDark ? "border-neutral-800 text-neutral-500" : "border-slate-100 text-slate-500"}`}>
                            <th className="text-left px-4 py-3 font-medium">Ação</th>
                            <th className="text-left px-4 py-3 font-medium">IP (parcial)</th>
                            <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(metrics?.admin_access_logs || []).map((log, i) => (
                            <tr key={i} className={`border-b text-sm ${isDark ? "border-neutral-800/50" : "border-slate-50"}`}>
                              <td className="px-4 py-2.5">
                                <Badge
                                  variant="outline"
                                  className={
                                    log.action === "access_denied"
                                      ? "text-red-600 border-red-300 text-xs"
                                      : "text-blue-600 border-blue-200 text-xs"
                                  }
                                >
                                  {log.action}
                                </Badge>
                              </td>
                              <td className={`px-4 py-2.5 font-mono text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                                {log.ip_address}
                              </td>
                              <td className={`px-4 py-2.5 ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
                                {log.timestamp ? format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "—"}
                              </td>
                            </tr>
                          ))}
                          {!metrics?.admin_access_logs?.length && (
                            <tr>
                              <td colSpan={3} className={`px-4 py-8 text-center text-sm ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
                                Nenhum acesso registrado ainda
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <DisclaimerCard isDark={isDark} text="IPs são parcialmente anonimizados (últimos 2 octetos removidos). Emails de admin são armazenados apenas para rastreabilidade interna." />
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer LGPD */}
        <div className={`rounded-xl border p-4 ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-slate-50 border-slate-200"}`}>
          <p className={`text-xs text-center ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
            <strong>ADMIN MASTER — JURIS</strong> · Todos os dados são estritamente agregados e anonimizados ·
            Não acessa dados pessoais, processos, documentos ou conteúdo jurídico individual ·
            Conforme <strong>LGPD (Lei 13.709/2018)</strong> · Gerado em {metrics?.generated_at ? format(new Date(metrics.generated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function LoadingGrid({ isDark }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`h-28 rounded-xl animate-pulse ${isDark ? "bg-neutral-800" : "bg-slate-200"}`} />
      ))}
    </div>
  );
}

function DisclaimerCard({ isDark, text }) {
  return (
    <div className={`rounded-lg border px-4 py-3 flex items-start gap-2 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-blue-50 border-blue-100"}`}>
      <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
      <p className={`text-xs ${isDark ? "text-neutral-400" : "text-blue-700"}`}>{text}</p>
    </div>
  );
}