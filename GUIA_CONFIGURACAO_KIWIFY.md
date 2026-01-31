# 🛒 GUIA COMPLETO: Configuração do Kiwify

## 📋 Passo a Passo para Criar Produtos no Kiwify

### **PASSO 1: Acessar o Painel Kiwify**
1. Acesse: https://dashboard.kiwify.com.br/
2. Faça login ou crie sua conta

---

### **PASSO 2: Criar Produto - Plano Pro (R$ 97/mês)**

1. No menu lateral, clique em **"Produtos"**
2. Clique no botão **"+ Criar produto"**
3. Selecione **"Assinatura"** (recorrente mensal)
4. Preencha:
   - **Nome do produto:** `Leads4You - Plano Pro`
   - **Descrição:** 
   ```
   Plano Pro do Leads4You - Sistema de Captura e Automação de Leads
   
   ✅ Buscas de Leads Ilimitadas
   ✅ Disparador de WhatsApp
   ✅ 1 Conexão WhatsApp
   ✅ Campanhas Ilimitadas
   ✅ Suporte Prioritário (24h)
   ```
   - **Preço:** R$ 97,00
   - **Recorrência:** Mensal
   
5. Clique em **"Criar produto"**
6. **ANOTE O ID DO PRODUTO** (aparece na URL ou nas configurações do produto)
   - Exemplo: `prod_abc123xyz`

---

### **PASSO 3: Criar Produto - Plano Enterprise (R$ 297/mês)**

1. Clique em **"+ Criar produto"** novamente
2. Selecione **"Assinatura"**
3. Preencha:
   - **Nome do produto:** `Leads4You - Plano Enterprise`
   - **Descrição:**
   ```
   Plano Enterprise do Leads4You - Sistema Completo para Empresas
   
   ✅ Tudo do Plano Pro +
   ✅ Até 5 Conexões WhatsApp
   ✅ Multi-Servidor (alta performance)
   ✅ Usuários Ilimitados na equipe
   ✅ Suporte VIP via WhatsApp
   ✅ Consultoria de implementação
   ```
   - **Preço:** R$ 297,00
   - **Recorrência:** Mensal

4. Clique em **"Criar produto"**
5. **ANOTE O ID DO PRODUTO** (ex: `prod_xyz789abc`)

---

### **PASSO 4: Obter Links de Pagamento**

Para cada produto:
1. Vá em **Produtos** → Clique no produto
2. Acesse **"Página de Vendas"** ou **"Checkout"**
3. Copie o **Link de pagamento**
   - Pro: `https://pay.kiwify.com.br/XXXXXXX`
   - Enterprise: `https://pay.kiwify.com.br/YYYYYYY`

---

### **PASSO 5: Configurar Webhook**

1. No painel Kiwify, vá em **Configurações** → **Webhooks**
2. Clique em **"+ Adicionar webhook"**
3. Configure:
   - **URL do webhook:** `https://SEU_DOMINIO.com/api/webhook/kiwify`
   - **Eventos a receber:**
     - ✅ `order.paid` (Pedido aprovado)
     - ✅ `order.refunded` (Pedido reembolsado)
     - ✅ `subscription.canceled` (Assinatura cancelada)
   
4. **Gere um Secret** (opcional mas recomendado):
   - Use um gerador de senha com 32+ caracteres
   - Exemplo: `kiwify_secret_a1b2c3d4e5f6g7h8i9j0...`
   - **ANOTE ESTE SECRET**

5. Clique em **"Salvar webhook"**

---

### **PASSO 6: Me Envie as Informações**

Após completar os passos acima, me envie:

```
📦 CONFIGURAÇÃO KIWIFY

1. ID do Produto PRO: prod_xxxxx
2. ID do Produto ENTERPRISE: prod_yyyyy
3. Link de Pagamento PRO: https://pay.kiwify.com.br/xxxxx
4. Link de Pagamento ENTERPRISE: https://pay.kiwify.com.br/yyyyy
5. Webhook Secret: kiwify_secret_xxxxx (se criou)
6. Seu domínio de produção: https://meudominio.com
```

---

## 🔧 O Que Vou Configurar

Com essas informações, vou:

1. **Backend (.env):**
   - Configurar `KIWIFY_WEBHOOK_SECRET`
   
2. **Backend (kiwify_webhook.py):**
   - Mapear IDs dos produtos para os planos corretos
   
3. **Frontend (QuotaLimitModal.tsx):**
   - Atualizar links de pagamento Pro e Enterprise

4. **Supabase:**
   - Executar migration de integração Kiwify
   - Criar tabelas de auditoria

---

## ⚠️ IMPORTANTE: Executar Migration no Supabase

Antes de testar, você precisa executar a migration no Supabase:

1. Acesse: https://supabase.com/dashboard/project/owlignktsqlrqaqhzujb
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo: `/app/frontend/supabase/migrations/20260203_fix_rls_service_role.sql`
4. Execute

Isso vai corrigir o bug de RLS que impedia criar campanhas.

---

## 🧪 Como Testar

Após configurar:

1. **Teste o webhook:**
```bash
curl https://seu-dominio.com/api/webhook/test
# Deve retornar: {"status": "ok", "message": "Webhook endpoint is working"}
```

2. **Teste de pagamento (modo sandbox):**
   - No Kiwify, ative modo de teste
   - Faça uma compra teste
   - Verifique se o plano foi atualizado no sistema

---

## 📞 Suporte

Se tiver dúvidas durante a configuração, me avise!
