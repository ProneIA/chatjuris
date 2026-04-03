import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log("whatsappWebhook payload:", JSON.stringify(body).slice(0, 500));

    // 1. Extrair dados do webhook da Evolution API
    // O instance pode vir como string ou objeto
    const instanceRaw = body?.instance;
    const instance = typeof instanceRaw === "object" ? instanceRaw?.instanceName : instanceRaw;

    const data = body?.data;
    const remoteJid = data?.key?.remoteJid;
    const fromMe = data?.key?.fromMe;
    const text = data?.message?.conversation || data?.message?.extendedTextMessage?.text;

    // Ignorar se não houver texto, for mensagem própria, ou não tiver instância
    if (!text || fromMe || !instance || !remoteJid) {
      return Response.json({ success: true });
    }

    const contactPhone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");

    const base44 = createClientFromRequest(req);

    // 2. Identificar o advogado via WhatsappSession (instance = user_id)
    const sessions = await base44.asServiceRole.entities.WhatsappSession.filter({
      user_id: instance,
      status: "connected",
      agent_enabled: true,
    });

    if (!sessions || sessions.length === 0) {
      console.log("Nenhuma sessão ativa para instância:", instance);
      return Response.json({ success: true });
    }

    // 3. Carregar contexto do escritório e histórico em paralelo
    const [officeConfigs, recentMessages] = await Promise.all([
      base44.asServiceRole.entities.OfficeConfig.filter({ user_id: instance }),
      base44.asServiceRole.entities.WhatsappMessage.filter(
        { user_id: instance, contact_phone: contactPhone },
        "-sent_at",
        10
      ),
    ]);

    const office = officeConfigs[0] || {};

    // 4. Salvar mensagem recebida
    await base44.asServiceRole.entities.WhatsappMessage.create({
      user_id: instance,
      contact_phone: contactPhone,
      direction: "inbound",
      content: text,
      sent_at: new Date().toISOString(),
    });

    // 5. Montar system prompt
    const systemPrompt = `Você é o assistente virtual do escritório "${office.office_name || "de advocacia"}", do advogado ${office.lawyer_name || ""}.
Áreas de atuação: ${office.practice_areas || "não informado"}
Honorários: ${office.fee_table || "não informado"}
Horário de atendimento: ${office.working_hours || "não informado"}
Duração padrão de reuniões: ${office.meeting_duration || 60} minutos

Suas funções:
- Responder dúvidas sobre valores e áreas de atuação do escritório
- Auxiliar no agendamento de reuniões
- Ser cordial e profissional

IMPORTANTE: Você representa APENAS este escritório. Nunca mencione outros escritórios ou advogados.`;

    // Montar histórico (mais antigas primeiro)
    const history = recentMessages
      .reverse()
      .map(m => `${m.direction === "inbound" ? "Cliente" : "Assistente"}: ${m.content}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}\n\nHistórico da conversa:\n${history}\n\nCliente: ${text}\n\nAssistente:`;

    // 6. Gerar resposta via LLM
    const agentReply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
    });

    const replyText = typeof agentReply === "string"
      ? agentReply
      : agentReply?.response || agentReply?.text || "Desculpe, não consegui processar sua mensagem.";

    // 7. Enviar resposta via Evolution API
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: contactPhone,
        text: replyText,
      }),
    });

    // 8. Salvar resposta enviada
    await base44.asServiceRole.entities.WhatsappMessage.create({
      user_id: instance,
      contact_phone: contactPhone,
      direction: "outbound",
      content: replyText,
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("whatsappWebhook error:", error);
    return Response.json({ success: true }); // sempre 200 para o webhook não retentar
  }
});