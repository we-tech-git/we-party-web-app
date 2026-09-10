import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { unwrapItem } from '@/api'
import { followInterest, getInterestPage, unfollowInterest } from '@/api/interestPage'
import { useLoading } from '@/composables/useLoading'
import { logger } from '@/utils/logger'

export interface InterestPageSkin {
  id: string
  slug: string | null
  name: string
  description: string | null
  heroLabel: string
  welcomeText: string | null
  memberNoun: string
  coverImageUrl: string | null
  emoji: string | null
}

export interface InterestPerson {
  id: string
  name: string
  username?: string
  profileImage?: string | null
}

/**
 * Estado da landing page pública de um interesse (`/public/interests/:slug`).
 * Setup-store no molde de `useEventsStore` — um `fetchPage` por visita à
 * página, loading/erro por seção via `useLoading()` (mesma chave usada nos
 * componentes: `interest-page:hero`), `toggleFollow` otimista com rollback
 * (mesmo padrão de `useEventsStore.toggleLike`).
 */
export const useInterestPageStore = defineStore('interestPage', () => {
  const { startLoading, stopLoading, isLoading } = useLoading()

  const interestId = ref<string | null>(null)
  const interest = ref<InterestPageSkin | null>(null)
  const followersCount = ref(0)
  const activeEventsCount = ref<number | null>(null)
  const isFollowing = ref(false)
  const sampleFollowers = ref<InterestPerson[]>([])
  const featuredEvents = ref<any[]>([])
  const upcomingEvents = ref<any[]>([])
  const topPeopleFollowing = ref<InterestPerson[]>([])
  const topPeopleOthers = ref<InterestPerson[]>([])
  const notFound = ref(false)

  const loadingHero = computed(() => isLoading('interest-page:hero'))

  /**
   * `id` pode ser o slug (rota pública é por slug) ou o id real — o
   * backend resolve os dois em `GET /interest/:id/page`. Depois do
   * primeiro fetch, `interestId` é sobrescrito pelo id real devolvido no
   * payload: todas as chamadas seguintes (follow, comentários, likes)
   * usam o id real, nunca o slug.
   */
  async function fetchPage (id: string) {
    interestId.value = id
    notFound.value = false
    startLoading('interest-page:hero')
    try {
      const res = await getInterestPage(id)
      const data = unwrapItem<any>(res)
      if (!data?.interest) {
        notFound.value = true
        return
      }

      interest.value = data.interest
      interestId.value = data.interest.id
      followersCount.value = data.followersCount ?? 0
      activeEventsCount.value = data.activeEventsCount ?? null
      isFollowing.value = !!data.isFollowing
      sampleFollowers.value = data.sampleFollowers ?? []
      featuredEvents.value = data.featuredEvents ?? []
      upcomingEvents.value = data.upcomingEvents ?? []
      topPeopleFollowing.value = data.topPeople?.following ?? []
      topPeopleOthers.value = data.topPeople?.others ?? []
    } catch (error) {
      logger.error('Erro ao carregar página do interesse:', error)
      notFound.value = true
    } finally {
      stopLoading('interest-page:hero')
    }
  }

  /** Otimista com rollback — mesmo padrão de `useEventsStore.toggleLike`. */
  async function toggleFollow () {
    if (!interestId.value) {
      return
    }
    const wasFollowing = isFollowing.value
    const previousCount = followersCount.value

    isFollowing.value = !wasFollowing
    followersCount.value = Math.max(0, previousCount + (wasFollowing ? -1 : 1))

    try {
      const action = wasFollowing ? unfollowInterest : followInterest
      const res = await action(interestId.value)
      const payload = unwrapItem<{ isFollowing: boolean, followersCount: number }>(res)
      if (payload) {
        isFollowing.value = payload.isFollowing
        followersCount.value = payload.followersCount
      }
    } catch (error) {
      isFollowing.value = wasFollowing
      followersCount.value = previousCount
      logger.error('Erro ao seguir/deixar de seguir interesse:', error)
      throw error
    }
  }

  function reset () {
    interestId.value = null
    interest.value = null
    followersCount.value = 0
    activeEventsCount.value = null
    isFollowing.value = false
    sampleFollowers.value = []
    featuredEvents.value = []
    upcomingEvents.value = []
    topPeopleFollowing.value = []
    topPeopleOthers.value = []
    notFound.value = false
  }

  return {
    interestId,
    interest,
    followersCount,
    activeEventsCount,
    isFollowing,
    sampleFollowers,
    featuredEvents,
    upcomingEvents,
    topPeopleFollowing,
    topPeopleOthers,
    notFound,
    loadingHero,
    fetchPage,
    toggleFollow,
    reset,
  }
})
