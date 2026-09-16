import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Download, Trash2, Eye, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function MyData({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: consents = [] } = useQuery({
    queryKey: ['consents', user?.email],
    queryFn: () => user?.email ? base44.entities.UserConsent.filter({ user_email: user.email }) : [],
    enabled: !!user?.email
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs', user?.email],
    queryFn: () => user?.email ? base44.entities.AuditLog.filter({ user_email: user.email }, '-created_date', 50) : [],
    enabled: !!user?.email
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.logout();
    },
  });

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Meus Dados e Privacidade
            </h1>
            <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
              Gerencie seus dados pessoais conforme a LGPD
            </p>
          </div>
        </div>

        {/* Informações do Usuário */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>Informações armazenadas na sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Nome</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.full_name}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Email</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Cadastro</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.created_date ? new Date(user.created_date).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Função</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consentimentos */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Consentimentos
            </CardTitle>
            <CardDescription>Histórico de aceite de termos e políticas</CardDescription>
          </CardHeader>
          <CardContent>
            {consents.length === 0 ? (
              <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Nenhum consentimento registrado</p>
            ) : (
              <div className="space-y-3">
                {consents.map((consent) => (
                  <div key={consent.id} className={`p-4 rounded-lg border ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {consent.consent_type === 'terms_of_use' ? 'Termos de Uso' :
                           consent.consent_type === 'privacy_policy' ? 'Política de Privacidade' :
                           consent.consent_type}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                          Aceito em: {new Date(consent.accepted_at).toLocaleString('pt-BR')}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          Versão: {consent.version}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                        Aceito
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs de Acesso */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Histórico de Atividades
            </CardTitle>
            <CardDescription>Últimas 50 ações realizadas na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className={`p-3 rounded-lg border text-sm ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{log.action}</p>
                        {log.details && <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>{log.details}</p>}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {new Date(log.created_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-500">
                <Download className="w-5 h-5" />
                Exportar Dados
              </CardTitle>
              <CardDescription>Recurso temporariamente indisponível</CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full" variant="outline">
                Exportar Meus Dados
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Conforme Art. 18º, inciso II da LGPD
              </p>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-500">
                <AlertTriangle className="w-5 h-5" />
                Excluir Conta
              </CardTitle>
              <CardDescription>Recurso temporariamente indisponível</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A exclusão permanente de conta está temporariamente indisponível. Você pode sair da sua conta agora.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Sair
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-gray-400 mt-2">
                Conforme Art. 18º, inciso VI da LGPD
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="pt-6">
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              <strong>Encarregado de Dados (DPO):</strong> Para questões sobre privacidade, entre em contato: dpo@juris.app
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              <strong>Seus Direitos:</strong> Conforme Art. 18º da LGPD, você tem direito de acessar, corrigir, excluir, 
              exportar e revogar consentimento sobre seus dados pessoais.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}