# 🚀 Leads4you - Arquitetura SaaS Completa

## 📋 Visão Geral

Transformação do Leads4you em um SaaS automatizado com planos, integração de pagamentos e automação completa do WhatsApp (WAHA).

---

## 💎 Sistema de Planos

### **1. Plano DEMO** (Gratuito)
- ✅ 5 buscas de leads no Google Maps
- ❌ Disparador WhatsApp bloqueado
- ⏰ Válido por 7 dias
- 🎯 Objetivo: Testar a ferramenta

### **2. Plano FREE** (Gratuito)
- ✅ 50 buscas de leads/mês
- ❌ Disparador WhatsApp bloqueado
- 🔄 Reset mensal automático
- 🎯 Objetivo: Uso básico contínuo

### **3. Plano PRO** (Pago via Kiwify - R$ 97/mês)
- ✅ Buscas ilimitadas de leads
- ✅ Disparador WhatsApp completo
- ✅ Instância WAHA automatizada
- ✅ Conexão QR Code simplificada
- ✅ Suporte por email
- 🎯 Objetivo: Uso profissional

### **4. Plano ENTERPRISE** (Pago via Kiwify - R$ 297/mês)
- ✅ Tudo do Pro
- ✅ Múltiplas instâncias WhatsApp
- ✅ API dedicada
- ✅ Suporte prioritário
- ✅ Whitelabel (opcional)
- 🎯 Objetivo: Agências e empresas

---

## 🔐 Automação WAHA (WhatsApp)

### **Problema Atual:**
Usuário precisa:
1. Ter servidor WAHA próprio
2. Configurar URL manualmente
3. Inserir API Key
4. Gerenciar instâncias

### **Solução Automatizada:**

#### **Ao Criar Conta Pro/Enterprise:**
```
1. Backend cria instância WAHA automaticamente
   Nome: user_{user_id}_{random_5_chars}
   Exemplo: user_abc123_x9k2m

2. Armazena credenciais no Supabase:
   - waha_instance_id
   - waha_api_key (gerada automaticamente)
   - waha_status: 'pending' | 'connected' | 'disconnected'

3. Usuário vai em "Conectar WhatsApp"
4. Sistema mostra QR Code automaticamente
5. Escaneia com WhatsApp
6. Pronto! Conectado.
```

#### **Fluxo Simplificado:**
```
┌─────────────────────────────────────┐
│ Usuário Paga Plano Pro             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Webhook Kiwify → Backend            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Backend Cria Instância WAHA         │
│ POST /api/sessions                  │
│ Name: user_{id}_{random}            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Salva Credenciais no Supabase       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Usuário Acessa "Conectar WhatsApp"  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Frontend Chama: GET /qrcode         │
│ Backend Retorna QR Code da Instância│
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Usuário Escaneia com WhatsApp       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ ✅ Conectado! Status: 'connected'  │
└─────────────────────────────────────┘
```

---

## 💳 Integração Kiwify (Pagamentos)

### **Webhook Kiwify:**
```python
@app.post("/api/webhook/kiwify")
async def kiwify_webhook(data: dict):
    """
    Recebe notificação de:
    - Compra aprovada
    - Renovação
    - Cancelamento
    - Reembolso
    """
    event_type = data.get("event")
    
    if event_type == "purchase.approved":
        # Upgrade para Pro
        user_email = data.get("customer_email")
        await upgrade_user_to_pro(user_email)
        await create_waha_instance(user_email)
    
    elif event_type == "subscription.canceled":
        # Downgrade para Free
        await downgrade_user(user_email)
        await disable_waha_instance(user_email)
```

### **Produtos Kiwify:**
1. **Leads4you Pro** - R$ 97/mês (recorrente)
2. **Leads4you Enterprise** - R$ 297/mês (recorrente)

---

## 📊 Sistema de Quotas (Limites)

### **Tabela Supabase: `user_quotas`**
```sql
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  company_id UUID REFERENCES companies(id),
  
  -- Limites
  plan_type VARCHAR(20) DEFAULT 'demo', -- 'demo', 'free', 'pro', 'enterprise'
  leads_limit INTEGER DEFAULT 5,
  leads_used INTEGER DEFAULT 0,
  
  campaigns_limit INTEGER DEFAULT 0, -- 0 = bloqueado
  campaigns_used INTEGER DEFAULT 0,
  
  messages_limit INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  
  -- Controle
  reset_date DATE, -- Data do próximo reset
  plan_expires_at TIMESTAMPTZ, -- Para plano demo
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Middleware de Verificação:**
```python
async def check_quota(user_id: str, action: str):
    """
    Verifica se o usuário pode executar a ação
    action: 'lead_search', 'campaign_send'
    """
    quota = await db.get_user_quota(user_id)
    
    if action == 'lead_search':
        if quota.leads_used >= quota.leads_limit:
            raise HTTPException(
                status_code=403,
                detail="Limite de buscas atingido. Faça upgrade do plano."
            )
        await db.increment_quota(user_id, 'leads_used')
    
    elif action == 'campaign_send':
        if quota.campaigns_limit == 0:
            raise HTTPException(
                status_code=403,
                detail="Disparador disponível apenas no Plano Pro. Faça upgrade!"
            )
```

---

## 🎨 Novas Páginas/Componentes

### **1. Página de Planos** (`/plans`)
- Grid com 4 planos
- Botão "Upgrade" que redireciona para Kiwify
- Comparação de features
- Badge "Plano Atual"

### **2. Modal de Limite Atingido**
- Aparece quando atinge o limite
- "Você usou 5/5 buscas este mês"
- Botão "Ver Planos"

### **3. Página WhatsApp Connect** (`/whatsapp-connect`)
- Substituir Settings atual
- Apenas QR Code + Status
- "Escanear QR Code para conectar"
- Status: Desconectado | Conectando | Conectado ✅

### **4. Dashboard de Uso**
- Barra de progresso: "3/5 buscas usadas"
- "2/∞ mensagens enviadas" (Pro)
- Link "Gerenciar Plano"

---

## 🔧 APIs Backend Necessárias

### **Quotas:**
```
GET  /api/quotas/me - Ver minhas quotas
POST /api/quotas/check - Verificar se pode executar ação
```

### **WAHA Automatizado:**
```
POST   /api/waha/create-instance - Criar instância (interno)
GET    /api/waha/qrcode - Obter QR Code
GET    /api/waha/status - Status da conexão
DELETE /api/waha/disconnect - Desconectar
```

### **Planos:**
```
GET  /api/plans - Listar planos disponíveis
GET  /api/plans/current - Ver plano atual
POST /api/plans/upgrade - Gerar link de pagamento Kiwify
```

### **Webhook:**
```
POST /api/webhook/kiwify - Receber notificações Kiwify
```

---

## 📅 Roadmap de Implementação

### **Fase 1: Sistema de Quotas** (2-3 horas)
- [ ] Migration: tabela `user_quotas`
- [ ] Backend: CRUD de quotas
- [ ] Middleware: verificação de limites
- [ ] Frontend: Barra de uso no Dashboard

### **Fase 2: Página de Planos** (2 horas)
- [ ] Componente de card de plano
- [ ] Página `/plans` com grid
- [ ] Modal de limite atingido
- [ ] Badge "Plano Atual" no Header

### **Fase 3: Automação WAHA** (3-4 horas)
- [ ] Backend: API criar instância automática
- [ ] Backend: API QR Code
- [ ] Frontend: Página WhatsApp Connect
- [ ] Simplificar Settings (remover campos manuais)

### **Fase 4: Integração Kiwify** (2 horas)
- [ ] Webhook endpoint
- [ ] Lógica de upgrade/downgrade
- [ ] Teste com webhook simulator

### **Fase 5: Polimento** (2 horas)
- [ ] Emails de boas-vindas
- [ ] Email de limite atingido
- [ ] Testes E2E completos
- [ ] Documentação

**TOTAL: ~15 horas de desenvolvimento**

---

## 💰 Estimativa de Receita

### **Cenário Conservador:**
- 100 usuários Demo/Free
- 10 conversões Pro/mês (10% taxa) = R$ 970/mês
- 2 conversões Enterprise/mês = R$ 594/mês
- **Total: R$ 1.564/mês**

### **Cenário Otimista (6 meses):**
- 500 usuários Demo/Free
- 50 Pro (10% taxa) = R$ 4.850/mês
- 10 Enterprise = R$ 2.970/mês
- **Total: R$ 7.820/mês**

---

## 🎯 Próximos Passos Imediatos

1. ✅ **Confirmar arquitetura** com você
2. ✅ **Escolher fase para começar** (recomendo: Fase 1)
3. ✅ **Configurar Kiwify** (criar produtos)
4. ✅ **Configurar servidor WAHA** (URL base para instâncias)
5. 🚀 **Iniciar desenvolvimento**

---

## ❓ Perguntas para Você

1. **Servidor WAHA**: Você já tem um servidor WAHA rodando? Qual URL?
2. **Kiwify**: Já tem conta? Preciso do webhook URL
3. **Valores**: R$ 97 e R$ 297 ok? Ou prefere outros valores?
4. **Limites Demo**: 5 buscas ok? 7 dias de validade ok?
5. **Limites Free**: 50 buscas/mês ok?
6. **Fase Inicial**: Começar por qual fase? (Recomendo 1)

---

Pronto para transformar o Leads4you em um SaaS lucrativo! 🚀
