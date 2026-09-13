import type * as ApiComments from '@/api/comments'
import type * as ApiEvent from '@/api/event'
import type * as ApiFollows from '@/api/follows'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createTestVuetify } from '@/test/vuetify'
import NewEventDetails from './NewEventDetails.vue'

// Teste de regressão da Fase 4 (REFACTOR_AUDIT_PLAN.md) — comportamento
// visível, escrito ANTES de decompor NewEventDetails.vue na Fase 5.
// (É o arquivo que herdou o header único na Fase 1 — ver AppHeader abaixo.)

const { loggedUserRef, fakeEvent } = vi.hoisted(() => ({
  loggedUserRef: { value: null as null | { id: string, name: string, profileImage: string, email: string } },
  fakeEvent: {
    id: 'ev1',
    title: 'Festa de Réveillon',
    description: 'Uma festa incrível',
    banner: '',
    schedule: new Date().toISOString(),
    location: 'Copacabana',
    likes: 10,
    confirmed: 5,
    organizer: { id: 'org1', name: 'Organizador Teste', profileImage: '' },
  },
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    loggedUser: loggedUserRef,
    userDisplayName: { value: loggedUserRef.value?.name ?? '' },
  }),
}))

// Mocks parciais (importOriginal + overrides): componentes filhos
// (InlineComments etc.) usam outras funções destes módulos que este teste
// nunca chega a exercitar — sobrescrever só o necessário evita ficar
// listando toda função nova que outro dev adicionar no arquivo real.
vi.mock('@/api/event', async importOriginal => {
  const actual = await importOriginal<typeof ApiEvent>()
  return {
    ...actual,
    getEventById: vi.fn().mockResolvedValue({ data: fakeEvent }),
    getMyAttendance: vi.fn().mockResolvedValue({ data: null }),
    getTrendingEvents: vi.fn().mockResolvedValue({ data: [] }),
    getLikedEvents: vi.fn().mockResolvedValue({ data: [] }),
    getFavoriteEvents: vi.fn().mockResolvedValue({ data: [] }),
  }
})

vi.mock('@/api/comments', async importOriginal => {
  const actual = await importOriginal<typeof ApiComments>()
  return {
    ...actual,
    getEventComments: vi.fn().mockResolvedValue({ data: [] }),
  }
})

vi.mock('@/api/follows', async importOriginal => {
  const actual = await importOriginal<typeof ApiFollows>()
  return {
    ...actual,
    checkIsFollowing: vi.fn().mockResolvedValue({ data: { isFollowing: false } }),
    followUserById: vi.fn().mockResolvedValue({ data: {} }),
    unfollowUserById: vi.fn().mockResolvedValue({ data: {} }),
  }
})

function mountNewEventDetails (props: Record<string, unknown> = {}) {
  const vuetify = createTestVuetify()
  const i18n = createI18n({ legacy: false, locale: 'pt-BR', messages: { 'pt-BR': {} } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/feed', component: { template: '<div />' } },
      { path: '/profile', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })

  return mount(NewEventDetails, {
    props: { eventId: 'ev1', ...props },
    global: {
      plugins: [vuetify, i18n, router],
    },
  })
}

async function flushMountedPromises () {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('NewEventDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    loggedUserRef.value = null
  })

  it('monta sem lançar erro e busca o evento pelo id da prop', async () => {
    const { getEventById } = await import('@/api/event')
    expect(() => mountNewEventDetails()).not.toThrow()
    await flushMountedPromises()
    expect(getEventById).toHaveBeenCalledWith('ev1')
  })

  it('renderiza o header único do app (AppHeader), herdado na Fase 1', async () => {
    const wrapper = mountNewEventDetails()
    await flushMountedPromises()
    expect(wrapper.find('header.feed-top-header').exists()).toBe(true)
  })

  it('mostra o título e a localização do evento carregado', async () => {
    const wrapper = mountNewEventDetails()
    await flushMountedPromises()
    expect(wrapper.text()).toContain('Festa de Réveillon')
    expect(wrapper.text()).toContain('Copacabana')
  })

  it('com `eventData` de preview, ainda assim busca o evento completo por ID', async () => {
    // loadEvent() sempre busca o evento completo por ID mesmo com preview
    // (a descrição vem cortada no payload do feed) — o preview só evita
    // tela em branco enquanto isso carrega, não substitui a chamada.
    const { getEventById } = await import('@/api/event')
    const wrapper = mountNewEventDetails({ eventData: fakeEvent })
    await flushMountedPromises()
    expect(getEventById).toHaveBeenCalledWith('ev1')
    expect(wrapper.text()).toContain('Festa de Réveillon')
  })
})
