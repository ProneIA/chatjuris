import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WEBHOOK_URLS = [
  "https://chatjuris.com/api/whatsappWebhook",
  "https://chatjuris.com/functions/whatsappWebhook",
  "https://base44.app/api/apps/690e408daf48e0f633c6cf3a/functions/whatsappWebhook",
];

export default function WebhookTest() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testUrl = async (url) => {
    setLoading(l => ({ ...l, [url]: true }));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true, source: "webhook-test-page", timestamp: new Date().toISOString() }),
      });
      const text = await res.text();
      setResults(r => ({ ...r, [url]: { status: res.status, ok: res.ok, body: text } }));
    } catch (e) {
      setResults(r => ({ ...r, [url]: { status: "ERRO", ok: false, body: e.message } }));
    } finally {
      setLoading(l => ({ ...l, [url]: false }));
    }
  };

  const configureWebhook = async () => {
    setLoading(l => ({ ...l, configure: true }));
    try {
      const res = await base44.functions.invoke("configureWebhook", {});
      setResults(r => ({ ...r, configure: { status: res.status, ok: true, body: JSON.stringify(res.data, null, 2) } }));
    } catch (e) {
      setResults(r => ({ ...r, configure: { status: "ERRO", ok: false, body: e.message } }));
    } finally {
      setLoading(l => ({ ...l, configure: false }));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Teste de Webhook</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Webhook na Evolution API</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Chama a função <code>configureWebhook</code> para registrar a URL do webhook na Evolution API.
          </p>
          <Button onClick={configureWebhook} disabled={loading.configure}>
            {loading.configure ? "Configurando..." : "Executar configureWebhook"}
          </Button>
          {results.configure && (
            <pre className={`mt-3 p-3 rounded text-xs overflow-auto ${results.configure.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              Status: {results.configure.status}{"\n"}{results.configure.body}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testar URLs do Webhook Diretamente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Envia um POST de teste para cada URL candidata para verificar qual está acessível externamente.
          </p>
          {WEBHOOK_URLS.map((url) => (
            <div key={url} className="border rounded p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <code className="text-xs break-all text-gray-700">{url}</code>
                <Button size="sm" variant="outline" onClick={() => testUrl(url)} disabled={loading[url]}>
                  {loading[url] ? "..." : "Testar"}
                </Button>
              </div>
              {results[url] && (
                <pre className={`p-2 rounded text-xs overflow-auto ${results[url].ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  HTTP {results[url].status}{"\n"}{results[url].body}
                </pre>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            As funções Base44 são <strong>públicas por padrão</strong> — não exigem autenticação de usuário para chamadas HTTP externas (webhooks, cURL, etc.).
          </p>
          <p className="text-sm text-gray-600">
            URL pública confirmada pelo Base44:
          </p>
          <code className="block mt-2 p-2 bg-gray-100 text-xs rounded break-all">
            https://base44.app/api/apps/690e408daf48e0f633c6cf3a/functions/whatsappWebhook
          </code>
          <p className="text-sm text-gray-600 mt-2">
            Se o domínio customizado <code>chatjuris.com</code> estiver configurado:
          </p>
          <code className="block mt-2 p-2 bg-gray-100 text-xs rounded break-all">
            https://chatjuris.com/functions/whatsappWebhook
          </code>
        </CardContent>
      </Card>
    </div>
  );
}