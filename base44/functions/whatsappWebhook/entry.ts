import { createClient } from 'npm:@base44/sdk@0.8.23';

const base44 = createClient({ 
  appId: "690e408daf48e0f633c6cf3a",
  token: "bb43747f8296403facf59b429ab4ebfb"
});

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Webhook recebido:", JSON.stringify(body));

    const instance = body.instance;
    const fromMe = body.data?.key?.fromMe;
    const remoteJid = body.data?.key?.remoteJid;
    const text = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text;

    // Ignorar mensagens enviadas pelo próprio bot ou sem texto
    if (fromMe || !text || !remoteJid) {
      return Response.json({ success: true });
    }

    // Debug: listar TODAS as sessões no banco
    const todasSessoes = await base44.entities.WhatsappSession.list();
    console.log("TODAS AS SESSOES:", JSON.stringify(todasSessoes));

    // Buscar todas as sessões ativas com agente habilitado
    const sessions = await base44.entities.WhatsappSession.filter({
      status: "connected",
      agent_enabled: true,
    });

    if (!sessions || sessions.length === 0) {
      console.log("Nenhuma sessão ativa com agente habilitado");
      return Response.json({ success: true });
    }

    // Usar a primeira sessão encontrada (ou filtrar por instance se disponível)
    const session = sessions.find(s => s.user_id === instance) || sessions[0];
    const userId = session.user_id;

    console.log("Sessão encontrada para user_id:", userId);

    // Buscar configurações do escritório
    const officeConfigs = await base44.entities.OfficeConfig.filter({ user_id: userId });
    const office = officeConfigs?.[0] || {};

    // Buscar histórico de mensagens (últimas 10)
    const history = await base44.entities.WhatsappMessage.filter(
      { user_id: userId, contact_phone: remoteJid },
      '-sent_at',
      10
    );

    // Salvar mensagem recebida
    const today = new Date().toISOString().split('T')[0];
    await base44.entities.WhatsappMessage.create({
      user_id: userId,
      contact_phone: remoteJid,
      direction: "inbound",
      content: text,
      sent_at: today,
    });

    // Montar histórico para o LLM
    const historyText = (history || [])
      .reverse()
      .map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Assistente'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `Você é um assistente jurídico virtual do escritório ${office.office_name || 'de advocacia'}, responsável pelo atendimento inicial via WhatsApp.
Advogado responsável: ${office.lawyer_name || 'o advogado'}.
Áreas de atuação: ${office.practice_areas || 'direito geral'}.
Horário de atendimento: ${office.working_hours || 'dias úteis, horário comercial'}.
Tabela de honorários: ${office.fee_table || 'consultar com o escritório'}.
${office.welcome_message ? `Mensagem padrão: ${office.welcome_message}` : ''}

Seja sempre educado, profissional e empático. Responda de forma clara e objetiva. Não dê conselhos jurídicos detalhados — apenas oriente o cliente e ofereça agendamento de consulta.

Histórico da conversa:
${historyText}

Cliente: ${text}`;

    // Chamar LLM
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
    });

    const reply = typeof llmResult === 'string' ? llmResult : (llmResult?.response || llmResult?.text || String(llmResult));

    // Enviar resposta via Evolution API
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: remoteJid,
        text: reply,
      }),
    });

    console.log("Mensagem enviada, status:", sendResponse.status);

    // Salvar resposta do agente
    await base44.entities.WhatsappMessage.create({
      user_id: userId,
      contact_phone: remoteJid,
      direction: "outbound",
      content: reply,
      sent_at: today,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro no webhook:", error.message);
    return Response.json({ success: true });
  }
});