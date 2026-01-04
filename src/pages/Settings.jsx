import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Palette, Keyboard, Save, Loader2, Pencil, X, Check, Shield, FileText } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Settings({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    task_reminders: true,
    deadline_alerts: true,
    weekly_summary: false,
    theme: 'dark',
    compact_view: false,
    show_avatars: true,
    keyboard_shortcuts_enabled: true,
  });
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((userData) => {
      setUser(userData);
      setNewName(userData?.full_name || "");
      if (userData.preferences) {
        setPreferences({ ...preferences, ...userData.preferences });
      }
    });
  }, []);

  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success("Configurações salvas com sucesso!");
    },
  });

  const handleSavePreferences = async () => {
    setLoading(true);
    await updatePreferencesMutation.mutateAsync({ preferences });
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    setLoading(true);
    await updatePreferencesMutation.mutateAsync({ full_name: newName.trim() });
    setUser({ ...user, full_name: newName.trim() });
    setEditingName(false);
    setLoading(false);
  };

  const shortcuts = [
    { keys: ["⌘", "K"], action: "Abrir Assistente IA" },
    { keys: ["⌘", "D"], action: "Dashboard" },
    { keys: ["⌘", "P"], action: "Processos" },
    { keys: ["⌘", "C"], action: "Clientes" },
    { keys: ["⌘", "T"], action: "Templates" },
    { keys: ["⌘", "J"], action: "Jurisprudência" },
    { keys: ["⌘", "L"], action: "Calendário" },
    { keys: ["⌘", ","], action: "Configurações" },
    { keys: ["?"], action: "Mostrar ajuda" },
  ];

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'shortcuts', label: 'Atalhos', icon: Keyboard },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
  ];

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Configurações</h1>
          <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Gerencie suas preferências e informações da conta</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-neutral-800 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="border border-neutral-800 rounded-lg bg-black p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-1">Informações do Perfil</h2>
                <p className="text-sm text-neutral-500">Seus dados pessoais</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400">Nome Completo</Label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-neutral-900 border-neutral-800 text-white flex-1"
                        placeholder="Digite seu nome"
                      />
                      <Button
                        size="icon"
                        onClick={handleSaveName}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditingName(false);
                          setNewName(user?.full_name || "");
                        }}
                        className="border-neutral-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={user?.full_name || ""}
                        disabled
                        className="bg-neutral-900 border-neutral-800 text-white flex-1"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setEditingName(true)}
                        className="border-neutral-700 hover:bg-neutral-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-400">Email</Label>
                  <Input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-neutral-900 border-neutral-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-400">Função</Label>
                  <Input
                    value={user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    disabled
                    className="bg-neutral-900 border-neutral-800 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-1">Preferências de Notificação</h2>
                <p className="text-sm text-neutral-500">Configure como deseja receber atualizações</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-neutral-800">
                  <div>
                    <p className="text-white">Notificações por Email</p>
                    <p className="text-sm text-neutral-500">Receber emails sobre atividades importantes</p>
                  </div>
                  <Switch
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, email_notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-neutral-800">
                  <div>
                    <p className="text-white">Lembretes de Tarefas</p>
                    <p className="text-sm text-neutral-500">Alertas para tarefas pendentes</p>
                  </div>
                  <Switch
                    checked={preferences.task_reminders}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, task_reminders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-neutral-800">
                  <div>
                    <p className="text-white">Alertas de Prazos</p>
                    <p className="text-sm text-neutral-500">Notificações de prazos próximos</p>
                  </div>
                  <Switch
                    checked={preferences.deadline_alerts}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, deadline_alerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white">Resumo Semanal</p>
                    <p className="text-sm text-neutral-500">Relatório semanal por email</p>
                  </div>
                  <Switch
                    checked={preferences.weekly_summary}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, weekly_summary: checked })
                    }
                  />
                </div>

                <Button onClick={handleSavePreferences} disabled={loading} className="w-full bg-white text-black hover:bg-gray-100">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Preferências
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-1">Preferências de Aparência</h2>
                <p className="text-sm text-neutral-500">Personalize a interface do sistema</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-neutral-400">Tema</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                      className={`p-4 border rounded-lg transition-all ${
                        preferences.theme === 'light'
                          ? 'border-white bg-neutral-900'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-sm font-medium text-white">Claro</div>
                      <div className="text-xs text-neutral-500 mt-1">Em breve</div>
                    </button>
                    <button
                      onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                      className={`p-4 border rounded-lg transition-all ${
                        preferences.theme === 'dark'
                          ? 'border-white bg-neutral-900'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-sm font-medium text-white">Escuro</div>
                      <div className="text-xs text-neutral-500 mt-1">Tema padrão</div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-neutral-800">
                  <div>
                    <p className="text-white">Visualização Compacta</p>
                    <p className="text-sm text-neutral-500">Reduzir espaçamento entre elementos</p>
                  </div>
                  <Switch
                    checked={preferences.compact_view}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, compact_view: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white">Mostrar Avatares</p>
                    <p className="text-sm text-neutral-500">Exibir avatares nas listas</p>
                  </div>
                  <Switch
                    checked={preferences.show_avatars}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, show_avatars: checked })
                    }
                  />
                </div>

                <Button onClick={handleSavePreferences} disabled={loading} className="w-full bg-white text-black hover:bg-gray-100">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Preferências
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-1">Privacidade e LGPD</h2>
                <p className="text-sm text-neutral-500">Gerencie seus dados pessoais e consentimentos</p>
              </div>

              <div className="p-4 border border-neutral-800 rounded-lg bg-neutral-900">
                <p className="text-sm text-neutral-300 mb-4">
                  Seus dados são protegidos conforme a Lei Geral de Proteção de Dados Pessoais (LGPD). 
                  Você tem direitos sobre seus dados pessoais, incluindo acesso, correção e exclusão.
                </p>
                <div className="space-y-3">
                  <Link to={createPageUrl("MyData")}>
                    <Button className="w-full justify-start bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700">
                      <FileText className="w-4 h-4 mr-2" />
                      Acessar Meus Dados
                    </Button>
                  </Link>
                  <Link to={createPageUrl("PrivacyPolicy")} target="_blank">
                    <Button className="w-full justify-start bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700">
                      <Shield className="w-4 h-4 mr-2" />
                      Ver Política de Privacidade
                    </Button>
                  </Link>
                  <Link to={createPageUrl("TermsOfService")} target="_blank">
                    <Button className="w-full justify-start bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700">
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Termos de Uso
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-4 border border-neutral-800 rounded-lg bg-neutral-900">
                <p className="text-xs text-neutral-500 mb-1">
                  <strong className="text-white">Encarregado de Dados (DPO):</strong> dpo@juris.app
                </p>
                <p className="text-xs text-neutral-500">
                  Para questões sobre privacidade e proteção de dados.
                </p>
              </div>
            </div>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-white mb-1">Atalhos de Teclado</h2>
                <p className="text-sm text-neutral-500">Use atalhos para navegar mais rápido</p>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-neutral-800 mb-4">
                <div>
                  <p className="text-white">Ativar Atalhos de Teclado</p>
                  <p className="text-sm text-neutral-500">Habilita ou desabilita os atalhos de navegação</p>
                </div>
                <Switch
                  checked={preferences.keyboard_shortcuts_enabled}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, keyboard_shortcuts_enabled: checked })
                  }
                />
              </div>

              <div className={`space-y-2 ${!preferences.keyboard_shortcuts_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-neutral-800 rounded-lg"
                  >
                    <span className="text-sm text-neutral-400">{shortcut.action}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd className="px-2 py-1 text-xs font-medium text-white bg-neutral-800 border border-neutral-700 rounded">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-neutral-600">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border border-neutral-800 rounded-lg bg-neutral-900">
                <p className="text-sm text-neutral-400">
                  <strong className="text-white">Dica:</strong> Pressione{" "}
                  <kbd className="px-1.5 py-0.5 text-xs bg-neutral-800 border border-neutral-700 rounded">?</kbd>{" "}
                  em qualquer página para ver os atalhos disponíveis.
                </p>
              </div>

              <Button onClick={handleSavePreferences} disabled={loading} className="w-full bg-white text-black hover:bg-gray-100">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Preferências
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}