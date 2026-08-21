<script setup lang="ts">
  import type { FilterOption } from './UpdatesFilter.vue'
  import type { ReleasedNewsUpdate, UpcomingNewsUpdate } from '@/constants/newsUpdates'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
  import { NEWS_UPDATES } from '@/constants/newsUpdates'
  import FeaturedUpdateCard from './FeaturedUpdateCard.vue'
  import UpdatesConversionCta from './UpdatesConversionCta.vue'
  import UpdatesFooter from './UpdatesFooter.vue'
  import UpdatesHeader from './UpdatesHeader.vue'
  import UpdatesHero from './UpdatesHero.vue'
  import UpdatesStatsBar from './UpdatesStatsBar.vue'
  import UpdatesTimeline from './UpdatesTimeline.vue'
  import UpcomingUpdatesSection from './UpcomingUpdatesSection.vue'

  gsap.registerPlugin(ScrollTrigger)

  // ═══════════════════════════════════════════════════════════════
  // DATA COMPUTATIONS
  // ═══════════════════════════════════════════════════════════════
  const released = computed(() =>
    NEWS_UPDATES
      .filter((u): u is ReleasedNewsUpdate => u.status === 'released')
      .toSorted((a, b) => b.releasedAt.localeCompare(a.releasedAt)),
  )

  const featured = computed(() => released.value[0] || null)

  const upcoming = computed(() =>
    NEWS_UPDATES
      .filter((u): u is UpcomingNewsUpdate & { expectedAt: string } =>
        u.status === 'upcoming' && Boolean(u.expectedAt))
      .toSorted((a, b) => a.expectedAt.localeCompare(b.expectedAt)),
  )

  const activeFilter = ref<FilterOption>('all')

  const categoryCounts = computed(() => {
    const all = released.value.length
    const feature = released.value.filter(u => u.category === 'feature').length
    const improvement = released.value.filter(u => u.category === 'improvement').length
    const fix = released.value.filter(u => u.category === 'fix').length
    return { all, feature, improvement, fix }
  })

  // ═══════════════════════════════════════════════════════════════
  // SCROLL TO TIMELINE
  // ═══════════════════════════════════════════════════════════════
  function scrollToTimeline () {
    const el = document.getElementById('updates-timeline-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GSAP SCROLL ANIMATIONS
  // ═══════════════════════════════════════════════════════════════
  const pageContainerRef = ref<HTMLElement | null>(null)
  let gsapCtx: gsap.Context | null = null

  onMounted(() => {
    nextTick(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion || !pageContainerRef.value) return

      gsapCtx = gsap.context(() => {
        // Hero entrance
        gsap.from('.hero-main-content', {
          y: 24,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
        })

        // Floating chips subtle entrance
        gsap.from('.floating-chip', {
          scale: 0.8,
          opacity: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'back.out(1.4)',
          delay: 0.3,
        })

        // Stats bar entrance
        gsap.from('.stats-bar-card', {
          scrollTrigger: {
            trigger: '.stats-bar-card',
            start: 'top 90%',
          },
          y: 20,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
        })

        // Featured card entrance
        gsap.from('.featured-card', {
          scrollTrigger: {
            trigger: '.featured-card',
            start: 'top 85%',
          },
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        })

        // Timeline items entrance
        const items = document.querySelectorAll('.timeline-item')
        for (const item of items) {
          gsap.from(item, {
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
            },
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
          })
        }
      }, pageContainerRef.value)
    })
  })

  onUnmounted(() => {
    if (gsapCtx) {
      gsapCtx.revert()
    }
  })
</script>

<template>
  <div ref="pageContainerRef" class="news-updates-page">
    <!-- Fixed Navigation Header -->
    <UpdatesHeader />

    <main id="main-content">
      <!-- Hero with Social Energy -->
      <UpdatesHero @scroll-to-timeline="scrollToTimeline" />

      <!-- Dynamic Status & Stats Bar -->
      <UpdatesStatsBar
        :released-count="released.length"
        :upcoming-count="upcoming.length"
        active-year="2026"
      />

      <!-- Featured Release Spotlight -->
      <FeaturedUpdateCard
        v-if="featured"
        :update="featured"
      />

      <!-- Editorial Timeline Feed with Filters -->
      <UpdatesTimeline
        :updates="released"
        :current-filter="activeFilter"
        :counts="categoryCounts"
        @update:filter="activeFilter = $event"
      />

      <!-- Upcoming Features (Roadmap) -->
      <UpcomingUpdatesSection
        :upcoming-updates="upcoming"
      />

      <!-- High-Conversion Final CTA -->
      <UpdatesConversionCta />
    </main>

    <!-- Brand Footer -->
    <UpdatesFooter />
  </div>
</template>

<style scoped>
.news-updates-page {
  --primary: #FFB74D;
  --primary-dark: #FF9F3D;
  --secondary: #FF5F8F;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --brand-gradient: linear-gradient(135deg, #FF9A4D 0%, #FF5F8F 100%);

  background: #FFFFFF;
  color: var(--text-main);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 100%;
}

.news-updates-page * {
  box-sizing: border-box;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
