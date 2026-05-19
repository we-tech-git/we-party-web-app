<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import router from '@/router'

  interface TrendItem {
    id: number
    title: string
    highlight: string
    engagement: string
  }

  const props = defineProps<{
    items: TrendItem[]
    loading?: boolean
  }>()

  const { t } = useI18n()

  const INITIAL_COUNT = 5
  const visibleCount = ref(INITIAL_COUNT)

  const visibleItems = computed(() => props.items.slice(0, visibleCount.value))
  const hasMore = computed(() => props.items.length > visibleCount.value)
  const isExpanded = computed(() => visibleCount.value > INITIAL_COUNT)

  function showMore () {
    visibleCount.value += 5
  }

  function showLess () {
    visibleCount.value = INITIAL_COUNT
  }

  function goToMainEvent (eventItem: TrendItem) {
    router.push(`/private/event/${eventItem.id}`)
  }

</script>

<template>
  <aside class="feed-trends">
    <header class="head">
      <h2>{{ t('feed.trending.title') }}</h2>
      <p>{{ t('feed.trending.subtitle') }}</p>
    </header>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="trends-skeleton">
      <div v-for="n in 5" :key="n" class="skeleton-item">
        <div class="skeleton-label" />
        <div class="skeleton-title" />
        <div class="skeleton-meta" />
      </div>
    </div>

    <!-- Trends List -->
    <ul v-else>
      <li v-for="item in visibleItems" :key="item.id">
        <span class="label">{{ item.highlight }}</span>
        <button class="main-trending-button" @click="goToMainEvent(item)">{{ item.title }}</button>
        <span class="meta">{{ item.engagement }}</span>
      </li>
    </ul>

    <div v-if="!loading" class="trends-actions">
      <button v-if="hasMore" class="more" type="button" @click="showMore">
        <i class="mdi mdi-chevron-down" />
        Mostrar mais
      </button>
      <button v-if="isExpanded" class="less" type="button" @click="showLess">
        <i class="mdi mdi-chevron-up" />
        Mostrar menos
      </button>
    </div>
  </aside>
</template>

<style scoped>
.feed-trends {
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 0 0 20px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  min-width: 280px;
}

.head h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #272c4b;
}

.head p {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  color: #9097b4;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

li {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0;
}

li:last-of-type {
  border-bottom: none;
}

.label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #ff5fa6;
  font-weight: 600;
}

strong {
  color: #2c3154;
  font-size: 1rem;
}

.meta {
  font-size: 0.82rem;
  color: #9ca2ba;
}

.main-trending-button {
  text-align: left;
  font-weight: 700;
}

.main-trending-button:hover {
  text-decoration: underline;
}

.trends-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.more,
.less {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.35rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, rgba(255, 138, 91, 0.15), rgba(255, 95, 166, 0.15));
  color: #ff5fa6;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.more i,
.less i {
  font-size: 1rem;
}

.more:hover,
.less:hover {
  background: linear-gradient(135deg, rgba(255, 138, 91, 0.25), rgba(255, 95, 166, 0.25));
}

.less {
  background: linear-gradient(135deg, rgba(158, 158, 158, 0.15), rgba(120, 120, 120, 0.15));
  color: #666;
}

.less:hover {
  background: linear-gradient(135deg, rgba(158, 158, 158, 0.25), rgba(120, 120, 120, 0.25));
}

/* Skeleton Loading */
.trends-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.skeleton-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0;
}

.skeleton-label,
.skeleton-title,
.skeleton-meta {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-label {
  width: 40%;
  height: 12px;
}

.skeleton-title {
  width: 85%;
  height: 18px;
}

.skeleton-meta {
  width: 30%;
  height: 12px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1240px) {
  .feed-trends {
    position: static;
    min-width: auto;
    margin-left: 0;
    order: 3;
  }
}

@media (max-width: 960px) {
  .feed-trends {
    display: none;
  }
}
</style>
