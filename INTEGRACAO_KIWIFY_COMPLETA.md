# 🎯 INTEGRAÇÃO KIWIFY + SISTEMA DE SEGURANÇA

**Data:** 31 de Janeiro de 2025  
**Objetivo:** Monetização + Segurança contra cancelamentos/reembolsos

---

## ✅ O QUE FOI IMPLEMENTADO

### **1. Modal de Quota Melhorado**
- ✅ Planos completos com preços
- ✅ Descrição detalhada de features
- ✅ Botões diretos para Kiwify
- ✅ Visual moderno com cards
- ✅ Badges de segurança

**Arquivo:** `/app/frontend/src/components/QuotaLimitModal.tsx`

### **2. Webhook Kiwify**
- ✅ Endpoint `/api/webhook/kiwify`
- ✅ Processa 3 eventos:
  - `order.paid` → Upgrade automático
  - `order.refunded` → Downgrade automático
  - `subscription.canceled` → Downgrade automático
- ✅ Verificação de assinatura HMAC
- ✅ Logs de auditoria

**Arquivo:** `/app/backend/kiwify_webhook.py`

### **3. Sistema de Segurança**
- ✅ Tabela `webhook_logs` (auditoria)
- ✅ Tabela `payment_history` (histórico)
- ✅ Campos de controle em `user_quotas`:
  - `subscription_id`
  - `order_id`
  - `subscription_status`
  - `cancellation_reason`
- ✅ Função `check_subscription_active()`
- ✅ Função `expire_subscriptions()` (cron)
- ✅ View `active_subscriptions`

**Arquivo:** `/app/frontend/supabase/migrations/20260131_kiwify_integration.sql`

### **4. Rota /pricing Removida**
- ✅ Rota removida do App.tsx
- ✅ Preços ficam só na landing page
- ✅ Modal aparece quando limite é atingido

---

## 📋 CONFIGURAÇÃO NO KIWIFY

### **PASSO 1: Criar Produtos**

1. **Acesse:** Painel Kiwify → Produtos

2. **Crie 2 produtos:**

**Produto 1: Plano Pro**
- Nome: Leads4You - Plano Pro
- Preço: R$ 97,00
- Recorrência: Mensal
- Copie o **Product ID** (ex: `prod_abc123`)

**Produto 2: Plano Enterprise**
- Nome: Leads4You - Plano Enterprise
- Preço: R$ 297,00
- Recorrência: Mensal
- Copie o **Product ID** (ex: `prod_xyz789`)

### **PASSO 2: Configurar Links de Pagamento**

1. Kiwify → Produtos → [Seu Produto] → Página de Vendas
2. Copie o **Link de Pagamento**

**Exemplo:**
- Pro: `https://pay.kiwify.com.br/abc123`
- Enterprise: `https://pay.kiwify.com.br/xyz789`

3. **Atualize no código:**

Edite `/app/frontend/src/components/QuotaLimitModal.tsx`:

```typescript
const KIWIFY_PRO_URL = "https://pay.kiwify.com.br/SEU_LINK_PRO";
const KIWIFY_ENTERPRISE_URL = "https://pay.kiwify.com.br/SEU_LINK_ENTERPRISE";
```

### **PASSO 3: Configurar IDs dos Produtos**

Edite `/app/backend/kiwify_webhook.py`:

```python
PRODUCT_PLAN_MAP = {
    'prod_abc123': 'Pro',           # ID real do produto Pro
    'prod_xyz789': 'Enterprise'     # ID real do produto Enterprise
}
```

### **PASSO 4: Configurar Webhook**

1. **Kiwify → Configurações → Webhooks**

2. **Adicione novo webhook:**
   - **URL:** `https://seu-dominio.com/api/webhook/kiwify`
   - **Eventos:**
     - ✅ Pedido Aprovado (`order.paid`)
     - ✅ Pedido Reembolsado (`order.refunded`)
     - ✅ Assinatura Cancelada (`subscription.canceled`)

3. **Secret (opcional):**
   - Gere um secret aleatório (32+ caracteres)
   - Adicione no backend `.env`: `KIWIFY_WEBHOOK_SECRET="seu_secret"`

---

## 🔐 CONFIGURAÇÃO DO BACKEND

### **1. Atualizar .env**

Edite `/app/backend/.env`:

```bash
# Webhook Kiwify
KIWIFY_WEBHOOK_SECRET="your_kiwify_webhook_secret_here"
```

### **2. Restart Backend**

```bash
sudo supervisorctl restart backend
```

---

## 🗄️ EXECUTAR MIGRATION NO SUPABASE

### **SQL Editor:**

1. Supabase → SQL Editor → New query
2. Copie: `/app/frontend/supabase/migrations/20260131_kiwify_integration.sql`
3. Execute

### **O que cria:**
- ✅ Campos novos em `user_quotas`
- ✅ Tabela `webhook_logs`
- ✅ Tabela `payment_history`
- ✅ Funções SQL
- ✅ RLS Policies

---

## 🧪 TESTAR O SISTEMA

### **Teste 1: Modal de Quota**

1. Crie usuário plano Demo
2. Use todas as 5 buscas
3. Tente buscar novamente
4. Modal deve aparecer com planos

### **Teste 2: Webhook (Modo Teste)**

**Endpoint de teste:**
```bash
curl https://seu-dominio.com/api/webhook/test
```

**Simular pagamento aprovado:**
```bash
curl -X POST https://seu-dominio.com/api/webhook/kiwify \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "order.paid",
    "order_id": "ORDER123",
    "product_id": "prod_abc123",
    "product_name": "Plano Pro",
    "customer_email": "usuario@teste.com",
    "customer_name": "Usuário Teste",
    "amount": 97.00,
    "subscription_id": "SUB123",
    "created_at": "2025-01-31T10:00:00Z"
  }'
```

**Verificar:**
1. Supabase → `webhook_logs` → Ver registro
2. Supabase → `user_quotas` → Usuário deve ter `plan='Pro'`

### **Teste 3: Cancelamento**

```bash
curl -X POST https://seu-dominio.com/api/webhook/kiwify \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "subscription.canceled",
    "order_id": "ORDER123",
    "subscription_id": "SUB123",
    "customer_email": "usuario@teste.com",
    "canceled_at": "2025-01-31T11:00:00Z"
  }'
```

**Verificar:**
- Usuário deve voltar para `plan='Demo'`
- `subscription_status='canceled'`

---

## 🔄 FLUXO COMPLETO

### **1. Usuário Atinge Limite**
```
User tenta buscar leads → Quota esgotada
↓
Modal aparece com planos Pro e Enterprise
↓
User clica "Assinar Plano Pro"
↓
Redireciona para Kiwify
```

### **2. Pagamento no Kiwify**
```
User preenche dados no Kiwify
↓
Pagamento aprovado
↓
Kiwify envia webhook: order.paid
↓
Backend recebe webhook
↓
Busca user pelo email
↓
Atualiza quota: plan='Pro', subscription_status='active'
↓
User pode usar sistema ilimitadamente
```

### **3. Cancelamento**
```
User cancela no Kiwify
↓
Kiwify envia webhook: subscription.canceled
↓
Backend recebe webhook
↓
Downgrade automático: plan='Demo'
↓
User volta para limitações
```

### **4. Reembolso**
```
User pede reembolso
↓
Kiwify aprova reembolso
↓
Kiwify envia webhook: order.refunded
↓
Backend processa
↓
Downgrade + Registro do motivo
```

---

## 🔒 SEGURANÇA IMPLEMENTADA

### **Validações:**
- ✅ Verificação de assinatura HMAC
- ✅ Validação de email do usuário
- ✅ Verificação de ownership (company_id)
- ✅ Logs de auditoria

### **Proteções:**
- ✅ RLS no banco (users só veem próprios dados)
- ✅ Webhook secret para prevenir spoofing
- ✅ Status de assinatura rastreado
- ✅ Histórico completo de pagamentos

### **Auto-expiração:**
Cron job (configurar no servidor):
```bash
# Rodar diariamente às 2am
0 2 * * * psql -d seu_db -c "SELECT expire_subscriptions();"
```

Ou usar Supabase Cron:
```sql
SELECT cron.schedule(
  'expire-subscriptions',
  '0 2 * * *',  -- 2am diariamente
  $$SELECT expire_subscriptions()$$
);
```

---

## 📊 MONITORAMENTO

### **Dashboard Admin (a criar):**

Ver em tempo real:
- Assinaturas ativas
- Cancelamentos do mês
- Receita recorrente (MRR)
- Churn rate

**Query exemplo:**
```sql
SELECT 
  plan,
  subscription_status,
  COUNT(*) as total,
  SUM(CASE WHEN plan='Pro' THEN 97 ELSE 297 END) as mrr
FROM user_quotas
WHERE subscription_status = 'active'
GROUP BY plan, subscription_status;
```

---

## 📝 CHECKLIST DE CONFIGURAÇÃO

### **Backend:**
- [ ] Migration executada no Supabase
- [ ] KIWIFY_WEBHOOK_SECRET configurado
- [ ] IDs dos produtos atualizados
- [ ] Backend reiniciado

### **Frontend:**
- [ ] Links de pagamento atualizados
- [ ] Modal testado
- [ ] Rota /pricing removida

### **Kiwify:**
- [ ] Produtos criados
- [ ] Webhook configurado
- [ ] URL correta apontando para API

### **Testes:**
- [ ] Modal aparece quando quota acaba
- [ ] Webhook responde corretamente
- [ ] Upgrade funciona
- [ ] Downgrade funciona

---

## 🎉 RESULTADO FINAL

**Sistema Completo:**
- ✅ Monetização automatizada
- ✅ Upgrade/downgrade automático
- ✅ Proteção contra cancelamento/reembolso
- ✅ Auditoria completa
- ✅ Modal profissional

**Pronto para produção!** 🚀

---

## 📞 SUPORTE

**Logs webhook:**
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 50;
```

**Ver assinaturas ativas:**
```sql
SELECT * FROM active_subscriptions;
```

**Ver histórico de pagamentos:**
```sql
SELECT * FROM payment_history WHERE user_id = 'USER_ID';
```
