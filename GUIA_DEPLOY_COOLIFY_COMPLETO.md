# 🚀 GUIA COMPLETO DE DEPLOY NO COOLIFY

## ✅ PRÉ-REQUISITO CONFIRMADO

```
✅ DNS: client4you.com.br → 72.60.10.10
✅ VPS: 72.60.10.10 (Coolify instalado)
✅ Código: Client4you pronto
```

---

## 🎯 DECISÃO: QUAL MÉTODO USAR?

### **MÉTODO A: GitHub + Coolify (RECOMENDADO)**
- ✅ Deploy automático a cada commit
- ✅ Versionamento de código
- ✅ Rollback fácil
- ⏱️ Tempo: 30-40 minutos

### **MÉTODO B: Upload Manual Coolify**
- ⚠️ Precisa fazer upload a cada mudança
- ⏱️ Tempo: 20-30 minutos

**👉 Vou explicar ambos, mas RECOMENDO o Método A**

---

# 📘 MÉTODO A: DEPLOY VIA GITHUB

## PASSO 1: Criar Repositório no GitHub

### 1.1. Criar conta no GitHub (se não tiver)
- Acesse: https://github.com/
- Clique em **"Sign up"**
- Crie sua conta

### 1.2. Criar novo repositório
1. No GitHub, clique no **"+"** (canto superior direito)
2. Selecione **"New repository"**
3. Configure:
   ```
   Repository name: client4you-app
   Description: Plataforma Client4you - Captação de Clientes
   Visibility: Private (recomendado)
   Initialize: NÃO marcar nada (sem README, sem .gitignore)
   ```
4. Clique em **"Create repository"**

### 1.3. Copiar URL do repositório

Após criar, copie a URL que aparece (tipo):
```
https://github.com/SEU_USUARIO/client4you-app.git
```

---

## PASSO 2: Preparar Código Localmente

⚠️ **IMPORTANTE**: Você precisa ter acesso ao servidor onde o código está rodando.

### 2.1. Conectar via SSH no servidor

```bash
ssh root@72.60.10.10
```

### 2.2. Navegar até o diretório do projeto

```bash
cd /app
```

### 2.3. Inicializar Git (se ainda não foi feito)

```bash
git init
git config user.name "Seu Nome"
git config user.email "seu@email.com"
```

### 2.4. Adicionar remote do GitHub

```bash
git remote add origin https://github.com/SEU_USUARIO/client4you-app.git
```

### 2.5. Criar arquivo .gitignore

```bash
cat > .gitignore << 'EOF'
# Environments
.env
.env.local
.env.production
backend/.env
frontend/.env

# Node modules
node_modules/
frontend/node_modules/
backend/node_modules/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/
.venv/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build outputs
frontend/dist/
frontend/build/

# Logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
EOF
```

### 2.6. Fazer primeiro commit e push

```bash
git add .
git commit -m "Initial commit - Client4you"
git branch -M main
git push -u origin main
```

⚠️ **Nota**: GitHub pode pedir autenticação:
- Use **Personal Access Token** em vez de senha
- Gerar token em: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

---

## PASSO 3: Configurar Coolify

### 3.1. Acessar Coolify

Abra no navegador:
```
http://72.60.10.10:8000
```

Faça login com suas credenciais.

---

### 3.2. Criar Projeto

1. No dashboard, clique em **"+ New Project"**
2. Configure:
   ```
   Name: client4you
   Description: Plataforma de captação de clientes
   ```
3. Clique em **"Save"**

---

### 3.3. Deploy do BACKEND

#### 3.3.1. Criar Resource

1. Dentro do projeto "client4you", clique em **"+ New Resource"**
2. Selecione **"Application"**
3. Selecione **"Public Repository"**

#### 3.3.2. Configurar Source

```
Source Type: Public Repository (GitHub/GitLab)
Repository URL: https://github.com/SEU_USUARIO/client4you-app.git
Branch: main
```

#### 3.3.3. Configurar Build

```
Name: client4you-backend
Build Pack: Dockerfile
Dockerfile: backend/Dockerfile
Port: 8001
```

#### 3.3.4. Adicionar Environment Variables

Clique em **"Environment Variables"** e adicione:

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
SMTP_PASSWORD=server-ready-check
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

**💡 Dica**: Cole todas de uma vez! Coolify aceita o formato `KEY=VALUE` (uma por linha).

#### 3.3.5. Configurar Domínio

1. Vá em **"Domains"**
2. Clique em **"+ Add Domain"**
3. Configure:
   ```
   Domain: api.client4you.com.br
   ```
4. Marque **"Generate Let's Encrypt Certificate"** ✅
5. Clique em **"Save"**

#### 3.3.6. Deploy Backend

1. Clique em **"Deploy"**
2. Aguarde 5-10 minutos
3. Veja os logs em tempo real
4. Quando aparecer **"Deployment successful"** ✅

---

### 3.4. Deploy do FRONTEND

#### 3.4.1. Criar Resource

1. Volte para o projeto "client4you"
2. Clique em **"+ New Resource"**
3. Selecione **"Application"**
4. Selecione **"Public Repository"**

#### 3.4.2. Configurar Source

```
Source Type: Public Repository (GitHub/GitLab)
Repository URL: https://github.com/SEU_USUARIO/client4you-app.git
Branch: main
```

#### 3.4.3. Configurar Build

```
Name: client4you-frontend
Build Pack: Dockerfile
Dockerfile: frontend/Dockerfile
Port: 3000
```

#### 3.4.4. Adicionar Environment Variables

```env
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93bGlnbmt0c3FscnFhcWh6dWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjUzMzAsImV4cCI6MjA4MzkwMTMzMH0.B9UhTYi8slAx2UWsSckys55O9VQHdkYIHyqhSeFy8Z0
VITE_BACKEND_URL=https://api.client4you.com.br
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
```

#### 3.4.5. Configurar Domínio

1. Vá em **"Domains"**
2. Clique em **"+ Add Domain"**
3. Configure:
   ```
   Domain: app.client4you.com.br
   ```
4. Marque **"Generate Let's Encrypt Certificate"** ✅
5. Clique em **"Save"**

#### 3.4.6. Deploy Frontend

1. Clique em **"Deploy"**
2. Aguarde 5-10 minutos
3. Quando aparecer **"Deployment successful"** ✅

---

## PASSO 4: Configurar DNS (Adicionar Subdomínios)

No painel da **Hostinger**, adicione mais 2 registros:

| Tipo | Nome | Aponta para | TTL |
|------|------|-------------|-----|
| A    | app  | 72.60.10.10 | 300 |
| A    | api  | 72.60.10.10 | 300 |

Aguarde 5-15 minutos para propagação.

---

## PASSO 5: Configurar Supabase

### 5.1. CORS

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. **Settings** → **API**
4. Em **CORS Configuration**, adicione:
   ```
   https://app.client4you.com.br
   https://api.client4you.com.br
   https://client4you.com.br
   ```

### 5.2. Auth URLs

1. **Authentication** → **URL Configuration**
2. **Site URL**:
   ```
   https://app.client4you.com.br
   ```
3. **Redirect URLs**:
   ```
   https://app.client4you.com.br/*
   https://app.client4you.com.br/auth/callback
   https://app.client4you.com.br/dashboard
   ```

---

## PASSO 6: Configurar Cloudflare Turnstile

1. Acesse: https://dash.cloudflare.com/ → Turnstile
2. Selecione o widget "client4you.com.br"
3. **Adicionar nomes de host**:
   ```
   app.client4you.com.br
   api.client4you.com.br
   ```
4. Salvar

---

## PASSO 7: TESTAR

### 7.1. Backend API

Abra no navegador:
```
https://api.client4you.com.br/api/
```

**Deve retornar:**
```json
{
  "message": "Lead Dispatcher API",
  "version": "2.2.0",
  "mode": "SaaS Hybrid"
}
```

### 7.2. Frontend

Abra no navegador:
```
https://app.client4you.com.br
```

**Deve mostrar:** Landing Page do Client4you

### 7.3. Criar Conta e Testar

1. Clique em **"Começar Grátis"**
2. Cadastre um usuário
3. Faça login
4. Dashboard deve carregar

---

## ✅ CHECKLIST FINAL

- [ ] Código no GitHub
- [ ] Backend deployado no Coolify
- [ ] Frontend deployado no Coolify
- [ ] DNS configurado (app + api)
- [ ] SSL gerado (Let's Encrypt)
- [ ] CORS configurado no Supabase
- [ ] Auth URLs configuradas
- [ ] Turnstile configurado
- [ ] Backend respondendo: `https://api.client4you.com.br/api/`
- [ ] Frontend abrindo: `https://app.client4you.com.br`
- [ ] Login funcionando
- [ ] Dashboard acessível

---

# 📗 MÉTODO B: UPLOAD MANUAL COOLIFY

## PASSO 1: Compactar Código

No servidor SSH:

```bash
cd /app
tar -czf client4you-app.tar.gz \
  --exclude=node_modules \
  --exclude=.venv \
  --exclude=__pycache__ \
  --exclude=.git \
  --exclude=*.log \
  backend/ frontend/ docker-compose.prod.yml
```

## PASSO 2: Baixar Arquivo

Use SCP ou WinSCP para baixar `client4you-app.tar.gz` para seu computador.

## PASSO 3: No Coolify

1. **+ New Project** → "client4you"
2. **+ New Resource** → **Application** → **Upload Files**
3. Faça upload do `client4you-app.tar.gz`
4. Configure variáveis de ambiente (mesmas do Método A)
5. Configure domínios
6. Deploy

⚠️ **Desvantagem**: A cada mudança no código, precisa repetir o processo.

---

# 🔄 ATUALIZAÇÕES FUTURAS

## Com GitHub (Método A):

```bash
# No servidor SSH:
cd /app
git add .
git commit -m "Atualização X"
git push

# No Coolify:
# Clique em "Redeploy" (automático se configurar webhook)
```

## Com Upload Manual (Método B):

```bash
# Recompilar, baixar, fazer upload novamente
```

---

# 🆘 TROUBLESHOOTING

## Backend não inicia

**Verificar:**
1. Logs no Coolify → Backend → Logs
2. Todas variáveis de ambiente corretas?
3. Dockerfile existe em `backend/`?

## Frontend não carrega

**Verificar:**
1. Variáveis `VITE_*` configuradas?
2. Build concluiu com sucesso?
3. Nginx configurado corretamente?

## SSL não funciona

**Solução:**
1. Aguardar 10-20 minutos
2. DNS propagado? (`ping api.client4you.com.br`)
3. Regenerar certificado no Coolify

## CORS Error

**Solução:**
1. Configurar CORS no Supabase
2. Adicionar domínios em `CORS_ORIGINS`
3. Limpar cache: `Ctrl + Shift + R`

---

# 🎉 CONCLUSÃO

Seguindo este guia, você terá:

- ✅ **Backend**: https://api.client4you.com.br
- ✅ **Frontend**: https://app.client4you.com.br
- ✅ **SSL/HTTPS**: Automático
- ✅ **Deploy contínuo**: Via GitHub
- ✅ **Sistema completo em produção**

**Tempo estimado:** 30-60 minutos

**Dificuldade:** Média

**Resultado:** SaaS completo no ar! 🚀

---

**Data:** Fevereiro 2025  
**Versão:** 3.0  
**Sistema:** Client4you Production Deploy
