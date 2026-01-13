import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    console.log('Enviando email de teste...');

    await base44.asServiceRole.functions.invoke('sendNotificationEmail', {
      templateType: 'welcome',
      data: {
        userEmail: 'ld.andrade@outlook.com',
        userName: 'Lucas Andrade',
        planName: 'Juris Pro Anual'
      }
    });

    console.log('Email de teste enviado com sucesso!');

    return Response.json({ 
      success: true,
      message: 'Email enviado para ld.andrade@outlook.com'
    }, { headers });

  } catch (error) {
    console.error('Erro ao enviar email de teste:', error);
    return Response.json({ error: error.message }, { status: 500, headers });
  }
});