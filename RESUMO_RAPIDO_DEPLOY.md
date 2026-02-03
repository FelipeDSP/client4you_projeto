# ⚡ RESUMO RÁPIDO - DEPLOY CLIENT4YOU

**Para:** client4you.com.br (IP: 72.60.10.10)

---

## 📋 O QUE FAZER AGORA

### 1️⃣ ACESSE O COOLIFY
```
http://72.60.10.10:8000
```
Faça login

---

### 2️⃣ CRIE O PROJETO
- Clique: **"+ New Project"**
- Nome: `client4you`
- Salve

---

### 3️⃣ DEPLOY BACKEND (1ª APLICAÇÃO)

**Criar Resource:**
- **"+ New Resource"** → **"Application"** → **"Public Repository"**

**Source:**
```
Repository: [URL do seu GitHub]
Branch: main
Dockerfile: backend/Dockerfile
Base Directory: backend
```

**Config:**
```
Name: client4you-backend
Port: 8001
```

**Environment Variables:** (cole tudo)
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
SMTP_FROM_NAME=Client4You
SMTP_USE_TLS=true
BACKEND_URL=https://api.client4you.com.br
FRONTEND_URL=https://app.client4you.com.br
```

**Domain:**
```
Domain: api.client4you.com.br
Port: 8001
✅ Generate SSL Certificate
```

**Deploy:**
- Clique: **"Deploy"**
- Aguarde 5-10 minutos

**Teste:**
```
https://api.client4you.com.br/api/
```

---

### 4️⃣ DEPLOY FRONTEND (2ª APLICAÇÃO)

**Criar Resource:**
- Volte ao projeto "client4you"
- **"+ New Resource"** → **"Application"** → **"Public Repository"**

**Source:**
```
Repository: [MESMA URL DO GITHUB]
Branch: main
Dockerfile: frontend/Dockerfile
Base Directory: frontend
```

**Config:**
```
Name: client4you-frontend
Port: 3000
```

**Build Arguments (ou Environment Variables):**
```env
VITE_BACKEND_URL=https://api.client4you.com.br
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
VITE_SUPABASE_PROJECT_ID=owlignktsqlrqaqhzujb
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
```

**Domain:**
```
Domain: app.client4you.com.br
Port: 3000
✅ Generate SSL Certificate
```

**Deploy:**
- Clique: **"Deploy"**
- Aguarde 5-10 minutos

**Teste:**
```
https://app.client4you.com.br
```

---

### 5️⃣ CONFIGURAR SUPABASE

**CORS:**
1. https://supabase.com/dashboard
2. Settings → API → CORS Configuration
3. Adicione:
   ```
   https://app.client4you.com.br
   https://api.client4you.com.br
   https://client4you.com.br
   ```

**Auth URLs:**
1. Authentication → URL Configuration
2. Site URL: `https://app.client4you.com.br`
3. Redirect URLs:
   ```
   https://app.client4you.com.br/*
   https://app.client4you.com.br/auth/callback
   https://app.client4you.com.br/dashboard
   ```

---

### 6️⃣ CONFIGURAR TURNSTILE

1. https://dash.cloudflare.com/ → Turnstile
2. Adicione domínios:
   ```
   app.client4you.com.br
   client4you.com.br
   ```

---

## ✅ PRONTO!

**URLs:**
- 🌐 https://client4you.com.br
- 🎨 https://app.client4you.com.br
- 🔌 https://api.client4you.com.br

---

## 🆘 PROBLEMAS?

**Backend não inicia:**
- Ver logs no Coolify
- Verificar variáveis de ambiente

**Frontend branco:**
- Verificar `VITE_BACKEND_URL` está correto
- Abrir Console (F12) e ver erros

**CORS Error:**
- Configurar CORS no Supabase
- Verificar `CORS_ORIGINS` no backend

**SSL não funciona:**
- Aguardar 10-20 minutos
- Regenerar certificado no Coolify

---

**Me avise qualquer erro! 💪**
