# 🚀 INSTRUÇÕES DE DEPLOY - NOVA ARQUITETURA DE BUSCA V2

**Data:** 31 de Janeiro de 2025  
**Versão:** 2.0  
**Status:** Pronto para Deploy

---

## ✅ O QUE FOI IMPLEMENTADO

### **1. Banco de Dados (Supabase)**
- ✅ Nova migration SQL completa
- ✅ Campos adicionados na tabela `leads`
- ✅ Nova tabela `search_sessions`
- ✅ Funções SQL para fingerprint
- ✅ Triggers automáticos
- ✅ Políticas RLS
- ✅ Índices para performance

### **2. Backend (Edge Function)**
- ✅ Nova Edge Function `search-leads-v2`
- ✅ Deduplicação inteligente
- ✅ **Paginação progressiva** (SERP API start=0, 20, 40...)
- ✅ Controle de sessões
- ✅ Estatísticas em tempo real
- ✅ **Busca ilimitada** até esgotar região

### **3. Frontend (React)**
- ✅ Hook `useSearchSession` para busca paginada
- ✅ Hook `useLeadsLibrary` para biblioteca
- ✅ **Página `/history` UNIFICADA** (3 abas: Buscas, Biblioteca, Favoritos)
- ✅ Página `/search` com indicador de página
- ✅ **Botão "Carregar Mais"** busca próximos 20 (não repete)
- ✅ Badges: 🆕 Novos / 🔄 Já capturados
- ✅ Contador de páginas buscadas
- ✅ Tipos TypeScript atualizados

---

## 📋 PASSO A PASSO DO DEPLOY

### **ETAPA 1: ATUALIZAR BANCO DE DADOS (SUPABASE)**

#### **Opção A: Via SQL Editor (RECOMENDADO)**

1. **Acesse o Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto: `owlignktsqlrqaqhzujb`

2. **Abra o SQL Editor:**
   - Menu lateral → SQL Editor
   - Clique em "+ New query"

3. **Cole e Execute a Migration:**
   - Copie TODO o conteúdo do arquivo:
     ```
     /app/frontend/supabase/migrations/20260131_search_architecture_v2.sql
     ```
   - Cole no SQL Editor
   - Clique em "Run" (ou pressione Ctrl+Enter)

4. **Verifique a Execução:**
   Deve aparecer mensagens como:
   ```
   ✅ Migration 20260131_search_architecture_v2 completed successfully!
   📊 Tables updated: leads (new columns), search_sessions (new table)
   🔧 Functions created: generate_lead_fingerprint, update_existing_lead_on_duplicate
   🔐 RLS policies applied
   📈 Indexes created for performance
   ```

5. **Confirme as Mudanças:**
   - Menu → Database → Tables
   - Verifique que existe: `search_sessions` (nova tabela)
   - Abra `leads` → Verifique novas colunas:
     - fingerprint
     - first_seen_at
     - last_seen_at
     - times_found
     - sources
     - is_favorite
     - tags

#### **Opção B: Via Supabase CLI** (Avançado)

```bash
# Se tiver Supabase CLI instalado
cd /app/frontend
supabase db push
```

---

### **ETAPA 2: DEPLOY DA EDGE FUNCTION**

#### **Opção A: Via Supabase Dashboard** (Manual)

1. **Acesse Edge Functions:**
   - Dashboard → Edge Functions
   - Clique em "New Function"

2. **Configurar:**
   - **Name:** `search-leads-v2`
   - **Code:** Copie o conteúdo de:
     ```
     /app/frontend/supabase/functions/search-leads-v2/index.ts
     ```
   - Clique em "Deploy"

3. **Verificar URL:**
   A function estará disponível em:
   ```
   https://owlignktsqlrqaqhzujb.supabase.co/functions/v1/search-leads-v2
   ```

#### **Opção B: Via Supabase CLI** (Recomendado)

```bash
cd /app/frontend

# Deploy da function
supabase functions deploy search-leads-v2

# Verificar se foi deployada
supabase functions list
```

---

### **ETAPA 3: ATUALIZAR FRONTEND**

Os arquivos já estão criados em `/app/frontend/src/`. Agora precisa:

#### **3.1 Instalar Dependências (se necessário)**

```bash
cd /app/frontend
yarn install
```

#### **3.2 Verificar Arquivos Criados:**

Confirme que existem:
```
✅ /app/frontend/src/hooks/useSearchSession.tsx
✅ /app/frontend/src/hooks/useLeadsLibrary.tsx
✅ /app/frontend/src/pages/LeadsLibrary.tsx
✅ /app/frontend/src/pages/SearchLeadsV2.tsx
✅ /app/frontend/src/types/index.ts (atualizado)
✅ /app/frontend/src/App.tsx (atualizado)
✅ /app/frontend/src/components/AppSidebar.tsx (atualizado)
```

#### **3.3 Build e Deploy:**

```bash
# Build do frontend
cd /app/frontend
yarn build

# Restart do serviço
sudo supervisorctl restart frontend
```

---

### **ETAPA 4: TESTAR O SISTEMA**

#### **4.1 Testar Banco de Dados**

No SQL Editor do Supabase, execute:

```sql
-- Verificar se função existe
SELECT generate_lead_fingerprint('Teste', 'Rua Teste 123', '11999999999');

-- Verificar tabela search_sessions
SELECT * FROM search_sessions LIMIT 5;

-- Verificar novos campos em leads
SELECT id, name, fingerprint, times_found, is_favorite 
FROM leads 
WHERE fingerprint IS NOT NULL 
LIMIT 5;
```

#### **4.2 Testar Edge Function**

No terminal:

```bash
# Obter token de autenticação
TOKEN="seu_token_aqui"

# Testar criação de busca
curl -X POST \
  'https://owlignktsqlrqaqhzujb.supabase.co/functions/v1/search-leads-v2' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "query": "restaurantes",
    "location": "São Paulo",
    "search_type": "serp",
    "company_id": "seu_company_id"
  }'
```

Deve retornar:
```json
{
  "session_id": "uuid...",
  "results": [...],
  "new_count": 15,
  "duplicate_count": 5,
  "current_page": 1,
  "has_more": true
}
```

#### **4.3 Testar Frontend**

1. **Acesse a aplicação:**
   ```
   https://unique-leads-view.preview.emergentagent.com
   ```

2. **Faça login e teste:**
   - ✅ Menu → "Buscar Leads" (deve usar SearchLeadsV2)
   - ✅ Menu → "Biblioteca" (nova página)
   - ✅ Fazer uma busca (ex: "restaurantes em São Paulo")
   - ✅ Verificar badges: 🆕 Novos / 🔄 Já capturados
   - ✅ Clicar em "Carregar Mais 20"
   - ✅ Ir para Biblioteca e ver todos os leads
   - ✅ Marcar lead como favorito (⭐)
   - ✅ Exportar resultados

---

## 🔍 VERIFICAÇÕES PÓS-DEPLOY

### **Checklist de Validação:**

- [ ] Migration executada sem erros
- [ ] Tabela `search_sessions` existe
- [ ] Novos campos em `leads` visíveis
- [ ] Edge Function deployada
- [ ] Frontend compilado sem erros
- [ ] Página `/leads` carrega
- [ ] Página `/search` mostra badges novo/duplicado
- [ ] Botão "Carregar Mais" funciona
- [ ] Deduplicação detecta leads repetidos
- [ ] Favoritos funcionam (⭐)
- [ ] Exportação gera arquivo Excel
- [ ] Performance OK (queries rápidas)

---

## 🐛 TROUBLESHOOTING

### **Problema 1: Migration falha com erro de sintaxe**

**Solução:**
- Verifique se copiou TODO o arquivo SQL
- Execute linha por linha no SQL Editor
- Verifique se a função `get_user_company_id` já existe

### **Problema 2: Edge Function retorna 500**

**Solução:**
1. Verifique logs no Supabase Dashboard:
   - Edge Functions → `search-leads-v2` → Logs
2. Confirme que as env vars estão setadas:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### **Problema 3: Frontend não compila**

**Solução:**
```bash
cd /app/frontend
rm -rf node_modules
rm yarn.lock
yarn install
yarn build
```

### **Problema 4: "search-leads-v2 not found"**

**Solução:**
- Confirme que deployou a Edge Function
- Verifique nome exato (com hífen, não underscore)
- Aguarde 1-2 minutos para propagação

### **Problema 5: RLS block na tabela search_sessions**

**Solução:**
Execute no SQL Editor:
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'search_sessions';

-- Recriar policy se necessário
DROP POLICY IF EXISTS "Users can view own company search sessions" ON search_sessions;
CREATE POLICY "Users can view own company search sessions"
    ON search_sessions FOR SELECT
    USING (company_id = get_user_company_id(auth.uid()));
```

### **Problema 6: Leads não aparecem na Biblioteca**

**Solução:**
1. Verificar se leads foram salvos:
```sql
SELECT COUNT(*) FROM leads WHERE company_id = 'seu_company_id';
```

2. Verificar fingerprints:
```sql
SELECT COUNT(*) FROM leads WHERE fingerprint IS NOT NULL;
```

3. Se estiverem NULL, executar:
```sql
UPDATE leads 
SET fingerprint = generate_lead_fingerprint(name, address, phone)
WHERE fingerprint IS NULL;
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### **Métricas para Acompanhar:**

1. **Performance do Banco:**
   ```sql
   -- Verificar quantos leads foram deduplicados
   SELECT 
     COUNT(*) as total_leads,
     COUNT(CASE WHEN times_found > 1 THEN 1 END) as duplicados,
     AVG(times_found) as media_vezes_encontrado
   FROM leads;
   ```

2. **Uso da Nova Busca:**
   ```sql
   -- Estatísticas de sessões
   SELECT 
     search_type,
     COUNT(*) as total_buscas,
     AVG(new_leads_count) as media_novos,
     AVG(duplicate_leads_count) as media_duplicados
   FROM search_sessions
   GROUP BY search_type;
   ```

3. **Economia de Custos:**
   ```sql
   -- Taxa de deduplicação (economia)
   SELECT 
     ROUND(
       (SUM(duplicate_leads_count)::numeric / 
        (SUM(new_leads_count) + SUM(duplicate_leads_count))) * 100, 
       2
     ) as taxa_deduplicacao_pct
   FROM search_sessions;
   ```

---

## 🎉 RESULTADO ESPERADO

Após o deploy completo, os usuários terão:

### **Antes:**
- ❌ Limite de 50 resultados
- ❌ Duplicados desperdiçados
- ❌ Sem histórico centralizado

### **Depois:**
- ✅ **Ilimitado** com "Carregar Mais"
- ✅ **Deduplicação** automática (economia 40-50%)
- ✅ **Biblioteca permanente** de todos os leads
- ✅ **Badges** mostrando novos vs duplicados
- ✅ **Favoritos** e tags
- ✅ **Estatísticas** (vezes encontrado)
- ✅ **Preparado para CNAE** (arquitetura extensível)

---

## 📞 SUPORTE

Se tiver problemas no deploy:

1. ✅ Verifique os logs do Supabase (SQL Editor + Edge Functions)
2. ✅ Confira o console do navegador (F12)
3. ✅ Veja logs do backend: `tail -f /var/log/supervisor/backend.*.log`
4. ✅ Veja logs do frontend: `tail -f /var/log/supervisor/frontend.*.log`

---

## ✅ CHECKLIST FINAL

Antes de considerar completo:

- [ ] **Banco:** Migration executada com sucesso
- [ ] **Edge Function:** Deployada e testada
- [ ] **Frontend:** Build sem erros
- [ ] **Testes:** Busca funcionando com paginação
- [ ] **Testes:** Biblioteca carregando leads
- [ ] **Testes:** Deduplicação detectando duplicados
- [ ] **Testes:** Favoritos salvando
- [ ] **Testes:** Exportação gerando Excel
- [ ] **Performance:** Queries < 1s
- [ ] **UX:** Badges visíveis (🆕/🔄)

---

## 🚀 PRÓXIMOS PASSOS (FUTURO)

Depois que estiver tudo funcionando:

1. **Fase 2: Busca CNAE** (adicionar aba CNAE)
2. **Fase 3: Tags customizadas** (adicionar/editar tags)
3. **Fase 4: Relatórios** (leads mais vistos, categorias populares)
4. **Fase 5: Automação** (notificar quando lead aparecer X vezes)

---

**✅ Implementação Completa - Pronto para Deploy!**

Última atualização: 31 de Janeiro de 2025
