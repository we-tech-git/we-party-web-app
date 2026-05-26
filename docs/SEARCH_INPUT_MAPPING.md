# Mapeamento de Inputs de Busca

## Visão Geral

Este documento mapeia todos os inputs de busca presentes no sistema we-party-web-app, documentando suas localizações, comportamentos e estilos atuais.

---

## Status da Padronização

✅ **CONCLUÍDO** - Todos os inputs de busca foram padronizados usando o componente `SearchInput.vue`.

### Componente Padrão Criado

**Localização:** `src/components/UI/SearchInput/SearchInput.vue`

**Props:**

- `modelValue` (string): valor do input (v-model)
- `placeholder` (string): texto do placeholder (padrão: "Buscar...")
- `loading` (boolean): exibe indicador de carregamento
- `clearable` (boolean): exibe botão de limpar (padrão: true)
- `debounce` (number): tempo de debounce em ms (padrão: 500)
- `disabled` (boolean): desabilita o input
- `size` ('small' | 'medium' | 'large'): tamanho do input (padrão: 'medium')

**Emits:**

- `update:modelValue`: atualização do valor
- `search`: disparado após debounce com o valor atual
- `clear`: disparado ao limpar o campo

### Características Visuais Padronizadas

- **Border-radius:** 12px (10px para small, 16px para large)
- **Border:** 1.5px solid #e0e2ed
- **Background:** #fafbfc (focus: white)
- **Focus:** border-color #ff5fa6, box-shadow rgba(255, 95, 166, 0.1)
- **Font-size:** 0.9rem (varia por tamanho)
- **Ícone de lupa:** SVG à esquerda
- **Botão limpar:** À direita quando há texto

### Comportamento Funcional Padronizado

- **Debounce:** 500ms (configurável)
- **Tecla Enter:** Busca imediata
- **Loading:** Indicador de spinner no ícone
- **Clear:** Botão de limpar visível quando há texto

---

## Inputs de Busca Padronizados

### 1. AddFriends.vue - Busca de Usuários (Cadastro)

**Localização:** `src/components/modules/AddFriends/AddFriends.vue`

**Mudanças Aplicadas:**

- ✅ Substituído input customizado por `<SearchInput>`
- ✅ Removido debounce manual (agora interno ao componente)
- ✅ Criados handlers `handleSearch` e `handleClearSearch`
- ✅ Removidos estilos CSS obsoletos

---

### 2. Interest.vue - Busca de Interesses (Cadastro)

**Localização:** `src/components/modules/interest/Interest.vue`

**Mudanças Aplicadas:**

- ✅ Substituído input customizado por `<SearchInput>`
- ✅ Removido debounce manual e watch
- ✅ Criados handlers `handleSearch` e `handleClearSearch`
- ✅ Removidos estilos CSS obsoletos

---

### 3. Feed.vue - Busca de Eventos

**Localização:** `src/components/modules/Feed/Feed.vue`

**Mudanças Aplicadas:**

- ✅ Substituído input customizado por `<SearchInput>` com `size="large"`
- ✅ Removido debounce manual
- ✅ Criados handlers `handleSearch` e `handleClearSearch`
- ✅ Customização via CSS `:deep()` para shadow e border-radius específicos do feed

---

### 4. Profile.vue - Busca de Usuários (Recomendações)

**Localização:** `src/components/modules/Profile/Profile.vue` (sidebar)

**Mudanças Aplicadas:**

- ✅ Substituído input customizado por `<SearchInput>` com `size="small"`
- ✅ Removido debounce manual e watch
- ✅ Criados handlers `handleUserSearch` e `handleClearUserSearch`
- ✅ Removidos estilos CSS obsoletos

---

### 5. Profile.vue - Busca de Interesses (Modal)

**Localização:** `src/components/modules/Profile/Profile.vue` (modal de interesses)

**Mudanças Aplicadas:**

- ✅ Substituído input customizado por `<SearchInput>`
- ✅ Removido debounce manual (função renomeada para `handleInterestsSearch`)
- ✅ Criado handler `handleClearInterestsSearch`
- ✅ Removidos estilos CSS obsoletos

---

## Arquivos Modificados

1. `src/components/UI/SearchInput/SearchInput.vue` - **CRIADO**
2. `src/components/modules/AddFriends/AddFriends.vue` - **MODIFICADO**
3. `src/components/modules/interest/Interest.vue` - **MODIFICADO**
4. `src/components/modules/Feed/Feed.vue` - **MODIFICADO**
5. `src/components/modules/Profile/Profile.vue` - **MODIFICADO**

---

## Benefícios da Padronização

1. **Consistência Visual:** Todos os inputs de busca têm aparência idêntica
2. **Comportamento Uniforme:** Debounce de 500ms em todos os inputs
3. **Manutenibilidade:** Mudanças de estilo feitas em um único lugar
4. **Reutilização:** Componente pode ser usado em novos contextos
5. **Acessibilidade:** Suporte a teclado (Enter para busca imediata)
6. **Performance:** Debounce evita requisições desnecessárias
7. **UX Consistente:** Feedback visual de loading e botão de limpar padronizados

---

_Documento atualizado em: 23/05/2026_
