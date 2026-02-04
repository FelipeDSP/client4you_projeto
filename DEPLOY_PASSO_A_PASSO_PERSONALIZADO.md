# 🚀 DEPLOY PASSO-A-PASSO - CLIENT4YOU NO COOLIFY

**Suas Informações:**
- 🌐 Domínio: `client4you.com.br`
- 🖥️ IP VPS: `72.60.10.10`
- ✅ DNS: Já configurado corretamente
- ✅ Código: Já está no GitHub

---

## ✅ PRÉ-REQUISITOS (VERIFICAÇÃO)

- [x] DNS configurado (@ → 72.60.10.10)
- [x] DNS app.client4you.com.br → 72.60.10.10
- [x] DNS api.client4you.com.br → 72.60.10.10
- [x] CAA records para Let's Encrypt (SSL automático)
- [x] Código no GitHub
- [ ] **PRÓXIMO:** Acessar Coolify e fazer deploy

---

## 🔗 PASSO 1: VERIFICAR DNS PROPAGADO

Antes de começar, vamos confirmar que o DNS está propagado:

```bash
# Teste no seu computador (Windows/Mac/Linux)
ping app.client4you.com.br
ping api.client4you.com.br
ping client4you.com.br
```

**✅ Deve retornar:** `72.60.10.10`

Se retornar outro IP ou erro, aguarde mais 5-10 minutos.

---

## 🐳 PASSO 2: ACESSAR COOLIFY

1. Abra o navegador
2. Acesse: `http://72.60.10.10:8000`
   
   **OU** se Coolify já tem domínio configurado:
   `https://coolify.seudominio.com`

3. Faça login com suas credenciais

---

## 📦 PASSO 3: CRIAR PROJETO NO COOLIFY

1. No dashboard do Coolify, clique em **"+ New Project"** (canto superior direito)

2. Preencha:
   ```
   Name: client4you
   Description: Plataforma de captação de clientes
   ```

3. Clique em **"Create"** ou **"Save"**

✅ **Projeto criado!** Agora você está dentro do projeto "client4you".

---

## 🔴 PASSO 4: DEPLOY DO BACKEND (APLICAÇÃO 1)

### 4.1 Criar Resource - Backend

1. Dentro do projeto "client4you", clique em **"+ New Resource"**

2. Selecione **"Application"**

3. Selecione **"Public Repository"** (ou "GitHub" se pedir para conectar)

### 4.2 Configurar Source

Preencha os campos:

```
Repository URL: [COLE A URL DO SEU GITHUB AQUI]
   Exemplo: https://github.com/seu-usuario/client4you-app

Branch: main

Build Pack: Dockerfile

Dockerfile Location: backend/Dockerfile

Base Directory: backend
```

**⚠️ IMPORTANTE:** Substitua `[COLE A URL DO SEU GITHUB AQUI]` pela URL real do seu repositório!

### 4.3 Configurar Aplicação

```
Name: client4you-backend
Port: 8001
```

### 4.4 Adicionar Environment Variables

Clique em **"Environment Variables"** ou **"Add Variable"**.

**Método 1: Adicionar uma por uma**

Clique em "+ Add" e preencha cada variável:

```
Nome: SUPABASE_URL
Valor: https://owlignktsqlrqaqhzujb.supabase.co
```

**Método 2: Bulk Add (Mais rápido)**

Se o Coolify tiver opção "Bulk Add" ou "Add Multiple", cole tudo de uma vez:

```env
SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyNTMzMCwiZXhwIjoyMDgzOTAxMzMwfQ.b1Ecnc-MU1BOK5Q7OV8ZKTJV1Hv07eghq3qTBg5rKrM
SUPABASE_JWT_SECRET=eEPK7dTjJf1y00pgXH183WEf6FkjxFrXID7Sj9pdi9fUJ2QyOxHPvykBVwII4VJmsQiletkD41AMLOzTona8rQ==
TURNSTILE_SECRET_KEY=0x4AAAAAACW4RI9ZshOaX_1cYx4vgnw15BE
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=1800
LOGIN_WINDOW_DURATION=900
CORS_ORIGINS=https://client4you.com.br,https://app.client4you.com.br,https://api.client4you.com.br
WAHA_DEFAULT_URL=https://waha.chatyou.chat
WAHA_MASTER_KEY=PJ1X_5sPM2cgeAI3LB_ALOUPUyUkg9GjKvMZ7Leifi0
KIWIFY_WEBHOOK_SECRET=o21anhwe1w1
SMTP_HOST=mail.estudyou.com
SMTP_PORT=465
SMTP_USER=nao-responda@estudyou.com
SMTP_PASSWORD=status-check-issue
SMTP_FROM_EMAIL=nao-responda@estudyou.com
SMTP_FROM_NAME=Client4You - Plataforma de Leads
SMTP_USE_TLS=true
BACKEND_URL=https://api.client4you.com.br
FRONTEND_URL=https://app.client4you.com.br
```

### 4.5 Configurar Domínio

1. Procure por **"Domains"** ou **"Network"** ou **"Add Domain"**

2. Clique em **"+ Add Domain"** ou **"+ Add"**

3. Preencha:
   ```
   Domain: api.client4you.com.br
   Port: 8001
   ```

4. ✅ **IMPORTANTE:** Marque a opção **"Generate SSL Certificate"** ou **"Enable HTTPS"**
   
   Isso vai gerar certificado Let's Encrypt automaticamente!

5. Clique em **"Save"** ou **"Add"**

### 4.6 Fazer Deploy do Backend

1. Procure pelo botão grande **"Deploy"** (geralmente no topo ou canto superior direito)

2. Clique em **"Deploy"**

3. **Acompanhe os logs em tempo real!**

   Você verá algo como:
   ```
   ⏳ Cloning repository...
   ⏳ Checking out branch main...
   ⏳ Building Docker image...
   ⏳ Installing Python dependencies...
   ⏳ Starting container...
   ⏳ Running health checks...
   ✅ Deployment successful!
   ```

4. **Aguarde 5-10 minutos** (primeira build demora mais)

### 4.7 Testar Backend

Quando o deploy terminar, teste:

**Opção 1: No navegador**
```
https://api.client4you.com.br/api/
```

**Opção 2: No terminal**
```bash
curl https://api.client4you.com.br/api/
```

**✅ Resposta esperada:**
```json
{
  "message": "Lead Dispatcher API",
  "version": "2.2.0",
  "mode": "SaaS Hybrid",
  "database": "Supabase"
}
```

**❌ Se der erro:**
- Aguarde mais 2-3 minutos (SSL pode demorar)
- Veja os logs no Coolify (aba "Logs")
- Me avise qual erro apareceu

---

## 🔵 PASSO 5: DEPLOY DO FRONTEND (APLICAÇÃO 2)

### 5.1 Criar Resource - Frontend

1. **Volte para o projeto "client4you"** (clique no nome do projeto no topo)

2. Clique em **"+ New Resource"** novamente

3. Selecione **"Application"**

4. Selecione **"Public Repository"** (mesmo repositório)

### 5.2 Configurar Source

```
Repository URL: [MESMA URL DO GITHUB DO PASSO 4.2]

Branch: main

Build Pack: Dockerfile

Dockerfile Location: frontend/Dockerfile

Base Directory: frontend
```

### 5.3 Configurar Aplicação

```
Name: client4you-frontend
Port: 3000
```

### 5.4 Adicionar Build Arguments

⚠️ **ATENÇÃO:** Aqui é diferente! Procure por:
- **"Build Arguments"** ou
- **"Docker Build Args"** ou
- **"Build-time Variables"**

Se não encontrar, use **"Environment Variables"** mesmo.

**Adicione:**

```
VITE_BACKEND_URL=https://api.client4you.com.br
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
VITE_SUPABASE_PROJECT_ID=owlignktsqlrqaqhzujb
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
```

### 5.5 Configurar Domínio

1. Vá em **"Domains"** ou **"Add Domain"**

2. Adicione:
   ```
   Domain: app.client4you.com.br
   Port: 3000
   ```

3. ✅ Marque **"Generate SSL Certificate"**

4. **OPCIONAL:** Adicionar domínio secundário `client4you.com.br` (sem o "app")

5. Clique em **"Save"**

### 5.6 Fazer Deploy do Frontend

1. Clique em **"Deploy"**

2. Acompanhe os logs

3. Aguarde 5-10 minutos

### 5.7 Testar Frontend

Abra no navegador:
```
https://app.client4you.com.br
```

**✅ Deve carregar:** Landing page do Client4you

**✅ Também teste:**
```
https://client4you.com.br
```

---

## ✅ PASSO 6: CONFIGURAR SUPABASE

Agora que os 2 apps estão no ar, configure o Supabase:

### 6.1 Configurar CORS

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Procure por **"CORS Configuration"** ou **"Allowed origins"**
5. Adicione:
   ```
   https://app.client4you.com.br
   https://api.client4you.com.br
   https://client4you.com.br
   ```
6. Clique em **"Save"**

### 6.2 Configurar Auth URLs

1. Ainda no Supabase, vá em **Authentication** → **URL Configuration**

2. **Site URL:**
   ```
   https://app.client4you.com.br
   ```

3. **Redirect URLs:** Adicione todas essas:
   ```
   https://app.client4you.com.br/*
   https://app.client4you.com.br/auth/callback
   https://app.client4you.com.br/dashboard
   https://app.client4you.com.br/admin
   https://client4you.com.br/*
   ```

4. Clique em **"Save"**

---

## ✅ PASSO 7: CONFIGURAR CLOUDFLARE TURNSTILE

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Turnstile**
3. Selecione o widget existente ou crie um novo
4. Em **"Domains"**, adicione:
   ```
   app.client4you.com.br
   client4you.com.br
   ```
5. Salve

---

## 🧪 PASSO 8: TESTES COMPLETOS

### 8.1 Teste Backend

```bash
curl https://api.client4you.com.br/api/
```

**✅ Deve retornar JSON com version 2.2.0**

### 8.2 Teste Frontend

1. Abra: `https://app.client4you.com.br`
2. Deve carregar a landing page
3. Clique em **"Começar Grátis"**
4. Deve abrir a página de cadastro

### 8.3 Teste Cadastro

1. Preencha formulário de cadastro
2. Clique em **"Criar conta"**
3. Deve logar automaticamente
4. Dashboard deve carregar

### 8.4 Teste Login

1. Faça logout
2. Tente fazer login novamente
3. Deve funcionar

---

## 🆘 TROUBLESHOOTING

### ❌ Backend retorna 502 ou 503

**Solução:**
1. No Coolify, vá em "client4you-backend"
2. Clique em **"Logs"**
3. Veja os últimos logs
4. Me envie os logs se precisar de ajuda

### ❌ Frontend mostra página branca

**Solução:**
1. Abra o Console do navegador (F12)
2. Vá na aba **"Console"**
3. Veja se há erros
4. Possível causa: `VITE_BACKEND_URL` não foi passado

**Como corrigir:**
1. No Coolify, vá em "client4you-frontend"
2. Em **"Environment Variables"** ou **"Build Args"**
3. Certifique-se que `VITE_BACKEND_URL=https://api.client4you.com.br` está lá
4. Clique em **"Redeploy"**

### ❌ Erro de CORS

**Solução:**
1. Verificar CORS configurado no Supabase (Passo 6.1)
2. No backend, verificar variável `CORS_ORIGINS` tem os domínios corretos
3. Limpar cache do navegador: `Ctrl + Shift + R`

### ❌ SSL não funciona

**Solução:**
1. Aguardar 10-20 minutos (Let's Encrypt demora)
2. No Coolify, ir em "Domains" e tentar regenerar certificado
3. Verificar que DNS está propagado: `ping api.client4you.com.br`

---

## 📊 MONITORAMENTO

### Ver Logs em Tempo Real

**No Coolify:**
1. Clique na aplicação (backend ou frontend)
2. Vá na aba **"Logs"**
3. Logs aparecem em tempo real

**Via SSH (avançado):**
```bash
ssh root@72.60.10.10

# Ver containers rodando
docker ps

# Ver logs do backend
docker logs -f <container-id-backend>

# Ver logs do frontend
docker logs -f <container-id-frontend>
```

---

## ✅ CHECKLIST FINAL

Marque conforme for completando:

### Deploy
- [ ] Projeto "client4you" criado no Coolify
- [ ] Backend deployado com sucesso
- [ ] Backend respondendo em https://api.client4you.com.br/api/
- [ ] Frontend deployado com sucesso
- [ ] Frontend abrindo em https://app.client4you.com.br
- [ ] SSL funcionando (https) em ambos

### Configurações
- [ ] CORS configurado no Supabase
- [ ] Auth URLs configuradas no Supabase
- [ ] Turnstile configurado com domínios

### Testes
- [ ] Criar conta funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Logout funciona
- [ ] Menu lateral funciona

---

## 🎉 DEPLOY COMPLETO!

Se todos os checkboxes estão marcados, **parabéns**! 🚀

Seu Client4you está no ar em:
- 🌐 **Landing:** https://client4you.com.br
- 🎨 **App:** https://app.client4you.com.br
- 🔌 **API:** https://api.client4you.com.br

---

## 📞 PRECISA DE AJUDA?

**Me avise se travar em algum passo!**

Informe:
1. Em qual PASSO você está
2. Qual erro está vendo
3. Screenshot (se possível)
4. Logs do Coolify (se tiver)

**Estou aqui para te ajudar! 💪**

---

**Data de criação:** Fevereiro 2025  
**Específico para:** client4you.com.br no IP 72.60.10.10
