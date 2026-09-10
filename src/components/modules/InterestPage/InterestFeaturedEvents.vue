<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'

  const props = defineProps<{
    events: any[]
  }>()

  const router = useRouter()
  const { t } = useI18n()

  /**
   * Mesmo tratamento de mídia do `discover-event-card` da landing page
   * (`LandingPage.vue`) — capa com gradiente de leitura por baixo do título
   * — só que com dado real (`getDefaultEventSelect()`), não os eventos de
   * demonstração fixos daquela seção.
   */
  const cards = computed(() => props.events.map(event => ({
    id: event.id,
    image: event.images?.[0]?.url || '',
    title: event.title,
    location: event.location,
    schedule: new Date(event.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    interestName: (event.eventInterests || [])[0]?.interest?.name,
    likes: event._count?.likes || 0,
    comments: event._count?.comments || 0,
  })))

  function goToEvent (id: string) {
    router.push(`/private/event/${id}`)
  }
</script>

<template>
  <section v-if="cards.length > 0" aria-labelledby="featured-heading" class="if-section">
    <p class="if-kicker">{{ t('interestPage.featured.kicker') }}</p>
    <h2 id="featured-heading" class="if-title">{{ t('interestPage.featured.title') }}</h2>

    <div class="if-rail">
      <button
        v-for="card in cards"
        :key="card.id"
        class="if-card"
        type="button"
        @click="goToEvent(card.id)"
      >
        <div class="if-media" :style="card.image ? { backgroundImage: `url(${card.image})` } : {}">
          <span v-if="card.interestName" class="if-tag">{{ card.interestName }}</span>
        </div>
        <div class="if-footer">
          <h3 class="if-card-title">{{ card.title }}</h3>
          <div class="if-meta">
            <span>📅 {{ card.schedule }}</span>
            <span v-if="card.location" class="if-location">📍 {{ card.location }}</span>
          </div>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.if-section {
  max-width: 810px;
  margin: 2.5rem auto 0;
  padding: 0 1.25rem;
}

.if-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f978a3;
}

.if-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0 0 1.1rem;
}

.if-rail {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.if-card {
  display: flex;
  flex-direction: column;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  min-width: 0;
}

.if-media {
  position: relative;
  height: 200px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: linear-gradient(160deg, #2c2c34, #0c0c10);
  background-size: cover;
  background-position: center;
  transition: transform 0.2s ease;
}

.if-card:hover .if-media {
  transform: translateY(-2px);
}

.if-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.78) 100%);
}

.if-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--radius-full);
  padding: 0.3rem 0.6rem;
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--color-dark);
}

.if-footer {
  padding: 0.65rem 0.1rem 0;
}

.if-card-title {
  margin: 0 0 0.25rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--color-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.if-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.76rem;
  color: var(--color-text-muted);
}

.if-location {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .if-rail {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .if-rail {
    grid-template-columns: 1fr;
  }

  .if-media {
    height: 170px;
  }
}
</style>
