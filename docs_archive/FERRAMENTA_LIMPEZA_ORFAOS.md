# 🧹 FERRAMENTA DE LIMPEZA: Usuários Órfãos

**Data:** 03 de Fevereiro de 2025  
**Status:** ✅ PRONTA PARA USO

---

## 🎯 OBJETIVO

Limpar usuários "fantasmas" que existem em `auth.users` mas não em `profiles`.

Esses usuários foram deletados antes (com o método antigo), mas seus emails ainda estão ocupados no Supabase Auth.

---

## 📊 O QUE SÃO USUÁRIOS ÓRFÃOS?

### Cenário:
```
1. Usuário criado → Existia em auth.users + profiles
2. Admin deletou (método antigo) → Removido apenas de profiles
3. Resultado atual:
   - ✅ Não aparece no painel admin (busca de profiles)
   - ❌ Email ainda registrado em auth.users
   - ❌ Não pode criar nova conta com mesmo email
```

### Problema:
```
❌ Emails "presos" que não podem ser reutilizados
❌ Usuários invisíveis ocupando slots
❌ Banco desorganizado
```

---

## 🛠️ FERRAMENTAS CRIADAS

### 1️⃣ Script Python (Recomendado)

**Arquivo:** `/app/backend/cleanup_orphan_users.py`

**Como usar:**
```bash
cd /app/backend
python3 cleanup_orphan_users.py
```

**O que faz:**
1. 🔍 Lista todos os usuários em auth.users
2. 🔍 Lista todos os IDs em profiles
3. 📊 Compara e encontra órfãos
4. 📋 Exibe lista detalhada (email, ID, data criação)
5. ⚠️ Pede confirmação
6. 🗑️ Deleta órfãos de auth.users
7. ✅ Mostra resumo

**Saída exemplo:**
```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║          🧹 LIMPEZA DE USUÁRIOS ÓRFÃOS - SUPABASE AUTH           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

🔍 BUSCANDO USUÁRIOS ÓRFÃOS
======================================================================

📋 Buscando usuários de auth.users...
   Total em auth.users: 15

📋 Buscando usuários de profiles...
   Total em profiles: 12

======================================================================
⚠️  ENCONTRADOS 3 USUÁRIOS ÓRFÃOS
======================================================================

Estes usuários existem em auth.users mas NÃO em profiles:

1. Email: usuario1@example.com
   ID: abc123-def456-789
   Criado em: 2025-01-15T10:30:00Z

2. Email: usuario2@example.com
   ID: xyz789-uvw456-123
   Criado em: 2025-01-20T14:20:00Z

3. Email: usuario3@example.com
   ID: mno345-pqr678-901
   Criado em: 2025-02-01T09:15:00Z


⚠️  ATENÇÃO: Esta ação é IRREVERSÍVEL!
   Os emails serão liberados para reuso.

Deseja deletar TODOS os usuários órfãos? (digite 'SIM' para confirmar): 
```

---

### 2️⃣ API Endpoints (Para Painel Admin - Futuro)

#### **GET /api/admin/orphan-users**
Lista usuários órfãos sem deletar

**Request:**
```bash
curl http://localhost:8001/api/admin/orphan-users \
  -H "Authorization: Bearer {admin_token}"
```

**Response:**
```json
{
  "total_auth_users": 15,
  "total_profiles": 12,
  "orphans_found": 3,
  "orphans": [
    {
      "id": "abc123-def456-789",
      "email": "usuario1@example.com",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "xyz789-uvw456-123",
      "email": "usuario2@example.com",
      "created_at": "2025-01-20T14:20:00Z"
    }
  ]
}
```

---

#### **DELETE /api/admin/orphan-users**
Deleta TODOS os órfãos de uma vez

**Request:**
```bash
curl -X DELETE http://localhost:8001/api/admin/orphan-users \
  -H "Authorization: Bearer {admin_token}"
```

**Response:**
```json
{
  "success": true,
  "message": "3 usuário(s) órfão(s) deletado(s)",
  "orphans_found": 3,
  "orphans_deleted": 3,
  "orphan_emails": [
    "usuario1@example.com",
    "usuario2@example.com",
    "usuario3@example.com"
  ],
  "failed": null
}
```

---

## 🚀 COMO USAR (PASSO A PASSO)

### Opção A: Script Python (Mais Fácil)

```bash
# 1. Ir para pasta backend
cd /app/backend

# 2. Executar script
python3 cleanup_orphan_users.py

# 3. Ver lista de órfãos
# (será exibido automaticamente)

# 4. Confirmar deleção
# Digite: SIM

# 5. Pronto! Emails liberados ✅
```

---

### Opção B: API (Para Integrar no Admin)

**Passo 1: Ver órfãos primeiro**
```bash
curl http://localhost:8001/api/admin/orphan-users \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

**Passo 2: Deletar todos**
```bash
curl -X DELETE http://localhost:8001/api/admin/orphan-users \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"
```

---

## 🔐 SEGURANÇA

### Proteções:
- ✅ Requer `super_admin` role
- ✅ Pede confirmação explícita (SIM)
- ✅ Logs detalhados de cada ação
- ✅ Mostra preview antes de deletar
- ✅ Não deleta usuários que existem em profiles

### Logs:
```
INFO: Admin admin@client4you.com listou 3 usuários órfãos
WARNING: Admin admin@client4you.com deletou 3 usuários órfãos
INFO: ✅ Órfão deletado: usuario1@example.com (ID: abc123)
INFO: ✅ Órfão deletado: usuario2@example.com (ID: xyz789)
INFO: ✅ Órfão deletado: usuario3@example.com (ID: mno345)
```

---

## ⚠️ ANTES DE EXECUTAR

### Perguntas importantes:

**1. Tem certeza que esses usuários são órfãos?**
- ✅ Sim, foram deletados do painel admin antes
- ✅ Não aparecem mais na lista de usuários
- ✅ Mas os emails não podem ser reutilizados

**2. Você tem backup?**
- ⚠️ Recomendado fazer backup do Supabase antes
- ⚠️ Ação é irreversível

**3. Quem pode executar?**
- ✅ Apenas super_admin
- ✅ Com SUPABASE_SERVICE_ROLE_KEY configurada

---

## 📊 CENÁRIOS DE USO

### Cenário 1: Limpeza Única (Agora)
```bash
# Limpar órfãos acumulados até hoje
python3 cleanup_orphan_users.py

# Confirmar com: SIM
```

### Cenário 2: Verificação Periódica
```bash
# Criar cron job (mensal)
0 0 1 * * cd /app/backend && python3 cleanup_orphan_users.py < echo "SIM"
```

### Cenário 3: Adicionar ao Painel Admin
```typescript
// frontend/src/pages/Admin.tsx
const cleanupOrphans = async () => {
  const response = await fetch(`${backendUrl}/api/admin/orphan-users`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  alert(`${result.orphans_deleted} órfãos deletados!`);
};
```

---

## 📝 ARQUIVOS CRIADOS

### Scripts:
- ✅ `/app/backend/cleanup_orphan_users.py` - Script interativo

### API:
- ✅ `/app/backend/admin_endpoints.py` - Endpoints adicionados:
  - `GET /api/admin/orphan-users` (listar)
  - `DELETE /api/admin/orphan-users` (deletar)

### Documentação:
- ✅ `/app/FERRAMENTA_LIMPEZA_ORFAOS.md` - Este arquivo

---

## 🎯 RESULTADO ESPERADO

### Antes:
```
auth.users: 15 usuários
profiles: 12 usuários
Órfãos: 3 usuários

Emails bloqueados:
- usuario1@example.com ❌
- usuario2@example.com ❌
- usuario3@example.com ❌
```

### Depois:
```
auth.users: 12 usuários
profiles: 12 usuários
Órfãos: 0 usuários

Emails liberados:
- usuario1@example.com ✅
- usuario2@example.com ✅
- usuario3@example.com ✅
```

---

## 🐛 TROUBLESHOOTING

### Erro: "No module named 'supabase'"
```bash
cd /app/backend
pip install supabase
```

### Erro: "SUPABASE_SERVICE_ROLE_KEY not found"
```bash
# Verificar .env
cat /app/backend/.env | grep SUPABASE_SERVICE_ROLE_KEY
```

### Erro: "Permission denied"
```bash
# Dar permissão de execução
chmod +x cleanup_orphan_users.py
```

### Script não pede confirmação
```bash
# Executar manualmente
python3 cleanup_orphan_users.py
# Aguardar prompt
# Digite: SIM
```

---

## ✅ CHECKLIST

Antes de executar:
- [ ] Backup do Supabase feito
- [ ] Login como super_admin
- [ ] SUPABASE_SERVICE_ROLE_KEY configurada
- [ ] Script tem permissão de execução

Após executar:
- [ ] Ver quantos órfãos foram encontrados
- [ ] Revisar lista de emails
- [ ] Confirmar deleção (SIM)
- [ ] Verificar resumo
- [ ] Testar criar conta com email liberado

---

## 🎉 PRONTO PARA USAR!

Execute agora:
```bash
cd /app/backend
python3 cleanup_orphan_users.py
```

**Ou me avise e eu executo para você!** 😊

---

**🧹 Ferramenta criada por:** Emergent Agent  
**📅 Data:** 03 de Fevereiro de 2025  
**✅ Status:** Pronta para uso  
**⚠️ Atenção:** Ação irreversível - use com cuidado
