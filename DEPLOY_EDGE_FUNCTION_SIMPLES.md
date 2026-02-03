# 🚀 DEPLOY EDGE FUNCTION - PASSO A PASSO SIMPLES

## ⚠️ PROBLEMA ATUAL

A busca de leads está usando a função antiga. Para habilitar:
- ✅ Busca progressiva (carregar mais de 20 resultados)
- ✅ Deduplicação inteligente
- ✅ Economia de 40-50%

Você precisa fazer deploy da **Edge Function** no Supabase.

---

## 📋 PASSO A PASSO (5 MINUTOS)

### **PASSO 1: Acesse o Supabase**

1. Abra: https://supabase.com/dashboard
2. Faça login
3. Selecione o projeto: **owlignktsqlrqaqhzujb**

### **PASSO 2: Vá em Edge Functions**

1. No menu lateral esquerdo, clique em **"Edge Functions"**
2. Clique no botão **"Create a new function"** ou **"New Function"**

### **PASSO 3: Crie a Função**

1. **Function name:** Digite exatamente: `search-leads-v2`
2. **Clique em "Create function"**

### **PASSO 4: Cole o Código**

1. **Abra o arquivo:** `/app/frontend/supabase/functions/search-leads-v2/index.ts`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no editor** do Supabase
4. **Clique em "Deploy"** ou **"Save"**

### **PASSO 5: Aguarde Deploy**

- Aguarde 30-60 segundos
- Você verá uma mensagem de sucesso ✅

### **PASSO 6: Teste**

1. Volte na aplicação: https://server-ready-check.preview.emergentagent.com
2. Faça uma busca de leads
3. O alerta azul deve desaparecer
4. Botão "Carregar Mais" deve funcionar

---

## 🎯 RESULTADO

Após o deploy, você terá:
- ✅ Busca progressiva funcionando
- ✅ Botão "Carregar Mais 20" ativo
- ✅ Deduplicação automática
- ✅ Economia de custos

---

## 🔧 ALTERNATIVA: Deploy via CLI (Avançado)

Se você tem o Supabase CLI instalado:

```bash
cd /app/frontend
supabase functions deploy search-leads-v2
```

---

## ❓ PROBLEMAS?

### **Erro: "Function already exists"**
- Vá em Edge Functions
- Encontre `search-leads-v2`
- Delete e recrie

### **Erro: "Invalid code"**
- Certifique-se de copiar TODO o arquivo
- Verifique se não tem caracteres estranhos

### **Função não aparece na lista**
- Aguarde 1-2 minutos
- Recarregue a página do Supabase

---

## 📄 STATUS ATUAL

- ✅ Migration SQL: Pronta (executar se ainda não fez)
- ⏳ Edge Function: **PENDENTE** (fazer deploy)
- ✅ Frontend: Atualizado (com fallback temporário)

---

## 📞 ONDE ENCONTRAR O ARQUIVO

**Caminho:** `/app/frontend/supabase/functions/search-leads-v2/index.ts`

**Como ver no terminal:**
```bash
cat /app/frontend/supabase/functions/search-leads-v2/index.ts
```

Ou use seu editor de código favorito.

---

**⏱️ Tempo total:** 5 minutos  
**Dificuldade:** Fácil (copiar e colar)

**Depois do deploy, a busca progressiva estará 100% funcional!** 🚀
