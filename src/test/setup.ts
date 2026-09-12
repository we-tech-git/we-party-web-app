import { vi } from 'vitest'

// `src/router/index.ts` usa módulos virtuais do unplugin-vue-router /
// vite-plugin-vue-layouts-next (rotas file-based), que só existem no
// build real da aplicação — não fazem sentido pra o ambiente de teste, e
// `@/api/index.ts` importa o router só pra redirecionar em 401. Mockado
// globalmente aqui porque qualquer teste que monte um componente ligado
// a `@/api` (direta ou indiretamente) esbarra nisso.
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    replace: vi.fn(),
    currentRoute: { value: { path: '/' } },
  },
}))

// jsdom não implementa matchMedia (usado pelo GSAP/ScrollTrigger e por
// composables que checam display-mode de PWA) — polyfill padrão, sem
// ele qualquer componente que registre o ScrollTrigger quebra o mount.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// jsdom também não implementa IntersectionObserver/ResizeObserver — usados
// por efeitos de scroll (ex.: header que solidifica ao rolar) e por
// componentes que medem o próprio tamanho. Stubs no-op: não precisamos que
// disparem de verdade, só que a chamada `new IntersectionObserver(...)`
// não derrube o mount.
class ObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}
vi.stubGlobal('IntersectionObserver', ObserverStub)
vi.stubGlobal('ResizeObserver', ObserverStub)
