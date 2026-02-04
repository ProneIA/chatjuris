import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Buscar configuração do usuário
        const configs = await base44.entities.WhatsAppAgentConfig.filter({ created_by: user.email });
        
        if (configs.length === 0) {
            return Response.json({ error: 'Nenhuma configuração encontrada. Configure seu assistente primeiro.' }, { status: 404 });
        }

        const config = configs[0];

        // Construir instruções personalizadas
        const toneMap = {
            formal: "Mantenha um tom formal e corporativo em todas as interações.",
            amigavel: "Seja amigável, descontraído e acolhedor nas conversas.",
            profissional: "Mantenha um tom profissional, mas acessível e cordial."
        };

        const servicesText = config.services_offered?.length > 0 
            ? `\n\nServiços oferecidos:\n${config.services_offered.map(s => `- ${s}`).join('\n')}`
            : '';

        const instructions = `Você é ${config.agent_name}, assistente virtual de ${config.office_name}.

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

${config.custom_instructions ? `\nINSTRUÇÕES ADICIONAIS:\n${config.custom_instructions}` : ''}`;

        const greeting = config.greeting_message || `Olá! 👋 Sou ${config.agent_name} de ${config.office_name}.\n\nComo posso ajudá-lo(a) hoje?`;

        // Criar o agente dinâmico
        const agentConfig = {
            description: `Assistente personalizado de ${config.office_name}`,
            instructions: instructions,
            tool_configs: [],
            whatsapp_greeting: greeting
        };

        return Response.json({ 
            success: true, 
            agent_name: config.agent_name.toLowerCase().replace(/\s+/g, '_'),
            config: agentConfig,
            message: 'Configuração do agente sincronizada com sucesso'
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});