<script setup lang="ts">
  /**
   * Grid de eventos do perfil de terceiro (curtidos/confirmados), separado em
   * "Próximos" e "Já rolou". Cada card mostra dia da semana + horário e uma
   * etiqueta de proximidade ("Hoje", "Amanhã", "Em 3 dias"); o que já passou
   * fica esmaecido. Read-only — o clique só abre o evento.
   *
   * Os títulos das seções só aparecem quando há os dois grupos: com um grupo
   * só, o título seria ruído.
   */
  import type { LikedEventItem } from '@/utils/profileEvents'
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import EventMiniCard from '@/components/UI/EventMiniCard/EventMiniCard.vue'
  import { formatEventDateLabel, getEventTiming, partitionByTiming } from '@/utils/eventTiming'

  const props = defineProps<{
    items: LikedEventItem[]
  }>()

  const emit = defineEmits<{
    open: [id: string | number]
  }>()

  const { t, locale } = useI18n()

  // Só os grupos que têm evento; `past` é o que esmaece o card.
  const sections = computed(() => {
    const { upcoming, past } = partitionByTiming(props.items)
    return [
      { key: 'upcoming', items: upcoming, past: false },
      { key: 'past', items: past, past: true },
    ].filter(section => section.items.length > 0)
  })
  const showHeadings = computed(() => sections.value.length > 1)

  function dateLabel (item: LikedEventItem) {
    return formatEventDateLabel(item.startDate, locale.value, t('profile.likedEvents.soon'))
  }

  function tagFor (item: LikedEventItem) {
    const timing = getEventTiming(item.startDate)
    switch (timing.kind) {
      case 'today': {
        return t('profile.public.timing.today')
      }
      case 'tomorrow': {
        return t('profile.public.timing.tomorrow')
      }
      case 'soon': {
        return t('profile.public.timing.inDays', { days: timing.days ?? 0 })
      }
      case 'past': {
        return t('profile.public.timing.ended')
      }
      default: {
        return ''
      }
    }
  }
</script>

<template>
  <div class="event-sections">
    <section
      v-for="group in sections"
      :key="group.key"
      class="event-section"
      :data-testid="`public-profile-events-${group.key}`"
    >
      <h3 v-if="showHeadings" class="event-section__title">
        {{ t(`profile.public.sections.${group.key}`) }}
        <span class="event-section__count">{{ group.items.length }}</span>
      </h3>

      <div class="mini-cards-grid">
        <EventMiniCard
          v-for="item in group.items"
          :key="item.id"
          :banner-url="item.banner"
          :date-label="dateLabel(item)"
          :location="item.location || t('profile.likedEvents.locationUndefined')"
          :past="group.past"
          :tag="tagFor(item)"
          :title="item.title"
          @click="emit('open', item.id)"
        >
          <template #stats>
            <span class="mini-stat">{{ item.confirmed }} {{ t('profile.public.confirmedCount') }}</span>
          </template>
        </EventMiniCard>
      </div>
    </section>
  </div>
</template>

<style scoped>
.event-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.event-section__title {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-dark);
}

.event-section__count {
  margin-left: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.mini-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.mini-stat {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 700;
}
</style>
