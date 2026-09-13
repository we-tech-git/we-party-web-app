import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createTestVuetify } from '@/test/vuetify'
import Profile from './Profile.vue'

// Teste de regressão da Fase 4 (REFACTOR_AUDIT_PLAN.md) — comportamento
// visível, escrito ANTES de decompor Profile.vue (5.782 linhas) na Fase 5.

// `vi.mock` é hoisted pro topo do arquivo — sem `vi.hoisted`, a factory
// abaixo rodaria antes de `loggedUserRef` existir (TDZ), e o mock nunca
// refletiria o valor setado no `beforeEach` de cada teste.
const { loggedUserRef } = vi.hoisted(() => ({
  loggedUserRef: { value: null as null | { id: string, name: string, username: string, profileImage: string, email: string } },
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    loggedUser: loggedUserRef,
    updateUser: vi.fn(),
  }),
}))

vi.mock('@/api/follows', () => ({
  followUserById: vi.fn().mockResolvedValue({ data: {} }),
  getFollowStats: vi.fn().mockResolvedValue({ data: { followersCount: 0, followingCount: 0 } }),
  getMyFollowers: vi.fn().mockResolvedValue({ data: [] }),
  getMyFollowing: vi.fn().mockResolvedValue({ data: [] }),
  unfollowUserById: vi.fn().mockResolvedValue({ data: {} }),
}))

vi.mock('@/api/interest', () => ({
  addUserInterest: vi.fn().mockResolvedValue({ data: {} }),
  getInterests: vi.fn().mockResolvedValue({ data: [] }),
  getUnownedInterestSuggestions: vi.fn().mockResolvedValue({ data: [] }),
  removeUserInterest: vi.fn().mockResolvedValue({ data: {} }),
  requestNewInterests: vi.fn().mockResolvedValue({ data: {} }),
  searchInterestsByName: vi.fn().mockResolvedValue({ data: [] }),
}))

vi.mock('@/api/users', () => ({
  getUserInterests: vi.fn().mockResolvedValue({ data: [] }),
  getUserProfile: vi.fn().mockResolvedValue({
    data: {
      id: 'u1',
      name: 'Maria Teste',
      username: 'mariateste',
      bio: '',
      profileImage: '',
      profileCoverImage: '',
      likedEvents: [],
      eventAttendances: [],
    },
  }),
  getUserRecomendations: vi.fn().mockResolvedValue({ data: [] }),
  searchUsers: vi.fn().mockResolvedValue({ data: [] }),
  updateUserProfile: vi.fn().mockResolvedValue({ data: {} }),
  uploadBannerImage: vi.fn().mockResolvedValue({ data: {} }),
  uploadProfileImage: vi.fn().mockResolvedValue({ data: {} }),
}))

function mountProfile () {
  const vuetify = createTestVuetify()
  const i18n = createI18n({ legacy: false, locale: 'pt-BR', messages: { 'pt-BR': {} } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/Login', component: { template: '<div />' } },
      { path: '/feed', component: { template: '<div />' } },
      { path: '/profile', component: { template: '<div />' } },
      { path: '/Signup', component: { template: '<div />' } },
      { path: '/updates', component: { template: '<div />' } },
    ],
  })

  return mount(Profile, {
    global: {
      plugins: [vuetify, i18n, router],
    },
  })
}

describe('Profile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    loggedUserRef.value = null
  })

  it('sem usuário logado, não busca perfil de ninguém (nem chama a API)', async () => {
    // Achado da Fase 4 (REFACTOR_AUDIT_PLAN.md): Profile.vue seta
    // `error.value = 'Usuário não autenticado'` (linha ~148) mas nunca
    // renderiza esse texto em lugar nenhum do template — quem cai aqui
    // sem sessão só vê o shell vazio da tela, sem nenhuma mensagem. Não é
    // comportamento desta fase mudar; o teste documenta o que existe hoje
    // (a API não é chamada), não o texto de erro que nunca aparece.
    const { getUserProfile } = await import('@/api/users')
    mountProfile()
    await flushMountedPromises()
    expect(getUserProfile).not.toHaveBeenCalled()
  })

  it('com usuário logado, monta sem lançar erro e busca o perfil', async () => {
    loggedUserRef.value = { id: 'u1', name: 'Maria Teste', username: 'mariateste', profileImage: '', email: 'maria@teste.com' }
    const { getUserProfile } = await import('@/api/users')

    const wrapper = mountProfile()
    await flushMountedPromises()

    expect(getUserProfile).toHaveBeenCalled()
    expect(wrapper.exists()).toBe(true)
  })

  it('renderiza o header único do app (AppHeader)', async () => {
    loggedUserRef.value = { id: 'u1', name: 'Maria Teste', username: 'mariateste', profileImage: '', email: 'maria@teste.com' }
    const wrapper = mountProfile()
    await flushMountedPromises()
    expect(wrapper.find('header.feed-top-header').exists()).toBe(true)
  })
})

// Os `await` do onMounted (fetch de perfil, stats, recomendados) rodam em
// paralelo — dar um tick extra garante que resolveram antes das asserções.
async function flushMountedPromises () {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}
