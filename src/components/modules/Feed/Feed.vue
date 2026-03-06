<script setup lang="ts">
  import type { FeedItem } from '@/stores/events'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { useRoute, useRouter } from 'vue-router'

  import { getEventRecomendations, getEventsToday, getFavoriteEvents, getTrendingEvents, searchByEvents } from '@/api/event'

  import FeedTrendsPanel from '@/components/modules/Feed/FeedTrendsPanel.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useEventsStore } from '@/stores/events'
  import FeedCard from './FeedCard.vue'
  import FeedSidebarNav from './FeedSidebarNav.vue'
  import FeedTopHeader from './FeedTopHeader.vue'

  interface NavItem {
    id: string
    label: string
    icon: 'home' | 'top' | 'bookmark' | 'bell' | 'profile'
  }

  interface TabItem {
    id: string
    label: string
  }

  interface TrendItem {
    id: number
    title: string
    highlight: string
    baseCount: number
  }

  const { t } = useI18n()
  const eventsStore = useEventsStore()
  const router = useRouter()
  const route = useRoute()
  const { loggedUser, userDisplayName } = useAuth()

  const activeNav = ref((route.query.tab as string) || 'home')
  const activeTab = ref('for-you')
  const searchQuery = ref('')

  // ── Filter state ──────────────────────────────────────────────────────────
  const filterOpen = ref(false)
  const activeCategories = ref<string[]>([])
  const activeDateFilter = ref<string | null>(null)

  const CATEGORY_CHIPS = [
    { id: 'musica', label: '🎵 Música' },
    { id: 'festas', label: '🎉 Festas' },
    { id: 'gastronomia', label: '🍔 Gastronomia' },
    { id: 'arte', label: '🎨 Arte & Cultura' },
    { id: 'esportes', label: '⚽ Esportes' },
    { id: 'cinema', label: '🎬 Cinema' },
    { id: 'teatro', label: '🎭 Teatro' },
    { id: 'tecnologia', label: '💻 Tecnologia' },
  ]

  const DATE_CHIPS = [
    { id: 'today', label: 'Hoje' },
    { id: 'tomorrow', label: 'Amanhã' },
    { id: 'weekend', label: 'Fim de semana' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mês' },
  ]

  const rawEventDates = ref<Record<string, Date>>({})

  const navItems = computed<NavItem[]>(() => [
    { id: 'home', label: t('feed.nav.home'), icon: 'home' },
    { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
    { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
    { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
  ])

  const tabs = computed<TabItem[]>(() => {
    if (activeNav.value === 'top-events') {
      return [
        { id: 'for-you', label: t('feed.tabs.forYou') },
        { id: 'trends', label: t('feed.tabs.trends') },
        { id: 'news', label: t('feed.tabs.news') },
      ]
    }

    return [
      { id: 'for-you', label: t('feed.tabs.forYou') },
      { id: 'today', label: t('feed.tabs.today') },
    ]
  })

  const filteredItems = ref<FeedItem[]>([

  ])

  const items = ref<FeedItem[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const page = ref(1)
  const limit = 10
  const hasMore = ref(true)

  function getFirstValidString (...values: unknown[]): string {
    for (const val of values) {
      if (val && typeof val === 'string' && val.trim() !== '') {
        return val
      }
    }
    return ''
  }

  function extractPhotoUrl (photos: unknown): string {
    if (!photos) return ''
    if (Array.isArray(photos) && photos.length > 0) return photos[0] || ''
    if (typeof photos === 'object' && photos !== null) {
      const keys = Object.keys(photos as Record<string, unknown>)
      const firstKey = keys[0]
      if (firstKey !== undefined) return (photos as Record<string, string>)[firstKey] || ''
    }
    return ''
  }

  function resolveLikesCount (event: any): number {
    if (typeof event.likesCount === 'number') return event.likesCount
    if (typeof event.likes === 'number') return event.likes
    if (Array.isArray(event.likes)) return event.likes.length
    if (typeof event._count?.likes === 'number') return event._count.likes
    if (typeof event.likes_count === 'number') return event.likes_count
    if (typeof event.totalLikes === 'number') return event.totalLikes
    if (typeof event.likeCount === 'number') return event.likeCount
    if (typeof event.confirmedCount === 'number') return event.confirmedCount
    if (typeof event._count?.attendances === 'number') return event._count.attendances
    return 0
  }

  function resolveSchedule (event: any): string {
    const candidates = [
      event.date,
      event.startDate,
      event.dateTime,
      event.startAt,
      event.eventDate,
      event.start_date,
      event.schedule,
    ]
    for (const val of candidates) {
      if (!val) continue
      const parsed = new Date(val)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      }
    }
    return 'Data a definir'
  }

  function mapEventToFeedItem (event: any): FeedItem {
    // Capture raw date for client-side date filtering
    const rawDateVal = event.date || event.startDate || event.dateTime || event.startAt || event.eventDate || event.start_date
    if (rawDateVal) {
      const parsedRaw = new Date(rawDateVal)
      if (!Number.isNaN(parsedRaw.getTime())) {
        rawEventDates.value[String(event.id)] = parsedRaw
      }
    }

    const rawBanner = getFirstValidString(
      event.bannerUrl,
      event.banner,
      extractPhotoUrl(event.photos),
      event.image,
      event.imageUrl,
      event.cover,
      event.thumbnail,
    )

    const calculatedHostName = event.organizer?.name || event.hostName || event.creator?.name || 'Organizador'

    const likesCount = resolveLikesCount(event)

    return {
      id: event.id,
      banner: rawBanner,
      creator: { name: calculatedHostName },
      hostAvatar: event.organizer?.avatar || event.hostAvatar || event.creator?.profileImage || '',
      schedule: resolveSchedule(event),
      location: event.location || event.address || event.place || 'Local a definir',
      title: event.name || event.title || 'Untitled Event',
      description: event.description || '',
      confirmed: event.confirmedCount || event._count?.attendances || 0,
      interested: event.interestedCount || 0,
      likes: likesCount,
      interests: (event.eventInterests || event.interests || event.categories || event.tags || []).map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name).filter(Boolean),
      commentsCount: event.commentsCount ?? event._count?.comments ?? 0,
    }
  }

  async function fetchEvents (isLoadMore = false) {
    if (isLoadMore) {
      loadingMore.value = true
      page.value = page.value + 1
    } else {
      loading.value = true
      page.value = 1
      items.value = []
      hasMore.value = true
    }

    try {
      const fetchPromise = (async () => {
        if (activeNav.value === 'top-events') {
          return await getTrendingEvents(page.value, limit)
        } else if (activeTab.value === 'today') {
          return await getEventsToday(page.value, limit)
        } else {
          return await getEventRecomendations(page.value, limit)
        }
      })()

      // Only delay on initial load to avoid flickering, not on load more
      const waitPromise = isLoadMore ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, 1000))

      const [response] = await Promise.all([
        fetchPromise,
        waitPromise,
      ])

      const events = response.data.events || response.data.content || response.data || []

      const mappedEvents = events.map((event: any) => mapEventToFeedItem(event))

      hasMore.value = mappedEvents.length >= limit

      items.value = isLoadMore ? [...items.value, ...mappedEvents] : mappedEvents

      if (isLoadMore && mappedEvents.length === 0) {
        // Reverte o incremento de página se não trouxe resultados
        page.value = page.value - 1
      }

      filteredItems.value = items.value
    } catch (error) {
      console.error('Failed to fetch events', error)
      if (!isLoadMore) {
        items.value = []
        filteredItems.value = []
      }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  onMounted(() => {
    if (activeNav.value === 'favorites') {
      fetchFavoriteEvents()
      // Sincroniza favoritos com o servidor ao montar a página
      eventsStore.syncFavoritesWithServer()
    } else {
      fetchEvents()
    }
    fetchTrends()
  })

  const trends = ref<TrendItem[]>([])

  async function fetchTrends () {
    try {
      const response = await getTrendingEvents()
      const data = response.data.events || response.data || []

      trends.value = data.map((evt: any) => ({
        id: evt.id,
        title: evt.name || evt.title || 'Evento sem nome',
        highlight: evt.location || evt.city || t('feed.trending.cityHighlight'),
        baseCount: evt.likesCount || evt.likes || evt._count?.likes || evt.confirmedCount || 0,
      }))
    } catch (error) {
      console.error('Error fetching trends', error)
    }
  }

  const displayedTrends = computed(() => {
    return trends.value.map(item => {
      const isLiked = eventsStore.isLiked(item.id)
      const total = item.baseCount + (isLiked ? 1 : 0)
      return {
        id: item.id,
        title: item.title,
        highlight: item.highlight,
        engagement: `${total} curtidas`,
        rawCount: total,
      }
    // eslint-disable-next-line unicorn/no-array-sort
    }).slice().sort((a: any, b: any) => b.rawCount - a.rawCount)
  })

  const user = computed(() => ({
    name: userDisplayName.value,
    avatar: loggedUser.value?.profileImage || '',
  }))

  const isSearching = computed(() => searchQuery.value.trim().length > 0)

  function selectTab (id: string) {
    if (activeTab.value === id) return

    activeTab.value = id
  }

  function handleBackNavigation () {
    if (activeNav.value === 'favorites') {
      activeNav.value = 'top-events'
    } else if (activeNav.value === 'top-events') {
      activeNav.value = 'home'
    } else {
      activeNav.value = 'home'
    }
  }

  function clearSearch () {
    searchQuery.value = ''
  }

  async function requestSearchEvents (normalizedSearch: string) {
    const resp = await searchByEvents(normalizedSearch, 1, 20)
    return resp.data.events || resp.data || []
  }

  let searchTimeout: ReturnType<typeof setTimeout>

  watch(searchQuery, (newQuerySearch: string) => {
    clearTimeout(searchTimeout)

    const normalized = newQuerySearch.trim()

    if (!normalized) {
      loading.value = false
      filteredItems.value = items.value
      return
    }

    loading.value = true

    searchTimeout = setTimeout(async () => {
      try {
        const events = await requestSearchEvents(normalized)
        filteredItems.value = (events || []).map((event: any) => mapEventToFeedItem(event))
      } catch (error) {
        console.error(error)
        filteredItems.value = []
      } finally {
        loading.value = false
      }
    }, 500)
  })

  watch(activeTab, () => {
    if (activeNav.value === 'favorites') return
    fetchEvents()
  })

  watch(activeNav, val => {
    if (val === 'profile') {
      router.push('/private/profile')
      return
    }

    // Reset active tab to 'for-you' when switching nav sections
    // This ensures consistency since different sections might have different tabs
    // and 'for-you' is common to all of them currently.
    activeTab.value = 'for-you'

    if (searchQuery.value) {
      searchQuery.value = ''
    }

    if (val === 'favorites') {
      fetchFavoriteEvents()
      // Sincroniza favoritos com o servidor para garantir dados atualizados
      eventsStore.syncFavoritesWithServer()
    } else {
      fetchEvents()
    }
  })

  /**
   * Busca eventos favoritos da API
   */
  async function fetchFavoriteEvents (isLoadMore = false) {
    try {
      if (isLoadMore) {
        loadingMore.value = true
        page.value = page.value + 1
      } else {
        loading.value = true
        page.value = 1
      }

      const response = await getFavoriteEvents(page.value, limit)
      const data = response.data

      // Tenta extrair eventos de diferentes estruturas de resposta
      let events: any[] = []
      if (data?.data?.events) {
        events = data.data.events
      } else if (data?.events) {
        events = data.events
      } else if (Array.isArray(data?.data)) {
        events = data.data
      } else if (Array.isArray(data)) {
        events = data
      }

      hasMore.value = events.length >= limit

      const mappedEvents = events.map((evt: any) => mapEventToFeedItem(evt))

      items.value = isLoadMore ? [...items.value, ...mappedEvents] : mappedEvents
      filteredItems.value = items.value
    } catch (error) {
      console.error('Erro ao buscar eventos favoritos:', error)
      if (!isLoadMore) {
        items.value = []
        filteredItems.value = []
      }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  // ── Filter helpers ───────────────────────────────────────────────────────
  function toggleCategory (id: string) {
    const idx = activeCategories.value.indexOf(id)
    if (idx === -1) {
      activeCategories.value.push(id)
    } else {
      activeCategories.value.splice(idx, 1)
    }
  }

  function toggleDateFilter (id: string) {
    activeDateFilter.value = activeDateFilter.value === id ? null : id
  }

  function clearFilters () {
    activeCategories.value = []
    activeDateFilter.value = null
  }

  const activeFiltersCount = computed(() =>
    activeCategories.value.length + (activeDateFilter.value ? 1 : 0),
  )

  const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

  function isDateInFilter (eventId: string): boolean {
    const date = rawEventDates.value[eventId]
    if (!date) return true
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    switch (activeDateFilter.value) {
      case 'today': {
        return date >= today && date < tomorrow
      }
      case 'tomorrow': {
        const dayAfter = new Date(tomorrow)
        dayAfter.setDate(dayAfter.getDate() + 1)
        return date >= tomorrow && date < dayAfter
      }
      case 'weekend': {
        const day = today.getDay()
        const daysToSat = day === 6 ? 0 : 6 - day
        const sat = new Date(today)
        sat.setDate(today.getDate() + daysToSat)
        const mon = new Date(sat)
        mon.setDate(sat.getDate() + 2)
        return date >= sat && date < mon
      }
      case 'week': {
        const nextWeek = new Date(today)
        nextWeek.setDate(today.getDate() + 7)
        return date >= today && date < nextWeek
      }
      case 'month': {
        const nextMonth = new Date(today)
        nextMonth.setMonth(today.getMonth() + 1)
        return date >= today && date < nextMonth
      }
      default: {
        return true
      }
    }
  }

  const displayedItems = computed(() => {
    let result = filteredItems.value
    if (activeCategories.value.length > 0) {
      result = result.filter(item =>
        item.interests?.some((interest: string) =>
          activeCategories.value.some(catId => {
            const chip = CATEGORY_CHIPS.find(c => c.id === catId)
            const catLabel = chip ? chip.label.replace(/^\S+\s/, '').toLowerCase() : catId
            return interest.toLowerCase().includes(catLabel)
              || catLabel.includes(interest.toLowerCase())
          }),
        ),
      )
    }
    if (activeDateFilter.value) {
      result = result.filter(item => isDateInFilter(String(item.id)))
    }
    return result
  })

  /**
   * Gerencia o toggle de favorito com atualização da lista quando necessário
   */
  async function handleToggleSave (item: FeedItem) {
    const wasSaved = eventsStore.isSaved(item.id)

    // Chama o toggleSave do store
    await eventsStore.toggleSave(item)

    // Se estava na aba de favoritos e foi desfavoritado, atualiza a lista
    if (activeNav.value === 'favorites' && wasSaved) {
      // Remove o item da lista imediatamente para feedback visual rápido
      filteredItems.value = filteredItems.value.filter(e => e.id !== item.id)
      items.value = items.value.filter(e => e.id !== item.id)

      // Sincroniza com o servidor após um pequeno delay
      setTimeout(() => {
        eventsStore.syncFavoritesWithServer()
      }, 500)
    }
  }

</script>
<template>
  <div class="feed-page">
    <FeedTopHeader :user="user">
      <template #center-content>
        <section class="feed-controls">
          <label class="search" role="search">
            <span aria-hidden="true" class="search-icon">
              <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                <path
                  d="M21 21l-4.35-4.35m0 0A6.75 6.75 0 1 0 7.96 7.96a6.75 6.75 0 0 0 8.69 8.69z"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
              </svg>
            </span>
            <input
              v-model="searchQuery"
              :aria-label="t('feed.searchAria')"
              :placeholder="t('feed.searchPlaceholder')"
              type="search"
            >
            <button
              v-if="isSearching"
              :aria-label="t('feed.actions.clearSearch')"
              class="clear"
              type="button"
              @click="clearSearch"
            >
              ✕
            </button>
          </label>

          <div class="tabs-row">
            <nav aria-label="Seções do feed" class="tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="{ active: activeTab === tab.id }"
                type="button"
                @click="selectTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </nav>

            <button
              class="filter-toggle-btn"
              :class="{ 'filter-active': hasActiveFilters, 'filter-open': filterOpen }"
              type="button"
              @click="filterOpen = !filterOpen"
            >
              <svg
                fill="none"
                height="15"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="15"
              >
                <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
              </svg>
              <span class="filter-btn-label">Filtros</span>
              <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
              <svg
                class="filter-chevron"
                :class="{ rotated: filterOpen }"
                fill="none"
                height="13"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                width="13"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          <Transition name="filter-expand">
            <div v-if="filterOpen" class="filter-panel">
              <div class="filter-section">
                <span class="filter-section-label">Categoria</span>
                <div class="filter-chips">
                  <button
                    v-for="cat in CATEGORY_CHIPS"
                    :key="cat.id"
                    class="filter-chip"
                    :class="{ active: activeCategories.includes(cat.id) }"
                    type="button"
                    @click="toggleCategory(cat.id)"
                  >
                    {{ cat.label }}
                  </button>
                </div>
              </div>

              <div class="filter-section">
                <span class="filter-section-label">Quando</span>
                <div class="filter-chips">
                  <button
                    v-for="d in DATE_CHIPS"
                    :key="d.id"
                    class="filter-chip filter-chip--date"
                    :class="{ active: activeDateFilter === d.id }"
                    type="button"
                    @click="toggleDateFilter(d.id)"
                  >
                    {{ d.label }}
                  </button>
                </div>
              </div>

              <Transition name="fade">
                <div v-if="hasActiveFilters" class="filter-clear-row">
                  <span class="filter-results-hint">
                    {{ displayedItems.length }} evento{{ displayedItems.length !== 1 ? 's' : '' }} encontrado{{ displayedItems.length !== 1 ? 's' : '' }}
                  </span>
                  <button class="filter-clear-btn" type="button" @click="clearFilters">
                    <svg
                      fill="none"
                      height="12"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      viewBox="0 0 24 24"
                      width="12"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                    Limpar filtros
                  </button>
                </div>
              </Transition>
            </div>
          </Transition>
        </section>
      </template>
    </FeedTopHeader>

    <section class="feed-shell">
      <FeedSidebarNav :active="activeNav" class="feed-sidebar" :items="navItems" @select="activeNav = $event" />

      <main class="feed-main">
        <!-- Breadcrumb Navigation -->
        <div v-if="activeNav !== 'home'" class="breadcrumb-nav">
          <button class="breadcrumb-back" type="button" @click="handleBackNavigation">
            <span class="back-icon">
              <svg
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="back-text">Voltar</span>
          </button>
          <span class="breadcrumb-separator">
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="breadcrumb-current">
            {{ activeNav === 'top-events' ? t('feed.nav.topEvents') : activeNav === 'favorites' ?
              t('feed.nav.favorites') :
              '' }}
          </span>
        </div>

        <div v-if="loading" class="loading-state">
          <v-progress-circular color="#ff5fa6" indeterminate size="64" />
        </div>
        <section v-else-if="displayedItems.length > 0" class="cards-stack">
          <FeedCard
            v-for="(item, index) in displayedItems"
            :id="item.id"
            :key="item.id"
            :banner="item.banner"
            :comments-count="item.commentsCount"
            :confirmed="item.confirmed"
            :description="item.description"
            :highlight="activeNav === 'top-events'"
            :host-avatar="item.hostAvatar"
            :host-name="item.creator.name"
            :interested="item.interested"
            :interests="item.interests"
            :is-saved="eventsStore.isSaved(item.id)"
            :liked="eventsStore.isLiked(item.id)"
            :likes="(item.likes || 0) + (eventsStore.isLiked(item.id) ? 1 : 0)"
            :location="item.location"
            :rank="activeNav === 'top-events' ? index + 1 : undefined"
            :schedule="item.schedule"
            :title="item.title"
            @toggle-like="eventsStore.toggleLike(item.id)"
            @toggle-save="handleToggleSave(item)"
          />
        </section>

        <div v-if="!loading && hasMore && displayedItems.length > 0 && !isSearching" class="load-more-container">
          <button
            class="load-more-btn"
            :disabled="loadingMore"
            type="button"
            @click="activeNav === 'favorites' ? fetchFavoriteEvents(true) : fetchEvents(true)"
          >
            <span v-if="loadingMore" class="spinner" />
            {{ loadingMore ? 'Carregando' : 'Carregar mais eventos' }}
          </button>
        </div>

        <p v-else-if="!loading && displayedItems.length === 0" class="empty">{{ hasActiveFilters ? 'Nenhum evento encontrado com esses filtros.' : t('feed.empty') }}</p>
      </main>

      <FeedTrendsPanel class="feed-trends" :items="displayedTrends" />
    </section>
  </div>
</template>

<style scoped>
.feed-page {
  min-height: 100vh;
  background: linear-gradient(142.35deg, rgba(252, 162, 89, 0.07) -1.66%, rgba(255, 98, 159, 0.11) 100.44%);
  display: flex;
  flex-direction: column;
}

.feed-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 240px minmax(0, 720px) 320px;
  grid-template-areas: 'sidebar main trends';
  column-gap: 2rem;
  row-gap: 0;
  width: min(100%, 1280px);
  margin: 0 auto 3.5rem;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  align-items: start;
  padding: 0 1rem;
  --feed-sticky-offset: clamp(96px, 12vw, 140px);
}

.feed-sidebar {
  grid-area: sidebar;
  z-index: 10;
}

.feed-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding-top: 1.75rem;
}

.feed-trends {
  grid-area: trends;
  align-self: start;
}

.feed-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 810px;
  margin: 0 auto;
  padding: 0.75rem 0.5rem 1rem;
  background: linear-gradient(180deg, rgba(249, 249, 255, 0.92) 0%, rgba(255, 255, 255, 0.92) 100%);
  backdrop-filter: blur(12px);
  border-radius: 24px;
}

.search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem 0.85rem 3.25rem;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 20px 45px rgba(14, 23, 58, 0.12);
  font-size: 0.95rem;
}

.search input {
  width: 100%;
  border: none;
  font-size: 0.95rem;
  color: #2f3557;
}

.search input:focus {
  outline: none;
}

.search-icon {
  position: absolute;
  left: 1.3rem;
  color: #a4aac6;
}

.clear {
  position: absolute;
  right: 1rem;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 95, 166, 0.15);
  color: #ff5fa6;
  font-size: 0.9rem;
  cursor: pointer;
}

.tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding-left: 0;
  width: 100%;
}

.tabs button {
  position: relative;
  border: none;
  background: transparent;
  font-size: 1.05rem;
  font-weight: 600;
  color: #9aa0b8;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
}

.tabs button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.4rem;
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.2s ease;
}

.tabs button.active {
  color: #2d2f55;
}

.tabs button.active::after {
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
}

.tab-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 95, 166, 0.1);
  color: #ff5fa6;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: all 0.2s ease;
}

.tab-back-btn:hover {
  background: rgba(255, 95, 166, 0.2);
  transform: translateX(-2px);
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 250, 0.95) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.08);
  border: 1px solid rgba(255, 186, 75, 0.15);
  margin-bottom: 0.5rem;
}

.breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.15) 0%, rgba(255, 95, 166, 0.15) 100%);
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.breadcrumb-back:hover {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  transform: translateX(-3px);
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

.breadcrumb-back:active {
  transform: scale(0.97);
}

.back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.breadcrumb-back:hover .back-icon {
  background: rgba(255, 255, 255, 0.3);
}

.back-text {
  letter-spacing: 0.02em;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  color: #c4c9de;
}

.breadcrumb-current {
  font-weight: 700;
  font-size: 0.95rem;
  color: #2d2f55;
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1) 0%, rgba(255, 95, 166, 0.1) 100%);
  border-radius: 10px;
}

.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty {
  margin: 0;
  padding: 2.5rem;
  border-radius: 20px;
  background: #ffffff;
  color: #7a8199;
  box-shadow: inset 0 0 0 1px rgba(122, 129, 153, 0.15);
  text-align: center;
  font-weight: 600;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  width: 100%;
}

.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.8rem 2.5rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.4);
}

.load-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1240px) {
  .feed-shell {
    grid-template-columns: 220px 1fr;
    grid-template-areas: 'sidebar main';
    width: min(100%, 960px);
    padding: 2.75rem 2.25rem 2.5rem;
    margin: 0 auto 3rem;
    border-radius: 0;
  }

  .feed-trends {
    display: none;
  }
}

@media (max-width: 1100px) {
  .feed-shell {
    /* Increase sticky offset because header is taller (stacked) in this range */
    --feed-sticky-offset: 180px;
    padding-top: 1rem;
  }

  .feed-controls {
    background: transparent;
    backdrop-filter: none;
    padding: 0;
  }
}

@media (max-width: 960px) {
  .feed-shell {
    grid-template-columns: 1fr;
    grid-template-areas: 'main';
    width: 100%;
    padding: 1rem 1.25rem calc(5rem + env(safe-area-inset-bottom, 0px));
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }

  .feed-sidebar {
    /* Sidebar is now fixed bottom nav, handled in FeedSidebarNav.vue */
    grid-area: auto;
  }

  .feed-controls {
    position: static;
    top: auto;
    padding: 0;
    margin: 0;
    backdrop-filter: none;
    background: transparent;
    border-radius: 0;
    gap: 1rem;
    width: 100%;
    /* Ensure it takes full width */
  }

  .search {
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    box-shadow: 0 4px 20px rgba(14, 23, 58, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .search-icon {
    left: 1rem;
  }

  .feed-shell {
    --feed-sticky-offset: 0px;
  }
}

@media (max-width: 640px) {
  .feed-shell {
    padding: 0.5rem 0.75rem calc(5rem + env(safe-area-inset-bottom, 0px));
  }

  .feed-controls {
    gap: 0.5rem;
  }

  .search {
    padding: 0.6rem 1rem 0.6rem 2.5rem;
    font-size: 0.9rem;
  }

  .search-icon {
    left: 0.8rem;
  }

  .search-icon svg {
    width: 16px;
    height: 16px;
  }

  .tabs {
    overflow-x: auto;
    gap: 1rem;
    padding-bottom: 0.25rem;
    /* Space for scrollbar if needed */
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    /* Firefox */
  }

  .tabs button {
    font-size: 0.95rem;
    padding: 0.15rem 0;
  }

  .tabs::-webkit-scrollbar {
    display: none;
    /* Chrome/Safari */
  }

  .breadcrumb-nav {
    padding: 0.6rem 1rem;
    border-radius: 14px;
    gap: 0.5rem;
  }

  .breadcrumb-back {
    padding: 0.4rem 0.85rem;
    font-size: 0.85rem;
    gap: 0.4rem;
  }

  .back-icon {
    width: 22px;
    height: 22px;
  }

  .back-icon svg {
    width: 14px;
    height: 14px;
  }

  .breadcrumb-current {
    font-size: 0.85rem;
    padding: 0.3rem 0.7rem;
  }

  .breadcrumb-separator svg {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 480px) {
  .breadcrumb-nav {
    padding: 0.5rem 0.85rem;
    border-radius: 12px;
    gap: 0.4rem;
  }

  .breadcrumb-back {
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
    border-radius: 10px;
  }

  .back-icon {
    width: 20px;
    height: 20px;
    border-radius: 6px;
  }

  .back-text {
    display: none;
  }

  .breadcrumb-current {
    font-size: 0.8rem;
    padding: 0.25rem 0.6rem;
    border-radius: 8px;
  }
}

/* ─── Filter ─── */
.tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.tabs-row .tabs {
  flex: 1;
  justify-content: flex-start;
}

.filter-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #5a6080;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-toggle-btn:hover {
  border-color: rgba(255, 95, 166, 0.4);
  color: #ff5fa6;
  box-shadow: 0 2px 12px rgba(255, 95, 166, 0.12);
}

.filter-toggle-btn.filter-active {
  border-color: #ff5fa6;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.08) 0%, rgba(255, 95, 166, 0.08) 100%);
  color: #ff5fa6;
}

.filter-toggle-btn.filter-open {
  border-color: #ff5fa6;
  color: #ff5fa6;
}

.filter-btn-label {
  letter-spacing: 0.01em;
}

.filter-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
}

.filter-chevron {
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.filter-chevron.rotated {
  transform: rotate(180deg);
}

/* Filter panel */
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 252, 0.98) 100%);
  border: 1px solid rgba(255, 95, 166, 0.14);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(255, 95, 166, 0.09), 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.filter-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.38);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.32rem 0.85rem;
  border-radius: 999px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #4a5070;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.filter-chip:hover {
  border-color: rgba(255, 95, 166, 0.45);
  color: #ff5fa6;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(255, 95, 166, 0.15);
}

.filter-chip.active {
  border-color: transparent;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  box-shadow: 0 3px 12px rgba(255, 95, 166, 0.3);
  transform: translateY(-1px);
}

.filter-chip--date {
  padding: 0.32rem 0.95rem;
}

.filter-clear-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.filter-results-hint {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
}

.filter-clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid rgba(255, 95, 166, 0.3);
  background: rgba(255, 95, 166, 0.06);
  color: #ff5fa6;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-clear-btn:hover {
  background: rgba(255, 95, 166, 0.12);
  border-color: #ff5fa6;
}

/* Filter transitions */
.filter-expand-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.filter-expand-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.95);
  max-height: 0;
}

.filter-expand-enter-to,
.filter-expand-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1);
  max-height: 400px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .filter-btn-label {
    display: none;
  }

  .filter-toggle-btn {
    padding: 0.45rem 0.65rem;
    gap: 0.3rem;
  }

  .filter-chip {
    font-size: 0.75rem;
    padding: 0.28rem 0.7rem;
  }
}
</style>
