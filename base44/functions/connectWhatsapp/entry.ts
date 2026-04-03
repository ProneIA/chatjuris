import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const instanceName = user.id;

    // 1. Criar instância (ignora erro se já existir)
    await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ instanceName, token: instanceName, qrcode: true }),
    });

    // 2. Buscar QR Code
    const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { "apikey": EVOLUTION_API_KEY },
    });
    const connectData = await connectRes.json();

    // 3. Salvar/atualizar WhatsappSession
    const sessions = await base44.entities.WhatsappSession.filter({ user_id: user.id });
    if (sessions.length > 0) {
      await base44.entities.WhatsappSession.update(sessions[0].id, { status: "pending" });
    } else {
      await base44.entities.WhatsappSession.create({
        user_id: user.id,
        phone_number: "",
        status: "pending",
        agent_enabled: false,
      });
    }

    // QR code pode vir em connectData.base64 ou connectData.qrcode.base64
    const qrBase64 = connectData?.base64 || connectData?.qrcode?.base64 || null;

    return Response.json({ qr_code: qrBase64, raw: connectData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});