<script setup lang="ts">
  import type { EventDateFilter } from '@/utils/eventDateFilters'
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { EVENT_DATE_FILTERS, matchesDateFilter } from '@/utils/eventDateFilters'

  const props = defineProps<{
    events: any[]
  }>()

  const router = useRouter()
  const { t } = useI18n()

  const activeFilter = ref<EventDateFilter>('all')

  /**
   * Todos os filtros aparecem (com contagem) quando há 2+ eventos; os que não
   * têm nenhum evento ficam desabilitados — assim o usuário vê que "nada rola
   * esse fim de semana" em vez de achar que a página não tem filtro.
   */
  const filterOptions = computed(() => EVENT_DATE_FILTERS.map(key => {
    const count = props.events.filter(evt => matchesDateFilter(evt.startDate, key)).length
    return { key, count, disabled: key !== 'all' && count === 0 }
  }))

  const showFilters = computed(() => props.events.length > 1)

  // Se a lista mudar e o filtro ativo ficar sem eventos, volta pra "Todos".
  const effectiveFilter = computed(() =>
    filterOptions.value.some(option => option.key === activeFilter.value && !option.disabled) ? activeFilter.value : 'all',
  )

  const filteredEvents = computed(() =>
    props.events.filter(evt => matchesDateFilter(evt.startDate, effectiveFilter.value)),
  )

  /**
   * Badge de urgência — cálculo do front a partir de `startDate`, sem campo
   * novo de backend (decisão do plano): ≤7 dias vermelho, 8–30 laranja,
   * >30 neutro.
   */
  function urgency (startDate: string): 'soon' | 'near' | 'far' {
    const days = (new Date(startDate).getTime() - Date.now()) / 86_400_000
    if (days <= 7) return 'soon'
    if (days <= 30) return 'near'
    return 'far'
  }

  function daysLabel (startDate: string): string {
    const days = Math.max(0, Math.ceil((new Date(startDate).getTime() - Date.now()) / 86_400_000))
    if (days === 0) return t('interestPage.upcoming.today')
    if (days === 1) return t('interestPage.upcoming.tomorrow')
    return t('interestPage.upcoming.daysLeft', { days })
  }

  const items = computed(() => filteredEvents.value.map(evt => {
    const date = new Date(evt.startDate)
    return {
      ...evt,
      urgency: urgency(evt.startDate),
      daysLabel: daysLabel(evt.startDate),
      day: Number.isNaN(date.getTime()) ? '' : date.getDate(),
      month: Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
      time: Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  }))

  function goToEvent (id: string) {
    router.push(`/event/${id}`)
  }
</script>

<template>
  <section v-if="events.length > 0" aria-labelledby="upcoming-heading" class="iu-section">
    <p class="iu-kicker">{{ t('interestPage.upcoming.kicker') }}</p>
    <h2 id="upcoming-heading" class="iu-title">{{ t('interestPage.upcoming.title') }}</h2>

    <v-chip-group
      v-if="showFilters"
      :aria-label="t('interestPage.upcoming.filtersLabel')"
      class="iu-filters"
      mandatory
      :model-value="effectiveFilter"
      @update:model-value="activeFilter = $event ?? 'all'"
    >
      <v-chip
        v-for="option in filterOptions"
        :key="option.key"
        class="iu-filter"
        color="primary"
        :data-testid="`interest-upcoming-filter-${option.key}`"
        :disabled="option.disabled"
        size="default"
        :value="option.key"
        variant="outlined"
      >
        {{ t(`interestPage.upcoming.filters.${option.key}`) }}
        <span class="iu-filter-count">{{ option.count }}</span>
      </v-chip>
    </v-chip-group>

    <div class="iu-list">
      <button
        v-for="item in items"
        :key="item.id"
        class="iu-item"
        type="button"
        @click="goToEvent(item.id)"
      >
        <div class="iu-date-box">
          <span class="iu-date-month">{{ item.month }}</span>
          <span class="iu-date-day">{{ item.day }}</span>
        </div>

        <div class="iu-item-info">
          <span class="iu-item-title">{{ item.title }}</span>
          <span class="iu-item-meta">
            <template v-if="item.location">📍 {{ item.location }} ·</template>
            {{ item.time }}
          </span>
        </div>

        <span class="iu-urgency" :class="`iu-urgency--${item.urgency}`">⏱ {{ item.daysLabel }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.iu-section {
  max-width: 810px;
  margin: 2.5rem auto 0;
  padding: 0 1.25rem;
}

.iu-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f978a3;
}

.iu-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0 0 1.1rem;
}

/* Filtros de data: Vuetify `v-chip-group`; o selecionado usa o gradiente da marca */
.iu-filters {
  margin: -0.4rem 0 0.9rem;
}

/* `!important` nas cores de texto: o Vuetify aplica `color="primary"` no texto do
   chip com !important, o que deixava rosa sobre o gradiente rosa (ilegível). */
.iu-filter {
  font-weight: 700;
  border-color: var(--color-primary);
  background: #fff;
  color: var(--color-dark) !important;
  box-shadow: none;
}

.iu-filter.v-chip--selected {
  background: var(--gradient-primary);
  border-color: transparent;
  color: #fff !important;
}

/* Sem o "véu" que o Vuetify põe por cima do chip selecionado (desbotava o gradiente) */
.iu-filter.v-chip--selected :deep(.v-chip__overlay) {
  opacity: 0;
}

.iu-filter.v-chip--disabled {
  border-color: rgba(0, 0, 0, 0.14);
  color: var(--color-text-muted) !important;
  opacity: 0.7;
}

.iu-filter-count {
  margin-left: 0.4rem;
  font-size: 0.72rem;
  opacity: 0.75;
}

.iu-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.iu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
  width: 100%;
  background: #fff;
  border: none;
  border-radius: var(--radius-lg);
  padding: 0.8rem 1rem;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.iu-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.iu-date-box {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
}

.iu-date-month {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.iu-date-day {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1;
}

.iu-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.iu-item-title {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--color-dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iu-item-meta {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iu-urgency {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-full);
}

.iu-urgency--soon {
  background: #ffdfc7;
  color: #c1571c;
}

.iu-urgency--near {
  background: #fdecc8;
  color: #b9822b;
}

.iu-urgency--far {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-light);
}

@media (max-width: 480px) {
  .iu-urgency {
    display: none;
  }
}
</style>
