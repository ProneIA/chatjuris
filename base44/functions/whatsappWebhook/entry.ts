import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // 1. Extrair dados do webhook
    const instance = body?.instance;
    const data = body?.data;
    const remoteJid = data?.key?.remoteJid;
    const fromMe = data?.key?.fromMe;
    const text = data?.message?.conversation || data?.message?.extendedTextMessage?.text;

    // Ignorar se não houver texto ou for mensagem própria
    if (!text || fromMe || !instance || !remoteJid) {
      return Response.json({ success: true });
    }

    const contactPhone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");

    // Usar service role pois não há autenticação de usuário nesse endpoint
    const base44 = createClientFromRequest(req);

    // 2. Identificar o advogado via WhatsappSession
    const sessions = await base44.asServiceRole.entities.WhatsappSession.filter({
      user_id: instance,
      status: "connected",
      agent_enabled: true,
    });

    if (!sessions || sessions.length === 0) {
      return Response.json({ success: true });
    }

    // 3. Carregar contexto do escritório
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

    // 5. Montar system prompt e histórico
    const systemPrompt = `Você é o assistente virtual do escritório ${office.office_name || "do advogado"} do advogado ${office.lawyer_name || ""}.
Áreas de atuação: ${office.practice_areas || "não informado"}
Honorários: ${office.fee_table || "não informado"}
Horário de atendimento: ${office.working_hours || "não informado"}
Duração padrão de reuniões: ${office.meeting_duration || 60} minutos

Suas funções:
- Responder dúvidas sobre valores e áreas de atuação do escritório
- Agendar reuniões com o advogado
- Ser cordial e profissional

IMPORTANTE: Você representa APENAS este escritório. Nunca mencione outros escritórios ou advogados.`;

    // Montar histórico (mensagens mais antigas primeiro)
    const history = recentMessages
      .reverse()
      .map(m => ({
        role: m.direction === "inbound" ? "user" : "assistant",
        content: m.content,
      }));

    // Adicionar nova mensagem do usuário
    history.push({ role: "user", content: text });

    // Formatar prompt completo com histórico
    const historyText = history
      .map(m => `${m.role === "user" ? "Cliente" : "Assistente"}: ${m.content}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}\n\nHistórico da conversa:\n${historyText}\n\nResponda apenas como o Assistente, sem prefixo:`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
    });

    const agentReply = typeof llmResult === "string" ? llmResult : llmResult?.response || llmResult?.text || "Desculpe, não consegui processar sua mensagem.";

    // 6. Enviar resposta via Evolution API
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
        text: agentReply,
      }),
    });

    // 7. Salvar resposta enviada
    await base44.asServiceRole.entities.WhatsappMessage.create({
      user_id: instance,
      contact_phone: contactPhone,
      direction: "outbound",
      content: agentReply,
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("whatsappWebhook error:", error);
    return Response.json({ success: true }); // sempre 200 para o webhook não retentar
  }
});