<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { useRoute, useRouter } from 'vue-router'

  import { getEventRecomendations, getEventsToday, getTrendingEvents, searchByEvents } from '@/api/event'
  import FeedTrendsPanel from '@/components/modules/Feed/FeedTrendsPanel.vue'

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

  interface FeedItem {
    id: string | number
    banner: string
    creator: {
      name: string
    }
    hostAvatar: string
    schedule: string
    location?: string
    title: string
    description: string
    confirmed: number
    interested: number
    likes?: number
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

  const activeNav = ref((route.query.tab as string) || 'home')
  const activeTab = ref('for-you')
  const searchQuery = ref('')

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

  function mapEventToFeedItem (event: any): FeedItem {
    // Helper to get first non-empty string
    const getFirstValid = (...values: any[]): string => {
      for (const val of values) {
        if (val && typeof val === 'string' && val.trim() !== '') {
          return val
        }
      }
      return ''
    }

    // Handle photos - can be array or object with numeric keys
    let photoUrl = ''
    if (event.photos) {
      if (Array.isArray(event.photos) && event.photos.length > 0) {
        photoUrl = event.photos[0] || ''
      } else if (typeof event.photos === 'object') {
        // Handle object with numeric keys like { 0: "url", 1: "url2" }
        const keys = Object.keys(event.photos)
        const firstKey = keys[0]
        if (firstKey !== undefined) {
          photoUrl = event.photos[firstKey] || ''
        }
      }
    }

    const rawBanner = getFirstValid(
      event.bannerUrl,
      event.banner,
      photoUrl,
      event.image,
      event.imageUrl,
      event.cover,
      event.thumbnail,
    )

    const calculatedHostName = event.organizer?.name || event.hostName || event.creator?.name || 'Unknown Host'

    return {
      id: event.id,
      banner: rawBanner,
      creator: { name: calculatedHostName },
      hostAvatar: event.organizer?.avatar || event.hostAvatar || event.creator?.profileImage || '',
      schedule: event.date || event.startDate ? new Date(event.date || event.startDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Data a definir',
      location: event.location || event.address || event.place || 'Local a definir',
      title: event.name || event.title || 'Untitled Event',
      description: event.description || '',
      confirmed: event.confirmedCount || event._count?.attendances || 0,
      interested: event.interestedCount || 0,
      likes: event.likesCount || event.likes || event._count?.likes || 0,
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

      if (events.length < limit) {
        hasMore.value = false
      }

      const mappedEvents = events.map((event: any) => mapEventToFeedItem(event))

      items.value = isLoadMore ? [...items.value, ...mappedEvents] : mappedEvents

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
    fetchEvents()
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

  const user = {
    name: 'Amanda Costa',
    avatar: 'https://i.pravatar.cc/80?img=32',
    points: 356,
  }

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
    if (activeNav.value === 'home') {
      fetchEvents()
    }
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
      loading.value = false
      filteredItems.value = eventsStore.savedEvents
      hasMore.value = false
    } else {
      fetchEvents()
    }
  })

  watch(() => eventsStore.savedEvents, val => {
    if (activeNav.value === 'favorites') {
      filteredItems.value = val
    }
  }, { deep: true })

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

          <nav aria-label="Seções do feed" class="tabs">
            <template v-if="activeNav !== 'top-events'">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="{ active: activeTab === tab.id }"
                type="button"
                @click="selectTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </template>
          </nav>
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
        <section v-else-if="filteredItems.length > 0" class="cards-stack">
          <FeedCard
            v-for="(item, index) in filteredItems"
            :id="item.id"
            :key="item.id"
            :banner="item.banner"
            :confirmed="item.confirmed"
            :description="item.description"
            :highlight="activeNav === 'top-events'"
            :host-avatar="item.hostAvatar"
            :host-name="item.creator.name"
            :interested="item.interested"
            :is-saved="eventsStore.isSaved(item.id)"
            :liked="eventsStore.isLiked(item.id)"
            :likes="(item.likes || 0) + (eventsStore.isLiked(item.id) ? 1 : 0)"
            :location="item.location"
            :rank="activeNav === 'top-events' ? index + 1 : undefined"
            :schedule="item.schedule"
            :title="item.title"
            @toggle-like="eventsStore.toggleLike(item.id)"
            @toggle-save="eventsStore.toggleSave(item)"
          />
        </section>

        <div v-if="!loading && hasMore && filteredItems.length > 0 && !isSearching" class="load-more-container">
          <button class="load-more-btn" :disabled="loadingMore" type="button" @click="fetchEvents(true)">
            <span v-if="loadingMore" class="spinner" />
            {{ loadingMore ? 'Carregando' : 'Carregar mais eventos' }}
          </button>
        </div>

        <p v-else-if="!loading && filteredItems.length === 0" class="empty">{{ t('feed.empty') }}</p>
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
  --feed-sticky-offset: clamp(96px, 12vw, 140px);
}

.feed-sidebar {
  grid-area: sidebar;
  z-index: 99;
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
    padding: 1rem 1.25rem 6rem;
    /* Added bottom padding for bottom nav */
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
    padding: 0.5rem 1rem 6rem;
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
</style>
