import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const user_id = body?.user_id || user.id;

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const APP_ID = Deno.env.get("BASE44_APP_ID");

    // URL correta das functions Base44
    const webhookUrl = "https://base44.app/api/apps/690e408daf48e0f633c6cf3a/functions/whatsappWebhook";

    console.log("Configurando webhook para instância:", user_id, "URL:", webhookUrl);

    const res = await fetch(`${EVOLUTION_API_URL}/webhook/set/${user_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: ["MESSAGES_UPSERT"],
      }),
    });

    const data = await res.json();
    console.log("Webhook configurado:", JSON.stringify(data));
    return Response.json({ success: true, webhook_url: webhookUrl, data });
  } catch (error) {
    console.error("setupEvolutionWebhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});