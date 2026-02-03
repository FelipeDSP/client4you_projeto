# 🚀 DEPLOY CLIENT4YOU - GUIA DEFINITIVO

## ✅ SUAS CREDENCIAIS (TODAS PRONTAS!)

Você já tem tudo configurado! ✨

---

## 📋 PASSO 1: CONFIGURAR DNS NA HOSTINGER

Você precisa adicionar 3 registros DNS:

### 1️⃣ Domínio Principal (Opcional - Redireciona para app)
```
Tipo: A
Nome: @
Aponta para: 72.60.10.10
TTL: 300
```

### 2️⃣ Frontend (app.client4you.com.br)
```
Tipo: A
Nome: app
Aponta para: 72.60.10.10
TTL: 300
```

### 3️⃣ Backend (api.client4you.com.br)
```
Tipo: A
Nome: api
Aponta para: 72.60.10.10
TTL: 300
```

### 4️⃣ WWW (Opcional - Redireciona para app)
```
Tipo: CNAME
Nome: www
Aponta para: app.client4you.com.br
TTL: 300
```

**Resultado Final:**
- ✅ https://app.client4you.com.br → Frontend
- ✅ https://api.client4you.com.br → Backend API
- ✅ https://client4you.com.br → Redireciona para app
- ✅ https://www.client4you.com.br → Redireciona para app

---

## 🐳 PASSO 2: CRIAR PROJETO NO COOLIFY

### A) Criar Novo Projeto

1. Acesse o Coolify: http://72.60.10.10:8000
2. **Dashboard** → **+ New Project**
3. **Nome**: `client4you`
4. **Salvar**

---

### B) Deploy do BACKEND

1. No projeto, clique em **+ New Resource**
2. Selecione **Application**
3. **Source**: 
   - Opção 1: **Public Repository** (se tiver no GitHub)
   - Opção 2: **Simple Dockerfile** (upload manual)

4. **Configurações:**
   ```
   Name: client4you-backend
   Build Pack: Dockerfile
   Dockerfile Location: backend/Dockerfile
   Port: 8001
   ```

5. **Environment Variables** → Cole TODAS as variáveis do arquivo `.env.production`

6. **Domains**:
   ```
   Domain: api.client4you.com.br
   Generate SSL: ✅ (Marcar)
   ```

7. **Deploy** → Aguarde build (5-10 min)

---

### C) Deploy do FRONTEND

1. No projeto, clique em **+ New Resource**
2. Selecione **Application**
3. **Source**: Mesmo repositório ou upload manual

4. **Configurações:**
   ```
   Name: client4you-frontend
   Build Pack: Dockerfile
   Dockerfile Location: frontend/Dockerfile
   Port: 3000
   ```

5. **Environment Variables** → Cole as variáveis VITE_* do `.env.production`

6. **Domains**:
   ```
   Domain: app.client4you.com.br
   Generate SSL: ✅ (Marcar)
   ```

7. **Deploy** → Aguarde build (5-10 min)

---

## 🔧 PASSO 3: CONFIGURAR SUPABASE

### 1) CORS Configuration

Acesse: https://supabase.com/dashboard → Seu Projeto → Settings → API

Em **CORS Configuration**, adicione:
```
https://app.client4you.com.br
https://api.client4you.com.br
https://client4you.com.br
```

### 2) Auth URL Configuration

Vá em: Authentication → URL Configuration

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

### 3) Testar Conexão

Execute no Supabase SQL Editor:
```sql
-- Verificar se há usuários (deve estar vazio inicialmente)
SELECT * FROM auth.users LIMIT 5;

-- Verificar quotas
SELECT * FROM public.user_quotas LIMIT 5;
```

---

## ✅ PASSO 4: VERIFICAR DEPLOY

### 1️⃣ Testar Backend API

Abra no navegador:
```
https://api.client4you.com.br/api/
```

**Resposta esperada:**
```json
{
  "message": "Lead Dispatcher API",
  "version": "2.2.0",
  "mode": "SaaS Hybrid"
}
```

### 2️⃣ Testar Frontend

Abra no navegador:
```
https://app.client4you.com.br
```

Deve mostrar a **Landing Page do Client4you**

### 3️⃣ Testar Autenticação

1. Clique em **"Começar Grátis"** ou **"Criar Conta"**
2. Cadastre um novo usuário
3. Verifique o email (se SMTP configurado) ou faça login direto
4. Dashboard deve carregar

### 4️⃣ Testar Busca de Leads (IMPORTANTE!)

**ANTES DE TESTAR, você precisa de uma SERP API KEY:**

1. Acesse: https://serpapi.com/
2. Crie conta grátis (100 buscas/mês grátis)
3. Copie sua API Key
4. No Coolify, adicione a variável:
   ```
   SERP_API_KEY=sua-chave-aqui
   ```
5. Redeploy o backend

**Depois, teste a busca:**
1. No dashboard, vá em **"Buscar Leads"**
2. Digite: `Restaurantes` (query)
3. Local: `São Paulo, SP`
4. Clique em **Buscar**
5. Deve retornar lista de restaurantes

### 5️⃣ Testar WhatsApp (Opcional)

1. Vá em **Configurações** → **WhatsApp**
2. Clique em **"Conectar WhatsApp"**
3. Escaneie o QR Code com seu celular
4. Status deve mudar para **"Conectado"**

---

## 🔍 TROUBLESHOOTING

### ❌ Erro 520 ou Backend não responde

**Solução:**
```bash
# No Coolify, vá em Logs do Backend e procure por:
# - "ModuleNotFoundError" → Falta instalar biblioteca
# - "Connection refused" → Verificar portas
# - "Invalid JWT" → Verificar SUPABASE_JWT_SECRET
```

### ❌ CORS Error no Frontend

**Solução:**
1. Verificar se adicionou domínios no Supabase CORS
2. Verificar variável `CORS_ORIGINS` no backend
3. Limpar cache do navegador: `Ctrl + Shift + R`

### ❌ SSL não funciona

**Solução:**
1. Aguardar 10-15 minutos (Let's Encrypt demora)
2. Verificar DNS: `ping api.client4you.com.br` → Deve retornar 72.60.10.10
3. No Coolify, tentar gerar SSL novamente

### ❌ Busca de Leads não funciona

**Solução:**
1. Verificar se `SERP_API_KEY` está configurada
2. Acessar https://serpapi.com/ e verificar se tem créditos
3. Ver logs do backend no Coolify

### ❌ WhatsApp não conecta

**Solução:**
1. Verificar `WAHA_DEFAULT_URL` e `WAHA_MASTER_KEY`
2. Testar URL: https://waha.chatyou.chat (deve abrir página)
3. Ver logs do backend

---

## 🎯 CHECKLIST FINAL

Marque tudo que completou:

### DNS:
- [ ] Registro A: `@` → 72.60.10.10
- [ ] Registro A: `app` → 72.60.10.10
- [ ] Registro A: `api` → 72.60.10.10
- [ ] Aguardou propagação DNS (5-60 min)

### Coolify Backend:
- [ ] Projeto criado
- [ ] Backend deployado
- [ ] Todas as variáveis de ambiente adicionadas
- [ ] Domínio `api.client4you.com.br` configurado
- [ ] SSL gerado (Let's Encrypt)
- [ ] Backend respondendo em https://api.client4you.com.br/api/

### Coolify Frontend:
- [ ] Frontend deployado
- [ ] Variáveis VITE_* adicionadas
- [ ] Domínio `app.client4you.com.br` configurado
- [ ] SSL gerado
- [ ] Landing Page abrindo

### Supabase:
- [ ] CORS configurado com os 3 domínios
- [ ] Site URL: `https://app.client4you.com.br`
- [ ] Redirect URLs configuradas
- [ ] Testado criação de usuário

### Integrações:
- [ ] SERP API Key configurada (para buscar leads)
- [ ] WAHA configurada (WhatsApp - opcional)
- [ ] SMTP testado (emails - opcional)
- [ ] Kiwify Webhook configurado (pagamentos - opcional)

### Testes:
- [ ] Criar conta funcionando
- [ ] Login funcionando
- [ ] Dashboard carregando
- [ ] Busca de leads testada
- [ ] Histórico de buscas salvando
- [ ] WhatsApp conectando (se configurado)

---

## 🎉 PARABÉNS!

Se todos os checkboxes estão marcados, o **Client4you está 100% operacional**! 🚀

**URLs de Produção:**
- 🌐 **App**: https://app.client4you.com.br
- 🔌 **API**: https://api.client4you.com.br
- 📱 **WhatsApp**: Integrado
- 💳 **Pagamentos**: Kiwify integrado

---

## 📊 MONITORAMENTO

### Ver Logs em Tempo Real:

No Coolify:
1. **Backend**: Resources → client4you-backend → Logs
2. **Frontend**: Resources → client4you-frontend → Logs

### Métricas do Supabase:

1. Acesse: https://supabase.com/dashboard
2. Vá em **Database** → **Logs**
3. Monitore:
   - Novos usuários cadastrados
   - Buscas realizadas
   - Campanhas criadas

---

## 🔄 ATUALIZAÇÕES FUTURAS

### Como Atualizar o Sistema:

**Se usar Git:**
```bash
git add .
git commit -m "Atualização X"
git push
```

**No Coolify:**
1. Vá no recurso (backend ou frontend)
2. Clique em **"Redeploy"**
3. Aguarde 2-5 minutos

**Build automático:**
- Configure webhook no GitHub/GitLab
- Coolify faz deploy automático a cada push

---

## 🆘 SUPORTE

**Precisa de ajuda?**

1. **Logs do Coolify**: Primeira coisa a verificar
2. **Supabase Logs**: Para erros de banco de dados
3. **Browser Console**: F12 → Console (erros frontend)

**Tudo funcionando?**

Agora você pode:
- ✅ Cadastrar usuários
- ✅ Buscar leads do Google Maps (ilimitado)
- ✅ Criar campanhas WhatsApp
- ✅ Receber pagamentos (Kiwify)
- ✅ Enviar emails (SMTP)
- ✅ Sistema completo de quotas

---

**Sistema:** Client4you SaaS  
**Versão:** 2.0  
**Data:** Fevereiro 2025  
**Status:** 🟢 PRODUÇÃO
