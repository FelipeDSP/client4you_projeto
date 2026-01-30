# 🎯 PROPOSTA: NOVA ARQUITETURA DE BUSCA DE LEADS

**Data:** 30 de Janeiro de 2025  
**Objetivo:** Resolver limitações atuais e preparar para expansão (CNAE)

---

## 🔍 PROBLEMAS IDENTIFICADOS

### **Sistema Atual:**

1. ❌ **Limite de 50 resultados** por busca (tenta buscar 50, mas SERP API limita)
2. ❌ **Sem histórico real** - Mesmo lead pode aparecer em buscas diferentes
3. ❌ **Sem deduplicação global** - Duplicatas entre buscas
4. ❌ **Sem paginação no frontend** - Mostra tudo de uma vez
5. ❌ **Busca não incremental** - Não pode "buscar mais" depois
6. ❌ **Estrutura não preparada para CNAE**

### **Código Atual:**
```typescript
// Frontend (SearchLeads.tsx)
const newLeads = await searchLeads(term, location); 
// ↓ Retorna apenas os leads DESSA busca
// ❌ Não tem paginação
// ❌ Não mostra histórico

// Edge Function
TARGET_RESULTS = 50; // Tenta buscar 50
// Loop até 50, mas SERP API pode limitar antes
```

---

## ✨ NOVA ARQUITETURA PROPOSTA

### **Conceito Central: BIBLIOTECA DE LEADS**

```
┌─────────────────────────────────────────────────────┐
│              BIBLIOTECA DE LEADS                    │
│  (Base unificada de todos os leads capturados)     │
└─────────────────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
    ┌─────────────┐          ┌─────────────┐
    │   SERP API  │          │    CNAE     │
    │ Google Maps │          │  (futuro)   │
    └─────────────┘          └─────────────┘
```

### **Mudanças Principais:**

#### 1. **BIBLIOTECA DE LEADS (Nova Página)**
Nova rota: `/leads` - Biblioteca completa de todos os leads

**Funcionalidades:**
- 📚 Lista **TODOS** os leads já capturados
- 🔍 Busca interna por nome, categoria, cidade
- 🏷️ Filtros avançados
- 📊 Deduplicação inteligente
- 📄 Paginação infinita (carregar mais)
- ⭐ Favoritos/Tags
- 📤 Exportação

#### 2. **BUSCAR LEADS (Reestruturada)**
Rota: `/search` - Ferramenta de captura

**Funcionalidades:**
- 🔎 Busca SERP API (Google Maps)
- 🔢 Busca CNAE (futuro)
- ➕ **"Capturar Mais"** - Buscar páginas adicionais
- 📍 Mostrar apenas novos (deduplicados)
- ✅ Salvar na Biblioteca automaticamente

---

## 🗄️ MUDANÇAS NO BANCO DE DADOS

### **Tabela: `leads` (Atualizada)**

Adicionar campos para deduplicação e rastreamento:

```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS fingerprint TEXT UNIQUE,  -- Hash único (nome+endereço+telefone)
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS times_found INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]',  -- ['serp_search_123', 'cnae_search_456']
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_leads_fingerprint ON leads(fingerprint);
CREATE INDEX IF NOT EXISTS idx_leads_company_id_fingerprint ON leads(company_id, fingerprint);
```

### **Tabela: `search_sessions` (Nova)**

Controla sessões de busca com paginação:

```sql
CREATE TABLE IF NOT EXISTS search_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Parâmetros da busca
  type TEXT NOT NULL,  -- 'serp' ou 'cnae'
  query TEXT NOT NULL,
  location TEXT,
  filters JSONB,  -- Filtros aplicados
  
  -- Controle de paginação
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER,
  results_per_page INTEGER DEFAULT 20,
  total_results INTEGER DEFAULT 0,
  
  -- Novos leads x duplicados
  new_leads_found INTEGER DEFAULT 0,
  duplicate_leads_skipped INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active',  -- 'active', 'completed', 'error'
  last_fetch_at TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE search_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company search sessions"
  ON search_sessions FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert own company search sessions"
  ON search_sessions FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));
```

---

## 🔄 NOVO FLUXO DE BUSCA

### **Fluxo 1: Primeira Busca**

```
1. Usuário acessa /search
2. Preenche: "restaurantes" + "São Paulo"
3. Clica "Buscar"

Frontend →
4. POST /api/search/sessions (cria nova sessão)
   {
     type: 'serp',
     query: 'restaurantes',
     location: 'São Paulo',
     page: 0
   }

Backend/Edge Function →
5. Chama SERP API (página 1, 20 resultados)
6. Para cada resultado:
   - Gera fingerprint: md5(nome+endereço+telefone)
   - Verifica se já existe no banco
   - Se NOVO → Insere
   - Se DUPLICADO → Incrementa times_found, atualiza last_seen_at
7. Retorna:
   {
     session_id: "abc-123",
     results: [...],
     new_count: 15,
     duplicate_count: 5,
     has_more: true,
     current_page: 0
   }

Frontend →
8. Exibe resultados com badges:
   - 🆕 Novos (15)
   - 🔄 Já capturados (5)
9. Mostra botão "Carregar Mais" (se has_more = true)
```

### **Fluxo 2: Carregar Mais Resultados**

```
1. Usuário clica "Carregar Mais"

Frontend →
2. POST /api/search/sessions/{session_id}/fetch-more

Backend →
3. Busca sessão no banco
4. Incrementa current_page
5. Chama SERP API (página 2, próximos 20)
6. Mesma lógica de deduplicação
7. Retorna novos resultados

Frontend →
8. Adiciona à lista existente
9. Atualiza contadores
```

### **Fluxo 3: Acessar Biblioteca**

```
1. Usuário acessa /leads

Frontend →
2. GET /api/leads?page=0&limit=50&sort=last_seen_at

Backend →
3. Busca leads com paginação
4. Retorna lista completa

Frontend →
5. Exibe biblioteca com:
   - Busca interna
   - Filtros (categoria, cidade, rating)
   - Ordenação (mais recente, mais visto, favoritos)
   - Paginação infinita
```

---

## 🎨 INTERFACE PROPOSTA

### **Página: `/search` (Buscar Leads)**

```
┌─────────────────────────────────────────────────────┐
│  🔍 Buscar Novos Leads                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Aba: [Google Maps] [CNAE (em breve)]             │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │ O que buscar?    │  │ Onde?            │       │
│  │ restaurantes     │  │ São Paulo        │ [🔍]  │
│  └──────────────────┘  └──────────────────┘       │
│                                                     │
│  📊 Resultados desta busca:                        │
│  🆕 15 novos  |  🔄 5 já capturados  |  📄 Página 1│
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🆕 Restaurante ABC           ⭐ 4.5 (234)  │  │
│  │ 📍 Rua das Flores, 123       📞 (11) 9... │  │
│  │ [📚 Adicionar à Biblioteca]  [📤 Exportar] │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🔄 Restaurante XYZ (já capturado)          │  │
│  │ 📍 Av. Paulista, 456        📞 (11) 8...   │  │
│  │ Visto 3x  |  Última vez: há 2 dias         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [➕ Carregar Mais Resultados (Página 2)]         │
│  [📚 Ver Biblioteca Completa]                     │
└─────────────────────────────────────────────────────┘
```

### **Página: `/leads` (Biblioteca)**

```
┌─────────────────────────────────────────────────────┐
│  📚 Biblioteca de Leads                             │
│  Total: 1.234 leads capturados                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔍 [Buscar na biblioteca...]                      │
│                                                     │
│  Filtros:                                          │
│  Categoria: [Todos ▼]  Cidade: [Todos ▼]          │
│  Rating: [⭐⭐⭐⭐ ou mais]  Telefone: [✓ Com]       │
│                                                     │
│  Ordenar: [Mais recente ▼]  [📤 Exportar Tudo]    │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ⭐ Restaurante ABC          🆕 Novo hoje    │  │
│  │ 📍 São Paulo  📞 (11) 9... ⭐ 4.5 (234)    │  │
│  │ Visto: 1x  |  Fontes: Google Maps          │  │
│  │ [⭐ Favoritar] [🏷️ Tags] [📤 Exportar]      │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [... mais 49 leads ...]                          │
│                                                     │
│  [🔄 Carregar mais 50 leads]                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### **Backend: Nova Edge Function**

**Arquivo:** `/supabase/functions/search-leads-v2/index.ts`

```typescript
interface SearchSessionCreate {
  type: 'serp' | 'cnae';
  query: string;
  location?: string;
  filters?: any;
}

// Criar nova sessão de busca
async function createSearchSession(data: SearchSessionCreate) {
  const session = await supabase
    .from('search_sessions')
    .insert({
      ...data,
      current_page: 0,
      status: 'active'
    })
    .select()
    .single();
  
  return session;
}

// Buscar próxima página
async function fetchMoreResults(sessionId: string) {
  // 1. Busca sessão
  const session = await getSession(sessionId);
  
  // 2. Chama SERP API com paginação
  const start = session.current_page * 20;
  const results = await callSerpAPI(session.query, session.location, start);
  
  // 3. Deduplicação
  const processed = await processResults(results, session.company_id);
  
  // 4. Atualiza sessão
  await updateSession(sessionId, {
    current_page: session.current_page + 1,
    new_leads_found: session.new_leads_found + processed.new_count,
    duplicate_leads_skipped: session.duplicate_leads_skipped + processed.duplicate_count
  });
  
  return processed;
}

// Processar resultados com deduplicação
async function processResults(results: any[], companyId: string) {
  let newCount = 0;
  let duplicateCount = 0;
  const processedLeads = [];
  
  for (const result of results) {
    // Gerar fingerprint único
    const fingerprint = generateFingerprint(result);
    
    // Verificar se já existe
    const existing = await supabase
      .from('leads')
      .select('id, times_found, sources')
      .eq('company_id', companyId)
      .eq('fingerprint', fingerprint)
      .maybeSingle();
    
    if (existing) {
      // DUPLICADO - Atualizar
      await supabase
        .from('leads')
        .update({
          last_seen_at: new Date().toISOString(),
          times_found: existing.times_found + 1
        })
        .eq('id', existing.id);
      
      duplicateCount++;
      processedLeads.push({ ...result, is_duplicate: true });
      
    } else {
      // NOVO - Inserir
      await supabase
        .from('leads')
        .insert({
          ...mapResultToLead(result),
          company_id: companyId,
          fingerprint,
          times_found: 1
        });
      
      newCount++;
      processedLeads.push({ ...result, is_duplicate: false });
    }
  }
  
  return {
    leads: processedLeads,
    new_count: newCount,
    duplicate_count: duplicateCount
  };
}

// Gerar fingerprint único
function generateFingerprint(result: any): string {
  const data = `${result.title}|${result.address}|${result.phone || ''}`;
  return crypto.createHash('md5').update(data).digest('hex');
}
```

### **Frontend: Hooks Atualizados**

**Arquivo:** `/frontend/src/hooks/useLeads.tsx`

```typescript
// Novo hook para sessões de busca
export function useSearchSession() {
  const [session, setSession] = useState<SearchSession | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Criar nova busca
  const startSearch = async (query: string, location: string) => {
    setIsSearching(true);
    
    const { data } = await supabase.functions.invoke('search-leads-v2', {
      body: { action: 'create', query, location, type: 'serp' }
    });
    
    setSession(data.session);
    setIsSearching(false);
    return data.results;
  };
  
  // Buscar mais resultados
  const fetchMore = async () => {
    if (!session) return;
    
    setIsSearching(true);
    
    const { data } = await supabase.functions.invoke('search-leads-v2', {
      body: { action: 'fetch_more', session_id: session.id }
    });
    
    setSession(data.session);
    setIsSearching(false);
    return data.results;
  };
  
  return { session, isSearching, startSearch, fetchMore };
}

// Hook para biblioteca de leads
export function useLeadsLibrary() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchLeads = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('last_seen_at', { ascending: false })
      .range(currentPage * 50, (currentPage + 1) * 50 - 1);
    
    if (reset) {
      setLeads(data || []);
    } else {
      setLeads(prev => [...prev, ...(data || [])]);
    }
    
    setHasMore(data?.length === 50);
    setPage(currentPage + 1);
  };
  
  const searchInLibrary = async (searchTerm: string) => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(50);
    
    setLeads(data || []);
  };
  
  return { leads, hasMore, fetchLeads, searchInLibrary };
}
```

---

## 📊 MELHORIAS IMEDIATAS

### **Fase 1: Deduplicação Inteligente (1 semana)**

1. ✅ Adicionar campo `fingerprint` na tabela `leads`
2. ✅ Implementar lógica de deduplicação na Edge Function
3. ✅ Atualizar frontend para mostrar badges (novo/duplicado)
4. ✅ Adicionar contadores

### **Fase 2: Paginação e "Carregar Mais" (1 semana)**

1. ✅ Criar tabela `search_sessions`
2. ✅ Implementar endpoint `fetch-more`
3. ✅ Adicionar botão no frontend
4. ✅ Permitir buscar até 100+ resultados

### **Fase 3: Biblioteca de Leads (1 semana)**

1. ✅ Criar página `/leads`
2. ✅ Implementar busca interna
3. ✅ Adicionar filtros avançados
4. ✅ Paginação infinita

---

## 💰 IMPACTO NO CUSTO

### **Antes (Sistema Atual):**
- Busca 50 resultados sempre
- Muitos duplicados desperdiçados
- Usuário busca várias vezes o mesmo termo

**Exemplo:**
```
10 buscas x 50 resultados = 500 calls SERP API
Mas ~200 são duplicados = 300 únicos
Custo: $2.50
Eficiência: 60%
```

### **Depois (Nova Arquitetura):**
- Busca 20 resultados inicialmente
- "Carregar mais" apenas se necessário
- Deduplicação evita retrabalho

**Exemplo:**
```
10 buscas x 20 resultados = 200 calls SERP API
+ 3 "carregar mais" x 20 = 60 calls
Total: 260 calls (48% de economia!)
Todos únicos = 260 leads novos
Custo: $1.30
Eficiência: 100%
```

---

## 🎯 PREPARAÇÃO PARA CNAE

Com essa nova estrutura, adicionar CNAE fica simples:

```typescript
// Frontend - Nova aba
<Tabs>
  <TabsList>
    <TabsTrigger value="serp">Google Maps</TabsTrigger>
    <TabsTrigger value="cnae">Busca Avançada (CNAE)</TabsTrigger>
  </TabsList>
  
  <TabsContent value="cnae">
    <CNAESearchForm 
      onSearch={(filters) => startSearch(filters, 'cnae')} 
    />
  </TabsContent>
</Tabs>

// Backend - Mesmo endpoint, tipos diferentes
async function handleSearch(type: 'serp' | 'cnae', params: any) {
  if (type === 'serp') {
    return await searchSerpAPI(params);
  } else if (type === 'cnae') {
    return await searchCNAE(params);
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Semana 1: Fundação**
- [ ] Migrar banco (fingerprint, search_sessions)
- [ ] Atualizar Edge Function (deduplicação)
- [ ] Testar lógica de fingerprint

### **Semana 2: Paginação**
- [ ] Implementar "Carregar Mais"
- [ ] Atualizar UI com badges (novo/duplicado)
- [ ] Testes de paginação SERP API

### **Semana 3: Biblioteca**
- [ ] Criar página `/leads`
- [ ] Implementar busca interna
- [ ] Adicionar filtros e ordenação

### **Semana 4: Polimento**
- [ ] Melhorar UX (loading states, animações)
- [ ] Adicionar favoritos e tags
- [ ] Documentação

---

## 🚀 RESULTADO FINAL

### **Antes:**
❌ Limite de 50 resultados  
❌ Duplicados em cada busca  
❌ Sem histórico centralizado  
❌ Sem paginação  

### **Depois:**
✅ **Ilimitado** (com "Carregar Mais")  
✅ **Deduplicação inteligente** (economia de 40-50%)  
✅ **Biblioteca unificada** de todos os leads  
✅ **Paginação incremental**  
✅ **Preparado para CNAE**  

---

## ❓ PRÓXIMOS PASSOS

Quer que eu comece a implementação?

**Opções:**

1. 🏗️ **Começar Fase 1** (Deduplicação) - ~2 horas
2. 📊 **Ver mockup mais detalhado** da UI
3. 🔧 **Implementar tudo de uma vez** - ~1 semana
4. 💬 **Discutir mais algum ponto** específico

Me diga como prefere prosseguir! 😊
