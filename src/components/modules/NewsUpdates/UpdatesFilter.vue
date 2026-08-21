<script setup lang="ts">
  import type { NewsUpdateCategory } from '@/constants/newsUpdates'

  export type FilterOption = 'all' | NewsUpdateCategory

  defineProps<{
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

  function selectFilter (option: FilterOption) {
    emit('update:filter', option)
  }
</script>

<template>
  <div class="updates-filter-bar" role="toolbar" aria-label="Filtros de Atualizações">
    <div class="filter-chips-container">
      <!-- Todos -->
      <button
        class="filter-chip"
        :class="{ active: currentFilter === 'all' }"
        type="button"
        @click="selectFilter('all')"
      >
        <v-icon icon="mdi-view-grid-outline" size="16" />
        <span>Todos</span>
        <span class="chip-count">{{ counts.all }}</span>
      </button>

      <!-- Novidades / Features -->
      <button
        class="filter-chip chip-feature"
        :class="{ active: currentFilter === 'feature' }"
        type="button"
        @click="selectFilter('feature')"
      >
        <v-icon icon="mdi-star-four-points" size="16" />
        <span>Novidades</span>
        <span class="chip-count">{{ counts.feature }}</span>
      </button>

      <!-- Melhorias / Improvements -->
      <button
        class="filter-chip chip-improvement"
        :class="{ active: currentFilter === 'improvement' }"
        type="button"
        @click="selectFilter('improvement')"
      >
        <v-icon icon="mdi-trending-up" size="16" />
        <span>Melhorias</span>
        <span class="chip-count">{{ counts.improvement }}</span>
      </button>

      <!-- Correções / Fixes -->
      <button
        class="filter-chip chip-fix"
        :class="{ active: currentFilter === 'fix' }"
        type="button"
        @click="selectFilter('fix')"
      >
        <v-icon icon="mdi-shield-check-outline" size="16" />
        <span>Correções & Infra</span>
        <span class="chip-count">{{ counts.fix }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.updates-filter-bar {
  margin-bottom: 2.5rem;
  width: 100%;
}

.filter-chips-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
  padding: 0.25rem 0.25rem 0.75rem;
  scrollbar-width: none;
}

.filter-chips-container::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.15rem;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  color: #475569;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 44px;
}

.filter-chip:hover {
  border-color: rgba(255, 154, 77, 0.4);
  color: #ff5f8f;
  transform: translateY(-1px);
}

.filter-chip.active {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(255, 95, 143, 0.3);
}

.filter-chip.active .chip-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.chip-count {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
}

@media (max-width: 640px) {
  .filter-chips-container {
    gap: 0.5rem;
  }

  .filter-chip {
    padding: 0.5rem 0.9rem;
    font-size: 0.82rem;
  }
}
</style>
