# 🏗️ ARQUITETURA CLIENT4YOU - PRODUÇÃO

```
┌─────────────────────────────────────────────────────────────┐
│                      USUÁRIO FINAL                          │
│                  (Navegador Web)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌─────────┐   ┌──────────┐   ┌──────────┐
│ client  │   │   app.   │   │   api.   │
│ 4you    │──▶│ client   │   │ client   │
│ .com.br │   │ 4you     │   │ 4you     │
│         │   │ .com.br  │   │ .com.br  │
└─────────┘   └────┬─────┘   └────┬─────┘
  (Redirect)       │              │
                   │              │
                   │              │
┌──────────────────┼──────────────┼─────────────────────┐
│                  │              │                     │
│           VPS (72.60.10.10)    │                     │
│         Coolify + Docker       │                     │
│                  │              │                     │
│  ┌───────────────▼──────────┐  │                     │
│  │                          │  │                     │
│  │   FRONTEND (Port 3000)   │  │                     │
│  │   ────────────────────   │  │                     │
│  │   • React + Vite         │  │                     │
│  │   • Nginx                │  │                     │
│  │   • Landing Page         │  │                     │
│  │   • Dashboard            │  │                     │
│  │   • Authentication UI    │◀─┼────┐                │
│  │                          │  │    │                │
│  └──────────────────────────┘  │    │                │
│                  │              │    │                │
│                  │ API Calls    │    │                │
│                  │              │    │                │
│  ┌───────────────▼──────────┐  │    │                │
│  │                          │  │    │                │
│  │   BACKEND (Port 8001)    │  │    │                │
│  │   ───────────────────    │  │    │                │
│  │   • FastAPI + Python     │  │    │                │
│  │   • Uvicorn              │  │    │                │
│  │   • Business Logic       │  │    │                │
│  │   • API Endpoints        │  │    │                │
│  │   • Authentication       │──┼────┘                │
│  │   • Rate Limiting        │  │                     │
│  │   • Security Layer       │  │                     │
│  │                          │  │                     │
│  └──────┬──────┬──────┬─────┘  │                     │
│         │      │      │        │                     │
└─────────┼──────┼──────┼────────┼─────────────────────┘
          │      │      │        │
          │      │      │        │
          ▼      ▼      ▼        ▼
     ┌────────────────────────────────┐
     │                                │
     │  SERVIÇOS EXTERNOS             │
     │  ─────────────────             │
     │                                │
     │  1. SUPABASE                   │
     │     ├─ PostgreSQL              │
     │     ├─ Auth                    │
     │     ├─ Storage                 │
     │     └─ RLS (Row Level Security)│
     │                                │
     │  2. SERP API                   │
     │     └─ Google Maps Scraping    │
     │                                │
     │  3. WAHA                       │
     │     └─ WhatsApp Integration    │
     │                                │
     │  4. SMTP (estudyou.com)        │
     │     └─ Email Notifications     │
     │                                │
     │  5. CLOUDFLARE TURNSTILE       │
     │     └─ Bot Protection          │
     │                                │
     │  6. KIWIFY                     │
     │     └─ Payment Processing      │
     │                                │
     └────────────────────────────────┘
```

---

## 🔄 FLUXO DE DADOS

### 1️⃣ CADASTRO DE USUÁRIO
```
Usuário → Frontend (app.client4you.com.br)
    ↓
Frontend → Supabase Auth (signup)
    ↓
Supabase cria usuário em auth.users
    ↓
Trigger cria:
    - profiles
    - companies
    - user_quotas (plano demo)
    - user_roles
    ↓
Frontend redireciona para /dashboard
```

### 2️⃣ LOGIN
```
Usuário → Frontend (Login page)
    ↓
Frontend → Supabase Auth (signInWithPassword)
    ↓
Supabase valida:
    - Email existe?
    - Senha correta?
    - Turnstile OK?
    ↓
Retorna JWT Token
    ↓
Frontend armazena token
    ↓
Redireciona para /dashboard
```

### 3️⃣ BUSCA DE LEADS
```
Usuário → Frontend (Search page)
    ↓
Frontend → Backend API (/api/search)
    ↓
Backend valida:
    - Token JWT válido?
    - User tem quota disponível?
    ↓
Backend → SERP API (Google Maps search)
    ↓
SERP API retorna leads
    ↓
Backend salva:
    - search_history
    - leads
    - Incrementa user_quotas.leads_used
    ↓
Backend → Frontend (lista de leads)
    ↓
Frontend exibe tabela de leads
```

### 4️⃣ DISPARADOR WHATSAPP
```
Usuário → Frontend (Disparador page)
    ↓
Cria campanha com:
    - Nome
    - Mensagem
    - Upload de contatos (CSV/Excel)
    ↓
Frontend → Backend API (/api/campaigns)
    ↓
Backend salva:
    - campaigns
    - campaign_contacts
    ↓
Usuário clica "Iniciar Campanha"
    ↓
Backend → WAHA API
    ↓
WAHA envia mensagens via WhatsApp
    ↓
Backend salva message_logs
    ↓
Frontend atualiza status em tempo real
```

### 5️⃣ PAGAMENTO (Kiwify)
```
Usuário → Kiwify Checkout
    ↓
Usuário paga
    ↓
Kiwify → Webhook (/api/webhook/kiwify)
    ↓
Backend valida:
    - Assinatura HMAC
    - Dados corretos?
    ↓
Backend atualiza:
    - user_quotas (upgrade de plano)
    - subscriptions
    ↓
Envia email de confirmação (SMTP)
    ↓
Usuário recebe acesso completo
```

---

## 🔐 SEGURANÇA EM CAMADAS

```
┌────────────────────────────────────────┐
│ CAMADA 1: DNS/CLOUDFLARE               │
│ • DDoS Protection                      │
│ • SSL/TLS (HTTPS)                      │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│ CAMADA 2: TURNSTILE                    │
│ • Bot Detection                        │
│ • Rate Limiting (Login)                │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│ CAMADA 3: BACKEND                      │
│ • JWT Validation                       │
│ • CORS Policy                          │
│ • Input Sanitization                   │
│ • Rate Limiting (API)                  │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│ CAMADA 4: SUPABASE                     │
│ • Row Level Security (RLS)             │
│ • Database Encryption                  │
│ • Audit Logs                           │
└────────────────────────────────────────┘
```

---

## 📦 CONTAINERS DOCKER

### Frontend Container
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Container
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc python3-dev libmagic1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 🌐 ESTRUTURA DE URLs

```
PRODUÇÃO:
├─ https://client4you.com.br       → Redireciona para app
├─ https://www.client4you.com.br   → Redireciona para app
├─ https://app.client4you.com.br   → Frontend
│  ├─ /                             → Landing Page
│  ├─ /login                        → Login
│  ├─ /signup                       → Cadastro
│  ├─ /dashboard                    → Dashboard (protegido)
│  ├─ /search                       → Buscar Leads (protegido)
│  ├─ /history                      → Histórico (protegido)
│  ├─ /disparador                   → Campanhas WhatsApp (protegido)
│  ├─ /profile                      → Perfil (protegido)
│  ├─ /settings                     → Configurações (protegido)
│  └─ /admin                        → Admin Panel (protegido)
│
└─ https://api.client4you.com.br   → Backend API
   ├─ /api/                         → Health Check
   ├─ /api/search                   → Buscar Leads
   ├─ /api/quotas/me                → Quotas do Usuário
   ├─ /api/campaigns                → CRUD Campanhas
   ├─ /api/waha/*                   → WhatsApp
   ├─ /api/webhook/kiwify           → Webhook Pagamentos
   └─ /api/admin/*                  → Admin Endpoints
```

---

## 💾 BANCO DE DADOS (Supabase)

### Tabelas Principais:
```
auth.users                → Usuários (gerenciado pelo Supabase Auth)
  └─ profiles             → Perfis estendidos
  └─ user_quotas          → Limites e uso de recursos
  └─ user_roles           → Papéis (member/admin/super_admin)
  └─ companies            → Empresas/Organizações

public.leads              → Leads capturados
public.search_history     → Histórico de buscas
public.campaigns          → Campanhas WhatsApp
public.campaign_contacts  → Contatos das campanhas
public.message_logs       → Logs de envio WhatsApp
public.subscriptions      → Assinaturas ativas
public.audit_logs         → Auditoria de ações
```

---

## 🚀 PERFORMANCE

### Frontend:
- ✅ Build otimizado (Vite)
- ✅ Code splitting
- ✅ Lazy loading de páginas
- ✅ Gzip compression (Nginx)
- ✅ Cache de assets (1 ano)

### Backend:
- ✅ Async/Await (FastAPI)
- ✅ Connection pooling (Supabase)
- ✅ Rate limiting
- ✅ Cache de quotas

### Database:
- ✅ Índices otimizados
- ✅ Row Level Security
- ✅ Connection pooling

---

## 📊 MONITORAMENTO

### Logs:
- Coolify → Logs em tempo real
- Supabase → Database logs
- Frontend → Browser console

### Métricas:
- Usuários ativos
- Leads capturados/dia
- Mensagens enviadas/dia
- Taxa de conversão signup
- Uso de quotas

---

**Arquitetura:** Multi-container Docker  
**Orquestração:** Coolify  
**Infraestrutura:** VPS (72.60.10.10)  
**Stack:** React + FastAPI + Supabase
