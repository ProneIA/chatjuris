const BASE44_URL = "https://base44.app/api/apps/690e408daf48e0f633c6cf3a/entities";
const API_KEY = "bb43747f8296403facf59b429ab4ebfb";
const HEADERS = { "api_key": API_KEY, "Content-Type": "application/json" };

async function b44Get(entity, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE44_URL}/${entity}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: HEADERS });
  return res.json();
}

async function b44Post(entity, data) {
  const res = await fetch(`${BASE44_URL}/${entity}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(data),
  });
  return res.json();
}

async function invokeLLM(systemPrompt, historico, textoMensagem) {
  const res = await fetch("https://base44.app/api/apps/690e408daf48e0f633c6cf3a/integrations/invoke_llm", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        ...historico,
        { role: "user", content: textoMensagem }
      ],
      model: "gpt-4o-mini"
    })
  });
  const data = await res.json();
  console.log("LLM raw response:", JSON.stringify(data));
  return data.choices?.[0]?.message?.content || data.content || data.response || "Não foi possível processar sua mensagem.";
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Webhook recebido:", JSON.stringify(body));

    const instance = body.instance;
    const fromMe = body.data?.key?.fromMe;
    const remoteJid = body.data?.key?.remoteJid;
    const text = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text;

    if (fromMe || !text || !remoteJid) {
      return Response.json({ success: true });
    }

    // Debug: todas as sessões no banco
    const todasSessoes = await b44Get("WhatsappSession");
    console.log("TODAS AS SESSOES:", JSON.stringify(todasSessoes));

    // Buscar sessões ativas com agente habilitado
    const sessions = await b44Get("WhatsappSession", { status: "connected", agent_enabled: "true" });
    console.log("Sessões ativas:", JSON.stringify(sessions));

    if (!sessions || sessions.length === 0) {
      console.log("Nenhuma sessão ativa com agente habilitado");
      return Response.json({ success: true });
    }

    const session = sessions.find(s => s.user_id === instance) || sessions[0];
    const userId = session.user_id;
    console.log("Sessão encontrada para user_id:", userId);

    // Buscar configurações do escritório
    const configs = await b44Get("OfficeConfig", { user_id: userId });
    const office = configs?.[0] || {};

    // Buscar histórico de mensagens (últimas 10)
    const history = await b44Get("WhatsappMessage", { user_id: userId, contact_phone: remoteJid });

    // Salvar mensagem recebida
    const today = new Date().toISOString().split('T')[0];
    await b44Post("WhatsappMessage", {
      user_id: userId,
      contact_phone: remoteJid,
      direction: "inbound",
      content: text,
      sent_at: today,
    });

    // Montar histórico para o LLM
    const historyItems = Array.isArray(history) ? history.slice(-10).reverse() : [];

    const systemPrompt = `Você é um assistente jurídico virtual do escritório ${office.office_name || 'de advocacia'}, responsável pelo atendimento inicial via WhatsApp.
Advogado responsável: ${office.lawyer_name || 'o advogado'}.
Áreas de atuação: ${office.practice_areas || 'direito geral'}.
Horário de atendimento: ${office.working_hours || 'dias úteis, horário comercial'}.
Tabela de honorários: ${office.fee_table || 'consultar com o escritório'}.
${office.welcome_message ? `Mensagem padrão: ${office.welcome_message}` : ''}

Seja sempre educado, profissional e empático. Responda de forma clara e objetiva. Não dê conselhos jurídicos detalhados — apenas oriente o cliente e ofereça agendamento de consulta.`;

    const historicoLLM = historyItems.map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content
    }));

    // Chamar LLM
    const reply = await invokeLLM(systemPrompt, historicoLLM, text);
    console.log("Resposta LLM:", reply);

    // Enviar resposta via Evolution API
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    const sendResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number: remoteJid, text: reply }),
    });
    console.log("Mensagem enviada, status:", sendResponse.status);

    // Salvar resposta do agente
    await b44Post("WhatsappMessage", {
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