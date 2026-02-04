import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verifica se usuário está autenticado e tem assinatura ativa
 * @param {Request} req - Request do Deno
 * @returns {Promise<{authorized: boolean, user?: object, subscription?: object, error?: string}>}
 */
export async function requireActiveSubscription(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return { authorized: false, error: 'Não autenticado' };
    }

    // Buscar subscription do usuário
    const subs = await base44.asServiceRole.entities.Subscription.filter({ 
      user_id: user.id 
    });
    
    if (subs.length === 0) {
      return { authorized: false, error: 'Assinatura não encontrada' };
    }

    const subscription = subs[0];
    const today = new Date().toISOString().split('T')[0];

    // Verificar se subscription está ativa
    const hasActiveSubscription = subscription.status === 'active';
    
    // Verificar trial válido
    const isInValidTrial = user.trial_status === 'active' && 
                          subscription.status === 'trial' &&
                          user.trial_end_date >= today;

    if (!hasActiveSubscription && !isInValidTrial) {
      return { 
        authorized: false, 
        error: 'Assinatura inativa ou trial expirado',
        subscription
      };
    }

    return { 
      authorized: true, 
      user, 
      subscription 
    };
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return { 
      authorized: false, 
      error: `Erro de autenticação: ${error.message}` 
    };
  }
}

/**
 * Verifica se usuário é admin
 * @param {Request} req - Request do Deno
 * @returns {Promise<{authorized: boolean, user?: object, error?: string}>}
 */
export async function requireAdmin(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return { authorized: false, error: 'Não autenticado' };
    }

    if (user.role !== 'admin') {
      return { 
        authorized: false, 
        error: 'Acesso negado. Apenas administradores.' 
      };
    }

    return { authorized: true, user };
  } catch (error) {
    console.error('Erro no middleware de admin:', error);
    return { 
      authorized: false, 
      error: `Erro de autenticação: ${error.message}` 
    };
  }
}