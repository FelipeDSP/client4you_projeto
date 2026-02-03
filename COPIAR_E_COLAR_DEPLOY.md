# 📋 COPIAR E COLAR - DEPLOY CLIENT4YOU

> **Use este arquivo para copiar rapidamente as informações necessárias**

---

## 🔗 URL DO COOLIFY
```
http://72.60.10.10:8000
```

---

## 📦 NOME DO PROJETO
```
client4you
```

---

## 🔴 BACKEND - Configurações

### Repository Settings
```
Branch: main
Dockerfile Location: backend/Dockerfile
Base Directory: backend
```

### Application Settings
```
Name: client4you-backend
Port: 8001
```

### Domain
```
api.client4you.com.br
```

### Environment Variables (COLE TUDO)
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
SMTP_PASSWORD=dd273a83-1e07-40a6-bba9-5336df1b94fe
SMTP_FROM_EMAIL=nao-responda@estudyou.com
SMTP_FROM_NAME=Client4You - Plataforma de Leads
SMTP_USE_TLS=true
BACKEND_URL=https://api.client4you.com.br
FRONTEND_URL=https://app.client4you.com.br
```

---

## 🔵 FRONTEND - Configurações

### Repository Settings
```
Branch: main
Dockerfile Location: frontend/Dockerfile
Base Directory: frontend
```

### Application Settings
```
Name: client4you-frontend
Port: 3000
```

### Domain
```
app.client4you.com.br
```

### Build Arguments / Environment Variables (COLE TUDO)
```env
VITE_BACKEND_URL=https://api.client4you.com.br
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
VITE_SUPABASE_PROJECT_ID=owlignktsqlrqaqhzujb
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
```

---

## 🔧 SUPABASE - CORS Configuration

### CORS Origins (Supabase Dashboard → Settings → API)
```
https://app.client4you.com.br
https://api.client4you.com.br
https://client4you.com.br
```

### Site URL (Authentication → URL Configuration)
```
https://app.client4you.com.br
```

### Redirect URLs (Authentication → URL Configuration)
```
https://app.client4you.com.br/*
https://app.client4you.com.br/auth/callback
https://app.client4you.com.br/dashboard
https://app.client4you.com.br/admin
https://client4you.com.br/*
```

---

## ☁️ CLOUDFLARE TURNSTILE - Domains

### Adicionar estes domínios
```
app.client4you.com.br
client4you.com.br
```

---

## 🧪 TESTES - URLs para abrir no navegador

### Backend
```
https://api.client4you.com.br/api/
```
**Deve retornar JSON com version 2.2.0**

### Frontend
```
https://app.client4you.com.br
```
**Deve carregar landing page**

### Domínio Principal
```
https://client4you.com.br
```
**Deve redirecionar para app**

---

## 📝 COMANDOS DE TESTE (Terminal)

### Testar DNS
```bash
ping app.client4you.com.br
ping api.client4you.com.br
```

### Testar Backend API
```bash
curl https://api.client4you.com.br/api/
```

### Ver SSL
```bash
curl -I https://app.client4you.com.br
```

---

## 🆘 COMANDOS DE DEBUG (SSH na VPS)

### Conectar via SSH
```bash
ssh root@72.60.10.10
```

### Ver containers rodando
```bash
docker ps
```

### Ver logs do backend
```bash
docker logs -f $(docker ps | grep backend | awk '{print $1}')
```

### Ver logs do frontend
```bash
docker logs -f $(docker ps | grep frontend | awk '{print $1}')
```

### Ver uso de recursos
```bash
docker stats
```

---

## ✅ CHECKLIST RÁPIDO

```
[ ] Acessei Coolify (http://72.60.10.10:8000)
[ ] Criei projeto "client4you"
[ ] Criei aplicação backend
[ ] Adicionei variáveis de ambiente do backend
[ ] Configurei domínio api.client4you.com.br
[ ] Fiz deploy do backend
[ ] Testei https://api.client4you.com.br/api/
[ ] Criei aplicação frontend
[ ] Adicionei build args do frontend
[ ] Configurei domínio app.client4you.com.br
[ ] Fiz deploy do frontend
[ ] Testei https://app.client4you.com.br
[ ] Configurei CORS no Supabase
[ ] Configurei Auth URLs no Supabase
[ ] Configurei Turnstile
[ ] Testei criar conta
[ ] Testei login
```

---

## 🎯 ATALHOS

### Coolify
```
http://72.60.10.10:8000
```

### Supabase Dashboard
```
https://supabase.com/dashboard/project/owlignktsqlrqaqhzujb
```

### Cloudflare Turnstile
```
https://dash.cloudflare.com/
```

### Seu GitHub
```
[COLE A URL DO SEU REPOSITÓRIO AQUI]
```

---

## 📞 AJUDA

**Se algo der errado, me envie:**

1. **Qual passo você está:**
   ```
   Ex: "Estou no Passo 3 - Deploy Backend"
   ```

2. **Qual erro está aparecendo:**
   ```
   [Cole o erro aqui]
   ```

3. **Logs do Coolify:**
   ```
   [Cole os últimos logs aqui]
   ```

4. **Screenshot (se possível)**

---

**Pronto para começar! 🚀**

**Abra:** `RESUMO_RAPIDO_DEPLOY.md` e vamos lá!
