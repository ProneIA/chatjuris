const BASE44_URL = "https://base44.app/api/apps/690e408daf48e0f633c6cf3a/entities";
const API_KEY = "bb43747f8296403facf59b429ab4ebfb";
const HEADERS = { "api_key": API_KEY, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Webhook recebido:", JSON.stringify(body));

    const instance = body.instance;
    const fromMe = body.data?.key?.fromMe;
    const remoteJid = body.data?.key?.remoteJid;
    const text = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text;

    // Ignorar mensagens enviadas por nós ou sem texto
    if (fromMe || !text || !remoteJid) {
      return Response.json({ success: true });
    }

    // Salvar mensagem inbound — a Automação cuida do resto
    const today = new Date().toISOString().split('T')[0];
    const saveRes = await fetch(`${BASE44_URL}/WhatsappMessage`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        user_id: instance,
        contact_phone: remoteJid,
        direction: "inbound",
        content: text,
        sent_at: today,
      }),
    });

    const saved = await saveRes.json();
    console.log("Mensagem salva:", JSON.stringify(saved));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook:", error.message);
    return Response.json({ success: true });
  }
});