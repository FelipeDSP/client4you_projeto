# 🎨 Brand Identity - Leads4you

## Nova Paleta de Cores

### Cores Principais

#### 🟠 LARANJA (Cor Predominante)
- **Hex**: `#FFAA00`
- **HSL**: `hsl(40, 100%, 50%)`
- **Uso**: Botões primários, CTAs, destaques, links importantes
- **Significado**: Energia, entusiasmo, ação, criatividade

#### 🔵 AZUL (Cor Secundária)
- **Hex**: `#0066CC`
- **HSL**: `hsl(210, 100%, 40%)`
- **Uso**: Sidebar, elementos de navegação, accents
- **Significado**: Confiança, profissionalismo, estabilidade

#### 🟢 VERDE (Cor de Suporte)
- **Hex**: `#33CC33`
- **HSL**: `hsl(120, 100%, 40%)`
- **Uso**: Indicadores de sucesso, status ativo, badges positivos
- **Significado**: Crescimento, sucesso, progresso

---

## Aplicação das Cores

### Botões
- **Primários**: Laranja gradiente (`#FF8C00` → `#FFAA00` → `#FFC300`)
- **Secundários**: Verde
- **Terciários/Outline**: Azul

### Sidebar
- **Background**: Azul escuro profissional
- **Item ativo**: Laranja
- **Hover**: Azul mais claro

### Cards e Elementos
- **Background**: Branco/Cinza claro
- **Bordas**: Cinza suave com toque de laranja
- **Sombras**: Laranja suave para elementos em destaque

### Ícones e Badges
- **Ativo/Online**: Verde
- **Destaque**: Laranja
- **Informação**: Azul
- **Erro**: Vermelho (padrão)

---

## Logo

### Arquivos
- **Caminho**: `/frontend/public/leads4you-logo.png`
- **Formato**: PNG com transparência
- **Cores**: Azul (led) + Verde (4) + Laranja (you)

### Uso
- **Sidebar**: Altura 32px (collapsible: 24px)
- **Login**: Altura 80px
- **Favicon**: Já configurado

---

## Gradientes

### Background Login
```css
bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950
```

### Radial Overlays
```css
radial-gradient(circle at 30% 20%, rgba(255,170,0,0.15), transparent 50%)
radial-gradient(circle at 70% 80%, rgba(0,102,204,0.1), transparent 50%)
```

### Botão Primário
```css
from-[#FF8C00] via-[#FFAA00] to-[#FFC300]
hover: from-[#FF7700] via-[#FF9500] to-[#FFB800]
```

---

## Arquivos Modificados

### CSS/Estilo
- ✅ `/frontend/src/index.css` - Variáveis de cor atualizadas
- ✅ `/frontend/tailwind.config.ts` - Configuração mantida (usa CSS vars)

### Componentes
- ✅ `/frontend/src/components/AppSidebar.tsx` - Logo implementada
- ✅ `/frontend/src/pages/Login.tsx` - Logo + gradientes laranja

### Assets
- ✅ `/frontend/public/leads4you-logo.png` - Logo atualizada sem fundo

### Configuração
- ✅ `/frontend/package.json` - Nome: "leads4you" v1.0.0
- ✅ `/frontend/index.html` - Já estava com "Leads4You"

---

## Guidelines de Uso

### Quando usar LARANJA 🟠
- Todos os botões de ação principal (Entrar, Criar, Salvar, Buscar)
- Links importantes e CTAs
- Indicadores de atividade/progresso
- Elementos que exigem atenção do usuário

### Quando usar AZUL 🔵
- Navegação e estrutura (sidebar, headers)
- Links secundários
- Elementos informativos
- Ícones de ferramenta/configuração

### Quando usar VERDE 🟢
- Status de sucesso
- Indicadores "online"/"ativo"
- Confirmações positivas
- Estatísticas positivas

---

## Próximos Passos Recomendados

1. **Testar em todas as páginas** - Verificar consistência visual
2. **Adicionar hover states** - Garantir feedback visual em todas as interações
3. **Criar variações** - Logo monocromática (branca/preta) para casos específicos
4. **Documentar componentes** - Criar storybook ou guia de componentes UI
5. **Acessibilidade** - Testar contraste de cores (WCAG)

---

## Resumo da Identidade

**Leads4you** é uma marca que transmite:
- 🔥 **Energia e ação** (Laranja predominante)
- 🤝 **Confiança e profissionalismo** (Azul estrutural)
- 📈 **Crescimento e resultados** (Verde de suporte)

A combinação das três cores cria uma identidade visual moderna, energética e confiável, perfeita para uma ferramenta de geração de leads.
