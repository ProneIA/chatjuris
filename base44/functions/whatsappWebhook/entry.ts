import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
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

    // Salvar mensagem inbound usando o SDK (service role)
    const today = new Date().toISOString().split('T')[0];
    const saved = await base44.asServiceRole.entities.WhatsappMessage.create({
      user_id: instance,
      contact_phone: remoteJid,
      direction: "inbound",
      content: text,
      sent_at: today,
    });

    console.log("Mensagem salva:", JSON.stringify(saved));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook:", error.message);
    return Response.json({ success: true });
  }
});