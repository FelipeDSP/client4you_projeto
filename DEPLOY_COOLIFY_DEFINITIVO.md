# 🚀 GUIA DEFINITIVO DE DEPLOY NO COOLIFY - CLIENT4YOU

> **Método:** Deploy de Backend e Frontend separados usando Dockerfiles individuais  
> **Plataforma:** Coolify v4  
> **Tempo estimado:** 45-60 minutos  
> **Nível:** Intermediário

---

## 📋 PRÉ-REQUISITOS

Antes de começar, confirme que você tem:

- ✅ **VPS com Coolify instalado** (IP: 72.60.10.10 ou seu IP)
- ✅ **Domínio registrado** (ex: client4you.com.br)
- ✅ **Acesso ao DNS** do domínio (Hostinger, Cloudflare, etc.)
- ✅ **Conta Supabase** com projeto criado
- ✅ **Código do Client4you** (este repositório)

---

## 🎯 ARQUITETURA DO DEPLOY

```
┌─────────────────────────────────────────┐
│         client4you.com.br              │
│         (Landing Page)                  │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  app.client    │    │  api.client     │
│  4you.com.br   │    │  4you.com.br    │
│                │    │                 │
│   FRONTEND     │───▶│    BACKEND      │
│   (Nginx:80)   │    │   (FastAPI)     │
│   Porta: 3000  │    │   Porta: 8001   │
└────────────────┘    └─────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
            ┌───────▼────────┐
            │   SUPABASE     │
            │   (Database)   │
            └────────────────┘
```

---

## 🔧 PROBLEMA IDENTIFICADO E SOLUÇÃO

### ❌ **Problema: "No available server"**

**Causas identificadas:**

1. **Porta incorreta no Frontend**
   - Dockerfile expõe porta 80 (Nginx)
   - docker-compose.prod.yml mapeia 3000:3000 (incorreto)
   - Coolify espera resposta na porta 3000, mas nada está lá

2. **Variáveis de build não passadas**
   - Frontend Dockerfile precisa de ARGs durante build
   - docker-compose não passa essas variáveis

3. **Uso incorreto de docker-compose**
   - Coolify funciona melhor com aplicações separadas
   - Dockerfiles individuais são mais estáveis

### ✅ **Solução: Deploy Separado (Backend + Frontend)**

Vamos fazer deploy de **2 aplicações separadas** no Coolify:
1. Backend (FastAPI)
2. Frontend (React + Nginx)

---

## 📦 PARTE 1: PREPARAR ARQUIVOS

### 1.1 Corrigir Dockerfile do Frontend

Atualize `/app/frontend/Dockerfile`:

```dockerfile
# ============================================
# STAGE 1: Build da aplicação React + Vite
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json yarn.lock* package-lock.json* ./

# Instalar dependências (suporta yarn ou npm)
RUN yarn install --frozen-lockfile || npm ci

# Copiar código fonte
COPY . .

# ⚠️ IMPORTANTE: Variáveis devem ser passadas como ARG durante o build
ARG VITE_BACKEND_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Definir como ENV para o build do Vite
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Build da aplicação
RUN yarn build || npm run build

# ============================================
# STAGE 2: Servidor Nginx
# ============================================
FROM nginx:alpine

# Instalar curl e wget para healthcheck
RUN apk add --no-cache curl wget

# Copiar build do React
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ⚠️ CORREÇÃO: Expor porta 3000 (não 80)
EXPOSE 3000

# Healthcheck para Coolify saber quando o app está pronto
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 1.2 Corrigir nginx.conf do Frontend

Atualize `/app/frontend/nginx.conf`:

```nginx
server {
    # ⚠️ CORREÇÃO: Nginx deve escutar na porta 3000 (não 80)
    listen 3000;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # React Router - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos (opcional mas recomendado)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint para Coolify
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

### 1.3 Verificar Dockerfile do Backend

O backend está OK, mas vamos adicionar healthcheck:

Atualize `/app/backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY . .

EXPOSE 8001

# Healthcheck para Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8001/api/ || exit 1

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 🌐 PARTE 2: CONFIGURAR DNS

### 2.1 Acessar painel DNS

Acesse o painel DNS do seu domínio (Hostinger, Cloudflare, etc.)

### 2.2 Adicionar registros DNS

Adicione os seguintes registros **A**:

| Tipo | Nome/Host | Valor (IP da VPS) | TTL  |
|------|-----------|-------------------|------|
| A    | @         | 72.60.10.10       | 300  |
| A    | www       | 72.60.10.10       | 300  |
| A    | app       | 72.60.10.10       | 300  |
| A    | api       | 72.60.10.10       | 300  |

**Resultado esperado:**
- `client4you.com.br` → 72.60.10.10
- `www.client4you.com.br` → 72.60.10.10
- `app.client4you.com.br` → 72.60.10.10
- `api.client4you.com.br` → 72.60.10.10

### 2.3 Testar propagação DNS

```bash
# Teste no terminal (pode levar 5-15 minutos)
ping app.client4you.com.br
ping api.client4you.com.br
```

Deve retornar: `72.60.10.10`

---

## 🐳 PARTE 3: DEPLOY NO COOLIFY

### 3.1 Acessar Coolify

Abra no navegador:
```
http://72.60.10.10:8000
```

Ou se Coolify já tem domínio configurado:
```
https://coolify.seudominio.com
```

### 3.2 Criar Projeto

1. No dashboard, clique em **"+ New Project"**
2. Preencha:
   - **Name:** `client4you`
   - **Description:** `Plataforma de captação de clientes`
3. Clique em **"Create"**

---

## 🔴 DEPLOY DO BACKEND (Aplicação 1)

### 3.3.1 Criar Resource - Backend

1. Dentro do projeto "client4you", clique em **"+ New Resource"**
2. Selecione **"Application"**
3. Selecione o tipo de source:
   - **Opção A:** Public Repository (se código está no GitHub)
   - **Opção B:** Private Repository (conectar GitHub account)
   - **Opção C:** Local Folder (upload manual)

### 3.3.2 Configurar Source (GitHub)

Se usar GitHub:

```
Repository URL: https://github.com/SEU_USUARIO/client4you-app
Branch: main
Build Pack: Dockerfile
Dockerfile Location: backend/Dockerfile
Base Directory: backend
```

### 3.3.3 Configurar Build - Backend

```
Name: client4you-backend
Port: 8001
```

### 3.3.4 Environment Variables - Backend

Clique em **"Environment Variables"** e adicione:

```env
# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMyNTMzMCwiZXhwIjoyMDgzOTAxMzMwfQ.b1Ecnc-MU1BOK5Q7OV8ZKTJV1Hv07eghq3qTBg5rKrM
SUPABASE_JWT_SECRET=eEPK7dTjJf1y00pgXH183WEf6FkjxFrXID7Sj9pdi9fUJ2QyOxHPvykBVwII4VJmsQiletkD41AMLOzTona8rQ==

# Segurança
TURNSTILE_SECRET_KEY=0x4AAAAAACW4RI9ZshOaX_1cYx4vgnw15BE
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=1800
LOGIN_WINDOW_DURATION=900

# CORS - Substitua pelo seu domínio
CORS_ORIGINS=https://client4you.com.br,https://app.client4you.com.br,https://api.client4you.com.br

# WAHA WhatsApp
WAHA_DEFAULT_URL=https://waha.chatyou.chat
WAHA_MASTER_KEY=PJ1X_5sPM2cgeAI3LB_ALOUPUyUkg9GjKvMZ7Leifi0

# Kiwify
KIWIFY_WEBHOOK_SECRET=o21anhwe1w1

# Email (SMTP)
SMTP_HOST=mail.estudyou.com
SMTP_PORT=465
SMTP_USER=nao-responda@estudyou.com
SMTP_PASSWORD=dd273a83-1e07-40a6-bba9-5336df1b94fe
SMTP_FROM_EMAIL=nao-responda@estudyou.com
SMTP_FROM_NAME=Client4You - Plataforma de Leads
SMTP_USE_TLS=true

# URLs do Sistema - Substitua pelo seu domínio
BACKEND_URL=https://api.client4you.com.br
FRONTEND_URL=https://app.client4you.com.br
```

**💡 Dica:** Cole linha por linha ou use "Bulk Add"

### 3.3.5 Configurar Domínio - Backend

1. Vá em **"Domains"** ou **"Networks"**
2. Clique em **"+ Add Domain"**
3. Configure:
   ```
   Domain: api.client4you.com.br
   Port: 8001
   ```
4. ✅ Marque **"Generate SSL Certificate"** (Let's Encrypt automático)
5. Clique em **"Save"**

### 3.3.6 Deploy Backend

1. Clique em **"Deploy"** (botão grande no topo)
2. Acompanhe os logs em tempo real
3. Aguarde 5-10 minutos para build completar

**✅ Backend pronto quando aparecer:** `Deployment successful`

### 3.3.7 Testar Backend

Abra no navegador ou use curl:

```bash
curl https://api.client4you.com.br/api/
```

**Resposta esperada:**
```json
{
  "message": "Lead Dispatcher API",
  "version": "2.2.0",
  "mode": "SaaS Hybrid",
  "database": "Supabase"
}
```

---

## 🔵 DEPLOY DO FRONTEND (Aplicação 2)

### 3.4.1 Criar Resource - Frontend

1. Volte para o projeto "client4you"
2. Clique em **"+ New Resource"** novamente
3. Selecione **"Application"**
4. Selecione o mesmo repositório

### 3.4.2 Configurar Source (GitHub)

```
Repository URL: https://github.com/SEU_USUARIO/client4you-app
Branch: main
Build Pack: Dockerfile
Dockerfile Location: frontend/Dockerfile
Base Directory: frontend
```

### 3.4.3 Configurar Build - Frontend

```
Name: client4you-frontend
Port: 3000
```

### 3.4.4 Build Args - Frontend

⚠️ **CRÍTICO:** O frontend precisa receber variáveis durante o **BUILD**, não runtime!

Procure por **"Build Arguments"** ou **"Docker Build Args"** e adicione:

```
VITE_BACKEND_URL=https://api.client4you.com.br
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
VITE_SUPABASE_PROJECT_ID=owlignktsqlrqaqhzujb
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
```

**📌 Nota:** Se o Coolify não tem campo "Build Args", adicione como Environment Variables mesmo.

### 3.4.5 Configurar Domínio - Frontend

1. Vá em **"Domains"**
2. Clique em **"+ Add Domain"**
3. Configure:
   ```
   Domain: app.client4you.com.br
   Port: 3000
   ```
4. ✅ Marque **"Generate SSL Certificate"**
5. Clique em **"Save"**

**Opcional:** Adicionar domínio secundário `client4you.com.br`

### 3.4.6 Deploy Frontend

1. Clique em **"Deploy"**
2. Acompanhe os logs
3. Aguarde 5-10 minutos

**✅ Frontend pronto quando aparecer:** `Deployment successful`

### 3.4.7 Testar Frontend

Abra no navegador:
```
https://app.client4you.com.br
```

Deve carregar a landing page do Client4you.

---

## ✅ PARTE 4: CONFIGURAÇÕES PÓS-DEPLOY

### 4.1 Configurar CORS no Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. **Settings** → **API**
4. Em **CORS Configuration**, adicione:
   ```
   https://app.client4you.com.br
   https://api.client4you.com.br
   https://client4you.com.br
   ```

### 4.2 Configurar Auth URLs no Supabase

1. **Authentication** → **URL Configuration**
2. **Site URL:**
   ```
   https://app.client4you.com.br
   ```
3. **Redirect URLs:**
   ```
   https://app.client4you.com.br/*
   https://app.client4you.com.br/auth/callback
   https://app.client4you.com.br/dashboard
   https://app.client4you.com.br/admin
   ```

### 4.3 Configurar Cloudflare Turnstile

1. Acesse https://dash.cloudflare.com/
2. Vá em **Turnstile**
3. Selecione o widget ou crie um novo
4. Adicione os domínios:
   ```
   app.client4you.com.br
   client4you.com.br
   ```

---

## 🧪 PARTE 5: TESTES COMPLETOS

### 5.1 Backend Health Check

```bash
# Teste 1: API raiz
curl https://api.client4you.com.br/api/

# Teste 2: Security health
curl https://api.client4you.com.br/api/security/health

# Teste 3: Dashboard stats (requer autenticação, mas não deve dar 500)
curl https://api.client4you.com.br/api/dashboard/stats
```

### 5.2 Frontend Testes Manuais

- [ ] Landing page carrega
- [ ] Botão "Começar Grátis" funciona
- [ ] Página de Signup abre
- [ ] Cloudflare Turnstile aparece
- [ ] Criar conta funciona
- [ ] Login funciona
- [ ] Dashboard carrega após login
- [ ] Barra de quota aparece
- [ ] Menu lateral funciona
- [ ] Busca de leads funciona (se SERP API configurada)

### 5.3 Testes de Integração

**Teste Supabase:**
1. Criar conta
2. Verificar no Supabase → Auth → Users se apareceu

**Teste Email:**
1. Tentar recuperar senha
2. Verificar se email chegou

**Teste WhatsApp (se WAHA configurado):**
1. Ir em Settings → WhatsApp
2. Iniciar sessão
3. Gerar QR code

---

## 🆘 TROUBLESHOOTING

### ❌ Problema: Backend retorna 502 Bad Gateway

**Solução:**
```bash
# Ver logs do backend no Coolify
# Ou via SSH na VPS:
docker logs <container-id-backend> --tail 100

# Verificar se porta 8001 está aberta
curl http://localhost:8001/api/
```

**Causas comuns:**
- Variáveis de ambiente faltando
- SUPABASE_SERVICE_ROLE_KEY incorreta
- Erro no código Python

### ❌ Problema: Frontend mostra página em branco

**Solução:**
```bash
# Ver logs do build do frontend
# Verificar console do navegador (F12)
```

**Causas comuns:**
- `VITE_BACKEND_URL` não foi passado como Build Arg
- Build falhou mas deploy continuou
- Nginx configurado incorretamente

### ❌ Problema: CORS Error no navegador

**Solução:**
1. Verificar `CORS_ORIGINS` no backend tem os domínios corretos
2. Configurar CORS no Supabase
3. Limpar cache: `Ctrl + Shift + R`

### ❌ Problema: SSL não funciona

**Solução:**
1. Aguardar 10-20 minutos (Let's Encrypt demora)
2. Verificar DNS propagou: `nslookup app.client4you.com.br`
3. Verificar porta 443 aberta no firewall da VPS
4. No Coolify, tentar regenerar certificado

### ❌ Problema: "No available server"

**Causas:**
- Healthcheck falhando
- Porta errada configurada
- Container crashando ao iniciar

**Solução:**
```bash
# SSH na VPS
ssh root@72.60.10.10

# Ver containers rodando
docker ps -a

# Ver logs do container
docker logs <container-name> --tail 50

# Testar porta internamente
curl http://localhost:3000/health
curl http://localhost:8001/api/
```

---

## 📊 MONITORAMENTO

### Logs em Tempo Real

**No Coolify:**
- Acesse a aplicação
- Clique em **"Logs"**
- Logs aparecem em tempo real

**Via SSH:**
```bash
# Backend
docker logs -f client4you-backend

# Frontend
docker logs -f client4you-frontend
```

### Métricas

**Comandos úteis:**
```bash
# Ver uso de recursos
docker stats

# Ver containers rodando
docker ps

# Ver portas abertas
netstat -tulpn | grep :8001
netstat -tulpn | grep :3000
```

---

## 🔄 ATUALIZAÇÕES FUTURAS

### Como Atualizar a Aplicação

**Se usar GitHub:**

1. Faça mudanças no código localmente
2. Commit e push:
   ```bash
   git add .
   git commit -m "Atualização X"
   git push
   ```
3. No Coolify, clique em **"Redeploy"**
4. Aguarde novo build (2-5 minutos)

**Se usar upload manual:**

1. Atualizar código na VPS
2. No Coolify, clicar em **"Rebuild"**

---

## ✅ CHECKLIST FINAL

Marque tudo que foi completado:

### DNS e Infraestrutura
- [ ] DNS configurado (app, api, www, @)
- [ ] DNS propagado (ping funcionando)
- [ ] Coolify acessível

### Backend
- [ ] Aplicação criada no Coolify
- [ ] Dockerfile corrigido com healthcheck
- [ ] Todas variáveis de ambiente configuradas
- [ ] Domínio api.client4you.com.br configurado
- [ ] SSL gerado (Let's Encrypt)
- [ ] Deploy concluído com sucesso
- [ ] Endpoint /api/ respondendo corretamente

### Frontend
- [ ] Aplicação criada no Coolify
- [ ] Dockerfile corrigido (porta 3000)
- [ ] nginx.conf corrigido (listen 3000)
- [ ] Build args configurados (VITE_*)
- [ ] Domínio app.client4you.com.br configurado
- [ ] SSL gerado
- [ ] Deploy concluído com sucesso
- [ ] Landing page abre corretamente

### Integrações
- [ ] CORS configurado no Supabase
- [ ] Auth URLs configuradas no Supabase
- [ ] Turnstile configurado com domínios
- [ ] Email SMTP testado (opcional)
- [ ] WAHA testado (opcional)

### Testes Funcionais
- [ ] Criar conta funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Busca de leads funciona
- [ ] Painel admin acessível

---

## 🎉 DEPLOY COMPLETO!

Se todos os itens estão marcados, sua aplicação está no ar! 🚀

**URLs de produção:**
- 🌐 Landing: https://client4you.com.br
- 🎨 App: https://app.client4you.com.br
- 🔌 API: https://api.client4you.com.br

**Próximos passos:**
1. Monitorar logs nas primeiras 24h
2. Configurar backups automáticos
3. Configurar alertas de downtime (UptimeRobot)
4. Documentar processos de manutenção
5. Configurar CDN (Cloudflare)

---

## 📞 SUPORTE

**Precisa de mais ajuda?**

Me informe:
1. Qual passo você está
2. Qual erro específico está vendo
3. Logs do Coolify ou container
4. Screenshot do problema

**Logs importantes para compartilhar:**
```bash
# Backend
docker logs client4you-backend --tail 100

# Frontend
docker logs client4you-frontend --tail 100
```

---

**Última atualização:** Fevereiro 2025  
**Versão do guia:** 4.0  
**Testado em:** Coolify v4, Ubuntu 22.04
