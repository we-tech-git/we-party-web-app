<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import router from '@/router'

  interface TrendItem {
    id: number
    title: string
    highlight: string
    engagement: string
  }

  defineProps<{
    items: TrendItem[]
  }>()

  const { t } = useI18n()

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

    <ul>
      <li v-for="item in items" :key="item.id">
        <span class="label">{{ item.highlight }}</span>
        <button class="main-trending-button" @click="goToMainEvent(item)">{{ item.title }}</button>
        <span class="meta">{{ item.engagement }}</span>
      </li>
    </ul>

    <button class="more" type="button">{{ t('feed.trending.more') }}</button>
  </aside>
</template>

<style scoped>
.feed-trends {
  position: sticky;
  top: var(--feed-sticky-offset, 120px);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  min-width: 280px;
  margin-left: 6rem;

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

.more {
  align-self: flex-start;
  padding: 0.55rem 1.35rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, rgba(255, 138, 91, 0.15), rgba(255, 95, 166, 0.15));
  color: #ff5fa6;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.more:hover {
  background: linear-gradient(135deg, rgba(255, 138, 91, 0.25), rgba(255, 95, 166, 0.25));
}

@media (max-width: 1240px) {
  .feed-trends {
    position: static;
    min-width: auto;
    order: 3;
  }
}

@media (max-width: 960px) {
  .feed-trends {
    display: none;
  }
}
</style>
