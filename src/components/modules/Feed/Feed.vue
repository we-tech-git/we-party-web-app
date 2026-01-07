<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { getEventRecomendations, searchByEvents } from '@/api/event'
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
    title: string
    description: string
    confirmed: number
    interested: number
  }

  interface TrendItem {
    id: number
    title: string
    highlight: string
    engagement: string
  }

  const { t } = useI18n()
  const eventsStore = useEventsStore()

  const activeNav = ref('home')
  const activeTab = ref('for-you')
  const searchQuery = ref('')

  const navItems = computed<NavItem[]>(() => [
    { id: 'home', label: t('feed.nav.home'), icon: 'home' },
    { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
    { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
    { id: 'notifications', label: t('feed.nav.notifications'), icon: 'bell' },
    { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
  ])

  const tabs = computed<TabItem[]>(() => [
    { id: 'for-you', label: t('feed.tabs.forYou') },
    { id: 'today', label: t('feed.tabs.today') },
  ])

  const filteredItems = ref<FeedItem[]>([

  ])

  const items = ref<FeedItem[]>([])
  const loading = ref(false)

  async function fetchEvents () {
    loading.value = true
    try {
      const response = await getEventRecomendations()
      const events = response.data.events || response.data.content || response.data || []

      items.value = events.map((event: any) => ({
        id: event.id,
        banner: event.bannerUrl || event.banner || event.photos?.[0] || 'https://via.placeholder.com/400x200',
        creator: event.creator || {},
        hostAvatar: event.organizer?.avatar || event.hostAvatar || event.creator?.profileImage || '',
        schedule: event.date ? new Date(event.date).toLocaleString() : 'TBA',
        title: event.title || 'Untitled Event',
        description: event.description || '',
        confirmed: event.confirmedCount || 0,
        interested: event.interestedCount || 0,
      }))
      filteredItems.value = items.value
    } catch (error) {
      console.error('Failed to fetch events', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchEvents()
  })

  const trends = ref<TrendItem[]>([
    {
      id: 1,
      title: 'Baile de máscaras',
      highlight: t('feed.trending.cityHighlight'),
      engagement: '18k pessoas comentando',
    },
    {
      id: 2,
      title: 'Mandelõ dos Cria',
      highlight: t('feed.trending.cityHighlight'),
      engagement: '7k pessoas comentando',
    },
    {
      id: 3,
      title: 'Invasão de poder',
      highlight: t('feed.trending.cityHighlight'),
      engagement: '1k pessoas comentando',
    },
    {
      id: 4,
      title: 'Expo síndico São Paulo',
      highlight: t('feed.trending.cityHighlight'),
      engagement: '5k pessoas comentando',
    },
  ])

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

  function clearSearch () {
    searchQuery.value = ''
  }

  async function requestSearchEvents (normalizedSearch: string) {
    const resp = await searchByEvents(normalizedSearch)
    return resp.data.events
  }

  watch(searchQuery, async (newQuerySearch: string) => {
    const normalized = newQuerySearch.trim().toLowerCase()

    if (!normalized) {
      filteredItems.value = items.value
      return
    }

    try {
      const events = await requestSearchEvents(normalized)
      filteredItems.value = (events || []).map((event: any) => ({
        id: event.id,
        banner: event.bannerUrl || event.banner || event.photos?.[0] || 'https://via.placeholder.com/400x200',
        hostName: event.organizer?.name || event.hostName || event.creator?.name || 'Unknown Host',
        hostAvatar: event.organizer?.avatar || event.hostAvatar || event.creator?.profileImage || '',
        schedule: event.date ? new Date(event.date).toLocaleString() : 'TBA',
        title: event.name || event.title || 'Untitled Event',
        description: event.description || '',
        confirmed: event.confirmedCount || 0,
        interested: event.interestedCount || 0,
      }))
    } catch (error) {
      console.error(error)
    }
  })

  watch(activeNav, val => {
    if (searchQuery.value) {
      searchQuery.value = ''
    }

    filteredItems.value = val === 'favorites' ? eventsStore.savedEvents : items.value
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
        </section>
      </template>
    </FeedTopHeader>

    <section class="feed-shell">
      <FeedSidebarNav :active="activeNav" class="feed-sidebar" :items="navItems" @select="activeNav = $event" />

      <main class="feed-main">
        <section v-if="filteredItems.length > 0" class="cards-stack">
          <FeedCard
            v-for="item in filteredItems"
            :id="item.id"
            :key="item.id"
            :banner="item.banner"
            :confirmed="item.confirmed"
            :description="item.description"
            :host-avatar="item.hostAvatar"
            :host-name="item.creator.name"
            :interested="item.interested"
            :is-saved="eventsStore.isSaved(item.id)"
            :liked="eventsStore.isLiked(item.id)"
            :likes="item.confirmed + (eventsStore.isLiked(item.id) ? 1 : 0)"
            :schedule="item.schedule"
            :title="item.title"
            @toggle-like="eventsStore.toggleLike(item.id)"
            @toggle-save="eventsStore.toggleSave(item)"
          />
        </section>
        <p v-else class="empty">{{ t('feed.empty') }}</p>
      </main>

      <FeedTrendsPanel class="feed-trends" :items="trends" />
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
  gap: 1.5rem;
  padding-left: 0.25rem;
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
}
</style>
