# 🐛 BUG CORRIGIDO: Admin Não Consegue Alterar Plano de Usuário

**Data:** 03 de Fevereiro de 2025  
**Severidade:** 🔴 ALTA  
**Status:** ✅ CORRIGIDO

---

## ❌ PROBLEMA IDENTIFICADO

### Comportamento Incorreto:
1. Admin cria usuário com plano Demo
2. Tenta alterar plano do usuário no painel admin
3. ❌ **Erro:** "new row violates row-level security policy for table 'user_quotas'"

### Causa Raiz:
O painel admin estava tentando fazer `upsert` diretamente na tabela `user_quotas` do frontend (usando anon key), mas a tabela tem **Row Level Security (RLS)** que bloqueia operações diretas.

**Frontend (anon key):** ❌ Sem permissão para UPDATE/INSERT em `user_quotas`

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Criado Endpoint no Backend

**Arquivo:** `/app/backend/admin_endpoints.py`

**Endpoint:** `POST /api/admin/users/{user_id}/quota`

**Parâmetros:**
```json
{
  "plan_type": "intermediario",
  "plan_name": "Intermediário",
  "leads_limit": -1,
  "campaigns_limit": -1,
  "messages_limit": -1
}
```

**O que faz:**
1. ✅ Valida que é super_admin
2. ✅ Busca company_id do usuário
3. ✅ Faz upsert em user_quotas (usando service_role key)
4. ✅ Marca subscription_status como 'active'
5. ✅ Retorna quota atualizada

**Benefícios:**
- ✅ Backend usa `service_role key` (bypassa RLS)
- ✅ Seguro (requer super_admin)
- ✅ Logs de auditoria
- ✅ Funciona para criar e atualizar quotas

---

## 🔧 CÓDIGO ATUALIZADO

### Backend (admin_endpoints.py)
```python
@admin_router.post("/users/{user_id}/quota")
async def update_user_quota(
    user_id: str,
    plan_type: str,
    plan_name: str,
    leads_limit: int,
    campaigns_limit: int,
    messages_limit: int,
    auth_user: dict = Depends(require_role("super_admin"))
):
    # Busca company_id
    # Faz upsert em user_quotas com service_role
    # Retorna sucesso
```

### Frontend (Admin.tsx)
**Antes:**
```typescript
// ❌ Direto no Supabase (bloqueado por RLS)
await supabase
  .from("user_quotas")
  .upsert({...});
```

**Depois:**
```typescript
// ✅ Via backend API
const response = await fetch(`${backendUrl}/api/admin/users/${userId}/quota`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

---

## 🎯 CASOS DE USO CORRIGIDOS

### 1. Alterar Plano de Usuário Existente
```
1. Admin vai no painel
2. Clica em "Editar Quota" no usuário
3. Seleciona novo plano (ex: Intermediário)
4. Clica em "Salvar"
5. ✅ Quota atualizada com sucesso!
```

### 2. Criar Usuário com Plano Específico
```
1. Admin clica em "Criar Usuário"
2. Preenche email, senha, nome
3. Seleciona plano (ex: Avançado)
4. Clica em "Criar"
5. ✅ Usuário criado com plano correto!
```

### 3. Upgrade Manual de Demo para Pago
```
1. Usuário cadastra (plano Demo automático)
2. Admin abre painel
3. Edita quota do usuário
4. Muda de "Demo" para "Intermediário"
5. ✅ Usuário tem acesso completo!
```

---

## 📊 ANTES vs DEPOIS

| Ação | Antes | Depois |
|------|-------|--------|
| **Criar usuário com plano** | ❌ RLS error | ✅ Funciona |
| **Alterar plano existente** | ❌ RLS error | ✅ Funciona |
| **Upgrade manual** | ❌ Impossível | ✅ Possível |
| **Segurança** | ⚠️ Tentativa no frontend | ✅ Backend protegido |
| **Logs** | ❌ Sem auditoria | ✅ Logs detalhados |

---

## 🔐 SEGURANÇA

### Proteções Implementadas:
- ✅ Requer role `super_admin`
- ✅ Validação de token JWT
- ✅ Backend usa service_role key
- ✅ Logs de auditoria completos
- ✅ Validação de user_id existe

### Exemplo de Log:
```
INFO: Admin admin@client4you.com atualizou quota de user123 para intermediario
```

---

## 🧪 COMO TESTAR

### Teste 1: Criar usuário com plano
```
1. Login como admin
2. Criar Usuário
   - Email: teste@example.com
   - Senha: teste123
   - Plano: Intermediário
3. Criar
4. ✅ Usuário criado com plano correto
```

### Teste 2: Alterar plano existente
```
1. Buscar usuário demo na lista
2. Clicar em "Editar Quota" (ícone de lápis)
3. Selecionar "Avançado"
4. Ajustar limites se necessário
5. Salvar
6. ✅ Plano atualizado!
```

### Teste 3: Verificar no banco
```sql
SELECT 
  p.email,
  uq.plan_type,
  uq.plan_name,
  uq.leads_limit,
  uq.subscription_status
FROM profiles p
JOIN user_quotas uq ON uq.user_id = p.id
WHERE p.email = 'teste@example.com';
```

---

## 📝 ARQUIVOS MODIFICADOS

**Backend:**
- ✅ `/app/backend/admin_endpoints.py` - Novo endpoint `POST /users/{id}/quota`

**Frontend:**
- ✅ `/app/frontend/src/pages/Admin.tsx` - Função `handleSaveQuota` atualizada
- ✅ `/app/frontend/src/pages/Admin.tsx` - Função `handleCreateUser` atualizada

---

## 🎯 PLANOS DISPONÍVEIS

Após correção, admin pode definir qualquer plano:

| Plano | Leads | WhatsApp | Campanhas |
|-------|-------|----------|-----------|
| **demo** | 5 | 1 teste | 50 msgs |
| **basico** | ♾️ | ❌ | ❌ |
| **intermediario** | ♾️ | ✅ | ♾️ |
| **avancado** | ♾️ | ✅ (5 instâncias) | ♾️ |

---

## 💡 USO PRÁTICO

### Cenário 1: Cliente Teste VIP
```
1. Cliente pede acesso completo para testar
2. Admin cria usuário com plano "avancado"
3. Cliente testa todas as funcionalidades
4. Depois de X dias, admin pode downgrade para "demo"
```

### Cenário 2: Problema com Pagamento
```
1. Cliente pagou mas webhook falhou
2. Cliente não tem acesso
3. Admin verifica no painel
4. Admin atualiza manualmente para plano pago
5. Cliente ganha acesso imediato
```

### Cenário 3: Upgrade Manual
```
1. Cliente quer upgrade mas sem Kiwify
2. Cliente paga via transferência/PIX
3. Admin confirma pagamento
4. Admin atualiza plano manualmente
5. Cliente ativado instantaneamente
```

---

## ⚠️ IMPORTANTE

### RLS Policies:
Este endpoint **não remove** as RLS policies de `user_quotas`.

As policies continuam protegendo a tabela:
- ✅ Usuários comuns não podem editar quotas
- ✅ Frontend não pode editar diretamente
- ✅ Apenas backend (service_role) pode editar
- ✅ Admin usa endpoint seguro do backend

### Por que não remover RLS?
- 🔐 Segurança em camadas
- 🔐 Previne edição maliciosa via frontend
- 🔐 Força uso de endpoints validados
- 🔐 Logs centralizados no backend

---

## 🐛 OUTROS BUGS RELACIONADOS CORRIGIDOS

### 1. Criar usuário também falhava
Ao criar usuário com plano específico, também dava RLS error.

**Status:** ✅ Corrigido (usa mesmo endpoint)

### 2. Timeout na criação
Frontend aguardava 2s para profile ser criado antes de criar quota.

**Melhoria:** Agora é mais rápido pois backend faz tudo de uma vez.

---

## ✅ RESULTADO FINAL

```
✅ Admin pode alterar plano de qualquer usuário
✅ Admin pode criar usuário com plano específico
✅ Sem erros de RLS
✅ Seguro e auditável
✅ Backend + Frontend sincronizados
✅ Sistema totalmente funcional
```

---

**🐛 Bug corrigido por:** Emergent Agent  
**⏱️ Tempo de correção:** ~10 minutos  
**✅ Status:** Testado e funcionando  
**📅 Data:** 03 de Fevereiro de 2025

---

## 🚀 AGORA VOCÊ PODE:

1. ✅ Criar usuários com qualquer plano
2. ✅ Alterar plano de usuários existentes
3. ✅ Fazer upgrade/downgrade manual
4. ✅ Corrigir problemas de webhook manualmente
5. ✅ Dar acesso VIP para testes

**Tente agora no painel admin!** 🎉
