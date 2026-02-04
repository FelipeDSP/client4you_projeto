# 📋 INFORMAÇÕES NECESSÁRIAS PARA DEPLOY

Para completar o deploy no Coolify, preciso das seguintes informações:

---

## 1️⃣ INFORMAÇÕES DE ACESSO

### VPS/Servidor
- **IP da VPS:** `_________________________`
- **URL do Coolify:** `_________________________`
- **Usuário Coolify:** `_________________________`
- **Senha Coolify:** `_________________________`

---

## 2️⃣ DOMÍNIO

### Informações do Domínio
- **Domínio principal:** `_________________________` (ex: client4you.com.br)
- **Provedor DNS:** `_________________________` (Hostinger, Cloudflare, GoDaddy, etc.)
- **Acesso ao painel DNS:** [ ] Sim  [ ] Não

### Subdomínios a configurar
- [ ] `app.seudominio.com` → Frontend
- [ ] `api.seudominio.com` → Backend
- [ ] `www.seudominio.com` → Redirect para app (opcional)

**Status DNS atual:**
- [ ] Já configurado e propagado
- [ ] Preciso configurar agora
- [ ] Preciso de ajuda para configurar

---

## 3️⃣ REPOSITÓRIO GIT

### Como você quer fazer deploy?

**Opção A: GitHub (Recomendado - Deploy automático)**
- [ ] Já tenho repositório no GitHub
  - URL: `_________________________`
  - Branch: `_________________________` (geralmente `main`)
- [ ] Preciso criar repositório no GitHub
  - [ ] Tenho conta no GitHub
  - [ ] Preciso criar conta no GitHub

**Opção B: Upload Manual (Mais simples, mas sem CD)**
- [ ] Vou fazer upload manual dos arquivos no Coolify

---

## 4️⃣ STATUS ATUAL

### O que você já fez até agora?

- [ ] Instalei o Coolify na VPS
- [ ] Criei projeto no Coolify
- [ ] Tentei fazer deploy (mas deu erro)
- [ ] Configurei DNS
- [ ] Código está no GitHub

### Qual erro específico você está vendo?

```
Cole aqui o erro que você está vendo:




```

### Screenshots (se tiver)

- [ ] Anexei screenshot do erro no Coolify
- [ ] Anexei screenshot das configurações

---

## 5️⃣ CREDENCIAIS EXTERNAS (Opcional - Se já tem)

### Supabase
- [ ] Já tenho conta e projeto criado
  - Project URL: `_________________________`
  - Anon Key: `_________________________`
  - Service Role Key: `_________________________`
- [ ] Preciso criar conta no Supabase

### Cloudflare Turnstile (Anti-bot)
- [ ] Já tenho configurado
  - Site Key: `_________________________`
  - Secret Key: `_________________________`
- [ ] Quero configurar depois
- [ ] Não vou usar

### WAHA (WhatsApp - Opcional)
- [ ] Já tenho servidor WAHA
  - URL: `_________________________`
  - Master Key: `_________________________`
- [ ] Não vou usar WhatsApp por enquanto

---

## 6️⃣ PRÓXIMOS PASSOS

Com base nas suas respostas acima, vou:

1. **Se código não está no GitHub:** Te ajudar a subir para GitHub
2. **Se DNS não configurado:** Te guiar passo-a-passo na configuração
3. **Se Coolify não configurado:** Te ajudar a configurar do zero
4. **Se deploy já tentado:** Analisar o erro e corrigir

---

## 📝 COMO PREENCHER ESTE FORMULÁRIO

1. Copie este arquivo
2. Preencha as informações solicitadas
3. Marque os checkboxes com `[x]`
4. Me envie de volta

**Exemplo de checkbox preenchido:**
- [x] Já tenho repositório no GitHub

---

## 🆘 PRECISA DE AJUDA PARA PREENCHER?

**Não tem certeza de alguma informação?**

Me avise que eu te ajudo a descobrir:

- ❓ "Não sei qual é o IP da minha VPS"
- ❓ "Não sei como configurar DNS"
- ❓ "Não tenho conta no GitHub"
- ❓ "Não tenho Supabase configurado"

**É só me dizer onde você está travado!**

---

**Aguardando suas respostas para prosseguir com o deploy! 🚀**
