<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import FeedCard from '@/components/modules/Feed/FeedCard.vue'

  const props = defineProps<{
    events: any[]
  }>()

  const { t } = useI18n()

  /**
   * Mapeia o shape fixo de `getDefaultEventSelect()` (backend) pras props
   * de `FeedCard.vue`. Diferente do `mapEventToFeedItem` de `Feed.vue` —
   * que precisa de fallbacks pra várias fontes heterogêneas (feed
   * agregado, integrações externas) — aqui a origem é sempre
   * `/interest/:id/page`, um único shape conhecido, então o mapeamento é
   * direto, sem a bateria de fallbacks.
   */
  const cards = computed(() => props.events.map(event => ({
    id: event.id,
    banner: event.images?.[0]?.url || '',
    hostName: event.creator?.name || 'Organizador',
    hostAvatar: event.creator?.profileImage || '',
    title: event.title,
    description: event.description || '',
    schedule: new Date(event.startDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    location: event.location,
    confirmed: event._count?.attendances || 0,
    interested: 0,
    likes: event._count?.likes || 0,
    commentsCount: event._count?.comments || 0,
    interests: (event.eventInterests || []).map((ei: any) => ei.interest?.name).filter(Boolean),
    eventData: event,
  })))
</script>

<template>
  <section v-if="cards.length > 0" aria-labelledby="featured-heading" class="if-section">
    <h2 id="featured-heading" class="if-title">{{ t('interestPage.featured.title') }}</h2>
    <div class="if-grid">
      <FeedCard
        v-for="card in cards"
        :key="card.id"
        v-bind="card"
      />
    </div>
  </section>
</template>

<style scoped>
.if-section {
  max-width: 720px;
  margin: 2rem auto 0;
  padding: 0 1.25rem;
}

.if-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #16171f;
  margin: 0 0 0.75rem;
}

.if-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
