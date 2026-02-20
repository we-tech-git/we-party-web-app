<script setup lang="ts">
  import type { NavItem } from '@/types/navigation'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { getEventById, getTrendingEvents } from '@/api/event'
  import { useAuth } from '@/composables/useAuth'
  import { useEventsStore } from '@/stores/events'
  import EventDetails from './EventDetails.vue'
  import FeedSidebarNav from './FeedSidebarNav.vue'
  import FeedTopHeader from './FeedTopHeader.vue'
  import FeedTrendsPanel from './FeedTrendsPanel.vue'

  const props = defineProps<{
    eventId: string | string[]
  }>()

  const { t } = useI18n()
  const router = useRouter()
  const eventsStore = useEventsStore()
  const { loggedUser, userDisplayName } = useAuth()

  // Background image from event
  const eventBannerUrl = ref('')
  const eventTitle = ref('')
  const isLoaded = ref(false)

  // Parallax effect
  const scrollY = ref(0)
  const parallaxOffset = computed(() => scrollY.value * 0.3)

  function handleScroll () {
    scrollY.value = window.scrollY
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    fetchEventBanner()
    fetchTrends()

    // Trigger entrance animation
    setTimeout(() => {
      isLoaded.value = true
    }, 100)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  async function fetchEventBanner () {
    try {
      const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
      if (!id) return

      const response = await getEventById(id)
      const data = response?.data?.event || response?.data || response

      // Extract banner URL
      const photos = data?.photos
      let photoUrl = ''
      if (photos) {
        if (Array.isArray(photos) && photos.length > 0) {
          photoUrl = photos[0]
        } else if (typeof photos === 'object' && photos !== null) {
          const keys = Object.keys(photos)
          if (keys.length > 0) {
            const firstKey = keys[0]
            if (firstKey) {
              photoUrl = (photos as Record<string, string>)[firstKey] || ''
            }
          }
        }
      }

      eventBannerUrl.value = data?.bannerUrl || data?.banner || photoUrl || ''
      eventTitle.value = data?.name || data?.title || ''
    } catch (error) {
      console.error('Error fetching event banner:', error)
    }
  }

  watch(() => props.eventId, () => {
    fetchEventBanner()
  })

  // Navigation logic
  const activeNav = ref('')

  function handleNavSelect (id: string) {
    activeNav.value = id
    if (id === 'home' || id === 'top-events' || id === 'favorites') {
      router.push('/private/feed')
    } else if (id === 'profile') {
      router.push('/private/profile')
    }
  }

  function handleBackNavigation () {
    router.back()
  }

  const user = computed(() => ({
    name: userDisplayName.value,
    avatar: loggedUser.value?.profileImage || '',
  }))

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
    }).toSorted((a: any, b: any) => b.rawCount - a.rawCount)
  })
</script>

<template>
  <div class="event-page-layout" :class="{ loaded: isLoaded }">
    <!-- Immersive Background -->
    <div class="immersive-bg">
      <!-- Blurred Background Image -->
      <div
        v-if="eventBannerUrl"
        class="bg-image"
        :style="{
          backgroundImage: `url(${eventBannerUrl})`,
          transform: `translateY(${parallaxOffset}px) scale(1.1)`
        }"
      />
      <div class="bg-overlay" />
      <div class="bg-gradient" />

      <!-- Animated Particles -->
      <div class="particles">
        <div
          v-for="i in 20"
          :key="i"
          class="particle"
          :style="{
            '--delay': `${Math.random() * 5}s`,
            '--duration': `${3 + Math.random() * 4}s`,
            '--x': `${Math.random() * 100}%`,
            '--size': `${2 + Math.random() * 4}px`
          }"
        />
      </div>

      <!-- Decorative Elements -->
      <div class="deco-circle deco-1" />
      <div class="deco-circle deco-2" />
      <div class="deco-circle deco-3" />
    </div>

    <!-- Floating Event Title Badge -->
    <div v-if="eventTitle" class="floating-title-badge">
      <span class="badge-icon">🎉</span>
      <span class="badge-text">{{ eventTitle }}</span>
    </div>

    <!-- Header Global -->
    <FeedTopHeader :user="user">
      <template #center-content>
        <div class="header-spacer" />
      </template>
    </FeedTopHeader>

    <section class="layout-shell">
      <!-- Sidebar -->
      <FeedSidebarNav :active="activeNav" class="layout-sidebar" :items="navItems" @select="handleNavSelect" />

      <!-- Main Content -->
      <main class="layout-main">
        <!-- Breadcrumb Navigation -->
        <div class="breadcrumb-nav">
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
            Detalhes do evento
          </span>
        </div>

        <EventDetails :event-id="eventId" />
      </main>

      <!-- Trends Panel -->
      <FeedTrendsPanel class="layout-trends" :items="displayedTrends" />
    </section>
  </div>
</template>

<style scoped>
.event-page-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* Immersive Background */
.immersive-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.bg-image {
  position: absolute;
  inset: -50px;
  background-size: cover;
  background-position: center;
  filter: blur(60px) saturate(1.5);
  opacity: 0.4;
  transition: opacity 1s ease, transform 0.1s linear;
}

.event-page-layout:not(.loaded) .bg-image {
  opacity: 0;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.85) 0%,
      rgba(255, 248, 250, 0.9) 50%,
      rgba(255, 245, 247, 0.85) 100%);
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 186, 75, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 95, 166, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
}

/* Animated Particles */
.particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  bottom: -20px;
  left: var(--x);
  width: var(--size);
  height: var(--size);
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.6), rgba(255, 95, 166, 0.6));
  border-radius: 50%;
  animation: floatUp var(--duration) ease-in-out infinite;
  animation-delay: var(--delay);
  opacity: 0;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }

  10% {
    opacity: 0.8;
  }

  90% {
    opacity: 0.8;
  }

  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}

/* Decorative Circles */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  animation: fadeIn 1s ease forwards;
}

.event-page-layout.loaded .deco-circle {
  opacity: 1;
}

.deco-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, rgba(255, 186, 75, 0.2) 0%, transparent 70%);
  animation: pulse 8s ease-in-out infinite, fadeIn 1s ease forwards;
  animation-delay: 0s, 0.2s;
}

.deco-2 {
  width: 300px;
  height: 300px;
  bottom: 10%;
  left: -50px;
  background: radial-gradient(circle, rgba(255, 95, 166, 0.2) 0%, transparent 70%);
  animation: pulse 10s ease-in-out infinite, fadeIn 1s ease forwards;
  animation-delay: 2s, 0.4s;
}

.deco-3 {
  width: 200px;
  height: 200px;
  top: 40%;
  right: 5%;
  background: radial-gradient(circle, rgba(147, 112, 219, 0.15) 0%, transparent 70%);
  animation: pulse 6s ease-in-out infinite, fadeIn 1s ease forwards;
  animation-delay: 1s, 0.6s;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Floating Title Badge */
.floating-title-badge {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 250, 0.95) 100%);
  border-radius: 50px;
  box-shadow: 0 10px 40px rgba(255, 95, 166, 0.2);
  border: 1px solid rgba(255, 186, 75, 0.3);
  z-index: 100;
  opacity: 0;
  animation: slideDownFadeIn 0.6s ease forwards;
  animation-delay: 0.5s;
  backdrop-filter: blur(10px);
}

.badge-icon {
  font-size: 1.25rem;
  animation: bounce 2s ease-in-out infinite;
}

.badge-text {
  font-weight: 700;
  font-size: 0.9rem;
  color: #2d2f55;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes slideDownFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

/* Layout Shell */
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
  position: relative;
  z-index: 1;
}

.layout-sidebar {
  grid-area: sidebar;
  align-self: start;
  position: sticky;
  top: 140px;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideInLeft 0.5s ease forwards;
  animation-delay: 0.3s;
}

.layout-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding-top: 1.75rem;
  opacity: 0;
  transform: translateY(30px);
  animation: slideUp 0.6s ease forwards;
  animation-delay: 0.2s;
}

.layout-trends {
  grid-area: trends;
  align-self: start;
  position: sticky;
  top: 140px;
  opacity: 0;
  transform: translateX(20px);
  animation: slideInRight 0.5s ease forwards;
  animation-delay: 0.4s;
}

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.header-spacer {
  width: 100%;
  height: 100%;
}

/* Responsive */
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

  .floating-title-badge {
    display: none;
  }
}

/* Breadcrumb Styles */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  width: fit-content;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(118, 59, 90, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  z-index: 10;
}

.breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  border: none;
  background: rgba(255, 95, 166, 0.1);
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.breadcrumb-back:hover {
  background: rgba(255, 95, 166, 0.18);
  transform: translateX(-2px);
}

.back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #fff;
  color: #ff5fa6;
  box-shadow: 0 2px 6px rgba(255, 95, 166, 0.15);
}

.breadcrumb-separator {
  color: #c4c9e0;
  display: flex;
  align-items: center;
}

.breadcrumb-current {
  color: #2d2f55;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.35rem 0.8rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
}

@media (max-width: 768px) {
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
    border-radius: 10px;
    font-size: 0.8rem;
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

@media (max-width: 960px) {
  .layout-shell {
    grid-template-columns: 1fr;
    grid-template-areas: 'main';
    width: 100%;
    padding: 1rem 1rem 6rem;
  }

  .layout-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    z-index: 1000;
    transform: none;
    opacity: 1;
    animation: none;
  }

  .deco-1,
  .deco-2,
  .deco-3 {
    display: none;
  }

  .particles {
    display: none;
  }
}

@media (max-width: 640px) {
  .layout-shell {
    padding: 0.5rem 0.75rem 6rem;
  }
}
</style>
