# 📊 ANÁLISE COMPLETA DO REPOSITÓRIO - LEADS4YOU

**Data da Análise:** 30 de Janeiro de 2025  
**Versão Backend:** 2.2.0  
**Versão Frontend:** 2.0.0  
**Status:** Sistema em Produção (Modo SaaS Híbrido)

---

## 📋 SUMÁRIO EXECUTIVO

O **Leads4You** é uma plataforma SaaS completa para captura e gestão de leads com integração de disparador de mensagens WhatsApp. O sistema oferece:

1. **Busca de Leads** via Google Maps (SERP API)
2. **Disparador de Mensagens WhatsApp** (WAHA - WhatsApp HTTP API)
3. **Gestão Multi-empresa** (Multi-tenant)
4. **Sistema de Quotas e Planos** (Demo, Pro, Enterprise)
5. **Dashboard com Estatísticas em Tempo Real**

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Stack Tecnológico**

#### **Frontend:**
- ⚛️ **React 18.2.0** com TypeScript
- 🎨 **Tailwind CSS** + **Radix UI** (componentes)
- 🚀 **Vite** (build tool)
- 📡 **React Query** (gerenciamento de estado)
- 🎯 **React Router DOM** (navegação)
- 🔐 **Supabase Auth** (autenticação)
- 📊 **Recharts** (gráficos)

#### **Backend:**
- 🐍 **FastAPI 0.110.1** (Python)
- 🦄 **Uvicorn** (ASGI server)
- 🐘 **Supabase** (PostgreSQL + Auth + Storage)
- 🔄 **AsyncIO** (workers assíncronos)
- 📊 **Pandas** (processamento de planilhas)
- 🔒 **JWT** + **RLS** (segurança)

#### **Integrações Externas:**
- 📱 **WAHA** (WhatsApp HTTP API) - `waha.chatyou.chat`
- 🔍 **SERP API** (Google Maps search)
- 💳 **Kiwify** (gateway de pagamento - planejado)

#### **Infraestrutura:**
- 🐳 **Docker** + **Supervisor** (gerenciamento de processos)
- 🌐 **Nginx** (proxy reverso)
- 🗄️ **MongoDB** (legado - não mais usado)
- ☁️ **Kubernetes** (produção)

---

## 📁 ESTRUTURA DE DIRETÓRIOS

```
/app
├── backend/                      # API FastAPI
│   ├── server.py                # Endpoints principais
│   ├── supabase_service.py      # Integração Supabase
│   ├── waha_service.py          # Integração WhatsApp
│   ├── waha_manager.py          # Multi-servidor WAHA
│   ├── campaign_worker.py       # Worker de disparos
│   ├── security_utils.py        # Validações de segurança
│   ├── models.py                # Modelos Pydantic
│   └── requirements.txt         # Dependências Python
│
├── frontend/                     # React App
│   ├── src/
│   │   ├── pages/               # Páginas principais
│   │   │   ├── Dashboard.tsx    # Painel inicial
│   │   │   ├── SearchLeads.tsx  # Busca de leads
│   │   │   ├── Disparador/      # Sistema WhatsApp
│   │   │   ├── Admin.tsx        # Painel admin
│   │   │   ├── Settings.tsx     # Configurações
│   │   │   └── ...
│   │   │
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── hooks/               # Custom hooks
│   │   ├── contexts/            # Context providers
│   │   ├── layouts/             # Layouts
│   │   └── types/               # TypeScript types
│   │
│   └── supabase/
│       └── migrations/          # Migrations SQL
│
├── tests/                        # Testes
├── deploy/                       # Scripts de deploy
└── *.md                         # Documentações
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS (SUPABASE)

### **Tabelas Principais:**

#### 1. **companies** (Empresas)
```sql
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)
- settings (JSONB) -- SERP API key, etc
```

#### 2. **profiles** (Usuários)
```sql
- id (UUID, PK) -- referencia auth.users
- company_id (UUID, FK -> companies)
- full_name (TEXT)
- role (TEXT) -- 'user', 'admin', 'owner'
- avatar_url (TEXT)
- created_at (TIMESTAMP)
```

#### 3. **user_quotas** (Sistema de Cotas)
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- plan (TEXT) -- 'Demo', 'Pro', 'Enterprise'
- lead_search_limit (INTEGER)
- lead_search_used (INTEGER)
- campaigns_limit (INTEGER)
- campaigns_used (INTEGER)
- valid_until (TIMESTAMP)
- reset_period (TEXT) -- 'daily', 'monthly'
```

**Planos:**
| Plano | Buscas | WhatsApp | Validade |
|-------|--------|----------|----------|
| Demo | 5 | ❌ | 7 dias |
| Pro | ♾️ | ✅ | Mensal |
| Enterprise | ♾️ | ✅ Multi | Mensal |

#### 4. **campaigns** (Campanhas WhatsApp)
```sql
- id (UUID, PK)
- company_id (UUID, FK)
- user_id (UUID, FK)
- name (TEXT)
- status (TEXT) -- 'draft', 'ready', 'running', 'paused', 'completed', 'cancelled'
- message_type (TEXT) -- 'text', 'image', 'document'
- message_text (TEXT)
- media_url (TEXT)
- media_filename (TEXT)
- interval_min (INTEGER) -- segundos
- interval_max (INTEGER) -- segundos
- start_time (TEXT) -- HH:MM
- end_time (TEXT) -- HH:MM
- daily_limit (INTEGER)
- working_days (INTEGER[]) -- [0,1,2,3,4] = Seg-Sex
- total_contacts (INTEGER)
- sent_count (INTEGER)
- error_count (INTEGER)
- pending_count (INTEGER)
- created_at (TIMESTAMP)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

#### 5. **campaign_contacts** (Contatos das Campanhas)
```sql
- id (UUID, PK)
- campaign_id (UUID, FK)
- name (TEXT)
- phone (TEXT)
- email (TEXT)
- custom_data (JSONB) -- dados extras da planilha
- status (TEXT) -- 'pending', 'sent', 'error'
- sent_at (TIMESTAMP)
- error_message (TEXT)
```

#### 6. **message_logs** (Logs de Envio)
```sql
- id (UUID, PK)
- campaign_id (UUID, FK)
- contact_id (UUID, FK)
- phone (TEXT)
- message_text (TEXT)
- status (TEXT) -- 'success', 'error'
- error_message (TEXT)
- sent_at (TIMESTAMP)
```

#### 7. **leads** (Leads Capturados)
```sql
- id (UUID, PK)
- company_id (UUID, FK)
- user_id (UUID, FK)
- name (TEXT)
- phone (TEXT)
- email (TEXT)
- address (TEXT)
- category (TEXT)
- rating (FLOAT)
- reviews_count (INTEGER)
- source (TEXT) -- 'google_maps'
- search_term (TEXT)
- location (TEXT)
- created_at (TIMESTAMP)
```

#### 8. **waha_servers** (Multi-servidor WAHA) - BONUS
```sql
- id (UUID, PK)
- name (TEXT)
- url (TEXT)
- api_key (TEXT, encrypted)
- max_instances (INTEGER) -- limite de sessões
- current_instances (INTEGER)
- priority (INTEGER) -- load balancing
- is_active (BOOLEAN)
- health_status (TEXT)
- last_health_check (TIMESTAMP)
```

### **Segurança (RLS - Row Level Security):**
✅ Todas as tabelas possuem políticas RLS  
✅ Usuários só acessam dados da própria empresa  
✅ Backend usa `service_role_key` para operações privilegiadas  
✅ Frontend usa `anon_key` com restrições RLS  

---

## 🔌 API BACKEND - ENDPOINTS PRINCIPAIS

**Base URL:** `https://repo-analyzer-163.preview.emergentagent.com/api`

### **1. Sistema / Health Check**
```
GET  /api/                    # Info da API (version, database)
```

### **2. WhatsApp Management (WAHA)**
```
GET  /api/whatsapp/status     # Status da conexão WhatsApp
POST /api/whatsapp/session/start    # Iniciar sessão
POST /api/whatsapp/session/stop     # Parar sessão
POST /api/whatsapp/session/logout   # Desconectar (logout)
GET  /api/whatsapp/qr         # Obter QR Code
```

**Funcionamento:**
- Cada empresa tem uma sessão única: `company_{company_id}`
- Servidor WAHA fixo: `waha.chatyou.chat`
- Estados: `DISCONNECTED` → `STARTING` → `SCANNING` → `CONNECTED`

### **3. Campanhas (CRUD)**
```
POST   /api/campaigns                   # Criar campanha
GET    /api/campaigns                   # Listar campanhas
GET    /api/campaigns/{id}              # Obter detalhes
PUT    /api/campaigns/{id}              # Atualizar
DELETE /api/campaigns/{id}              # Deletar
```

**Autenticação:** `Bearer Token` (JWT do Supabase)  
**Rate Limit:** 50 criações/hora

### **4. Campanhas - Controle de Disparo**
```
POST /api/campaigns/{id}/start     # Iniciar disparo
POST /api/campaigns/{id}/pause     # Pausar
POST /api/campaigns/{id}/cancel    # Cancelar
POST /api/campaigns/{id}/reset     # Resetar (reiniciar)
```

**Worker Assíncrono:**
- Envia mensagens respeitando intervalo configurado
- Respeita horário de funcionamento (start_time - end_time)
- Respeita dias úteis (working_days)
- Limite diário opcional
- Substitui variáveis: `{{nome}}`, `{{email}}`, etc

### **5. Upload de Contatos**
```
POST /api/campaigns/{id}/upload
Content-Type: multipart/form-data

Fields:
  - file: arquivo CSV/XLSX
  - phone_column: nome da coluna de telefone (default: "Telefone")
  - name_column: nome da coluna de nome (default: "Nome")
```

**Formatos aceitos:** `.csv`, `.xlsx`, `.xls`  
**Validações:**
- Tamanho máximo: 10 MB
- Sanitização de dados (previne CSV injection)
- Detecção automática de colunas

### **6. Contatos**
```
GET /api/campaigns/{id}/contacts   # Listar contatos
GET /api/campaigns/{id}/logs       # Logs de mensagens
```

### **7. Dashboard**
```
GET /api/dashboard/stats           # Estatísticas gerais
  Retorna:
  - total_campaigns
  - active_campaigns
  - total_messages_sent
  - messages_sent_today
```

### **8. Quotas (Sistema de Limites)**
```
GET  /api/quotas/me                # Quota do usuário
POST /api/quotas/check             # Verificar antes de ação
POST /api/quotas/increment         # Incrementar após sucesso
```

**Ações rastreadas:**
- `lead_search` - Busca de leads
- `create_campaign` - Criação de campanhas

---

## 🎨 FRONTEND - PÁGINAS E FUNCIONALIDADES

### **Páginas Públicas:**
1. **LandingPage** (`/`) - Página inicial
2. **Login** (`/login`) - Autenticação
3. **Signup** (`/signup`) - Registro de novos usuários
4. **Pricing** (`/pricing`) - Planos e preços

### **Páginas Protegidas (requerem login):**

#### 1. **Dashboard** (`/dashboard`)
- Visão geral do sistema
- Cards com estatísticas:
  - Total de leads capturados
  - Campanhas ativas
  - Mensagens enviadas hoje
  - Taxa de sucesso
- Gráficos de performance

#### 2. **Buscar Leads** (`/search`)
- Formulário de busca (termo + localização)
- Integração com SERP API (Google Maps)
- Filtros avançados:
  - Categoria
  - Avaliação mínima
  - Número de reviews
- Tabela de resultados com:
  - Seleção múltipla
  - Exportação para CSV/Excel
  - Paginação
- **Verificação de Quota** antes da busca
- Alert se SERP API não configurada

#### 3. **Disparador** (`/disparador`)
**Bloqueado para plano Demo** 🔒

**Abas:**
- **Campanhas:** Lista de campanhas criadas
- **Nova Campanha:** Criar nova campanha

**Funcionalidades:**
- Criar/Editar/Deletar campanhas
- Upload de lista de contatos (CSV/Excel)
- Configurar mensagem:
  - Texto simples
  - Texto + Imagem
  - Texto + Documento
  - Variáveis dinâmicas: `{{nome}}`, `{{email}}`, etc
- Configurações avançadas:
  - Intervalo entre mensagens (min/max)
  - Horário de funcionamento (08:00 - 18:00)
  - Dias úteis (Seg-Sex)
  - Limite diário
- Card de campanha com:
  - Estatísticas (enviadas/erros/pendentes)
  - Barra de progresso
  - Ações: Iniciar/Pausar/Cancelar/Resetar/Deletar
  - Visualizar logs de envio

#### 4. **Histórico** (`/history`)
- Histórico completo de leads capturados
- Filtros e busca
- Exportação

#### 5. **Configurações** (`/settings`)
**Seções:**

**a) Perfil da Empresa**
- Nome da empresa
- Logo

**b) Configuração SERP API**
- Campo para API Key
- Teste de conexão
- Status: ✅ Configurada / ❌ Não configurada

**c) Painel de Controle WhatsApp**
- Status da conexão
- Botões:
  - **Iniciar Sessão** → Gera QR Code
  - **Pausar Motor** → Para sem desconectar
  - **Encerrar Sessão** → Logout completo
- Exibição do QR Code (quando em estado SCANNING)
- Indicadores visuais de status:
  - 🔴 Desconectado
  - 🟡 Iniciando...
  - 🟢 Conectado

#### 6. **Perfil** (`/profile`)
- Dados do usuário
- Avatar
- Informações do plano atual
- Barra de quota (uso/limite)

#### 7. **Admin** (`/admin`) - Somente Admins
- Gestão de usuários da empresa
- Alterar permissões
- Ver estatísticas gerais

---

## 🔐 SISTEMA DE AUTENTICAÇÃO E SEGURANÇA

### **Autenticação:**
- **Supabase Auth** (JWT)
- Login via email/senha
- Tokens armazenados no localStorage
- Renovação automática de tokens
- Logout com limpeza de sessão

### **Autorização:**
- **Roles:** `user`, `admin`, `owner`
- **RLS (Row Level Security)** no Supabase
- Middleware de autenticação no backend:
  - `get_authenticated_user()` - Valida JWT
  - `require_role()` - Verifica permissão
  - `validate_campaign_ownership()` - Previne IDOR

### **Validações de Segurança Implementadas:**
✅ **CSRF Protection** via SameSite cookies  
✅ **Rate Limiting** (SlowAPI)  
✅ **File Upload Validation:**
  - Tamanho máximo (10 MB)
  - Tipos permitidos (CSV, Excel)
  - Verificação de magic bytes
✅ **CSV Injection Prevention:**
  - Sanitização de valores
  - Remoção de fórmulas maliciosas
✅ **SQL Injection Prevention:**
  - ORM (Supabase client)
  - Prepared statements
✅ **XSS Prevention:**
  - Escape de dados no frontend
  - Content Security Policy (CSP)
✅ **IDOR Prevention:**
  - Validação de company_id em todas as rotas
  - RLS no banco

### **CORS:**
```python
CORS_ORIGINS = "*"  # ⚠️ ATENÇÃO: Configurar domínios específicos em produção
```

---

## 🚀 FLUXOS PRINCIPAIS DO SISTEMA

### **Fluxo 1: Busca de Leads**

```
1. Usuário acessa /search
2. Sistema verifica se SERP API está configurada
   ├─ Se não → Exibe alert "Configure a API"
   └─ Se sim → Permite busca
3. Usuário preenche: "restaurantes" + "São Paulo"
4. Frontend chama `checkQuota('lead_search')`
   ├─ Se limite atingido → Exibe modal de upgrade
   └─ Se permitido → Continua
5. Frontend → POST /api/leads/search
6. Backend → SERP API (Google Maps)
7. Backend salva leads no Supabase
8. Frontend exibe resultados na tabela
9. Frontend chama `incrementQuota('lead_search')`
10. Usuário pode exportar ou salvar selecionados
```

### **Fluxo 2: Conexão WhatsApp (Primeira Vez)**

```
1. Usuário acessa /settings
2. Clica em "Iniciar Sessão WhatsApp"
3. Frontend → POST /api/whatsapp/session/start
4. Backend → WAHA: POST /api/sessions (cria sessão)
5. Backend → WAHA: POST /api/sessions/{session}/start
6. WAHA muda status para "STARTING" → "SCANNING"
7. Frontend polling: GET /api/whatsapp/status (a cada 3s)
8. Status = "SCANNING" → Frontend busca QR Code
9. Frontend → GET /api/whatsapp/qr
10. Backend → WAHA: GET /api/screenshot
11. WAHA retorna imagem PNG do QR Code
12. Frontend exibe QR Code na tela
13. Usuário escaneia com WhatsApp
14. WAHA detecta conexão → Status "CONNECTED"
15. Frontend exibe: ✅ "WhatsApp Conectado!"
```

### **Fluxo 3: Criar e Disparar Campanha**

```
1. Usuário acessa /disparador
2. Sistema verifica plano
   ├─ Se Demo → Exibe tela de bloqueio
   └─ Se Pro/Enterprise → Permite acesso
3. Clica "Nova Campanha"
4. Preenche formulário:
   - Nome: "Promoção Restaurantes"
   - Mensagem: "Olá {{nome}}, temos uma oferta especial!"
   - Intervalo: 30-60s
   - Horário: 09:00 - 18:00
   - Dias: Seg-Sex
5. Frontend → POST /api/campaigns (cria campanha em 'draft')
6. Sistema exibe card da campanha
7. Usuário clica "Upload de Contatos"
8. Seleciona arquivo CSV com colunas: Nome, Telefone, Email
9. Frontend → POST /api/campaigns/{id}/upload
10. Backend:
    - Valida arquivo (tamanho, tipo)
    - Parse com Pandas
    - Normaliza telefones (adiciona +55)
    - Sanitiza dados
    - Salva contatos no banco
    - Atualiza campanha: status='ready', total_contacts=X
11. Usuário clica "Iniciar Campanha"
12. Frontend verifica WhatsApp conectado
13. Frontend → POST /api/campaigns/{id}/start
14. Backend:
    - Verifica conexão WAHA
    - Inicia worker assíncrono em background
15. Worker em loop:
    - Busca próximo contato pendente
    - Verifica horário permitido
    - Verifica limite diário
    - Substitui variáveis na mensagem
    - Envia via WAHA
    - Aguarda intervalo aleatório (30-60s)
    - Repete até acabar contatos
16. Frontend atualiza em tempo real:
    - Barra de progresso
    - Contadores (enviadas/erros/pendentes)
17. Campanha termina → Status 'completed'
```

---

## 📊 SISTEMA DE QUOTAS E PLANOS

### **Estrutura do Sistema:**

```typescript
interface UserQuota {
  plan: 'Demo' | 'Pro' | 'Enterprise';
  lead_search_limit: number;      // Limite de buscas
  lead_search_used: number;        // Buscas utilizadas
  campaigns_limit: number;         // Limite de campanhas
  campaigns_used: number;          // Campanhas criadas
  valid_until: Date;               // Data de expiração
  reset_period: 'daily' | 'monthly'; // Período de reset
}
```

### **Verificação no Frontend:**

```typescript
// Hook useQuotas
const { quota, checkQuota, incrementQuota } = useQuotas();

// Antes de buscar leads
const check = await checkQuota('lead_search');
if (!check.allowed) {
  setShowQuotaModal(true); // Modal "Limite atingido"
  return;
}

// Busca leads...

// Após sucesso
await incrementQuota('lead_search');
```

### **Verificação no Backend:**

```python
@api_router.post("/campaigns")
async def create_campaign(
    campaign: CampaignCreate,
    auth_user: dict = Depends(get_authenticated_user)
):
    # Validar quota antes de criar
    await validate_quota_for_action(
        user_id=auth_user["user_id"],
        action="create_campaign",
        required_plan=["Pro", "Enterprise"],
        db=db
    )
    
    # Cria campanha...
    
    # Incrementa contador
    await db.increment_quota(auth_user["user_id"], "create_campaign")
```

### **Bloqueios por Plano:**

| Recurso | Demo | Pro | Enterprise |
|---------|------|-----|------------|
| Busca de Leads | 5 | ♾️ | ♾️ |
| WhatsApp | ❌ | ✅ | ✅ |
| Campanhas | ❌ | ✅ | ✅ |
| Multi-instâncias WAHA | ❌ | ❌ | ✅ |

---

## 🔧 INTEGRAÇÕES EXTERNAS

### **1. WAHA (WhatsApp HTTP API)**

**URL:** `https://waha.chatyou.chat`  
**Autenticação:** `X-Api-Key: {WAHA_MASTER_KEY}`

**Endpoints Utilizados:**
```
POST   /api/sessions                    # Criar sessão
POST   /api/sessions/{session}/start    # Iniciar
POST   /api/sessions/{session}/stop     # Parar
POST   /api/sessions/{session}/logout   # Logout
GET    /api/sessions/{session}          # Status
GET    /api/screenshot?session={name}   # QR Code
POST   /api/sendText                    # Enviar texto
POST   /api/sendImage                   # Enviar imagem
POST   /api/sendFile                    # Enviar arquivo
```

**Gestão de Sessões:**
- Uma sessão por empresa: `company_{company_id}`
- Estados: `STOPPED`, `STARTING`, `SCAN_QR_CODE`, `WORKING`, `FAILED`
- Persistência: Sessão mantém login mesmo após parar
- Logout: Requer novo QR Code

**Worker de Disparo:**
```python
# Envio de mensagem
async def send_message(phone: str, message: str):
    # Normaliza telefone (+5511999999999)
    normalized = normalize_phone(phone)
    
    # Substitui variáveis
    text = message.replace("{{nome}}", contact.name)
    
    # Envia via WAHA
    await waha.send_text_message(
        chat_id=f"{normalized}@c.us",
        text=text
    )
```

### **2. SERP API (Google Maps Search)**

**Configuração:**
- Armazenado em: `companies.settings->serp_api_key`
- Configurado pelo usuário em `/settings`

**Uso:**
```python
# No backend (via hook do frontend)
results = await serp_api.search_google_maps(
    query="restaurantes",
    location="São Paulo, Brazil"
)
# Retorna: nome, telefone, endereço, rating, reviews
```

### **3. Kiwify (Gateway de Pagamento) - PLANEJADO**

**Webhook (a implementar):**
```python
@api_router.post("/webhook/kiwify")
async def kiwify_webhook(data: dict):
    event = data["event"]
    
    if event == "purchase.approved":
        # Upgrade para Pro
        await upgrade_user_to_pro(data["customer_email"])
    
    elif event == "subscription.canceled":
        # Downgrade para Free
        await downgrade_user(data["customer_email"])
```

---

## 🎯 FEATURES IMPLEMENTADAS

### ✅ **Core Features (100%)**
- [x] Autenticação multi-tenant (Supabase)
- [x] Sistema de quotas e planos
- [x] Busca de leads (SERP API)
- [x] Exportação de leads (CSV/Excel)
- [x] Dashboard com estatísticas
- [x] Gestão de perfil e empresa

### ✅ **Disparador WhatsApp (95%)**
- [x] Conexão WhatsApp via QR Code
- [x] Gerenciamento de sessões (start/stop/logout)
- [x] CRUD de campanhas
- [x] Upload de contatos (CSV/Excel)
- [x] Mensagens com variáveis dinâmicas
- [x] Suporte a texto, imagem, documento
- [x] Worker assíncrono de disparo
- [x] Controle de intervalo entre mensagens
- [x] Horário de funcionamento
- [x] Dias úteis
- [x] Limite diário
- [x] Logs de envio
- [x] Barra de progresso em tempo real
- [ ] Webhooks de status (pendente)

### ✅ **Segurança (90%)**
- [x] JWT Authentication
- [x] RLS (Row Level Security)
- [x] Rate Limiting
- [x] File Upload Validation
- [x] CSV Injection Prevention
- [x] IDOR Prevention
- [x] XSS Prevention
- [ ] CORS restrito (atualmente "*")
- [ ] Criptografia de API keys

### 🚧 **Features Planejadas**
- [ ] Integração Kiwify (pagamentos)
- [ ] Multi-instâncias WAHA (Enterprise)
- [ ] Agendamento de campanhas
- [ ] Templates de mensagens
- [ ] Relatórios avançados
- [ ] Webhooks customizáveis
- [ ] API pública (para integrações)
- [ ] Whitelabel (Enterprise)

---

## 🐛 ISSUE CONHECIDA - RLS POLICY

### **Problema:**
```
❌ POST /api/campaigns falha com erro:
"new row violates row-level security policy for table campaigns"
```

### **Causa:**
Backend estava usando `SUPABASE_KEY` (anon key) em vez de `SUPABASE_SERVICE_ROLE_KEY`.

### **Solução Aplicada:**
```python
# supabase_service.py
class SupabaseService:
    def __init__(self):
        # ✅ USA service_role key (bypass RLS)
        self.key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY')
```

### **Status:**
✅ **RESOLVIDO** - Backend agora usa service_role key para operações privilegiadas.

---

## 📈 ESTATÍSTICAS DO PROJETO

### **Linhas de Código (Aproximado):**
- Backend: ~3.500 linhas (Python)
- Frontend: ~8.000 linhas (TypeScript/TSX)
- Migrations: ~1.200 linhas (SQL)
- **Total:** ~12.700 linhas

### **Arquivos Principais:**
- Backend: 8 arquivos core
- Frontend: 35+ componentes/páginas
- Migrations: 18 arquivos
- Documentação: 10+ arquivos MD

### **Dependências:**
- Backend: 34 packages (Python)
- Frontend: 54 packages (NPM)

---

## 🚀 COMO RODAR O PROJETO

### **Pré-requisitos:**
- Docker + Kubernetes (produção)
- Python 3.11+ (desenvolvimento local)
- Node.js 18+ (desenvolvimento local)
- Conta Supabase
- API Key WAHA

### **Variáveis de Ambiente:**

**Backend (.env):**
```bash
SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
WAHA_DEFAULT_URL=https://waha.chatyou.chat
WAHA_MASTER_KEY=PJ1X_5sPM2cg...
CORS_ORIGINS=*
```

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://owlignktsqlrqaqhzujb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_BACKEND_URL=https://repo-analyzer-163.preview.emergentagent.com
```

### **Comandos:**

**Backend:**
```bash
cd /app/backend
/root/.venv/bin/pip install -r requirements.txt
sudo supervisorctl restart backend
```

**Frontend:**
```bash
cd /app/frontend
yarn install
sudo supervisorctl restart frontend
```

### **Verificar Status:**
```bash
sudo supervisorctl status
curl https://repo-analyzer-163.preview.emergentagent.com/api/
```

---

## 📝 DOCUMENTAÇÃO ADICIONAL

O repositório contém várias documentações detalhadas:

1. **ANALISE_COMPLETA_SAAS.md** - Sistema de quotas
2. **SAAS_ARCHITECTURE_LEADS4YOU.md** - Arquitetura geral
3. **QUOTAS_IMPLEMENTATION.md** - Detalhes de implementação
4. **SECURITY_FIXES_APPLIED.md** - Correções de segurança
5. **CODE_QUALITY_AUDIT_REPORT.md** - Auditoria de código
6. **BUG_FIXES_COMPLETE_REPORT.md** - Correções aplicadas
7. **GUIA_DE_TESTES.md** - Guia de testes
8. **test_result.md** - Histórico de testes

---

## 🎓 APRENDIZADOS E BOAS PRÁTICAS

### **Arquitetura:**
✅ Separação clara frontend/backend  
✅ Multi-tenancy (company_id em todas as queries)  
✅ Workers assíncronos para tarefas longas  
✅ RLS para segurança no banco  

### **Segurança:**
✅ Uso de service_role key no backend  
✅ Validação rigorosa de uploads  
✅ Sanitização de dados  
✅ Rate limiting  

### **UX:**
✅ Feedback visual em tempo real  
✅ Polling inteligente (WhatsApp status)  
✅ Modals de confirmação  
✅ Alertas de configuração faltante  

### **Performance:**
✅ Índices no banco de dados  
✅ Paginação em todas as listagens  
✅ Query optimization (Supabase)  

---

## 🔮 PRÓXIMOS PASSOS SUGERIDOS

### **Curto Prazo (1-2 semanas):**
1. ✅ Testar POST /api/campaigns após fix do RLS
2. ✅ Validar frontend do Disparador
3. Configurar CORS restrito (domínios específicos)
4. Implementar criptografia de API keys no banco
5. Adicionar testes automatizados

### **Médio Prazo (1-2 meses):**
1. Integração completa Kiwify (webhook)
2. Sistema de notificações (email/push)
3. Relatórios em PDF
4. Templates de mensagens
5. Agendamento de campanhas

### **Longo Prazo (3-6 meses):**
1. Multi-instâncias WAHA (Enterprise)
2. API pública com documentação Swagger
3. Webhooks customizáveis
4. Whitelabel completo
5. Dashboard analytics avançado

---

## 📞 CONTATO E SUPORTE

**Projeto:** Leads4You  
**Tipo:** SaaS B2B (Geração e Gestão de Leads)  
**Stack:** React + FastAPI + Supabase + WAHA  
**Status:** MVP Completo - Pronto para Testes Beta  

---

## 📄 LICENÇA

Projeto proprietário - Todos os direitos reservados.

---

**Última Atualização:** 30 de Janeiro de 2025  
**Revisão:** 1.0
