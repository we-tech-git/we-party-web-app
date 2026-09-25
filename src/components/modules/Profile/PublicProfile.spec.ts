import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import ptBR from '@/locales/pt-BR.json'
import { useShareStore } from '@/stores/share'
import { createTestVuetify } from '@/test/vuetify'
import PublicProfile from './PublicProfile.vue'

// Perfil de terceiro (`/profile/:id`): interesses, "seguido por quem você
// segue", compartilhar, contagem nas abas, estado vazio e cards com etiqueta.

const { loggedUserRef, profileRef, followersRef, followingRef } = vi.hoisted(() => ({
  loggedUserRef: { value: { id: 'viewer', name: 'Eu', username: 'eu', profileImage: '' } as null | Record<string, string> },
  profileRef: { value: {} as Record<string, unknown> },
  followersRef: { value: [] as Record<string, string>[] },
  followingRef: { value: [] as Record<string, string>[] },
}))

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ loggedUser: loggedUserRef }),
}))

vi.mock('@/api/users', () => ({
  getUserProfile: vi.fn(() => Promise.resolve({ data: { data: profileRef.value } })),
}))

vi.mock('@/api/follows', () => ({
  followUserById: vi.fn().mockResolvedValue({ data: {} }),
  unfollowUserById: vi.fn().mockResolvedValue({ data: {} }),
  getFollowers: vi.fn(() => Promise.resolve({ data: { data: { followers: followersRef.value } } })),
  getFollowing: vi.fn(() => Promise.resolve({ data: { data: { following: followingRef.value } } })),
}))

const DAY = 86_400_000
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString()

function baseProfile (overrides: Record<string, unknown> = {}) {
  return {
    id: 'target',
    name: 'Tagarela',
    username: 'comentador3000',
    profileImage: null,
    profileCoverImage: null,
    bio: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    followersCount: 3,
    followingCount: 1,
    isFollowing: false,
    interests: [],
    likedEvents: [],
    eventAttendances: [],
    ...overrides,
  }
}

const event = (id: string, title: string, startDate: string) => ({ id, title, startDate, location: 'Local', photos: [] })
const person = (id: string, name: string) => ({ id, name, username: id })

async function mountProfile () {
  const i18n = createI18n({ legacy: false, locale: 'pt-BR', messages: { 'pt-BR': ptBR } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/feed', component: { template: '<div />' } },
      { path: '/profile', component: { template: '<div />' } },
    ],
  })

  const wrapper = mount(PublicProfile, {
    props: { userId: 'target' },
    global: {
      plugins: [createTestVuetify(), i18n, router],
      stubs: { AppHeader: true, AppFooter: true, FeedSidebarNav: true, WePartyLoader: true, Snackbar: true },
    },
  })
  await flushPromises()
  return wrapper
}

describe('PublicProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    loggedUserRef.value = { id: 'viewer', name: 'Eu', username: 'eu', profileImage: '' }
    profileRef.value = baseProfile()
    followersRef.value = []
    followingRef.value = []
    vi.clearAllMocks()
  })

  describe('interesses', () => {
    it('mostra os chips de interesse do perfil', async () => {
      profileRef.value = baseProfile({
        interests: [{ id: 'i1', name: 'Rock', slug: 'rock' }, { id: 'i2', name: 'Punk', slug: 'punk' }],
      })
      const wrapper = await mountProfile()

      const chips = wrapper.findAll('[data-testid="profile-interest-chip"]')
      expect(chips.map(chip => chip.text())).toEqual(['Rock', 'Punk'])
      expect(wrapper.find('.interests-section').attributes('aria-label')).toBe('Interesses de Tagarela')
    })

    it('sem interesses (ou backend antigo sem o campo), não renderiza a seção', async () => {
      profileRef.value = baseProfile({ interests: undefined })
      const wrapper = await mountProfile()

      expect(wrapper.find('.interests-section').exists()).toBe(false)
    })
  })

  describe('seguido por quem você segue', () => {
    it('cruza os seguidores do perfil com quem o visitante segue', async () => {
      followersRef.value = [person('a', 'Ana'), person('b', 'Bruno'), person('x', 'Xavier'), person('viewer', 'Eu')]
      followingRef.value = [person('a', 'Ana'), person('b', 'Bruno'), person('viewer2', 'Outro')]
      const wrapper = await mountProfile()

      expect(wrapper.get('[data-testid="public-profile-mutual-followers-text"]').text()).toBe('Seguido por Ana e Bruno')
    })

    it('com 3+ em comum, cita 2 nomes e soma o resto', async () => {
      followersRef.value = ['a', 'b', 'c', 'd'].map(id => person(id, id.toUpperCase()))
      followingRef.value = followersRef.value
      const wrapper = await mountProfile()

      expect(wrapper.get('[data-testid="public-profile-mutual-followers-text"]').text()).toBe('Seguido por A, B e mais 2')
    })

    it('sem ninguém em comum, não mostra nada', async () => {
      followersRef.value = [person('x', 'Xavier')]
      followingRef.value = [person('a', 'Ana')]
      const wrapper = await mountProfile()

      expect(wrapper.find('[data-testid="public-profile-mutual-followers"]').exists()).toBe(false)
    })

    it('falha na busca das listas não quebra o perfil', async () => {
      const follows = await import('@/api/follows')
      vi.mocked(follows.getFollowers).mockRejectedValueOnce(new Error('boom'))
      const wrapper = await mountProfile()

      expect(wrapper.find('[data-testid="public-profile-mutual-followers"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Tagarela')
    })
  })

  describe('compartilhar', () => {
    it('abre o ShareSheet com a URL pública do perfil', async () => {
      const wrapper = await mountProfile()
      const share = useShareStore()

      await wrapper.get('[data-testid="public-profile-share"]').trigger('click')

      expect(share.isOpen).toBe(true)
      expect(share.shareData.heading).toBe('Compartilhar perfil')
      expect(share.shareData.title).toBe('Tagarela')
      expect(share.shareData.url).toBe(`${window.location.origin}/profile/target`)
    })
  })

  describe('abas e eventos', () => {
    it('mostra a contagem em cada aba', async () => {
      profileRef.value = baseProfile({
        likedEvents: [event('1', 'A', daysFromNow(3)), event('2', 'B', daysFromNow(9))],
        eventAttendances: [],
      })
      const wrapper = await mountProfile()

      expect(wrapper.get('[data-testid="public-profile-tab-liked-count"]').text()).toBe('2')
      expect(wrapper.get('[data-testid="public-profile-tab-confirmed-count"]').text()).toBe('0')
    })

    it('separa "Próximos" e "Já rolou" e etiqueta a proximidade', async () => {
      profileRef.value = baseProfile({
        likedEvents: [
          event('old', 'Show antigo', daysFromNow(-10)),
          event('soon', 'Show em breve', daysFromNow(3)),
          event('today', 'Show hoje', daysFromNow(0)),
        ],
      })
      const wrapper = await mountProfile()

      const upcoming = wrapper.get('[data-testid="public-profile-events-upcoming"]')
      const past = wrapper.get('[data-testid="public-profile-events-past"]')
      expect(upcoming.text()).toContain('Próximos')
      expect(past.text()).toContain('Já rolou')

      // Mais perto primeiro: hoje antes de "em 3 dias"
      const tags = upcoming.findAll('[data-testid="event-mini-card-tag"]').map(tag => tag.text())
      expect(tags).toEqual(['Hoje', 'Em 3 dias'])
      expect(past.find('.event-mini-card--past').exists()).toBe(true)
    })

    it('com um grupo só, não mostra os títulos de seção', async () => {
      profileRef.value = baseProfile({ likedEvents: [event('1', 'Show', daysFromNow(20))] })
      const wrapper = await mountProfile()

      expect(wrapper.find('.event-section__title').exists()).toBe(false)
      expect(wrapper.find('[data-testid="event-mini-card-tag"]').exists()).toBe(false)
    })

    it('a data do card usa a data crua (dia 13+ não vira "Em breve")', async () => {
      // 13/11/2030 quarta-feira 20:00 local — `new Date("13/11/2030…")` seria inválido
      profileRef.value = baseProfile({ likedEvents: [event('1', 'Show', new Date(2030, 10, 13, 20).toISOString())] })
      const wrapper = await mountProfile()

      const badge = wrapper.get('.date-badge').text()
      expect(badge).toContain('13/11')
      expect(badge).toContain('20:00')
    })

    it('estado vazio convida a explorar eventos', async () => {
      const wrapper = await mountProfile()

      const empty = wrapper.get('[data-testid="public-profile-empty"]')
      expect(empty.text()).toContain('Nenhum evento curtido ainda')
      expect(empty.text()).toContain('Quando Tagarela curtir um evento, ele aparece aqui.')
      expect(wrapper.find('[data-testid="public-profile-empty-explore"]').exists()).toBe(true)
    })
  })

  describe('perfil sem botão de seguir (isFollowing nulo)', () => {
    it('mantém o compartilhar, não mostra seguir e não busca seguidores em comum', async () => {
      profileRef.value = baseProfile({ isFollowing: null })
      const follows = await import('@/api/follows')
      const wrapper = await mountProfile()

      expect(wrapper.find('[data-testid="public-profile-share"]').exists()).toBe(true)
      expect(wrapper.find('.follow-btn').exists()).toBe(false)
      expect(follows.getFollowers).not.toHaveBeenCalled()
    })
  })
})
