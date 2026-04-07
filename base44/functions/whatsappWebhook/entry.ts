import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log("whatsappWebhook payload:", JSON.stringify(body).slice(0, 500));

    // Extrair dados do webhook da Evolution API
    const instanceRaw = body?.instance;
    const instance = typeof instanceRaw === "object" ? instanceRaw?.instanceName : instanceRaw;

    const data = body?.data;
    const remoteJid = data?.key?.remoteJid;
    const fromMe = data?.key?.fromMe;
    const text = data?.message?.conversation || data?.message?.extendedTextMessage?.text;

    // Ignorar grupos, mensagens próprias, sem texto ou sem instância
    if (!text || fromMe || !instance || !remoteJid || remoteJid.endsWith("@g.us")) {
      return Response.json({ success: true });
    }

    const contactPhone = remoteJid.replace("@s.whatsapp.net", "");

    const base44 = createClientFromRequest(req);

    // Identificar sessão ativa do advogado
    const sessions = await base44.asServiceRole.entities.WhatsappSession.filter({
      user_id: instance,
      status: "connected",
      agent_enabled: true,
    });

    if (!sessions || sessions.length === 0) {
      console.log("Nenhuma sessão ativa para instância:", instance);
      // Salvar mensagem mesmo sem agente ativo (para histórico)
      await base44.asServiceRole.entities.WhatsappMessage.create({
        user_id: instance,
        contact_phone: contactPhone,
        direction: "inbound",
        content: text,
        sent_at: new Date().toISOString(),
      });
      return Response.json({ success: true });
    }

    // Buscar usuário pelo user_id para obter o email
    const users = await base44.asServiceRole.entities.User.list();
    const targetUser = users.find(u => u.id === instance);
    const userEmail = targetUser?.email;

    // Carregar contextos em paralelo
    const [officeConfigs, agentConfigs, recentMessages] = await Promise.all([
      base44.asServiceRole.entities.OfficeConfig.filter({ user_id: instance }),
      userEmail
        ? base44.asServiceRole.entities.WhatsAppAgentConfig.filter({ created_by: userEmail })
        : Promise.resolve([]),
      base44.asServiceRole.entities.WhatsappMessage.filter(
        { user_id: instance, contact_phone: contactPhone },
        "-sent_at",
        15
      ),
    ]);

    const office = officeConfigs[0] || {};
    const agentCfg = agentConfigs[0] || {};

    // Salvar mensagem recebida
    await base44.asServiceRole.entities.WhatsappMessage.create({
      user_id: instance,
      contact_phone: contactPhone,
      direction: "inbound",
      content: text,
      sent_at: new Date().toISOString(),
    });

    // Mapas de tom
    const toneMap = {
      formal: "Mantenha um tom formal e corporativo em todas as interações.",
      amigavel: "Seja amigável, descontraído e acolhedor nas conversas.",
      profissional: "Mantenha um tom profissional, mas acessível e cordial.",
    };

    const agentName = agentCfg.agent_name || "Assistente Virtual";
    const officeName = agentCfg.office_name || office.office_name || "Escritório de Advocacia";
    const tone = toneMap[agentCfg.response_tone] || toneMap.profissional;
    const practiceAreas = office.practice_areas || "não informado";
    const feeTable = office.fee_table || "não informado";
    const workingHours = agentCfg.office_hours || office.working_hours || "não informado";
    const meetingDuration = office.meeting_duration || 60;
    const customInstructions = agentCfg.custom_instructions || "";
    const collectAppointment = agentCfg.collect_appointment_info !== false;

    const servicesText = Array.isArray(agentCfg.services_offered) && agentCfg.services_offered.length > 0
      ? `\nServiços: ${agentCfg.services_offered.join(", ")}`
      : "";

    const systemPrompt = `Você é ${agentName}, assistente virtual do escritório "${officeName}".
${tone}

DADOS DO ESCRITÓRIO:
- Áreas de atuação: ${practiceAreas}
- Honorários: ${feeTable}
- Horário de atendimento: ${workingHours}
- Duração padrão de reuniões: ${meetingDuration} minutos${servicesText}

RESPONSABILIDADES:
1. Responder dúvidas sobre serviços e horários do escritório
2. Ser cordial e representar apenas este escritório
${collectAppointment ? "3. Coletar nome, tipo de consulta e horário preferido para agendamentos\n4. Após coletar, informar que a equipe confirmará em até 24 horas" : ""}

RESTRIÇÕES:
- NÃO dê orientações jurídicas específicas
- NÃO solicite documentos pessoais
- Encaminhe casos complexos para atendimento humano
${customInstructions ? `\nINSTRUÇÕES ADICIONAIS:\n${customInstructions}` : ""}

Responda de forma concisa, máximo 3 parágrafos curtos.`;

    // Histórico (mais antigas primeiro)
    const history = [...recentMessages]
      .reverse()
      .map(m => `${m.direction === "inbound" ? "Cliente" : agentName}: ${m.content}`)
      .join("\n");

    const fullPrompt = `${systemPrompt}\n\nHistórico da conversa:\n${history}\n\nCliente: ${text}\n\n${agentName}:`;

    // Gerar resposta via LLM
    const agentReply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
    });

    const replyText = typeof agentReply === "string"
      ? agentReply
      : agentReply?.response || agentReply?.text || "Desculpe, não consegui processar sua mensagem no momento.";

    // Enviar resposta via Evolution API
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    const sendRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
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

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error("Erro ao enviar mensagem Evolution:", errBody);
    }

    // Salvar resposta enviada
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