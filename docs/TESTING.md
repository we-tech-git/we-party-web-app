# Testes — We Party Web App

Documento vivo criado na Fase 7 do `REFACTOR_AUDIT_PLAN.md`. Cobre **onde e
como escrever teste neste repositório**. Para a divisão de responsabilidade
com testes E2E, ver a última seção.

## Stack

- **Vitest** (`vitest.config.ts`, na raiz) — test runner.
- **`@vue/test-utils`** — montagem de componente.
- **`jsdom`** — ambiente DOM simulado (config `environment: 'jsdom'`).
- **`src/test/setup.ts`** — setup global, carregado antes de cada arquivo de
  teste (ver abaixo).
- **`src/test/vuetify.ts`** — helper `createTestVuetify()` pra registrar o
  Vuetify inteiro em teste.

Rodar a suíte:

```bash
yarn test         # vitest run
```

## Onde colocar o teste

Arquivo `*.spec.ts` **ao lado do arquivo testado**, não em uma pasta
`__tests__/` separada — é o padrão já usado pelos 5 specs existentes:

```
src/utils/avatar.spec.ts
src/components/modules/Profile/Profile.spec.ts
src/components/modules/Feed/Feed.spec.ts
src/components/modules/Feed/NewEventDetails.spec.ts
src/components/modules/Landingpage/LandingPage.spec.ts
```

`vitest.config.ts` inclui `src/**/*.spec.ts`, então qualquer novo arquivo
nesse padrão é pego automaticamente.

## Dois tipos de teste neste repo

### 1. Teste de função pura (util/composable sem DOM)

Mais simples e mais rápido — sem `mount`, sem Vuetify/router/i18n. Exemplo
real, `src/utils/avatar.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getInitials } from './avatar'

describe('getInitials', () => {
  it('retorna a inicial única para nome de uma palavra', () => {
    expect(getInitials('Maria')).toBe('M')
  })
})
```

Prefira este formato sempre que a lógica puder ser extraída pra uma função
pura (ver critério de extração de composable no `REFACTOR_AUDIT_PLAN.md`,
Fase 4) — é mais barato de escrever e de manter do que montar componente só
pra testar uma regra de formatação/derivação de dado.

### 2. Teste de componente (mount)

Para telas/componentes com template, estado e integração com store/router.
Monta o componente de verdade com `@vue/test-utils`, registrando o que o
app real registra em produção (Vuetify, i18n, router, Pinia), e mocka só o
que cruza a borda de rede (`@/api/*`). Ver `Feed.spec.ts`,
`NewEventDetails.spec.ts`, `Profile.spec.ts`, `LandingPage.spec.ts` como
referência de estrutura:

```ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createTestVuetify } from '@/test/vuetify'
import MeuComponente from './MeuComponente.vue'

vi.mock('@/api/event', () => ({
  getAllEvents: vi.fn().mockResolvedValue({ data: [] }),
}))

function mountMeuComponente (props = {}) {
  return mount(MeuComponente, {
    props,
    global: {
      plugins: [createTestVuetify(), createPinia(), /* i18n, router */],
    },
  })
}
```

Pontos importantes, todos resolvidos centralmente em `src/test/setup.ts` —
**não reinvente por arquivo de teste**:

- `@/router` é mockado globalmente (rotas file-based não existem fora do
  build real; qualquer coisa que puxe `@/api` indiretamente esbarra nisso).
- `window.matchMedia`, `IntersectionObserver` e `ResizeObserver` são
  stubados globalmente (jsdom não implementa; GSAP/ScrollTrigger e
  composables de scroll/tamanho dependem deles pra montar sem erro).

Se um teste novo precisar de um router de verdade (navegação dentro do
teste), crie um local com `createRouter({ history: createMemoryHistory() })`
como em `Feed.spec.ts` — o mock global em `setup.ts` continua valendo pra
qualquer import indireto de `@/router` fora desse teste.

### O que testar em componente: comportamento visível, não implementação

Os specs de `Feed`/`NewEventDetails`/`LandingPage`/`Profile` foram escritos
**antes** da decomposição desses arquivos na Fase 5, como teste de
regressão — cobrindo o que o usuário vê/pode fazer, não a estrutura interna
do arquivo. Um componente extraído (ex.: `EventFaqAccordion.vue`) pode
ganhar seu próprio spec focado só nele quando fizer sentido, mas o
spec do componente-pai não deve quebrar por causa da extração em si — se
quebrar, é sinal de que o teste estava acoplado a implementação, não a
comportamento.

## Quando adicionar cobertura

Este documento não estabelece meta de cobertura (%) nem "teste obrigatório
pra todo PR" — ver `REFACTOR_AUDIT_PLAN.md`, Fase 4/checklist "Antes de
abrir PR" em `AGENTS.md`. Na prática:

- Composable/util novo com lógica não trivial → teste de função pura.
- Componente com bug de regressão real (comportamento quebrou sem que
  nenhum teste pegasse) → bom candidato a virar spec, pra não regredir de
  novo.
- Extração de componente (padrão desta refatoração) → rodar
  `yarn test`/`yarn lint`/`yarn build` como gate antes do PR; não é
  exigido escrever spec novo só por ter movido template pra outro arquivo.

## Divisão com testes E2E

Testes end-to-end (fluxo completo, navegador real, múltiplas telas) **não**
vivem neste repositório — vivem em
[`weparty-automation`](../../weparty-automation), com Cypress. Essa é a
regra transversal 3.0 do `REFACTOR_AUDIT_PLAN.md`: componentes aqui expõem
`data-testid` estável (convenção: kebab-case prefixado pelo
componente/tela, ex. `feed-card-like`) para esses testes selecionarem
elemento, mas a suíte E2E em si, os Page Objects e os fixtures ficam no
outro repositório — ver `weparty-automation/AGENTS.md`.
