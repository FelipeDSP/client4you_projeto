# 🎯 GUIA VISUAL - ONDE FAZER CADA COISA

## ⚠️ VOCÊ TENTOU COLAR NO LUGAR ERRADO!

**Erro comum:** Colar código TypeScript no SQL Editor

---

## 📍 LOCAIS CORRETOS NO SUPABASE

### **1️⃣ SQL EDITOR** (para SQL)
```
Dashboard → SQL Editor (ícone: </>)
```
**O que vai aqui:** Comandos SQL (CREATE TABLE, ALTER TABLE, etc)  
**Arquivo:** `20260131_search_architecture_v2.sql`  
**Quando usar:** Criar/atualizar estrutura do banco

**Visual:**
```
┌─────────────────────────────────────┐
│ SQL Editor                    [Run] │
├─────────────────────────────────────┤
│                                     │
│ CREATE TABLE ...                    │
│ ALTER TABLE ...                     │
│ CREATE FUNCTION ...                 │
│                                     │
└─────────────────────────────────────┘
```

---

### **2️⃣ EDGE FUNCTIONS** (para TypeScript)
```
Dashboard → Edge Functions (ícone: ⚡)
```
**O que vai aqui:** Código TypeScript/JavaScript  
**Arquivo:** `search-leads-v2/index.ts`  
**Quando usar:** Criar APIs serverless

**Visual:**
```
┌─────────────────────────────────────┐
│ Edge Functions                      │
├─────────────────────────────────────┤
│ [+ Create a new function]           │
│                                     │
│ • search-leads (existente)          │
│ • search-leads-v2 (criar novo)      │
│                                     │
└─────────────────────────────────────┘
```

**Depois de clicar "Create":**
```
┌─────────────────────────────────────┐
│ Function: search-leads-v2    [Save] │
├─────────────────────────────────────┤
│ index.ts                            │
│                                     │
│ import { createClient } from ...    │
│ // Cole o código TypeScript AQUI   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 O QUE VOCÊ PRECISA FAZER AGORA

### **OPÇÃO A: Só Edge Function (Mínimo para funcionar)**

**Resultado:** Busca funciona, mas sem deduplicação avançada

1. Dashboard → **Edge Functions** ⚡
2. **Create function**
3. Name: `search-leads-v2`
4. Cole código de: `/app/frontend/supabase/functions/search-leads-v2/index.ts`
5. **Deploy**

---

### **OPÇÃO B: Tudo Completo (Recomendado)**

**Resultado:** Busca + Deduplicação + Biblioteca completa

**Passo 1 - SQL:**
1. Dashboard → **SQL Editor** </>
2. New query
3. Cole: `/app/frontend/supabase/migrations/20260131_search_architecture_v2.sql`
4. Run

**Passo 2 - Edge Function:**
1. Dashboard → **Edge Functions** ⚡
2. Create function
3. Name: `search-leads-v2`
4. Cole: `/app/frontend/supabase/functions/search-leads-v2/index.ts`
5. Deploy

---

## 📂 QUAL ARQUIVO USAR EM CADA LUGAR

### **SQL Editor (</>):**
```
Arquivo: /app/frontend/supabase/migrations/20260131_search_architecture_v2.sql

Começa com:
-- ============================================
-- MIGRATION: Nova Arquitetura de Busca v2
-- ============================================
ALTER TABLE public.leads ...
```

### **Edge Functions (⚡):**
```
Arquivo: /app/frontend/supabase/functions/search-leads-v2/index.ts

Começa com:
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHash } from "https://deno.land/std@0.177.0/node/crypto.ts";
```

---

## 🔍 IDENTIFICANDO O ARQUIVO CERTO

### **É SQL se:**
- ✅ Tem `CREATE TABLE`
- ✅ Tem `ALTER TABLE`
- ✅ Tem `--` para comentários
- ✅ Termina com `.sql`

### **É TypeScript se:**
- ✅ Tem `import`
- ✅ Tem `export`
- ✅ Tem `//` para comentários
- ✅ Termina com `.ts` ou `.js`

---

## ✅ VERIFICAÇÃO

**Você está no lugar certo se:**

### **SQL Editor:**
- Vê um campo grande para escrever SQL
- Tem botão "Run" ou "Execute"
- Pode criar múltiplas queries

### **Edge Functions:**
- Vê lista de funções existentes
- Tem botão "Create a new function"
- Depois de criar, vê editor de código com syntax highlighting
- Tem botão "Deploy"

---

## 📞 LINKS DIRETOS

**SQL Editor:**
```
https://supabase.com/dashboard/project/owlignktsqlrqaqhzujb/sql/new
```

**Edge Functions:**
```
https://supabase.com/dashboard/project/owlignktsqlrqaqhzujb/functions
```

---

## 🎬 VÍDEO MENTAL DO FLUXO

```
1. Abrir Supabase Dashboard
   ↓
2. Ver menu lateral esquerdo
   ↓
3. Procurar ícone ⚡ "Edge Functions"
   ↓
4. Clicar
   ↓
5. Botão verde "Create a new function"
   ↓
6. Digitar nome: search-leads-v2
   ↓
7. Aparecer editor de código
   ↓
8. Colar código TypeScript
   ↓
9. Botão "Deploy" ou "Save and deploy"
   ↓
10. Aguardar (~30s)
   ↓
11. Ver mensagem de sucesso ✅
```

---

## ❌ ERROS COMUNS

### **"Syntax error at or near import"**
- ❌ Você colou TypeScript no SQL Editor
- ✅ Use Edge Functions

### **"Function already exists"**
- ❌ Já existe uma função com esse nome
- ✅ Delete a antiga ou use outro nome

### **"Invalid code"**
- ❌ Código incompleto ou corrompido
- ✅ Copie TODO o arquivo novamente

---

## 🚀 DEPOIS DE DEPLOYAR

1. Aguarde 30-60 segundos
2. Recarregue a aplicação
3. Faça uma busca de leads
4. Alerta azul desaparece
5. Botão "Carregar Mais" funciona

---

**Resumo:** SQL Editor (SQL) ≠ Edge Functions (TypeScript)

Use o lugar certo para cada arquivo! 🎯
