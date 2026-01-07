<script setup lang="ts">
  import type { NavItem } from './FeedSidebarNav.vue'
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { getTrendingEvents } from '@/api/event'
  import { useEventsStore } from '@/stores/events' // Import store
  import EventDetails from './EventDetails.vue'
  import FeedSidebarNav from './FeedSidebarNav.vue'
  import FeedTopHeader from './FeedTopHeader.vue'
  import FeedTrendsPanel from './FeedTrendsPanel.vue'

  defineProps<{
    eventId: string | string[]
  }>()

  const { t } = useI18n()
  const router = useRouter()
  const eventsStore = useEventsStore() // Initialize store

  // --- Lógica de Layout (Copiada do Feed) ---
  const activeNav = ref('')

  function handleNavSelect (id: string) {
    activeNav.value = id
    if (id === 'home' || id === 'top-events' || id === 'favorites') {
      router.push('/private/feed')
    } else if (id === 'profile') {
      router.push('/private/profile')
    }
  }

  const user = {
    name: 'Amanda Costa',
    avatar: 'https://i.pravatar.cc/80?img=32',
    points: 356,
  }

  const navItems = computed<NavItem[]>(() => [
    { id: 'home', label: t('feed.nav.home'), icon: 'home' },
    { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
    { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
    { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
  ])

  const trends = ref<any[]>([])

  async function fetchTrends () {
    try {
      const response = await getTrendingEvents()
      const data = response.data.events || response.data || []

      trends.value = data.map((evt: any) => ({
        id: evt.id,
        title: evt.name || evt.title || 'Evento sem nome',
        highlight: evt.location || evt.city || t('feed.trending.cityHighlight'),
        baseCount: evt.confirmedCount || 0,
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

  onMounted(() => {
    fetchTrends()
  })
</script>

<template>
  <div class="event-page-layout">
    <!-- Header Global -->
    <FeedTopHeader :user="user">
      <template #center-content>
        <!-- Barra de busca simplificada para manter consistência visual -->
        <div class="header-spacer" />
      </template>
    </FeedTopHeader>

    <section class="layout-shell">
      <!-- Sidebar -->
      <FeedSidebarNav :active="activeNav" class="layout-sidebar" :items="navItems" @select="handleNavSelect" />

      <!-- Conteúdo Principal (Detalhes do Evento) -->
      <main class="layout-main">
        <EventDetails :event-id="eventId" />
      </main>

      <!-- Trends (Lateral Direita) -->
      <FeedTrendsPanel class="layout-trends" :items="displayedTrends" />
    </section>
  </div>
</template>

<style scoped>
.event-page-layout {
  min-height: 100vh;
  background: linear-gradient(142.35deg, rgba(252, 162, 89, 0.07) -1.66%, rgba(255, 98, 159, 0.11) 100.44%);
  display: flex;
  flex-direction: column;
}

.layout-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 240px minmax(0, 720px) 320px;
  grid-template-areas: 'sidebar main trends';
  column-gap: 2rem;
  row-gap: 0;
  width: min(100%, 1280px);
  margin: 0 auto 3.5rem;
  background: transparent;
  align-items: start;
}

.layout-sidebar {
  grid-area: sidebar;
  align-self: start;
  position: sticky;
  top: 120px;
  /* Ajuste conforme altura do header */
}

.layout-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding-top: 1.75rem;
}

.layout-trends {
  grid-area: trends;
  align-self: start;
  position: sticky;
  top: 120px;
}

.header-spacer {
  width: 100%;
  height: 100%;
}

/* Responsividade igual ao Feed */
@media (max-width: 1240px) {
  .layout-shell {
    grid-template-columns: 220px 1fr;
    grid-template-areas: 'sidebar main';
    width: min(100%, 960px);
    padding: 2.75rem 2.25rem 2.5rem;
  }

  .layout-trends {
    display: none;
  }
}

@media (max-width: 960px) {
  .layout-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      'sidebar'
      'main';
    width: 100%;
    padding: 1rem;
  }

  .layout-sidebar {
    position: static;
    margin-bottom: 1rem;
  }
}
</style>
