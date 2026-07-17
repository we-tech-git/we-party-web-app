# 🚦 Rate Limiting, Debounce & Throttle — Guia Técnico

Guia de referência para os padrões de debounce, throttle, cancelamento de
requisições e prevenção de ações duplicadas usados no projeto. Resultado da
auditoria técnica de jul/2026 (ver histórico no final deste documento).

## 📖 Diferença entre os quatro mecanismos

| Mecanismo | O que faz | Quando usar |
|---|---|---|
| **Debounce** | Espera o usuário **parar** de disparar o evento antes de agir | Busca ao digitar, validação, autosave |
| **Throttle** | Limita a frequência de execução em um evento **contínuo** | Scroll, resize, mousemove com trabalho pesado |
| **Guard de reentrância** | Bloqueia uma ação assíncrona enquanto ela já está em andamento | Cliques duplicados, submits duplicados |
| **Rate limiting** | Limita o número de ações em uma janela de tempo | Proteção anti-brute-force (login), APIs pagas/externas |

⚠️ **Rate limiting no frontend é sempre UX, nunca segurança.** Qualquer
controle feito em `localStorage`/memória do navegador é trivialmente
burlável (basta limpar o storage). A proteção real contra brute-force,
spam ou abuso de API precisa existir no backend.

## 🎯 Constantes centrais

Todos os tempos usados nos fluxos abaixo vêm de
[`src/constants/timing.ts`](../src/constants/timing.ts) — fonte única de
verdade, para não haver valores divergentes espalhados pelo código.

| Constante | Valor | Uso |
|---|---|---|
| `SEARCH_DEBOUNCE_MS` | 500ms | Debounce de busca ao digitar |
| `SCROLL_THROTTLE_MS` | 100ms | Throttle de listeners de `scroll` |
| `RESIZE_THROTTLE_MS` | 150ms | Throttle de listeners de `resize` |
| `RESEND_COOLDOWN_S` | 60s | Cooldown de reenvio de PIN/código |
| `HTTP_RETRY_MAX` | 2 | Tentativas máximas de retry HTTP (não ativado ainda — ver Pendências) |
| `HTTP_RETRY_BASE_MS` | 500ms | Base do backoff exponencial de retry |

## 🔍 Debounce — busca ao digitar

Implementação manual (`setTimeout`/`clearTimeout`), sem biblioteca externa,
lendo o tempo de `SEARCH_DEBOUNCE_MS`:

```typescript
import { SEARCH_DEBOUNCE_MS } from '@/constants/timing'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function handleInput(value: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchSuggestions(value)
  }, SEARCH_DEBOUNCE_MS)
}
```

**Onde está em uso:**
- `src/components/UI/SearchInput/SearchInput.vue` (componente reutilizável de busca)
- `src/components/modules/Feed/EventSearchAutocomplete.vue`
- Consumido por: `Feed.vue`, `AddFriends.vue`, `Profile.vue` (busca de usuários e interesses)

Sempre limpar o timer em `onBeforeUnmount` para evitar callback disparando
após o componente ser desmontado.

## ⏱️ Throttle — eventos contínuos

Usa `useThrottleFn` do `@vueuse/core` (já é dependência do projeto —
nenhuma instalação nova foi necessária):

```typescript
import { useThrottleFn } from '@vueuse/core'
import { SCROLL_THROTTLE_MS } from '@/constants/timing'

const throttledOnScroll = useThrottleFn(() => {
  navSolid.value = window.scrollY > 40
}, SCROLL_THROTTLE_MS)

window.addEventListener('scroll', throttledOnScroll, { passive: true })
```

**Onde está em uso:**
- `src/components/modules/Feed/NewEventDetails.vue` — `onScroll` (estado da nav bar)
- `src/components/modules/Landingpage/LandingPage.vue` — `handleResize` (recálculo de câmera/renderer Three.js)

**Não throttled de propósito:** `handleMouseMove` na LandingPage apenas grava
`mouseX`/`mouseY`, consumidos por um loop `requestAnimationFrame` — esse já
é o padrão correto para eventos que alimentam uma animação; throttle ali
seria contraproducente.

## 🛑 Guard de reentrância — cliques e submits duplicados

Padrão manual usado de forma consistente no projeto, sem necessidade de
abstração adicional:

```typescript
const isSubmitting = ref(false)

async function handleSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    await api.submit()
  } finally {
    isSubmitting.value = false
  }
}
```

O botão de submit deve sempre usar `:disabled="isSubmitting"` — isso cobre
cliques repetidos, mas **não cobre Enter em formulários com
`@submit.prevent`**, por isso o guard explícito no início da função
continua necessário mesmo com o botão desabilitado.

**Onde está em uso:** `Login.vue`, `Signup.vue`, `RequestPassword.vue`,
`InlineComments.vue` (`sending`, `deletingId`), `Profile.vue`
(`isFetchingProfile`, guarda contra fetch duplicado por remontagem).

## ✂️ Cancelamento de requisições (AbortController)

Buscas disparadas por debounce podem ter respostas que chegam **fora de
ordem** (ex.: resposta de `"a"` chegando depois da de `"abc"`). Para isso,
`callApi` (`src/api/index.ts`) aceita um `signal?: AbortSignal` opcional,
repassado ao Axios:

```typescript
let ctrl: AbortController | null = null

async function fetchSuggestions(query: string) {
  ctrl?.abort()
  ctrl = new AbortController()
  try {
    const resp = await searchByEvents(query, 1, 6, ctrl.signal)
    // ...
  } catch (error) {
    if (isRequestCanceled(error)) return // requisição substituída, ignora
    // tratar erro real
  }
}
```

`isRequestCanceled()` (exportado de `src/api/index.ts`) identifica erros de
cancelamento para que não sejam tratados como falha real nem exibidos ao
usuário.

**Onde está em uso:** `EventSearchAutocomplete.vue`, `Feed.vue`
(`handleSearch`), `AddFriends.vue` (`performSearch`), `Profile.vue`
(`handleInterestsSearch`).

## 🔐 Rate limiting anti-brute-force (disponível, não ativado)

`src/composables/useRateLimit.ts` implementa um limitador baseado em
`localStorage` (tentativas por janela de tempo + bloqueio temporário),
pensado originalmente para o fluxo de login:

```typescript
import { useRateLimit } from '@/composables/useRateLimit'

const loginRateLimit = useRateLimit('login', {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
})
```

**Por que não está plugado no login hoje:** é burlável (basta limpar o
`localStorage`) e, se usado sozinho, pode **bloquear usuários legítimos**
sem entregar proteção real. A decisão foi mantê-lo disponível no
repositório, documentado, para uso consciente futuro — sem ativá-lo até que
exista uma justificativa de UX clara e, idealmente, complementado por rate
limiting real no backend.

## 📜 Histórico da auditoria (jul/2026)

| Checkpoint | O que foi feito | Status |
|---|---|---|
| 0 | Criação de `src/constants/timing.ts` | ✅ |
| 1 | Debounce de busca unificado em `SEARCH_DEBOUNCE_MS` (500ms) nos 4 pontos de busca | ✅ |
| 2 | Decisão: `useThrottle.ts` (código morto, 0 imports) removido; `useRateLimit.ts` mantido inativo | ✅ |
| 3 | `AbortController` propagado por `callApi` e pelos 4 fluxos de busca | ✅ |
| 4 | Interceptor HTTP para `429`/`Retry-After`/backoff | ⏸️ Adiado |
| 5 | Throttle em `NewEventDetails.onScroll` e `LandingPage.handleResize` via `useThrottleFn` | ✅ |
| 6 | Guard de reentrância adicionado em `RequestPassword.vue` | ✅ |
| 7 | Esta documentação | ✅ |

## ⚠️ Pendências conhecidas

- **Interceptor HTTP 429/Retry-After/backoff** (Checkpoint 4) — ainda não
  implementado. `HTTP_RETRY_MAX`/`HTTP_RETRY_BASE_MS` já existem em
  `constants/timing.ts` para quando isso for retomado.
- **Vazamento de listeners na LandingPage** — os listeners `resize` e
  `mousemove` do canvas 3D (Three.js) nunca são removidos em
  `onUnmounted`. Baixa severidade (a página normalmente não é
  montada/desmontada repetidamente), mas vale corrigir.
- **Rate limiting real** depende de um backend, que não existe neste
  repositório. Qualquer garantia de proteção contra brute-force, spam ou
  abuso de API precisa ser verificada e implementada no serviço de backend
  — não pode ser assumida a partir do que existe no frontend.
