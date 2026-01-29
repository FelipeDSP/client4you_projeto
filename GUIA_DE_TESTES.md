# 🧪 Guia de Testes - Sistema de Configuração

## 📋 O que foi implementado

### ✅ Correções e Melhorias

1. **Configuração WAHA**
   - ✅ Adicionadas variáveis de ambiente no backend/.env
   - ✅ WAHA_DEFAULT_URL: https://waha.chatyou.chat
   - ✅ WAHA_MASTER_KEY: Configurado
   - ✅ Sessões únicas por empresa: `company_{company_id}`

2. **Configuração SERP API**
   - ✅ Card de configuração adicionado na página Settings
   - ✅ Integração com tabela company_settings do Supabase
   - ✅ Cada empresa pode configurar sua própria chave

3. **Interface de Gerenciamento WhatsApp**
   - ✅ Painel de controle na página Settings
   - ✅ Botões: Iniciar Sessão / Reiniciar Motor / Desconectar
   - ✅ Exibição de QR Code automática
   - ✅ Polling de status a cada 5 segundos

---

## 🔍 Como Testar

### Passo 1: Acessar a Página de Configurações

1. Faça login na plataforma
2. Navegue até **Configurações** (Settings)
3. Você deve ver 2 cards:
   - 🌐 **Chave SERP API**
   - 📱 **Gerenciamento de Sessão WhatsApp**

---

### Passo 2: Testar Configuração da SERP API

#### ✅ O que verificar:

1. **Card SERP API**
   - Badge mostra "Não Configurado" (laranja) se não houver chave
   - Badge mostra "Configurado" (verde) se houver chave
   - Ícone do globo muda de cor conforme status

2. **Salvar Chave**
   - Digite uma chave SERP API no campo
   - Clique em "Salvar Chave"
   - Deve aparecer mensagem de sucesso
   - Badge deve mudar para "Configurado"
   - Recarregue a página e verifique se a chave foi mantida

3. **Link para obter chave**
   - Clique no link "serpapi.com/manage-api-key"
   - Deve abrir em nova aba

#### 🎯 Resultado Esperado:
- ✅ Chave salva no Supabase (tabela company_settings)
- ✅ Chave específica para cada empresa (company_id)
- ✅ Chave permanece após reload da página

---

### Passo 3: Testar Gerenciamento WhatsApp

#### Status Possíveis:

| Status | Descrição | O que aparece |
|--------|-----------|---------------|
| **LOADING** | Carregando status | Spinner animado |
| **DISCONNECTED** | Sem sessão ativa | Ícone QR Code esmaecido + mensagem |
| **STARTING** | Iniciando motor | Loader azul + "Iniciando motor na VPS..." |
| **SCANNING** | Aguardando QR Code | QR Code exibido para escanear |
| **CONNECTED** | WhatsApp conectado | Ícone smartphone verde + mensagem de sucesso |

#### ✅ Teste 1: Iniciar Sessão

1. Status inicial deve ser **DISCONNECTED**
2. Clique em "Criar/Iniciar Sessão"
3. Status muda para **STARTING** (aguarde até 30 segundos)
4. Status muda para **SCANNING**
5. QR Code deve aparecer automaticamente
6. Escaneie o QR Code com seu WhatsApp
7. Status muda para **CONNECTED**

#### ✅ Teste 2: Verificar Persistência

1. Com WhatsApp **CONNECTED**, recarregue a página
2. Status deve permanecer **CONNECTED**
3. Não deve pedir novo QR Code

#### ✅ Teste 3: Reiniciar Motor

1. Com status **CONNECTED**, clique em "Reiniciar Motor"
2. Motor para e reinicia
3. Status volta para **CONNECTED** automaticamente

#### ✅ Teste 4: Desconectar Conta

1. Clique em "Desconectar Conta"
2. Confirme a ação
3. WhatsApp desconecta
4. Status volta para **DISCONNECTED**
5. Próxima conexão vai pedir novo QR Code

#### 🎯 Resultado Esperado:
- ✅ Polling automático funciona (atualiza status a cada 5s)
- ✅ QR Code aparece automaticamente quando necessário
- ✅ Sessão é única por empresa (company_{company_id})
- ✅ Botões desabilitam em estados incorretos

---

### Passo 4: Testar Sessões Múltiplas (Multi-tenant)

Se você tiver acesso a múltiplas empresas:

1. **Empresa A**
   - Conecte o WhatsApp da Empresa A
   - Veja que a sessão se chama `company_{id_empresa_a}`

2. **Empresa B**
   - Faça login com usuário da Empresa B
   - Conecte outro WhatsApp (diferente da Empresa A)
   - Sessão se chama `company_{id_empresa_b}`

3. **Verificar Isolamento**
   - Volte para Empresa A: deve estar conectada
   - Volte para Empresa B: deve estar conectada
   - Cada empresa mantém sua própria sessão

---

## 🐛 Possíveis Problemas e Soluções

### ❌ Backend não inicia

**Solução:**
```bash
sudo supervisorctl status backend
tail -n 50 /var/log/supervisor/backend.err.log
```

### ❌ QR Code não aparece

**Verificar:**
1. URL do WAHA está correta no .env?
2. WAHA_MASTER_KEY está correto?
3. Verificar logs do backend

### ❌ Erro ao salvar chave SERP API

**Verificar:**
1. Usuário está autenticado?
2. company_id está presente?
3. Tabela company_settings existe no Supabase?
4. RLS policies estão corretas?

### ❌ Status sempre fica em LOADING

**Verificar:**
1. Endpoint `/api/whatsapp/status` está respondendo?
2. company_id está sendo enviado?
3. Console do navegador tem erros?

---

## 📊 Endpoints da API (Para Debug)

### Verificar Status do Sistema
```bash
curl http://localhost:8001/api/
# Resposta esperada: {"message":"Lead Dispatcher API","version":"2.2.0","mode":"SaaS Hybrid"}
```

### Verificar Status WhatsApp
```bash
curl "http://localhost:8001/api/whatsapp/status?company_id=SEU_COMPANY_ID"
# Resposta: {"status":"CONNECTED","connected":true,"session_name":"company_SEU_COMPANY_ID"}
```

---

## ✅ Checklist Final

Antes de dar como concluído, verifique:

- [ ] Backend rodando sem erros
- [ ] Frontend carrega página Settings sem erros
- [ ] Card SERP API aparece e funciona
- [ ] Card WhatsApp aparece e funciona
- [ ] Consegue salvar chave SERP API
- [ ] Badge SERP API atualiza corretamente
- [ ] Consegue iniciar sessão WhatsApp
- [ ] QR Code aparece automaticamente
- [ ] Consegue conectar WhatsApp
- [ ] Status atualiza sozinho (polling)
- [ ] Consegue desconectar WhatsApp
- [ ] Sessão persiste após reload

---

## 🚀 Próximos Passos

Após validar que tudo está funcionando:

1. **Teste em produção** com dados reais
2. **Monitore logs** para identificar problemas
3. **Documente** qualquer comportamento inesperado
4. **Considere adicionar**:
   - Validação de formato da chave SERP API
   - Teste de conexão SERP API
   - Histórico de conexões WhatsApp
   - Notificações quando WhatsApp desconectar

---

## 📞 Suporte

Se encontrar algum problema:
1. Verifique logs do backend
2. Verifique console do navegador (F12)
3. Teste os endpoints diretamente via curl
4. Verifique se as variáveis de ambiente estão corretas

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Status:** ✅ Pronto para testes
