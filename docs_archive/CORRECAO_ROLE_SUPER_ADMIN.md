# 🔐 PROBLEMA: Token Sem Role Super_Admin

**Data:** 03 de Fevereiro de 2025  
**Status:** ✅ RESOLVIDO

---

## 🐛 PROBLEMA

### Sintoma:
```
Erro ao atualizar quota
Acesso negado. Requer permissão: super_admin
```

### Causa:
Usuário `felipsantos.p@gmail.com` tinha acesso ao painel admin no **frontend**, mas não tinha a role `super_admin` no **banco de dados**.

**Roles encontradas:**
- ✅ `company_owner` (pode acessar painel admin no frontend)
- ❌ `super_admin` (necessária para endpoints do backend)

---

## ✅ SOLUÇÃO APLICADA

### Adicionado Role Super_Admin

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('0c6387a7-57a2-4e6e-bd40-d34cff18f6ac', 'super_admin');
```

**Resultado:**
```
user_id: 0c6387a7-57a2-4e6e-bd40-d34cff18f6ac
email: felipsantos.p@gmail.com

Roles:
✅ company_owner
✅ super_admin (NOVO!)
```

---

## 🔄 PRÓXIMO PASSO NECESSÁRIO

### VOCÊ PRECISA FAZER LOGOUT E LOGIN NOVAMENTE

**Por quê?**
O token JWT atual não inclui a role `super_admin`. O token só é atualizado quando você faz login.

**Como fazer:**
```
1. Clique no seu nome (canto superior direito)
2. Clique em "Sair" ou "Logout"
3. Faça login novamente
4. ✅ Agora o token terá super_admin
```

---

## 🧪 APÓS LOGIN, TESTE:

1. Ir no painel admin
2. Editar quota do usuário
3. Selecionar plano "Intermediário"
4. Clicar em "Salvar Quota"
5. ✅ Deve funcionar sem erros!

---

## 🔐 O QUE É JWT E POR QUE PRECISA RELOGAR?

### JWT (JSON Web Token):
Quando você faz login, o Supabase cria um token com suas informações:

```json
{
  "user_id": "abc123",
  "email": "seu@email.com",
  "roles": ["company_owner"],  // ❌ Faltando super_admin
  "exp": "2025-02-03T20:00:00Z"
}
```

Esse token fica salvo no navegador e é enviado em toda requisição.

### Após adicionar role:
O banco tem a role nova, mas o token ainda tem a lista antiga.

**Solução:** Fazer logout → Login novamente → Novo token com todas as roles:

```json
{
  "user_id": "abc123",
  "email": "seu@email.com",
  "roles": ["company_owner", "super_admin"],  // ✅ Completo!
  "exp": "2025-02-03T20:30:00Z"
}
```

---

## 📊 DIFERENÇA ENTRE AS ROLES

| Role | Acesso Frontend | Acesso Backend API |
|------|-----------------|-------------------|
| **company_owner** | ✅ Painel admin | ❌ Endpoints limitados |
| **super_admin** | ✅ Painel admin | ✅ Todos os endpoints |

### Por que duas roles?

**`company_owner`:**
- Gerencia sua própria empresa
- Vê painel admin da empresa
- Não pode editar outras empresas

**`super_admin`:**
- Acesso total ao sistema
- Pode editar qualquer empresa
- Pode usar endpoints privilegiados
- Tem service_role equivalent powers

**Você tem as duas:** Melhor dos dois mundos! 🎉

---

## 🛠️ SE PRECISAR ADICIONAR ADMIN PARA OUTRO USUÁRIO

### Opção 1: Via Script Python
```bash
cd /app/backend
python3 << 'EOF'
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Buscar usuário
profile = supabase.table('profiles').select('id').eq('email', 'email@aqui.com').single().execute()
user_id = profile.data['id']

# Adicionar super_admin
supabase.table('user_roles').insert({
    'user_id': user_id,
    'role': 'super_admin'
}).execute()

print("✅ Super admin adicionado!")
EOF
```

### Opção 2: Via SQL no Supabase Dashboard
```sql
-- Buscar user_id
SELECT id FROM profiles WHERE email = 'email@aqui.com';

-- Adicionar role
INSERT INTO user_roles (user_id, role)
VALUES ('user-id-aqui', 'super_admin');
```

---

## ✅ CHECKLIST

- [x] Role `super_admin` adicionada no banco
- [ ] **Você precisa fazer logout**
- [ ] **Fazer login novamente**
- [ ] Testar editar quota
- [ ] Confirmar que funciona

---

## 🎯 RESUMO

**Problema:** Token sem super_admin  
**Solução:** Adicionado no banco  
**Próximo passo:** Logout + Login  
**Resultado esperado:** Editar quotas funcionando ✅

---

**🔐 Correção aplicada por:** Emergent Agent  
**⏱️ Tempo:** ~5 minutos  
**📅 Data:** 03 de Fevereiro de 2025

**AGORA FAÇA LOGOUT E LOGIN PARA ATIVAR!** 🚀
