<script setup lang="ts">
  import type { FilterOption } from './UpdatesFilter.vue'
  import type { ReleasedNewsUpdate } from '@/constants/newsUpdates'
  import { computed } from 'vue'
  import UpdatesFilter from './UpdatesFilter.vue'
  import UpdateTimelineItem from './UpdateTimelineItem.vue'

  const props = defineProps<{
    updates: ReleasedNewsUpdate[]
    currentFilter: FilterOption
    counts: {
      all: number
      feature: number
      improvement: number
      fix: number
    }
  }>()

  const emit = defineEmits<{
    (e: 'update:filter', value: FilterOption): void
  }>()

  const filteredUpdates = computed(() => {
    if (props.currentFilter === 'all') {
      return props.updates
    }
    return props.updates.filter(u => u.category === props.currentFilter)
  })

  function handleFilterChange (val: FilterOption) {
    emit('update:filter', val)
  }
</script>

<template>
  <section id="updates-timeline-section" class="updates-timeline-section" aria-labelledby="timeline-heading">
    <div class="timeline-container">
      <!-- Section Header -->
      <div class="timeline-header-block">
        <div class="timeline-eyebrow">
          <v-icon icon="mdi-history" size="16" />
          <span>HISTÓRICO DE EVOLUÇÃO</span>
        </div>
        <h2 id="timeline-heading" class="timeline-heading-title">
          Tudo o que já entregamos para a sua experiência
        </h2>
        <p class="timeline-heading-desc">
          Acompanhe cada etapa de construção da WeParty organizada em ordem cronológica.
        </p>
      </div>

      <!-- Category Filter Toolbar -->
      <UpdatesFilter
        :current-filter="currentFilter"
        :counts="counts"
        @update:filter="handleFilterChange"
      />

      <!-- Timeline Wrapper with Vertical Track -->
      <div class="timeline-track-wrapper">
        <!-- Central vertical line (Desktop) -->
        <div class="timeline-vertical-line" aria-hidden="true" />

        <!-- Timeline Items List -->
        <div v-if="filteredUpdates.length > 0" class="timeline-items-list">
          <UpdateTimelineItem
            v-for="(item, index) in filteredUpdates"
            :key="item.id"
            :update="item"
            :index="index"
            :is-even="index % 2 === 0"
          />
        </div>

        <!-- Empty State if filter yields no result -->
        <div v-else class="timeline-empty-state">
          <div class="empty-icon-box">
            <v-icon icon="mdi-filter-variant-remove" size="32" />
          </div>
          <h3 class="empty-title">Nenhuma atualização nesta categoria</h3>
          <p class="empty-desc">Selecione outro filtro acima para visualizar as novidades.</p>
          <button
            class="btn-reset-filter"
            type="button"
            @click="handleFilterChange('all')"
          >
            Ver todas as novidades
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.updates-timeline-section {
  padding: 4rem 0 5rem;
  background: #FAFAFC;
  position: relative;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.timeline-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
}

/* Header Block */
.timeline-header-block {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 3rem;
}

.timeline-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #ff5f8f;
  background: rgba(255, 95, 143, 0.08);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 1rem;
  letter-spacing: 0.08em;
}

.timeline-heading-title {
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.timeline-heading-desc {
  font-size: 1.05rem;
  color: #64748b;
  line-height: 1.6;
}

/* Track Wrapper */
.timeline-track-wrapper {
  position: relative;
  width: 100%;
}

.timeline-vertical-line {
  position: absolute;
  top: 1.5rem;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: linear-gradient(180deg, #ff9a4d 0%, #ff5f8f 50%, rgba(139, 92, 246, 0.3) 100%);
  border-radius: 999px;
  z-index: 1;
}

.timeline-items-list {
  position: relative;
  z-index: 2;
}

/* Empty State */
.timeline-empty-state {
  text-align: center;
  padding: 4rem 1.5rem;
  background: #ffffff;
  border-radius: 24px;
  border: 1px dashed #cbd5e1;
  max-width: 480px;
  margin: 0 auto;
}

.empty-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.empty-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

.btn-reset-filter {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  font-weight: 700;
  font-size: 0.88rem;
  padding: 0.65rem 1.4rem;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(255, 95, 143, 0.3);
}

@media (max-width: 960px) {
  .timeline-vertical-line {
    display: none;
  }

  .updates-timeline-section {
    padding: 3rem 0;
  }
}
</style>
