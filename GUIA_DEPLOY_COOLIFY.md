# 🚀 GUIA COMPLETO DE DEPLOY - Client4you no Coolify

## ✅ Pré-requisitos Verificados

- [x] VPS: 72.60.10.10
- [x] Domínio: client4you.com.br
- [x] DNS: Apontando para a VPS
- [x] Coolify instalado
- [x] Supabase configurado

---

## 📋 PASSO 1: Configurar DNS (CONCLUÍDO ✅)

No painel da Hostinger, certifique-se que o registro A está assim:

```
Tipo: A
Nome: @
Aponta para: 72.60.10.10
TTL: 300
```

**Testar DNS:**
```bash
ping client4you.com.br
# Deve retornar: 72.60.10.10
```

---

## 📦 PASSO 2: Preparar Repositório Git

### Opção A: Usar GitHub (RECOMENDADO)

1. Crie um repositório no GitHub: `client4you-app`

2. No seu computador local, faça upload do código:
```bash
cd /caminho/para/o/codigo
git init
git add .
git commit -m "Initial commit - Client4you"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/client4you-app.git
git push -u origin main
```

### Opção B: Deploy Manual (Sem Git)

Pule para o Passo 3B.

---

## 🔐 PASSO 3A: Criar Projeto no Coolify (Via Git)

1. **Acesse o Coolify**: http://72.60.10.10:8000 (ou seu domínio do Coolify)

2. **Clique em "New Project"**

3. **Configurações do Projeto:**
   - **Name**: Client4you
   - **Description**: Plataforma de captação de clientes

4. **Clique em "New Resource"** → **Application**

5. **Source:**
   - Selecione: **Public Repository (GitHub/GitLab)**
   - **Repository URL**: `https://github.com/SEU_USUARIO/client4you-app`
   - **Branch**: `main`
   - **Build Pack**: Docker Compose
   - **Docker Compose File**: `docker-compose.prod.yml`

6. **Clique em "Continue"**

---

## 🔐 PASSO 3B: Criar Projeto no Coolify (Manual)

Se não usar Git:

1. **Compacte o código** em um arquivo `.tar.gz`
2. No Coolify, use a opção **"Simple Dockerfile"**
3. Faça upload manualmente dos arquivos

---

## ⚙️ PASSO 4: Configurar Variáveis de Ambiente

No Coolify, vá em **Environment Variables** e adicione:

### 🔹 SUPABASE (OBRIGATÓRIO)

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=seu-jwt-secret-aqui
```

**Onde encontrar essas credenciais:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - Project URL = `SUPABASE_URL`
   - `anon` `public` key = `SUPABASE_ANON_KEY`
   - `service_role` key = `SUPABASE_SERVICE_ROLE_KEY`
5. Em **Settings** → **Auth** → **JWT Settings**:
   - JWT Secret = `SUPABASE_JWT_SECRET`

---

### 🔹 SERP API (Para buscar leads do Google Maps)

```env
SERP_API_KEY=sua-chave-serpapi
```

**Como obter:**
1. Acesse: https://serpapi.com/
2. Crie uma conta grátis
3. Copie sua API Key

---

### 🔹 WAHA (WhatsApp - OPCIONAL)

```env
WAHA_DEFAULT_URL=https://waha.chatyou.chat
WAHA_MASTER_KEY=sua-master-key
```

**Se não tiver WAHA:**
- Deixe em branco por enquanto
- O sistema funcionará sem o Disparador WhatsApp

---

### 🔹 KIWIFY (Pagamentos - OPCIONAL)

```env
KIWIFY_SECRET=seu-secret-kiwify
```

---

### 🔹 EMAIL (OPCIONAL - para notificações)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM=noreply@client4you.com.br
```

---

### 🔹 CLOUDFLARE TURNSTILE (Anti-bot - OPCIONAL)

```env
TURNSTILE_SITE_KEY=0x4AAAAAACW4RDfzQ0vdBVOB
TURNSTILE_SECRET_KEY=sua-secret-key
```

**Como obter:**
1. Acesse: https://dash.cloudflare.com/
2. Vá em **Turnstile**
3. Crie um novo site
4. Copie Site Key e Secret Key

---

### 🔹 URLs DO SISTEMA

```env
BACKEND_URL=https://client4you.com.br/api
FRONTEND_URL=https://client4you.com.br
```

---

## 🌐 PASSO 5: Configurar Domínio no Coolify

1. No Coolify, vá em **Domains**

2. **Clique em "+ Add Domain"**

3. **Configure:**
   ```
   Domain: client4you.com.br
   Port: 3000 (Frontend)
   ```

4. **SSL/HTTPS:**
   - Marque a opção: **"Generate Let's Encrypt Certificate"**
   - Coolify vai gerar automaticamente o certificado SSL

5. **Salve**

---

## 🚀 PASSO 6: Fazer Deploy

1. No Coolify, clique em **"Deploy"**

2. **Aguarde o processo de build** (pode levar 5-10 minutos):
   - ⏳ Cloning repository...
   - ⏳ Building frontend...
   - ⏳ Building backend...
   - ⏳ Starting services...
   - ✅ Deployment successful!

3. **Verifique os logs** se houver erros

---

## ✅ PASSO 7: Verificar Deployment

### Teste o Frontend:
```
https://client4you.com.br
```

Deve abrir a Landing Page do Client4you.

### Teste o Backend:
```
https://client4you.com.br/api/
```

Deve retornar:
```json
{
  "message": "Lead Dispatcher API",
  "version": "2.2.0",
  "mode": "SaaS Hybrid"
}
```

### Teste Login:
1. Acesse: https://client4you.com.br/login
2. Crie uma conta de teste
3. Faça login

---

## 🔧 PASSO 8: Configurações Pós-Deploy

### 1. Configurar CORS no Supabase

1. Acesse: https://supabase.com/dashboard
2. Vá em **Settings** → **API**
3. Em **CORS Configuration**, adicione:
   ```
   https://client4you.com.br
   http://client4you.com.br
   ```

### 2. Configurar Redirect URLs (Auth)

1. No Supabase, vá em **Authentication** → **URL Configuration**
2. Em **Site URL**, coloque:
   ```
   https://client4you.com.br
   ```
3. Em **Redirect URLs**, adicione:
   ```
   https://client4you.com.br/auth/callback
   https://client4you.com.br/dashboard
   ```

### 3. Testar Integração com Supabase

1. Crie uma conta no sistema
2. Verifique se o usuário foi criado no Supabase (Auth → Users)
3. Faça login e teste as funcionalidades

---

## 🔍 TROUBLESHOOTING

### ❌ Erro: "520 Web Server Error"

**Solução:**
- Verifique se o backend está rodando no Coolify
- Veja os logs: `Logs` → `Backend`
- Certifique-se de que todas as variáveis de ambiente estão corretas

### ❌ Erro: "CORS Policy"

**Solução:**
- Configure CORS no Supabase (Passo 8.1)
- Reinicie o deploy no Coolify

### ❌ Erro: "Invalid JWT"

**Solução:**
- Verifique se `SUPABASE_JWT_SECRET` está correto
- Copie novamente do Supabase → Settings → Auth → JWT Settings

### ❌ SSL não está funcionando

**Solução:**
- Aguarde 5-10 minutos (Let's Encrypt leva tempo)
- Verifique se o DNS está correto: `ping client4you.com.br`
- No Coolify, tente gerar novamente o certificado

### ❌ "Cannot connect to backend"

**Solução:**
- Verifique se `VITE_BACKEND_URL` está configurado corretamente
- Deve ser: `https://client4you.com.br/api`
- Reinicie o frontend no Coolify

---

## 📊 MONITORAMENTO

### Verificar Saúde dos Serviços:

No Coolify, vá em **Resources** e veja:
- ✅ Frontend: Running
- ✅ Backend: Running

### Logs em Tempo Real:

```bash
# Frontend
docker logs -f coolify-client4you-frontend

# Backend
docker logs -f coolify-client4you-backend
```

---

## 🔄 ATUALIZAÇÕES FUTURAS

### Como Atualizar a Aplicação:

1. **Faça commit das mudanças no Git:**
   ```bash
   git add .
   git commit -m "Atualização X"
   git push
   ```

2. **No Coolify, clique em "Redeploy"**

3. **Aguarde o novo deploy** (2-5 minutos)

---

## 📝 CHECKLIST FINAL

Marque tudo que foi completado:

- [ ] DNS configurado e apontando para 72.60.10.10
- [ ] Coolify acessível e funcionando
- [ ] Repositório Git criado (ou upload manual feito)
- [ ] Projeto criado no Coolify
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Domínio client4you.com.br adicionado
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Deploy realizado com sucesso
- [ ] Frontend acessível em https://client4you.com.br
- [ ] Backend respondendo em https://client4you.com.br/api/
- [ ] CORS configurado no Supabase
- [ ] Redirect URLs configuradas no Supabase
- [ ] Conta de teste criada e login funcionando
- [ ] Busca de leads testada (se SERP API configurada)
- [ ] Disparador WhatsApp testado (se WAHA configurado)

---

## 🎉 PARABÉNS!

Se todos os checkboxes estiverem marcados, o **Client4you está no AR**! 🚀

**URL de Produção:** https://client4you.com.br

---

## 📞 SUPORTE

**Problemas no Deploy?**

1. Verifique os logs no Coolify
2. Teste cada serviço individualmente
3. Certifique-se de que o DNS propagou (pode levar até 1 hora)
4. Revise as variáveis de ambiente

**Tudo funcionando?**

Agora você pode:
- ✅ Cadastrar usuários
- ✅ Buscar leads do Google Maps
- ✅ Criar campanhas WhatsApp (se WAHA configurado)
- ✅ Gerenciar assinaturas (se Kiwify configurado)

---

**Data:** Fevereiro 2025  
**Versão:** 1.0  
**Sistema:** Client4you SaaS
