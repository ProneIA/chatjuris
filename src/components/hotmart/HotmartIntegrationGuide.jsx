import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function HotmartIntegrationGuide() {
  const webhookUrl = `${window.location.origin}/api/functions/hotmartWebhook`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Guia de Integração Hotmart</h1>
        <p className="text-slate-600">Configure sua conta Hotmart para integrar com a plataforma</p>
      </div>

      {/* Passo 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Configurar Produto na Hotmart
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            1. Acesse <a href="https://app-vlc.hotmart.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">https://app-vlc.hotmart.com</a>
          </p>
          <p className="text-sm text-slate-600">
            2. Vá em <strong>Produtos &gt; Meus Produtos</strong>
          </p>
          <p className="text-sm text-slate-600">
            3. Crie ou edite seu produto de assinatura mensal
          </p>
          <p className="text-sm text-slate-600">
            4. Configure o preço (ex: R$ 97,00/mês)
          </p>
          <Alert className="mt-4">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              <strong>Importante:</strong> O produto deve ser configurado como <strong>assinatura recorrente</strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            Configurar Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            1. Acesse <strong>Ferramentas &gt; Hotmart API</strong>
          </p>
          <p className="text-sm text-slate-600">
            2. Vá para a aba <strong>Webhooks</strong>
          </p>
          <p className="text-sm text-slate-600">
            3. Clique em <strong>Adicionar URL</strong>
          </p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-600 mb-2 font-medium">URL do Webhook:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border text-xs break-all">
                {webhookUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(webhookUrl)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            4. Selecione os seguintes eventos:
          </p>
          <ul className="text-xs text-slate-600 space-y-1 ml-6 list-disc">
            <li><strong>PURCHASE_COMPLETE</strong> - Compra concluída</li>
            <li><strong>PURCHASE_APPROVED</strong> - Pagamento aprovado</li>
            <li><strong>PURCHASE_CANCELED</strong> - Compra cancelada</li>
            <li><strong>PURCHASE_REFUNDED</strong> - Reembolso realizado</li>
            <li><strong>SUBSCRIPTION_CANCELLATION</strong> - Assinatura cancelada</li>
            <li><strong>SUBSCRIPTION_REACTIVATION</strong> - Assinatura reativada</li>
          </ul>

          <Alert className="mt-4">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-xs">
              Após salvar, a Hotmart enviará eventos automaticamente para nossa plataforma
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            Obter Credenciais API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            1. Em <strong>Ferramentas &gt; Hotmart API</strong>, vá para <strong>Credenciais</strong>
          </p>
          <p className="text-sm text-slate-600">
            2. Copie o <strong>Client ID</strong> e <strong>Client Secret</strong>
          </p>
          <p className="text-sm text-slate-600">
            3. Adicione estas credenciais nas variáveis de ambiente da plataforma:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <code className="block text-xs">HOTMART_CLIENT_ID=seu_client_id</code>
            <code className="block text-xs">HOTMART_CLIENT_SECRET=seu_client_secret</code>
          </div>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Mantenha estas credenciais em segredo. Elas já foram configuradas nos secrets do app.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passo 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            Atualizar Link de Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            1. Copie o link de checkout do seu produto na Hotmart
          </p>
          <p className="text-sm text-slate-600">
            2. Edite o arquivo <code className="bg-slate-100 px-2 py-1 rounded text-xs">pages/AccessDenied.js</code>
          </p>
          <p className="text-sm text-slate-600">
            3. Substitua a variável <code className="bg-slate-100 px-2 py-1 rounded text-xs">hotmartCheckoutUrl</code> pelo seu link
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <code className="text-xs block">
              const hotmartCheckoutUrl = "https://pay.hotmart.com/SEU_PRODUTO_ID";
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Sistema Configurado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            ✅ Webhook configurado e aguardando eventos<br />
            ✅ Bloqueio de acesso ativado para usuários não pagantes<br />
            ✅ Sistema de verificação automática implementado
          </p>
        </CardContent>
      </Card>

      {/* Teste */}
      <Alert>
        <AlertDescription>
          <strong>Como Testar:</strong>
          <ol className="text-xs mt-2 space-y-1 ml-4 list-decimal">
            <li>Faça logout da plataforma</li>
            <li>Realize uma compra teste usando o modo Sandbox da Hotmart</li>
            <li>Verifique se o usuário recebe acesso automaticamente</li>
            <li>Cancele a compra teste e confirme que o acesso é revogado</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}