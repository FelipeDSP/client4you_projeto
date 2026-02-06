# Client4You / Lead Dispatcher - PRD (Product Requirements Document)

## 📋 Visão Geral
Plataforma SaaS para captação e conversão de leads via WhatsApp.

**Stack Técnico:**
- Frontend: React + TypeScript + Vite + TailwindCSS + Shadcn/UI
- Backend: FastAPI (Python)
- Banco de Dados: Supabase (PostgreSQL)
- Integração WhatsApp: WAHA (WhatsApp HTTP API)
- Pagamentos: Kiwify (webhooks)

---

## 👥 User Personas

### 1. Empreendedor/Vendedor (Usuário Final)
- Busca leads qualificados para seu negócio
- Precisa de ferramenta para disparar mensagens em massa
- Quer automatizar atendimento inicial

### 2. Administrador da Plataforma
- Gerencia usuários e planos
- Monitora uso do sistema
- Resolve problemas de suporte

---

## 🎯 Core Requirements (Estáticos)

### Funcionalidades Principais
1. **Extrator de Leads** - Busca leads do Google Maps por segmento/localização
2. **Disparador WhatsApp** - Envio de mensagens em massa com intervalos
3. **Agente IA** - Resposta automática inteligente (em desenvolvimento)
4. **Gestão de Campanhas** - Criar, pausar, cancelar campanhas
5. **Dashboard** - Métricas em tempo real

### Sistema de Planos
| Plano | Leads | Disparador | Agente IA | Preço |
|-------|-------|------------|-----------|-------|
| Demo | 5 buscas | ❌ | ❌ | Grátis (7 dias) |
| Básico | Ilimitado | ❌ | ❌ | R$ 39,90/mês |
| Intermediário | Ilimitado | ✅ Ilimitado | ❌ | R$ 99,90/mês |
| Avançado | Ilimitado | ✅ Ilimitado | ✅ | R$ 199,90/mês |

### Segurança
- Autenticação JWT via Supabase Auth
- Verificação de assinatura HMAC nos webhooks
- Rate limiting nos endpoints
- Row Level Security (RLS) no banco

---

## ✅ O que foi Implementado (06/02/2026)

### Controle de Acesso por Plano
- [x] Hook `usePlanPermissions` - verifica permissões do usuário
- [x] Componente `PlanBlockedOverlay` - tela de bloqueio com upgrade
- [x] Verificação de expiração de plano no backend
- [x] Sidebar com ícones de cadeado para features bloqueadas
- [x] Alerta de expiração próxima no Dashboard

### Página Agente IA
- [x] Página criada (`/agente-ia`)
- [x] Configurações de personalidade
- [x] Editor de prompt do sistema
- [x] Configurações de comportamento (delay, tamanho resposta)
- [x] Qualificação automática de leads
- [x] Horário de funcionamento
- [x] Status: Beta (integração n8n pendente)

### Sistema de Pagamentos (Kiwify)
- [x] Webhook para `order.paid` - upgrade automático
- [x] Webhook para `order.refunded` - downgrade
- [x] Webhook para `subscription.canceled` - downgrade
- [x] Criação automática de conta ao pagar
- [x] Email com credenciais para novos usuários

---

## 📝 Backlog Priorizado

### P0 (Crítico)
- [ ] Integração n8n para Agente IA
- [ ] Job de verificação de planos expirados (cron)
- [ ] Webhook de renovação mensal do Kiwify

### P1 (Importante)
- [ ] Página de preços/planos pública
- [ ] Histórico de pagamentos no perfil
- [ ] Notificação por email X dias antes de expirar
- [ ] Múltiplas instâncias WhatsApp (plano Avançado)

### P2 (Melhoria)
- [ ] Teste A/B de mensagens
- [ ] Relatórios exportáveis (PDF)
- [ ] Integração com CRMs
- [ ] API pública com documentação

---

## 🔗 Links de Pagamento (Kiwify)
- Básico: https://pay.kiwify.com.br/FzhyShi
- Intermediário: https://pay.kiwify.com.br/YlIDqCN
- Avançado: https://pay.kiwify.com.br/TnUQl3f

---

## 📊 Próximas Tarefas

1. Configurar webhook de renovação no Kiwify
2. Implementar integração n8n para Agente IA
3. Criar job de expiração automática de planos
4. Adicionar página de histórico de pagamentos
