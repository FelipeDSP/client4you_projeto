# 🚀 GUIA RÁPIDO - Deploy Client4you (15 minutos)

## 1️⃣ Configurar DNS (JÁ FEITO ✅)
```
Tipo: A
Nome: @
IP: 72.60.10.10
TTL: 300
```

## 2️⃣ Obter Credenciais Supabase

Acesse: https://supabase.com/dashboard → Seu Projeto → Settings → API

Copie:
```
SUPABASE_URL = Project URL
SUPABASE_ANON_KEY = anon public key
SUPABASE_SERVICE_ROLE_KEY = service_role key (clicar "Reveal" para ver)
```

Vá em: Settings → Auth → JWT Settings
```
SUPABASE_JWT_SECRET = JWT Secret
```

## 3️⃣ Obter SERP API Key

1. Acesse: https://serpapi.com/
2. Crie conta grátis
3. Copie sua API Key
```
SERP_API_KEY = sua chave
```

## 4️⃣ No Coolify

### Criar Novo Projeto:
1. **New Project** → Nome: "Client4you"
2. **New Resource** → **Application**
3. **Source**: 
   - Docker Compose
   - Upload manual do código OU Git repository

### Adicionar Variáveis de Ambiente:

Copie e cole no Coolify (ajustando os valores):

```env
# SUPABASE (OBRIGATÓRIO)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI...
SUPABASE_JWT_SECRET=seu-jwt-secret

# SERP API (OBRIGATÓRIO)
SERP_API_KEY=sua-chave-serpapi

# URLs
BACKEND_URL=https://client4you.com.br/api
FRONTEND_URL=https://client4you.com.br
```

### Configurar Domínio:
1. **Domains** → **Add Domain**
2. **Domain**: client4you.com.br
3. **Port**: 3000
4. **SSL**: Marcar "Generate Let's Encrypt Certificate"

### Deploy:
1. Clique em **"Deploy"**
2. Aguarde 5-10 minutos

## 5️⃣ Configurar Supabase

No Supabase → Authentication → URL Configuration:

```
Site URL: https://client4you.com.br

Redirect URLs (adicionar):
- https://client4you.com.br/auth/callback
- https://client4you.com.br/dashboard
```

No Supabase → Settings → API → CORS:
```
Adicionar: https://client4you.com.br
```

## 6️⃣ Testar

1. **Frontend**: https://client4you.com.br
2. **Backend**: https://client4you.com.br/api/
3. **Criar conta** e fazer login
4. **Buscar leads** (se SERP API configurada)

---

## ✅ PRONTO!

Se tudo funcionou, o Client4you está no ar! 🎉

**Problemas?** Veja o guia completo em: `GUIA_DEPLOY_COOLIFY.md`
