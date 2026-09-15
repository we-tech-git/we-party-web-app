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
    schedule: new Date(event.startDate).toLocaleDateString('pt-BR'),
    // Até 2 categorias no card (ex.: "ROCK" + "INDIE") — antes só a primeira era exibida.
    tags: (event.eventInterests || []).slice(0, 2).map((ei: any) => ei.interest?.name).filter(Boolean),
    likes: event._count?.likes || 0,
    comments: event._count?.comments || 0,
  })))

  function goToEvent (id: string) {
    router.push(`/event/${id}`)
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
          <div v-if="card.tags.length > 0" class="if-tags">
            <span v-for="tag in card.tags" :key="tag" class="if-tag">{{ tag }}</span>
          </div>
        </div>
        <div class="if-footer">
          <h3 class="if-card-title">{{ card.title }}</h3>
          <div class="if-meta">
            <span class="if-date">📅 {{ card.schedule }}</span>
            <template v-if="card.location">
              <span class="if-dot">·</span>
              <span class="if-location">📍 {{ card.location }}</span>
            </template>
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

/* Mesmo estilo/posição das interest-tags do FeedCard.vue (.interest-tags):
   pill translúcida no rodapé da imagem, não no topo. */
.if-tags {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.if-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.55rem;
  border-radius: 14px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
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
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  color: var(--color-text-muted);
  overflow: hidden;
}

.if-date {
  flex-shrink: 0;
}

.if-dot {
  flex-shrink: 0;
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
