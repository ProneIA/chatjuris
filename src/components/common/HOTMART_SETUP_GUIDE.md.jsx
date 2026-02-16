# 🚀 GUIA DE CONFIGURAÇÃO HOTMART - SISTEMA COMPLETO

## 📋 ÍNDICE
1. [Visão Geral do Sistema](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Criar Produtos na Hotmart](#criar-produtos)
4. [Configurar Webhook](#configurar-webhook)
5. [Testar Integração](#testar-integração)
6. [Monitoramento](#monitoramento)

---

## 🎯 VISÃO GERAL DO SISTEMA

### Planos Implementados

| Plano | Duração | Preço | Tipo | Renovação |
|-------|---------|-------|------|-----------|
| **TESTE** | 7 dias | R$ 0,00 | Gratuito | Não renova |
| **MENSAL** | 30 dias | R$ 119,90 | Recorrente | Automática |
| **ANUAL** | 365 dias | R$ 1.198,80 | Único | Manual |
| **VITALÍCIO** | Ilimitado | R$ 1.599,90 | Único | Nunca expira |

### Fluxo Automatizado

```
USUÁRIO → Escolhe Plano → Frontend

├─ TESTE: Ativa localmente (sem Hotmart)
│  └─ createTrialSubscription()
│
├─ MENSAL/ANUAL/VITALÍCIO: 
│  ├─ Redireciona para Hotmart Checkout
│  ├─ Usuário realiza pagamento
│  ├─ Hotmart envia Webhook
│  ├─ hotmartWebhook() processa
│  ├─ Subscription criada/atualizada
│  ├─ User sincronizado
│  └─ Email de confirmação enviado
│
└─ Sistema (CRON diário):
   ├─ Verifica expirações
   ├─ Sincroniza recorrentes
   └─ Envia alertas
```

---

## ⚙️ CONFIGURAÇÃO INICIAL

### 1. Criar Planos no Sistema (EXECUTAR UMA VEZ)

**Via função administrativa:**
```javascript
// Acesse como ADMIN
await base44.functions.invoke('adminSeedHotmartPlans', {});
```

Isso criará automaticamente os 4 planos no banco de dados:
- ✅ TESTE (gratuito, 7 dias)
- ✅ MENSAL (recorrente, R$ 119,90)
- ✅ ANUAL (único, R$ 1.198,80)
- ✅ VITALÍCIO (único, R$ 1.599,90)

---

## 🏪 CRIAR PRODUTOS NA HOTMART

### 1. Acessar Hotmart
- Login: https://app.hotmart.com
- Produtos → Criar Novo Produto

### 2. Produto 1: PLANO MENSAL (Recorrente)

**Configurações:**
- **Nome:** Juris Pro - Plano Mensal
- **Tipo:** Assinatura (Recorrente)
- **Valor:** R$ 119,90
- **Recorrência:** Mensal (30 dias)
- **Trial:** Não
- **Cancelamento:** Permitir a qualquer momento

**Copiar:**
- ✅ Product ID (ex: 12345678)
- ✅ URL de Checkout (ex: https://pay.hotmart.com/XXXXXXXX)

**Atualizar no sistema:**
```javascript
await base44.functions.invoke('adminGetHotmartPlans', {
  action: 'update',
  plan_id: '[ID_DO_PLANO_MENSAL]',
  plan_data: {
    hotmart_product_id: '12345678',
    hotmart_checkout_url: 'https://pay.hotmart.com/XXXXXXXX'
  }
});
```

---

### 3. Produto 2: PLANO ANUAL (Não Recorrente)

**Configurações:**
- **Nome:** Juris Pro - Plano Anual
- **Tipo:** Produto Digital (NÃO recorrente)
- **Valor:** R$ 1.198,80
- **Parcelamento:** Até 12x
- **Validade:** Sem limite

**Copiar e atualizar igual ao Mensal**

---

### 4. Produto 3: PLANO VITALÍCIO

**Configurações:**
- **Nome:** Juris Pro - Acesso Vitalício
- **Tipo:** Produto Digital (NÃO recorrente)
- **Valor:** R$ 1.599,90
- **Parcelamento:** Até 12x sem juros
- **Validade:** Sem limite

**URL atual já configurada:** `https://pay.hotmart.com/L104287363X`

---

## 🔗 CONFIGURAR WEBHOOK NA HOTMART

### 1. Acessar Configurações
- Hotmart → Configurações → Integrações → Webhooks

### 2. Criar Novo Webhook

**URL do Webhook:**
```
https://[SEU_DOMINIO]/api/backend/hotmartWebhook
```

**Exemplo:**
```
https://chatjuris.com/api/backend/hotmartWebhook
```

**Eventos a marcar:**
- ✅ PURCHASE_COMPLETE
- ✅ PURCHASE_APPROVED
- ✅ PURCHASE_CANCELED
- ✅ PURCHASE_REFUNDED
- ✅ SUBSCRIPTION_CANCELLATION
- ✅ SUBSCRIPTION_PAYMENT_APPROVED
- ✅ PURCHASE_DELAYED
- ✅ PURCHASE_EXPIRED

**Versão:** V2 (mais recente)

### 3. Autenticação

**Hotmart envia header:**
```
x-hotmart-hottok: [TOKEN]
```

**Validação no backend:**
```javascript
const hotmartToken = req.headers.get('x-hotmart-hottok');
const expectedToken = Deno.env.get('HOTMART_BASIC_TOKEN');

if (hotmartToken !== expectedToken) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Configurar secret:**
- Dashboard → Secrets → HOTMART_BASIC_TOKEN

---

## 🧪 TESTAR INTEGRAÇÃO

### Teste 1: Trial Gratuito (Local)
1. Criar nova conta
2. Ir em `/Pricing`
3. Clicar "Teste Grátis 7 Dias"
4. ✅ Verificar acesso liberado imediatamente
5. ✅ Verificar `User.subscription_status = 'trial'`

### Teste 2: Plano Pago (Sandbox Hotmart)
1. Usar Hotmart Sandbox
2. Comprar plano MENSAL/ANUAL/VITALÍCIO
3. Hotmart envia webhook de teste
4. ✅ Verificar logs do webhook
5. ✅ Verificar Subscription criada
6. ✅ Verificar User sincronizado
7. ✅ Verificar email enviado

### Teste 3: Cancelamento
1. Cancelar assinatura na Hotmart
2. Webhook `SUBSCRIPTION_CANCELLATION` enviado
3. ✅ Verificar status atualizado para 'canceled'

---

## 📊 MONITORAMENTO

### Dashboard Admin
- **URL:** `/AdminPanel`
- Ver todas assinaturas ativas
- Histórico de transações
- Logs de auditoria

### Logs em Tempo Real
```javascript
// Ver logs do webhook
console.log('Webhook Hotmart recebido:', payload);

// Ver transações processadas
const transactions = await base44.entities.HotmartTransaction.list();
```

### CRON Jobs Configurados

**1. Verificar Expirações (02:00 diariamente)**
- Função: `checkExpiredSubscriptions`
- Bloqueia trials/assinaturas expiradas

**2. Sincronizar Assinaturas (03:00 diariamente)**
- Função: `syncHotmartSubscriptions`
- Verifica status de assinaturas recorrentes
- Envia alertas 7 dias antes da expiração

---

## 🔐 SEGURANÇA

### Validações Implementadas
✅ Token Hotmart validado em todos os webhooks
✅ Idempotência (previne duplicação de transações)
✅ Product ID validado contra planos configurados
✅ Logs de auditoria em todas as operações
✅ User sincronizado automaticamente
✅ Subscription isolada por usuário (RLS)

### Dados Sensíveis
- ✅ HOTMART_BASIC_TOKEN armazenado em secrets
- ✅ Tokens nunca expostos no frontend
- ✅ Webhook usa HTTPS obrigatório

---

## 📧 EMAILS AUTOMÁTICOS

### Enviados automaticamente:
1. **Compra aprovada:** Boas-vindas + detalhes do plano
2. **7 dias antes de expirar:** Alerta de renovação (anual)
3. **Assinatura cancelada:** Confirmação de cancelamento
4. **Pagamento recusado:** Notificação de falha

---

## 🐛 TROUBLESHOOTING

### Problema: Webhook não está sendo recebido
**Solução:**
1. Verificar URL configurada na Hotmart
2. Testar URL manualmente: `curl -X POST [URL_WEBHOOK]`
3. Verificar logs do servidor
4. Verificar se HOTMART_BASIC_TOKEN está configurado

### Problema: Pagamento aprovado mas acesso não liberado
**Solução:**
1. Verificar logs do webhook: `console.log` no backend
2. Verificar se usuário existe no banco
3. Verificar se `plan_type` foi detectado corretamente
4. Verificar se Subscription foi criada
5. Verificar se User foi sincronizado

### Problema: Assinatura não expira automaticamente
**Solução:**
1. Verificar se CRON job está rodando: `/AdminPanel` → Logs
2. Rodar manualmente: `await base44.functions.invoke('checkExpiredSubscriptions', {})`

---

## 📝 CHECKLIST DE DEPLOY

- [ ] Criar 4 produtos na Hotmart
- [ ] Copiar Product IDs e URLs de checkout
- [ ] Atualizar planos no banco via `adminSeedHotmartPlans`
- [ ] Configurar webhook na Hotmart
- [ ] Definir secret `HOTMART_BASIC_TOKEN`
- [ ] Testar trial gratuito
- [ ] Testar compra sandbox
- [ ] Verificar CRON jobs ativos
- [ ] Testar email de confirmação
- [ ] Monitorar logs por 48h

---

## 🎉 SISTEMA PRONTO!

Após seguir este guia, o sistema estará **100% automatizado**:
- Usuários podem comprar diretamente
- Pagamentos são processados pela Hotmart
- Acessos são liberados automaticamente
- Emails são enviados automaticamente
- Expirações são gerenciadas automaticamente

**Zero intervenção manual necessária! 🚀**