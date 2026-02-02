# 🚀 GUIA COMPLETO DE DEPLOY - CLIENT4YOU
## Deploy em VPS usando Coolify + Docker Compose

---

## 📋 **PRÉ-REQUISITOS**

### ✅ **O que você precisa ter:**

1. **VPS configurada com Coolify instalado**
2. **Domínio configurado** (ex: client4you.com.br)
3. **Contas/Chaves de serviços externos:**
   - Supabase (já tem)
   - Cloudflare Turnstile (já tem)
   - WAHA WhatsApp (já tem)
   - Kiwify (já tem)
   - SMTP/Email (já tem)

---

## 🗂️ **ESTRUTURA DO PROJETO**

```
client4you/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env (NÃO commitar!)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── .env (NÃO commitar!)
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 📦 **PASSO 1: PREPARAR ARQUIVOS DE DEPLOY**

### **1.1 Criar Dockerfile do Backend**

Crie `/app/backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Expor porta
EXPOSE 8001

# Comando para iniciar
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### **1.2 Criar Dockerfile do Frontend**

Crie `/app/frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY yarn.lock ./

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN yarn build

# Stage de produção com nginx
FROM nginx:alpine

# Copiar build do frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
```

### **1.3 Criar nginx.conf para Frontend**

Crie `/app/frontend/nginx.conf`:

```nginx
server {
    listen 3000;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # React Router - todas rotas vão para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **1.4 Criar docker-compose.yml**

Crie `/app/docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: client4you-backend
    restart: unless-stopped
    ports:
      - "8001:8001"
    env_file:
      - ./backend/.env
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - ./backend/uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: client4you-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    name: client4you-network
```

---

## 🔐 **PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE**

### **2.1 Backend - `.env`**

Crie `/app/backend/.env` (NÃO commitar no git!):

```env
# Supabase
SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=eEPK7dTjJf1y00pgXH183WEf6FkjxFrXID7Sj9pdi9f...

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAACW4RI9ZshOaX_1cYx4vgnw15BE

# Rate Limiting Anti-Brute Force
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=1800
LOGIN_WINDOW_DURATION=900

# CORS - Ajuste com seu domínio
CORS_ORIGINS=https://client4you.com.br,https://app.client4you.com.br

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

# Whitelist de IPs (opcional)
ADMIN_IP_WHITELIST=
```

### **2.2 Frontend - `.env`**

Crie `/app/frontend/.env`:

```env
VITE_SUPABASE_PROJECT_ID=owlignktsqlrqaqhzujb
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co

# Backend URL - AJUSTE COM SEU DOMÍNIO
VITE_BACKEND_URL=https://api.client4you.com.br
REACT_APP_BACKEND_URL=https://api.client4you.com.br

# Cloudflare Turnstile
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
```

---

## 🗄️ **PASSO 3: APLICAR MIGRATIONS NO SUPABASE**

**ANTES de fazer deploy, aplique estas migrations:**

### **3.1 Migration de Segurança**

No Supabase SQL Editor, execute:
```sql
-- Arquivo: /app/frontend/supabase/migrations/20260207_security_enhancements.sql
-- (Copie e cole o conteúdo completo)
```

### **3.2 Fix de RLS para Quotas**

```sql
-- Arquivo: /app/SUPABASE_FIX_QUOTA_RLS.sql
-- (Copie e cole o conteúdo completo)
```

### **3.3 Verificar Tabelas Criadas**

Confirme que estas tabelas existem:
- ✅ `login_attempts`
- ✅ `user_2fa`
- ✅ `audit_logs`
- ✅ `ip_whitelist`

---

## 🌐 **PASSO 4: CONFIGURAR DNS**

Configure os seguintes registros DNS no seu provedor:

```
Tipo    Nome                Valor                        TTL
A       @                   SEU_IP_VPS                   3600
A       www                 SEU_IP_VPS                   3600
A       api                 SEU_IP_VPS                   3600
A       app                 SEU_IP_VPS                   3600
```

**Exemplo:**
- `client4you.com.br` → Landing page
- `app.client4you.com.br` → Aplicação frontend
- `api.client4you.com.br` → Backend API

---

## 🐳 **PASSO 5: DEPLOY NO COOLIFY**

### **5.1 Acessar Coolify**

Acesse seu painel Coolify na VPS.

### **5.2 Criar Novo Projeto**

1. Clique em **"New Resource"** ou **"Novo Recurso"**
2. Selecione **"Docker Compose"**
3. Nome do projeto: `client4you`

### **5.3 Configurar Repository**

- **Source:** Git repository ou upload manual
- **Branch:** main/master
- **Docker Compose File:** Selecione `docker-compose.yml`

### **5.4 Configurar Domínios**

Configure os domínios para cada serviço:

**Frontend:**
- Primary: `app.client4you.com.br`
- Alternativo: `client4you.com.br`

**Backend:**
- Primary: `api.client4you.com.br`

### **5.5 Configurar Environment Variables**

No painel do Coolify, adicione TODAS as variáveis do `.env` (backend e frontend).

**⚠️ IMPORTANTE:** Coolify permite adicionar variáveis secretas de forma segura!

### **5.6 Habilitar HTTPS/SSL**

- Coolify automaticamente provisiona certificados Let's Encrypt
- Certifique-se de marcar "Enable HTTPS"

### **5.7 Deploy**

Clique em **"Deploy"** e aguarde o build completar.

---

## ✅ **PASSO 6: VERIFICAÇÃO PÓS-DEPLOY**

### **6.1 Checklist de Testes**

Execute estes testes após deploy:

#### **Backend Health Check:**
```bash
curl https://api.client4you.com.br/api/
# Esperado: {"message": "Lead Dispatcher API", "version": "2.2.0", ...}

curl https://api.client4you.com.br/api/security/health
# Esperado: {"status": "healthy", ...}
```

#### **Frontend:**
- [ ] Acesse `https://app.client4you.com.br`
- [ ] Página carrega corretamente
- [ ] Login funciona
- [ ] CAPTCHA aparece após 3 tentativas
- [ ] Dashboard carrega
- [ ] Painel admin pede re-autenticação

#### **Integrações:**
- [ ] WAHA: Teste envio de mensagem WhatsApp
- [ ] Supabase: Login/Logout funcionam
- [ ] Email: Testar notificações
- [ ] Kiwify: Webhook de pagamento

### **6.2 Monitoramento**

**Logs do Coolify:**
- Acesse logs em tempo real no painel
- Backend: `/var/log/backend.log`
- Frontend: Nginx logs

**Comandos úteis na VPS:**
```bash
# Ver containers rodando
docker ps

# Ver logs do backend
docker logs client4you-backend -f

# Ver logs do frontend
docker logs client4you-frontend -f

# Reiniciar serviços
docker-compose restart

# Parar tudo
docker-compose down

# Subir novamente
docker-compose up -d
```

---

## 🔒 **PASSO 7: SEGURANÇA FINAL**

### **7.1 Firewall**

Configure firewall na VPS:
```bash
# Permitir apenas portas necessárias
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### **7.2 Backup**

Configure backups automáticos:
- **Banco Supabase:** Já tem backup automático
- **Uploads:** Backup da pasta `./backend/uploads`
- **Configurações:** Backup dos `.env` files

### **7.3 Monitoramento**

Considere usar:
- **Uptime Robot** - Monitorar uptime
- **Sentry** - Logs de erro
- **Google Analytics** - Métricas de uso

---

## 📊 **PASSO 8: OTIMIZAÇÕES OPCIONAIS**

### **8.1 CDN (Cloudflare)**

- Configurar Cloudflare na frente do domínio
- Cache de assets estáticos
- Proteção DDoS

### **8.2 Redis Cache**

Adicionar Redis ao docker-compose para cache:
```yaml
redis:
  image: redis:7-alpine
  container_name: client4you-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
```

### **8.3 Nginx Reverse Proxy**

Se não usar proxy do Coolify, configure Nginx na VPS:
```nginx
upstream backend {
    server localhost:8001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.client4you.com.br;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name app.client4you.com.br;
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🆘 **TROUBLESHOOTING**

### **Problema: Backend não inicia**
```bash
# Ver logs
docker logs client4you-backend

# Verificar variáveis de ambiente
docker exec client4you-backend env | grep SUPABASE
```

### **Problema: Frontend não conecta ao backend**
- Verificar `VITE_BACKEND_URL` está correto
- Testar endpoint: `curl https://api.client4you.com.br/api/`
- Verificar CORS no backend

### **Problema: HTTPS não funciona**
- DNS propagado? (pode levar até 48h)
- Certificado Let's Encrypt gerado?
- Porta 443 aberta no firewall?

---

## 📝 **CHECKLIST FINAL PRÉ-DEPLOY**

- [ ] Migrations do Supabase aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] DNS configurado e propagado
- [ ] Dockerfiles criados
- [ ] docker-compose.yml criado
- [ ] `.gitignore` contém `.env`
- [ ] Testado localmente com docker-compose
- [ ] Backup de dados importantes feito
- [ ] Domínio SSL/HTTPS configurado
- [ ] Health checks funcionando
- [ ] Monitoramento configurado

---

## 🎉 **DEPLOY COMPLETO!**

Sua aplicação está no ar! 🚀

**URLs de acesso:**
- Frontend: https://app.client4you.com.br
- Backend API: https://api.client4you.com.br
- Admin: https://app.client4you.com.br/admin

**Próximos passos:**
1. Monitorar logs nas primeiras 24h
2. Testar todos fluxos críticos
3. Configurar alertas de downtime
4. Documentar processos de manutenção

---

**Precisa de ajuda? Me chame!** 💪
