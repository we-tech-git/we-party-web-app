<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  import FeedTrendsPanel from '@/components/modules/Feed/FeedTrendsPanel.vue'

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
    id: number
    banner: string
    hostName: string
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
  const items = ref<FeedItem[]>([
    {
      id: 1,
      banner: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80',
      hostName: 'Pedro Lopes',
      hostAvatar: 'https://i.pravatar.cc/72?img=12',
      schedule: 'Sexta-feira às 8PM',
      title: 'Grupo de estudos em Filosofia',
      description: '300 confirmados · 123 interessados',
      confirmed: 9230,
      interested: 3120,
    },
    {
      id: 2,
      banner: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1400&q=80',
      hostName: 'Malcon S.',
      hostAvatar: 'https://i.pravatar.cc/72?img=5',
      schedule: 'Sábado às 20h',
      title: 'Baile da madrugada',
      description: '500 confirmados · 312 interessados',
      confirmed: 7540,
      interested: 1820,
    },
    {
      id: 3,
      banner: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80',
      hostName: 'DJ Anny',
      hostAvatar: 'https://i.pravatar.cc/72?img=45',
      schedule: 'Domingo às 17h',
      title: 'Festival de verão na cidade',
      description: '2k confirmados · 890 interessados',
      confirmed: 6120,
      interested: 980,
    },
  ])

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

  const filteredItems = computed(() => {
    const normalized = searchQuery.value.trim().toLowerCase()

    if (!normalized) {
      return items.value
    }

    return items.value.filter(item => {
      return (
        item.title.toLowerCase().includes(normalized)
        || item.description.toLowerCase().includes(normalized)
        || item.hostName.toLowerCase().includes(normalized)
      )
    })
  })
</script>
<template>
  <div class="feed-page">
    <FeedTopHeader :user="user" />

    <section class="feed-shell">
      <FeedSidebarNav :active="activeNav" class="feed-sidebar" :items="navItems" @select="activeNav = $event" />

      <main class="feed-main">
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

        <section v-if="filteredItems.length > 0" class="cards-stack">
          <FeedCard
            v-for="item in filteredItems"
            :key="item.id"
            :banner="item.banner"
            :confirmed="item.confirmed"
            :description="item.description"
            :host-avatar="item.hostAvatar"
            :host-name="item.hostName"
            :interested="item.interested"
            :schedule="item.schedule"
            :title="item.title"
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
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
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
  align-self: start;
}

.feed-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.feed-trends {
  grid-area: trends;
  align-self: start;
}

.feed-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: var(--feed-sticky-offset);
  z-index: 5;
  padding: 0.75rem 0.5rem 1rem;
  margin: -0.75rem -0.5rem 0;
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

@media (max-width: 960px) {
  .feed-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      'sidebar'
      'main';
    width: 100%;
    padding: 2.5rem 1.75rem 2.75rem;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }

  .feed-controls {
    position: static;
    top: auto;
    padding: 0;
    margin: 0;
    backdrop-filter: none;
    background: transparent;
    border-radius: 0;
  }

  .feed-shell {
    --feed-sticky-offset: 0px;
  }
}

@media (max-width: 640px) {
  .feed-shell {
    padding: 2.75rem 1.25rem 2.25rem;
  }

  .feed-controls {
    gap: 1.25rem;
  }

  .tabs {
    overflow-x: auto;
    gap: 1rem;
  }
}
</style>
