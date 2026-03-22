import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Coletar todos os dados do usuário
    const userData = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_date: user.created_date
      },
      exported_at: new Date().toISOString(),
      export_format: 'JSON',
      lgpd_compliance: 'Art. 18º, inciso II - Direito à portabilidade'
    };

    // Buscar dados de todas as entidades relacionadas ao usuário
    try {
      userData.clients = await base44.entities.Client.filter({ created_by: user.email });
    } catch (e) {
      userData.clients = [];
    }

    try {
      userData.cases = await base44.entities.Case.filter({ created_by: user.email });
    } catch (e) {
      userData.cases = [];
    }

    try {
      userData.documents = await base44.entities.LegalDocument.filter({ created_by: user.email });
    } catch (e) {
      userData.documents = [];
    }

    try {
      userData.tasks = await base44.entities.Task.filter({ created_by: user.email });
    } catch (e) {
      userData.tasks = [];
    }

    try {
      userData.templates = await base44.entities.Template.filter({ created_by: user.email });
    } catch (e) {
      userData.templates = [];
    }

    try {
      userData.conversations = await base44.entities.Conversation.filter({ created_by: user.email });
    } catch (e) {
      userData.conversations = [];
    }

    try {
      userData.subscription = await base44.entities.Subscription.filter({ user_id: user.id });
    } catch (e) {
      userData.subscription = [];
    }

    try {
      userData.consents = await base44.entities.UserConsent.filter({ user_email: user.email });
    } catch (e) {
      userData.consents = [];
    }

    try {
      userData.audit_logs = await base44.entities.AuditLog.filter({ user_email: user.email }, '-created_date', 100);
    } catch (e) {
      userData.audit_logs = [];
    }

    // Registrar log de exportação
    try {
      await base44.entities.AuditLog.create({
        user_email: user.email,
        action: 'Exportação de Dados',
        details: 'Usuário exportou todos os seus dados pessoais (Art. 18º LGPD)'
      });
    } catch (e) {
      console.error('Erro ao registrar log:', e);
    }

    return Response.json(userData);

  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});