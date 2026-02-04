# ⚠️ STATUS ATUAL - BUSCA DE LEADS

## 🎯 SITUAÇÃO

A busca de leads está **FUNCIONANDO** usando a função antiga (`search-leads`) temporariamente.

## ❌ PROBLEMA COM search-leads-v2

A Edge Function `search-leads-v2` tem um problema de autenticação 401:
- Código deployado no Supabase
- Mas validação JWT muito restritiva
- Precisa investigação mais profunda

## ✅ SOLUÇÃO TEMPORÁRIA APLICADA

**Configuração atual:**
- ✅ Sistema usa `search-leads` (função antiga que funciona)
- ✅ Busca de leads funcionando normalmente
- ✅ Sem erros para o usuário
- ⏳ Sem busca progressiva (limitado a ~50 resultados)

## 📊 O QUE FUNCIONA AGORA

### **✅ Buscar Leads:**
- Busca inicial funciona
- Retorna até 50 leads
- Salva no banco
- Exportação funciona

### **✅ Histórico & Biblioteca:**
- 3 abas funcionando
- Visualização de leads
- Favoritos
- Filtros

### **❌ O QUE NÃO FUNCIONA:**
- Botão "Carregar Mais" (precisa search-leads-v2)
- Busca progressiva ilimitada
- Deduplicação avançada

## 🔧 PRÓXIMOS PASSOS PARA RESOLVER

### **Opção 1: Investigar Auth da v2** (complexo)
1. Ver logs da Edge Function no Supabase
2. Debugar validação JWT
3. Ajustar políticas RLS
4. Testar novamente

### **Opção 2: Esperar funcionar assim** (simples)
- Sistema funcional com limitações
- 50 leads por busca é suficiente?
- Busca progressiva fica para depois

### **Opção 3: Remover autenticação da v2** (arriscado)
- Deixar função aberta (sem JWT)
- Validar só por company_id
- Menos seguro mas funciona

## 💡 RECOMENDAÇÃO

**Para agora:** Use o sistema como está (funcional com 50 leads/busca)

**Para depois:** Quando tiver tempo, investigar logs da Edge Function:
1. Supabase → Edge Functions → search-leads-v2 → Logs
2. Ver exatamente qual erro de auth acontece
3. Ajustar código baseado no erro real

## 🧪 TESTE AGORA

1. Acesse a aplicação
2. Vá em "Buscar Leads"
3. Busque: "restaurantes ariquemes"
4. Deve funcionar ✅
5. Retorna até 50 leads
6. Histórico salva tudo

## 📝 LOGS PARA DEBUG (quando quiser resolver)

No Supabase Dashboard:
```
Edge Functions → search-leads-v2 → Logs tab
```

Procure por:
- Mensagens de erro JWT
- "Missing authorization header"
- "Invalid token"
- Qualquer stack trace

---

**Status:** ✅ Sistema funcional (com limitações temporárias)  
**Prioridade do fix:** Baixa (não bloqueia uso)  
**Impacto:** Limitado a 50 leads por busca (ao invés de ilimitado)
