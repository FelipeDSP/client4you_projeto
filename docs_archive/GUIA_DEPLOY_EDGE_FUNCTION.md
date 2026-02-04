# 🚀 GUIA SIMPLIFICADO - DEPLOY EDGE FUNCTION

## PASSO 1: Copiar o Código da Edge Function

1. **Abra o arquivo:** `/app/frontend/supabase/functions/search-leads-v2/index.ts`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)

---

## PASSO 2: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral esquerdo, clique em **"Edge Functions"**

---

## PASSO 3: Criar a Edge Function

1. Clique no botão **"Create a new function"** (ou "+ New function")
2. Preencha:
   - **Name:** `search-leads-v2`
   - **Code:** Cole o conteúdo copiado no Passo 1
3. Clique em **"Deploy function"**
4. Aguarde ~30 segundos

---

## PASSO 4: Executar a Migration do Banco

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"+ New query"**
3. **Abra o arquivo:** `/app/frontend/supabase/migrations/20260131_search_architecture_v2.sql`
4. **Copie TODO o conteúdo** e cole no SQL Editor
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Aguarde a mensagem de sucesso

---

## PASSO 5: Verificar se Funcionou

No SQL Editor, execute este comando:

```sql
-- Verificar se a tabela search_sessions existe
SELECT * FROM search_sessions LIMIT 1;
```

Se retornar sem erro (mesmo que vazio), está funcionando! ✅

---

## ⚠️ Se der erro:

**Erro: "Edge Function not found"**
- Aguarde 2 minutos e tente novamente
- Verifique se o nome está exatamente: `search-leads-v2` (com hífen)

**Erro: "Table search_sessions does not exist"**
- Execute novamente a migration do Passo 4
- Verifique se copiou TODO o arquivo SQL

---

## ✅ Pronto!

Depois que terminar, **me avise** e vou continuar com as melhorias no frontend!

---

**Precisa de ajuda?** Me chame a qualquer momento! 🚀
