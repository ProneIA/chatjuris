import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { instance, remoteJid, text } = await req.json();

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number: remoteJid, text }),
    });

    const data = await res.json();
    console.log("Mensagem enviada, status:", res.status, JSON.stringify(data));

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});