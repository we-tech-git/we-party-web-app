<script setup lang="ts">
  import type { NavItem } from './FeedSidebarNav.vue'
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import EventDetails from './EventDetails.vue'
  import FeedSidebarNav from './FeedSidebarNav.vue'
  import FeedTopHeader from './FeedTopHeader.vue'
  import FeedTrendsPanel from './FeedTrendsPanel.vue'

  defineProps<{
    eventId: string | string[]
  }>()

  const { t } = useI18n()

  // --- Lógica de Layout (Copiada do Feed) ---
  const activeNav = ref('home')

  const user = {
    name: 'Amanda Costa',
    avatar: 'https://i.pravatar.cc/80?img=32',
    points: 356,
  }

  const navItems = computed<NavItem[]>(() => [
    { id: 'home', label: t('feed.nav.home'), icon: 'home' },
    { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
    { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
    { id: 'notifications', label: t('feed.nav.notifications'), icon: 'bell' },
    { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
  ])

  const trends = ref([
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
      <FeedSidebarNav :active="activeNav" class="layout-sidebar" :items="navItems" @select="activeNav = $event" />

      <!-- Conteúdo Principal (Detalhes do Evento) -->
      <main class="layout-main">
        <EventDetails :event-id="eventId" />
      </main>

      <!-- Trends (Lateral Direita) -->
      <FeedTrendsPanel class="layout-trends" :items="trends" />
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
