import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    // Verificação do webhook (GET request da Meta)
    if (req.method === 'GET') {
        const url = new URL(req.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe') {
            // Buscar token de verificação do usuário
            const configs = await base44.asServiceRole.entities.WhatsAppAgentConfig.list();
            const config = configs.find(c => c.whatsapp_webhook_verify_token === token);

            if (config) {
                return new Response(challenge, { status: 200 });
            }
        }

        return Response.json({ error: 'Verificação falhou' }, { status: 403 });
    }

    // Processar mensagens recebidas (POST request)
    if (req.method === 'POST') {
        try {
            const body = await req.json();

            // Verificar se é uma mensagem
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;

            if (!messages || messages.length === 0) {
                return Response.json({ status: 'no_messages' }, { status: 200 });
            }

            const message = messages[0];
            const from = message.from; // Número do cliente
            const messageText = message.text?.body;
            const phoneNumberId = value.metadata?.phone_number_id;

            if (!messageText) {
                return Response.json({ status: 'no_text' }, { status: 200 });
            }

            // Buscar configuração do usuário baseada no phone_number_id
            const configs = await base44.asServiceRole.entities.WhatsAppAgentConfig.filter({
                whatsapp_phone_number_id: phoneNumberId
            });

            if (configs.length === 0) {
                return Response.json({ error: 'Configuração não encontrada' }, { status: 404 });
            }

            const config = configs[0];

            // Construir instruções para a IA
            const toneMap = {
                formal: "Mantenha um tom formal e corporativo em todas as interações.",
                amigavel: "Seja amigável, descontraído e acolhedor nas conversas.",
                profissional: "Mantenha um tom profissional, mas acessível e cordial."
            };

            const servicesText = config.services_offered?.length > 0 
                ? `\n\nServiços oferecidos:\n${config.services_offered.map(s => `- ${s}`).join('\n')}`
                : '';

            const systemPrompt = `Você é ${config.agent_name}, assistente virtual de ${config.office_name}.

${toneMap[config.response_tone] || toneMap.profissional}

HORÁRIO DE ATENDIMENTO: ${config.office_hours}
${servicesText}

SUAS RESPONSABILIDADES:

1. RECEPÇÃO:
   - Cumprimente os clientes de forma ${config.response_tone === 'formal' ? 'formal e respeitosa' : config.response_tone === 'amigavel' ? 'calorosa e amigável' : 'profissional e cordial'}
   - Apresente-se como ${config.agent_name} de ${config.office_name}
   - Demonstre empatia e atenção

2. RESPONDER DÚVIDAS:
   - Responda perguntas sobre nossos serviços e horários
   - Seja claro e objetivo
   - Para dúvidas específicas, informe que um advogado entrará em contato

${config.collect_appointment_info ? `3. AGENDAMENTO DE COMPROMISSOS:
   - Colete: nome completo, tipo de consulta/serviço, data/hora preferida
   - Após coletar, informe: "Obrigado! Um membro da equipe entrará em contato em até 24 horas para confirmar."
   - NÃO confirme agendamentos definitivos` : ''}

4. RESTRIÇÕES:
   - NÃO solicite documentos pessoais ou CPF
   - NÃO acesse dados de clientes ou processos
   - NÃO dê orientações jurídicas específicas
   - Encaminhe casos complexos para atendimento humano
   - Mantenha respostas curtas e diretas (máximo 3 parágrafos)

${config.custom_instructions ? `\nINSTRUÇÕES ADICIONAIS:\n${config.custom_instructions}` : ''}`;

            // Gerar resposta com OpenAI
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: messageText }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            const openaiData = await openaiResponse.json();
            const aiReply = openaiData.choices[0].message.content;

            // Enviar resposta via WhatsApp API
            const whatsappResponse = await fetch(
                `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.whatsapp_access_token}`
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: from,
                        text: { body: aiReply }
                    })
                }
            );

            if (!whatsappResponse.ok) {
                const error = await whatsappResponse.text();
                console.error('Erro ao enviar mensagem WhatsApp:', error);
            }

            return Response.json({ status: 'success' }, { status: 200 });

        } catch (error) {
            console.error('Erro ao processar webhook:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }
    }

    return Response.json({ error: 'Método não permitido' }, { status: 405 });
});