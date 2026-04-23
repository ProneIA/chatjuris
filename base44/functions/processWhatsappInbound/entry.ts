import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Payload da automação de entidade
    const message = payload.data;
    console.log("Processando mensagem inbound:", JSON.stringify(message));

    if (!message || message.direction !== 'inbound') {
      return Response.json({ success: true, skip: true });
    }

    const { user_id, contact_phone, content } = message;

    // Buscar configurações do escritório
    const configs = await base44.asServiceRole.entities.OfficeConfig.filter({ user_id });
    const office = configs?.[0] || null;

    if (office) {
      console.log("OfficeConfig encontrado:", JSON.stringify(office));
    } else {
      console.log(`OfficeConfig não encontrado para user_id: ${user_id}`);
    }

    // Buscar histórico recente de mensagens (últimas 10)
    const history = await base44.asServiceRole.entities.WhatsappMessage.filter({
      user_id,
      contact_phone,
    });
    const historyItems = Array.isArray(history) ? history.slice(-10) : [];

    // Montar histórico para o LLM
    const historicoLLM = historyItems.map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Montar system prompt
    const systemPrompt = `Você é o assistente virtual do escritório ${office?.office_name || 'de advocacia'}.
Advogado responsável: ${office?.lawyer_name || 'o advogado'}
Áreas de atuação: ${office?.practice_areas || 'direito geral'}
Honorários: ${office?.fee_table || 'consultar com o escritório'}
Horário de atendimento: ${office?.working_hours || 'dias úteis, horário comercial'}

Responda de forma curta e direta. Máximo 3 linhas por mensagem. Use linguagem informal e amigável, como uma conversa de WhatsApp. Nunca use markdown, asteriscos, bullets ou formatação — apenas texto simples. Se precisar passar muita informação, quebre em mensagens curtas. Não dê conselhos jurídicos detalhados — apenas oriente o cliente e ofereça agendamento de consulta.`;

    // Montar prompt completo com system prompt + histórico + mensagem atual
    const promptCompleto = `${systemPrompt}\n\n--- Histórico da conversa ---\n${historicoLLM.map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`).join('\n')}\n\nCliente: ${content}\n\nAssistente:`;

    const resposta = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: promptCompleto,
      model: "claude_sonnet_4_6",
    });

    console.log("Resposta LLM:", resposta);

    // Salvar resposta como outbound
    const today = new Date().toISOString().split('T')[0];
    await base44.asServiceRole.entities.WhatsappMessage.create({
      user_id,
      contact_phone,
      direction: 'outbound',
      content: resposta,
      sent_at: today,
    });

    // Buscar sessão para obter o instance name
    const sessions = await base44.asServiceRole.entities.WhatsappSession.filter({
      user_id,
      status: 'connected',
    });
    const instance = sessions?.[0]?.session_token || user_id;

    // Enviar via Evolution API
    await base44.asServiceRole.functions.invoke('sendWhatsappReply', {
      instance,
      remoteJid: contact_phone,
      text: resposta,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar mensagem inbound:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});