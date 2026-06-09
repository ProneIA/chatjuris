import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Bell, Palette, Keyboard, Save, Loader2, Pencil, X, Check, Shield, FileText, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AppPage, PageHeader, AppCard, AppTabs, SectionHeader, AppContent, AppButton, AppField } from "@/components/ds";
import { AppTabPanel } from "@/components/ds/AppTabs";

const TABS = [
  { value: "profile",       label: "Perfil",       icon: User     },
  { value: "notifications", label: "Notificações", icon: Bell     },
  { value: "appearance",    label: "Aparência",    icon: Palette  },
  { value: "shortcuts",     label: "Atalhos",      icon: Keyboard },
  { value: "privacy",       label: "Privacidade",  icon: Shield   },
];

const shortcuts = [
  { keys: ["⌘", "K"], action: "Abrir Assistente IA"     },
  { keys: ["⌘", "D"], action: "Dashboard"               },
  { keys: ["⌘", "P"], action: "Processos"               },
  { keys: ["⌘", "C"], action: "Clientes"                },
  { keys: ["⌘", "T"], action: "Templates"               },
  { keys: ["⌘", "J"], action: "Jurisprudência"          },
  { keys: ["⌘", "L"], action: "Calendário"              },
  { keys: ["⌘", ","], action: "Configurações"           },
  { keys: ["?"],       action: "Mostrar ajuda"           },
];

export default function Settings() {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState("profile");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName]         = useState("");
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    task_reminders: true,
    deadline_alerts: true,
    weekly_summary: false,
    theme: "light",
    compact_view: false,
    show_avatars: true,
    keyboard_shortcuts_enabled: true,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setNewName(u?.full_name || "");
      if (u?.preferences) setPreferences(p => ({ ...p, ...u.preferences }));
    });
  }, []);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Configurações salvas com sucesso!");
    },
  });

  const handleSavePreferences = async () => {
    setLoading(true);
    await updateMutation.mutateAsync({ preferences });
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) { toast.error("O nome não pode estar vazio"); return; }
    setLoading(true);
    await updateMutation.mutateAsync({ full_name: newName.trim() });
    setUser(u => ({ ...u, full_name: newName.trim() }));
    setEditingName(false);
    setLoading(false);
  };

  const SaveButton = () => (
    <AppButton
      variant="primary"
      loading={loading}
      icon={Save}
      onClick={handleSavePreferences}
      style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
    >
      Salvar Preferências
    </AppButton>
  );

  const ToggleRow = ({ label, sub, pref }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: "var(--text-2)", margin: "2px 0 0" }}>{sub}</p>
      </div>
      <Switch
        checked={preferences[pref]}
        onCheckedChange={v => setPreferences(p => ({ ...p, [pref]: v }))}
      />
    </div>
  );

  return (
    <AppPage>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie suas preferências e informações da conta"
        icon={SettingsIcon}
      />

      <AppContent narrow>
        <AppTabs tabs={TABS} value={activeTab} onValueChange={setActiveTab}>

          {/* Profile */}
          <AppTabPanel value="profile">
            <AppCard>
              <SectionHeader title="Informações do Perfil" subtitle="Seus dados pessoais" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                <div>
                  <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block" }}>Nome Completo</Label>
                  {editingName ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, fontFamily: "var(--font-body)", color: "var(--text-1)" }}
                        placeholder="Digite seu nome"
                      />
                      <button onClick={handleSaveName} disabled={loading} className="btn-primary" style={{ padding: "0 12px" }}>
                        {loading ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Check style={{ width: 14, height: 14 }} />}
                      </button>
                      <button onClick={() => { setEditingName(false); setNewName(user?.full_name || ""); }} className="btn-outline" style={{ padding: "0 12px" }}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={user?.full_name || ""} disabled style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, fontFamily: "var(--font-body)", color: "var(--text-1)", background: "var(--bg)" }} />
                      <button onClick={() => setEditingName(true)} className="btn-outline" style={{ padding: "0 12px" }}>
                        <Pencil style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block" }}>Email</Label>
                  <input type="email" value={user?.email || ""} disabled style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, fontFamily: "var(--font-body)", color: "var(--text-1)", background: "var(--bg)" }} />
                </div>
                <div>
                  <Label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block" }}>Função</Label>
                  <input value={user?.role === "admin" ? "Administrador" : "Usuário"} disabled style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, fontFamily: "var(--font-body)", color: "var(--text-1)", background: "var(--bg)" }} />
                </div>
              </div>
            </AppCard>
          </AppTabPanel>

          {/* Notifications */}
          <AppTabPanel value="notifications">
            <AppCard>
              <SectionHeader title="Preferências de Notificação" subtitle="Configure como deseja receber atualizações" />
              <ToggleRow label="Notificações por Email"   sub="Receber emails sobre atividades importantes" pref="email_notifications" />
              <ToggleRow label="Lembretes de Tarefas"    sub="Alertas para tarefas pendentes"              pref="task_reminders"       />
              <ToggleRow label="Alertas de Prazos"       sub="Notificações de prazos próximos"             pref="deadline_alerts"      />
              <ToggleRow label="Resumo Semanal"          sub="Relatório semanal por email"                 pref="weekly_summary"       />
              <div style={{ paddingTop: 16 }}><SaveButton /></div>
            </AppCard>
          </AppTabPanel>

          {/* Appearance */}
          <AppTabPanel value="appearance">
            <AppCard>
              <SectionHeader title="Preferências de Aparência" subtitle="Personalize a interface do sistema" />
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Tema</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[{ value: "light", label: "Claro", sub: "Padrão" }, { value: "dark", label: "Escuro", sub: "Em breve" }].map(t => (
                    <button key={t.value} onClick={() => setPreferences(p => ({ ...p, theme: t.value }))}
                      style={{ padding: "16px", borderRadius: 12, border: `2px solid ${preferences.theme === t.value ? "var(--accent)" : "var(--border)"}`, background: preferences.theme === t.value ? "var(--accent-light)" : "var(--card)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 2px" }}>{t.label}</p>
                      <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>{t.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <ToggleRow label="Visualização Compacta" sub="Reduzir espaçamento entre elementos" pref="compact_view"  />
              <ToggleRow label="Mostrar Avatares"      sub="Exibir avatares nas listas"          pref="show_avatars"  />
              <div style={{ paddingTop: 16 }}><SaveButton /></div>
            </AppCard>
          </AppTabPanel>

          {/* Shortcuts */}
          <AppTabPanel value="shortcuts">
            <AppCard>
              <SectionHeader title="Atalhos de Teclado" subtitle="Use atalhos para navegar mais rápido" />
              <ToggleRow label="Ativar Atalhos de Teclado" sub="Habilita ou desabilita os atalhos de navegação" pref="keyboard_shortcuts_enabled" />
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, opacity: preferences.keyboard_shortcuts_enabled ? 1 : 0.4, pointerEvents: preferences.keyboard_shortcuts_enabled ? "all" : "none" }}>
                {shortcuts.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>{s.action}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {s.keys.map((k, j) => (
                        <React.Fragment key={j}>
                          <kbd style={{ padding: "2px 8px", fontSize: 11, fontWeight: 600, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>{k}</kbd>
                          {j < s.keys.length - 1 && <span style={{ color: "var(--text-3)", fontSize: 11 }}>+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>
                  <strong style={{ color: "var(--text-1)" }}>Dica:</strong> Pressione{" "}
                  <kbd style={{ padding: "2px 6px", fontSize: 11, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4 }}>?</kbd>{" "}
                  em qualquer página para ver os atalhos disponíveis.
                </p>
              </div>
              <div style={{ paddingTop: 16 }}><SaveButton /></div>
            </AppCard>
          </AppTabPanel>

          {/* Privacy */}
          <AppTabPanel value="privacy">
            <AppCard>
              <SectionHeader title="Privacidade e LGPD" subtitle="Gerencie seus dados pessoais e consentimentos" />
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, margin: "8px 0 16px" }}>
                Seus dados são protegidos conforme a Lei Geral de Proteção de Dados Pessoais (LGPD). Você tem direitos sobre seus dados pessoais, incluindo acesso, correção e exclusão.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link to={createPageUrl("MyData")} style={{ textDecoration: "none" }}>
                  <button className="btn-outline" style={{ width: "100%", justifyContent: "flex-start", gap: 8 }}>
                    <FileText style={{ width: 14, height: 14 }} /> Acessar Meus Dados
                  </button>
                </Link>
                <Link to={createPageUrl("PrivacyPolicy")} target="_blank" style={{ textDecoration: "none" }}>
                  <button className="btn-outline" style={{ width: "100%", justifyContent: "flex-start", gap: 8 }}>
                    <Shield style={{ width: 14, height: 14 }} /> Ver Política de Privacidade
                  </button>
                </Link>
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
                  <strong style={{ color: "var(--text-1)" }}>Encarregado de Dados (DPO):</strong> dpo@juris.app
                </p>
              </div>
            </AppCard>
          </AppTabPanel>

        </AppTabs>
      </AppContent>
    </AppPage>
  );
}