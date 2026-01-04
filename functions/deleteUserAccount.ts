import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Registrar log antes de excluir
    try {
      await base44.entities.AuditLog.create({
        user_email: user.email,
        action: 'Exclusão de Conta',
        details: 'Usuário solicitou exclusão permanente da conta (Art. 18º, VI LGPD)'
      });
    } catch (e) {
      console.error('Erro ao registrar log:', e);
    }

    // Usar service role para deletar todos os dados
    const deletePromises = [];

    try {
      const clients = await base44.entities.Client.filter({ created_by: user.email });
      for (const client of clients) {
        deletePromises.push(base44.asServiceRole.entities.Client.delete(client.id));
      }
    } catch (e) {}

    try {
      const cases = await base44.entities.Case.filter({ created_by: user.email });
      for (const c of cases) {
        deletePromises.push(base44.asServiceRole.entities.Case.delete(c.id));
      }
    } catch (e) {}

    try {
      const documents = await base44.entities.LegalDocument.filter({ created_by: user.email });
      for (const doc of documents) {
        deletePromises.push(base44.asServiceRole.entities.LegalDocument.delete(doc.id));
      }
    } catch (e) {}

    try {
      const tasks = await base44.entities.Task.filter({ created_by: user.email });
      for (const task of tasks) {
        deletePromises.push(base44.asServiceRole.entities.Task.delete(task.id));
      }
    } catch (e) {}

    try {
      const templates = await base44.entities.Template.filter({ created_by: user.email });
      for (const template of templates) {
        deletePromises.push(base44.asServiceRole.entities.Template.delete(template.id));
      }
    } catch (e) {}

    try {
      const conversations = await base44.entities.Conversation.filter({ created_by: user.email });
      for (const conv of conversations) {
        deletePromises.push(base44.asServiceRole.entities.Conversation.delete(conv.id));
      }
    } catch (e) {}

    try {
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      for (const sub of subs) {
        deletePromises.push(base44.asServiceRole.entities.Subscription.delete(sub.id));
      }
    } catch (e) {}

    try {
      const consents = await base44.entities.UserConsent.filter({ user_email: user.email });
      for (const consent of consents) {
        deletePromises.push(base44.asServiceRole.entities.UserConsent.delete(consent.id));
      }
    } catch (e) {}

    try {
      const logs = await base44.entities.AuditLog.filter({ user_email: user.email });
      for (const log of logs) {
        deletePromises.push(base44.asServiceRole.entities.AuditLog.delete(log.id));
      }
    } catch (e) {}

    // Executar todas as exclusões
    await Promise.all(deletePromises);

    // Nota: A exclusão do usuário da entidade User deve ser feita manualmente pelo admin
    // pois usuários não podem se auto-deletar da entidade User
    
    return Response.json({ 
      success: true, 
      message: 'Todos os dados foram excluídos. Por favor, contate o suporte para remover completamente sua conta de usuário.',
      deleted_items: deletePromises.length
    });

  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});