# 🚀 GUIA DEFINITIVO DE DEPLOY - CLIENT4YOU

## ✅ VOCÊ TEM TUDO PRONTO!

Todas as credenciais de infraestrutura estão configuradas no arquivo `.env.production`.

---

## 📋 PASSO 1: CONFIGURAR DNS (5 minutos)

Acesse o painel da **Hostinger** e configure 3 registros DNS:

### Registros DNS necessários:

| Tipo | Nome | Aponta para | TTL |
|------|------|-------------|-----|
| A    | @    | 72.60.10.10 | 300 |
| A    | app  | 72.60.10.10 | 300 |
| A    | api  | 72.60.10.10 | 300 |

### Resultado:
- ✅ `client4you.com.br` → Redireciona para app
- ✅ `app.client4you.com.br` → Frontend
- ✅ `api.client4you.com.br` → Backend API

**Aguarde 5-15 minutos para propagação DNS**

---

## 🐳 PASSO 2: DEPLOY NO COOLIFY

### A) Acessar Coolify

1. Abra: `http://72.60.10.10:8000`
2. Faça login no Coolify

---

### B) Criar Projeto

1. Clique em **"+ New Project"**
2. **Name**: `client4you`
3. **Save**

---

### C) Deploy do BACKEND

1. No projeto, clique em **"+ New Resource"**
2. Selecione **"Application"**

#### **Configuração:**
```
Name: client4you-backend
Source: Git Repository ou Upload manual
Build Pack: Dockerfile
Dockerfile Location: backend/Dockerfile
Port: 8001
```

#### **Environment Variables:**

Cole TODAS as variáveis do arquivo `.env.production`:

```env
SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyNTMzMCwiZXhwIjoyMDgzOTAxMzMwfQ.b1Ecnc-MU1BOK5Q7OV8ZKTJV1Hv07eghq3qTBg5rKrM
SUPABASE_JWT_SECRET=eEPK7dTjJf1y00pgXH183WEf6FkjxFrXID7Sj9pdi9fUJ2QyOxHPvykBVwII4VJmsQiletkD41AMLOzTona8rQ==
WAHA_DEFAULT_URL=https://waha.chatyou.chat
WAHA_MASTER_KEY=PJ1X_5sPM2cgeAI3LB_ALOUPUyUkg9GjKvMZ7Leifi0
KIWIFY_SECRET=o21anhwe1w1
SMTP_HOST=mail.estudyou.com
SMTP_PORT=465
SMTP_USER=nao-responda@estudyou.com
SMTP_PASSWORD=dd273a83-1e07-40a6-bba9-5336df1b94fe
SMTP_FROM=nao-responda@estudyou.com
SMTP_FROM_NAME=Client4You - Plataforma de Leads
SMTP_USE_TLS=true
TURNSTILE_SECRET_KEY=0x4AAAAAACW4RI9ZshOaX_1cYx4vgnw15BE
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=1800
LOGIN_WINDOW_DURATION=900
CORS_ORIGINS=https://app.client4you.com.br,https://api.client4you.com.br,https://client4you.com.br
BACKEND_URL=https://api.client4you.com.br
FRONTEND_URL=https://app.client4you.com.br
```

#### **Domain:**
```
Domain: api.client4you.com.br
Generate SSL Certificate: ✅ (Marcar)
```

#### **Deploy:**
1. Clique em **"Deploy"**
2. Aguarde 5-10 minutos (logs em tempo real)
3. ✅ Backend funcionando!

---

### D) Deploy do FRONTEND

1. No projeto, clique em **"+ New Resource"**
2. Selecione **"Application"**

#### **Configuração:**
```
Name: client4you-frontend
Source: Mesmo repositório/upload
Build Pack: Dockerfile
Dockerfile Location: frontend/Dockerfile
Port: 3000
```

#### **Environment Variables:**

Cole apenas as variáveis VITE_*:

```env
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
VITE_BACKEND_URL=https://api.client4you.com.br
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
```

#### **Domain:**
```
Domain: app.client4you.com.br
Generate SSL Certificate: ✅ (Marcar)
```

#### **Deploy:**
1. Clique em **"Deploy"**
2. Aguarde 5-10 minutos
3. ✅ Frontend funcionando!

---

## 🔧 PASSO 3: CONFIGURAR SUPABASE

### A) CORS

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. **Settings** → **API**
4. Em **CORS Configuration**, adicione:
```
https://app.client4you.com.br
https://api.client4you.com.br
https://client4you.com.br
```

### B) Auth URLs

1. **Authentication** → **URL Configuration**

**Site URL:**
```
https://app.client4you.com.br
```

**Redirect URLs:**
```
https://app.client4you.com.br/*
https://app.client4you.com.br/auth/callback
https://app.client4you.com.br/dashboard
```

---

## ✅ PASSO 4: TESTAR DEPLOY

### 1️⃣ Backend API
Abra: `https://api.client4you.com.br/api/`

**Deve retornar:**
```json
{
  "message": "Lead Dispatcher API",
  "version": "2.2.0",
  "mode": "SaaS Hybrid"
}
```

### 2️⃣ Frontend
Abra: `https://app.client4you.com.br`

**Deve mostrar:** Landing Page do Client4you

### 3️⃣ Criar Conta
1. Clique em **"Começar Grátis"**
2. Cadastre um usuário de teste
3. Faça login
4. Dashboard deve carregar ✅

---

## 🔑 PASSO 5: CONFIGURAR SERP API (PÓS-DEPLOY)

### ⚠️ IMPORTANTE: 
A **SERP API Key NÃO vai nas variáveis de ambiente**!

Cada empresa/usuário configura sua própria chave via interface.

### Como configurar:

1. **Obter chave SERP API:**
   - Acesse: https://serpapi.com/
   - Cadastre-se (plano grátis: 100 buscas/mês)
   - Vá em **Dashboard** → **API Key**
   - Copie sua chave

2. **Configurar no Client4you:**
   - Faça login em `https://app.client4you.com.br`
   - Vá em **Configurações** (`/settings`)
   - Card **"Chave SERP API"**
   - Cole sua chave
   - Clique em **"Salvar Chave"**
   - ✅ Badge muda para "Configurado"

3. **Testar busca:**
   - Vá em **"Buscar Leads"** (`/search`)
   - Query: `Restaurantes`
   - Local: `São Paulo, SP`
   - Clique em **Buscar**
   - ✅ Deve retornar lista de leads

---

## 📱 PASSO 6: CONECTAR WHATSAPP (OPCIONAL)

O sistema já vem com servidor WAHA configurado!

### Como conectar:

1. Vá em **Configurações** (`/settings`)
2. Card **"Gerenciamento de Sessão WhatsApp"**
3. Clique em **"Criar/Iniciar Sessão"**
4. QR Code aparece
5. Abra WhatsApp no celular
6. Escaneie o QR Code
7. ✅ Status muda para "CONNECTED"

### Testar envio:

1. Vá em **"Disparador"** (`/disparador`)
2. Crie uma campanha de teste
3. Adicione 1-2 contatos (CSV ou manual)
4. Clique em **"Iniciar Campanha"**
5. ✅ Mensagens enviadas!

---

## 🎯 URLs FINAIS

Após deploy completo:

- 🌐 **App**: https://app.client4you.com.br
- 🔌 **API**: https://api.client4you.com.br
- 📧 **Emails**: Configurado (estudyou.com)
- 💳 **Pagamentos**: Webhook Kiwify ativo
- 📱 **WhatsApp**: Servidor WAHA pronto

---

## 🔍 TROUBLESHOOTING

### ❌ Backend não inicia

**Verificar:**
1. Logs no Coolify → `client4you-backend` → **Logs**
2. Todas as variáveis de ambiente copiadas?
3. Porta 8001 configurada?

### ❌ Frontend mostra página branca

**Verificar:**
1. Logs no Coolify → `client4you-frontend` → **Logs**
2. Variáveis `VITE_*` configuradas?
3. Build concluído com sucesso?

### ❌ CORS Error

**Solução:**
1. Verificar CORS no Supabase (Passo 3A)
2. Limpar cache: `Ctrl + Shift + R`
3. Testar em janela anônima

### ❌ SSL não funciona

**Solução:**
1. Aguardar 10-20 minutos (Let's Encrypt leva tempo)
2. Verificar DNS: `ping api.client4you.com.br` → Deve retornar 72.60.10.10
3. No Coolify, tentar regenerar certificado

### ❌ Busca de leads não funciona

**Solução:**
1. Configurou SERP API Key em `/settings`? ⚠️ **Obrigatório!**
2. Tem créditos em https://serpapi.com/?
3. Ver logs do backend no Coolify

---

## ✅ CHECKLIST FINAL

Marque tudo:

- [ ] DNS configurado (3 registros A)
- [ ] Aguardou propagação DNS (5-15 min)
- [ ] Backend deployado no Coolify
- [ ] Frontend deployado no Coolify
- [ ] SSL gerado (Let's Encrypt)
- [ ] CORS configurado no Supabase
- [ ] Auth URLs configuradas no Supabase
- [ ] Backend respondendo: `https://api.client4you.com.br/api/`
- [ ] Frontend abrindo: `https://app.client4you.com.br`
- [ ] Conta criada e login funcionando
- [ ] SERP API Key configurada em `/settings`
- [ ] Busca de leads testada
- [ ] WhatsApp conectado (opcional)

---

## 🎉 PARABÉNS!

Se todos os checkboxes estão marcados, o **Client4you está 100% operacional**! 🚀

**Sistema completo em produção:**
- ✅ Multi-tenant (múltiplas empresas)
- ✅ Busca ilimitada de leads (cada empresa paga sua SERP API)
- ✅ WhatsApp integrado (sessões isoladas)
- ✅ Pagamentos automáticos (Kiwify)
- ✅ Emails transacionais
- ✅ SSL/HTTPS automático
- ✅ Escalável e seguro

---

**Tempo total estimado:** 30-45 minutos  
**Dificuldade:** Média  
**Resultado:** SaaS completo em produção! 🎯
