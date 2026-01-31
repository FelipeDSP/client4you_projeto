# 🛒 GUIA COMPLETO: Configuração do Kiwify

## 📋 Planos a Criar

| Plano | Preço | Recursos |
|-------|-------|----------|
| Básico | R$ 39,90/mês | Leads ilimitado, SEM Disparador |
| Intermediário | R$ 99,90/mês | Leads + Disparador WhatsApp |
| Avançado | R$ 199,90/mês | Tudo + IA (em breve) |

---

## 📝 Passo a Passo

### **PASSO 1: Acessar o Painel Kiwify**
1. Acesse: https://dashboard.kiwify.com.br/
2. Faça login na sua conta

---

### **PASSO 2: Criar Produto - Plano Básico (R$ 39,90/mês)**

1. Clique em **"Produtos"** → **"Criar produto"**
2. Selecione **"Assinatura"** (recorrente mensal)
3. Preencha:
   - **Nome:** `Leads4You - Plano Básico`
   - **Descrição:**
   ```
   Plano Básico do Leads4You
   
   ✅ Extrator de Leads Ilimitado
   ✅ Exportar para Excel/CSV
   ✅ Histórico de buscas
   ✅ Suporte por email
   ```
   - **Preço:** R$ 39,90
   - **Recorrência:** Mensal
   - **Página de vendas:** `https://email-config-setup-2.preview.emergentagent.com`

4. Clique em **"Criar produto"**
5. **ANOTE O ID DO PRODUTO** (aparece na URL)

---

### **PASSO 3: Criar Produto - Plano Intermediário (R$ 99,90/mês)**

1. Clique em **"Criar produto"** novamente
2. Selecione **"Assinatura"**
3. Preencha:
   - **Nome:** `Leads4You - Plano Intermediário`
   - **Descrição:**
   ```
   Plano Intermediário do Leads4You - O MAIS POPULAR!
   
   ✅ Tudo do Plano Básico +
   ✅ Disparador de Campanhas WhatsApp Ilimitado
   ✅ Conexão WhatsApp automatizada
   ✅ Upload de listas de contatos
   ✅ Agendamento de mensagens
   ✅ Suporte prioritário
   ```
   - **Preço:** R$ 99,90
   - **Recorrência:** Mensal
   - **Página de vendas:** `https://email-config-setup-2.preview.emergentagent.com`

4. **ANOTE O ID DO PRODUTO**

---

### **PASSO 4: Criar Produto - Plano Avançado (R$ 199,90/mês)**

1. Clique em **"Criar produto"**
2. Selecione **"Assinatura"**
3. Preencha:
   - **Nome:** `Leads4You - Plano Avançado`
   - **Descrição:**
   ```
   Plano Avançado do Leads4You - Solução Completa com IA!
   
   ✅ Tudo do Plano Intermediário +
   ✅ Agente de IA Personalizado (em breve)
   ✅ Automações avançadas com IA
   ✅ Respostas automáticas inteligentes
   ✅ Múltiplas instâncias WhatsApp
   ✅ API de integração
   ✅ Suporte dedicado
   ```
   - **Preço:** R$ 199,90
   - **Recorrência:** Mensal
   - **Página de vendas:** `https://email-config-setup-2.preview.emergentagent.com`

4. **ANOTE O ID DO PRODUTO**

---

### **PASSO 5: Obter Links de Pagamento**

Para cada produto criado:
1. Vá em **Produtos** → Clique no produto
2. Acesse **"Checkout"** ou **"Página de Vendas"**
3. Copie o **Link de pagamento**

---

### **PASSO 6: Configurar Webhook**

1. Vá em **Configurações** → **Webhooks**
2. Clique em **"+ Adicionar webhook"**
3. Configure:
   - **URL:** `https://SEU_DOMINIO.com/api/webhook/kiwify`
   - **Eventos:**
     - ✅ `order.paid` (Pedido aprovado)
     - ✅ `order.refunded` (Pedido reembolsado)
     - ✅ `subscription.canceled` (Assinatura cancelada)

4. **Gere um Secret** (recomendado, 32+ caracteres)
5. **ANOTE O SECRET**

---

## 📤 Me Envie as Informações

Após completar, me envie:

```
📦 CONFIGURAÇÃO KIWIFY - LEADS4YOU

1. ID Produto BÁSICO: _________________
2. ID Produto INTERMEDIÁRIO: _________________
3. ID Produto AVANÇADO: _________________

4. Link Pagamento BÁSICO: https://pay.kiwify.com.br/_______
5. Link Pagamento INTERMEDIÁRIO: https://pay.kiwify.com.br/_______
6. Link Pagamento AVANÇADO: https://pay.kiwify.com.br/_______

7. Webhook Secret: _________________

8. Domínio de produção: https://_________________
```

---

## 🔧 O Que Vou Configurar

Com essas informações, vou:

1. **Backend (`kiwify_webhook.py`):**
   - Mapear IDs dos produtos para os planos

2. **Frontend (`QuotaLimitModal.tsx`):**
   - Atualizar links de pagamento

3. **Backend (`.env`):**
   - Configurar `KIWIFY_WEBHOOK_SECRET`

---

## ⚠️ IMPORTANTE: Migration no Supabase

Antes de testar, execute no Supabase SQL Editor:

**Arquivo:** `/app/frontend/supabase/migrations/20260203_fix_rls_service_role.sql`

Isso corrige o bug de RLS que impede criar campanhas.

---

## 🧪 Como Testar

1. **Verificar webhook:**
```bash
curl https://seu-dominio.com/api/webhook/test
```

2. **Fazer compra teste no Kiwify:**
   - Ative modo sandbox
   - Faça uma compra
   - Verifique se o plano atualizou

---

## 📞 Suporte

Se tiver dúvidas, me avise!
