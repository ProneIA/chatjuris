import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Palette, Keyboard, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    task_reminders: true,
    deadline_alerts: true,
    weekly_summary: false,
    theme: 'light',
    compact_view: false,
    show_avatars: true,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((userData) => {
      setUser(userData);
      // Carregar preferências salvas
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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
            <p className="text-slate-600 mt-1">Gerencie suas preferências e informações da conta</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Palette className="w-4 h-4 mr-2" />
                Aparência
              </TabsTrigger>
              <TabsTrigger value="shortcuts">
                <Keyboard className="w-4 h-4 mr-2" />
                Atalhos
              </TabsTrigger>
            </TabsList>

            {/* Perfil */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>Atualize suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={user?.full_name || ""}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">
                      Entre em contato com o suporte para alterar seu nome
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Input
                      id="role"
                      value={user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notificações */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                  <CardDescription>Configure como deseja receber atualizações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-slate-500">Receber emails sobre atividades importantes</p>
                    </div>
                    <Switch
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, email_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembretes de Tarefas</Label>
                      <p className="text-sm text-slate-500">Alertas para tarefas pendentes</p>
                    </div>
                    <Switch
                      checked={preferences.task_reminders}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, task_reminders: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Prazos</Label>
                      <p className="text-sm text-slate-500">Notificações de prazos próximos</p>
                    </div>
                    <Switch
                      checked={preferences.deadline_alerts}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, deadline_alerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Resumo Semanal</Label>
                      <p className="text-sm text-slate-500">Relatório semanal por email</p>
                    </div>
                    <Switch
                      checked={preferences.weekly_summary}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, weekly_summary: checked })
                      }
                    />
                  </div>

                  <Button onClick={handleSavePreferences} disabled={loading} className="w-full">
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aparência */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Aparência</CardTitle>
                  <CardDescription>Personalize a interface do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          preferences.theme === 'light'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-medium">Claro</div>
                        <div className="text-xs text-slate-500 mt-1">Tema padrão claro</div>
                      </button>
                      <button
                        onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          preferences.theme === 'dark'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-sm font-medium">Escuro</div>
                        <div className="text-xs text-slate-500 mt-1">Em breve</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Visualização Compacta</Label>
                      <p className="text-sm text-slate-500">Reduzir espaçamento entre elementos</p>
                    </div>
                    <Switch
                      checked={preferences.compact_view}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, compact_view: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mostrar Avatares</Label>
                      <p className="text-sm text-slate-500">Exibir avatares nas listas</p>
                    </div>
                    <Switch
                      checked={preferences.show_avatars}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, show_avatars: checked })
                      }
                    />
                  </div>

                  <Button onClick={handleSavePreferences} disabled={loading} className="w-full">
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Atalhos */}
            <TabsContent value="shortcuts">
              <Card>
                <CardHeader>
                  <CardTitle>Atalhos de Teclado</CardTitle>
                  <CardDescription>Use atalhos para navegar mais rápido</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <span className="text-sm text-slate-700">{shortcut.action}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded">
                                {key}
                              </kbd>
                              {i < shortcut.keys.length - 1 && (
                                <span className="text-slate-400">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Dica:</strong> Pressione <kbd className="px-1.5 py-0.5 text-xs bg-white border border-blue-300 rounded">?</kbd> em qualquer página para ver os atalhos disponíveis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}