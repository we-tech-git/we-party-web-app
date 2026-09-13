import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createTestVuetify } from '@/test/vuetify'
import Feed from './Feed.vue'

// Teste de regressão da Fase 4 (REFACTOR_AUDIT_PLAN.md) — comportamento
// visível ao usuário, não implementação: escrito ANTES de decompor
// Feed.vue na Fase 5, pra pegar quebra durante a extração de
// componentes/composables, não pra documentar como o arquivo é hoje por
// dentro.

vi.mock('@/api/event', () => ({
  getAllEvents: vi.fn().mockResolvedValue({ data: [] }),
  getAllPublicEvents: vi.fn().mockResolvedValue({ data: [] }),
  getEventRecomendations: vi.fn().mockResolvedValue({ data: [] }),
  getEventsToday: vi.fn().mockResolvedValue({ data: [] }),
  getFavoriteEvents: vi.fn().mockResolvedValue({ data: [] }),
  getPublicEventRecomendations: vi.fn().mockResolvedValue({ data: [] }),
  getPublicEventsToday: vi.fn().mockResolvedValue({ data: [] }),
  getPublicTrendingEvents: vi.fn().mockResolvedValue({ data: [] }),
  getTrendingEvents: vi.fn().mockResolvedValue({ data: [] }),
  searchByEvents: vi.fn().mockResolvedValue({ data: [] }),
  searchPublicEvents: vi.fn().mockResolvedValue({ data: [] }),
}))

vi.mock('@/api/users', () => ({
  getUserInterests: vi.fn().mockResolvedValue({ data: [] }),
  getUserProfile: vi.fn().mockResolvedValue({ data: null }),
}))

function mountFeed (props: Record<string, unknown> = {}) {
  const vuetify = createTestVuetify()
  const i18n = createI18n({
    legacy: false,
    locale: 'pt-BR',
    messages: {
      'pt-BR': {
        feed: {
          searchPlaceholder: 'Buscar eventos...',
          nav: { home: 'Início', topEvents: 'Top eventos', favorites: 'Favoritos', profile: 'Perfil' },
        },
      },
    },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/feed', component: { template: '<div />' } },
      { path: '/profile', component: { template: '<div />' } },
      { path: '/Login', component: { template: '<div />' } },
    ],
  })

  return mount(Feed, {
    props: { guestMode: true, ...props },
    global: {
      plugins: [vuetify, i18n, router],
    },
  })
}

describe('Feed', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('monta sem lançar erro em modo guest', () => {
    expect(() => mountFeed()).not.toThrow()
  })

  it('renderiza o header único do app (AppHeader)', () => {
    const wrapper = mountFeed()
    expect(wrapper.find('header.feed-top-header').exists()).toBe(true)
  })

  it('mostra os botões de entrar/cadastro no modo guest', () => {
    const wrapper = mountFeed({ guestMode: true })
    expect(wrapper.text()).toContain('Entrar')
  })

  it('não lança erro ao trocar o modo guest em runtime', async () => {
    const wrapper = mountFeed({ guestMode: true })
    await wrapper.setProps({ guestMode: false })
    expect(wrapper.exists()).toBe(true)
  })
})
