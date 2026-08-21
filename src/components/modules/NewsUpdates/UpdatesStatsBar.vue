<script setup lang="ts">
  defineProps<{
    releasedCount: number
    upcomingCount: number
    activeYear?: string | number
  }>()
</script>

<template>
  <section class="stats-bar-section" aria-label="Métricas de Atualizações">
    <div class="stats-container">
      <div class="stats-bar-card">
        <!-- Item 1: Ano -->
        <div class="stat-item">
          <div class="stat-icon-wrapper year">
            <v-icon icon="mdi-calendar-range" size="18" />
          </div>
          <div class="stat-meta">
            <span class="stat-value">{{ activeYear || '2026' }}</span>
            <span class="stat-label">Ano de Lançamentos</span>
          </div>
        </div>

        <div class="stat-divider" aria-hidden="true" />

        <!-- Item 2: Novidades Entregues -->
        <div class="stat-item">
          <div class="stat-icon-wrapper releases">
            <v-icon icon="mdi-rocket-launch-outline" size="18" />
          </div>
          <div class="stat-meta">
            <span class="stat-value">{{ releasedCount }} novidades</span>
            <span class="stat-label">Entregues e no ar</span>
          </div>
        </div>

        <div class="stat-divider" aria-hidden="true" />

        <!-- Item 3: Em Roadmap -->
        <div class="stat-item">
          <div class="stat-icon-wrapper upcoming">
            <v-icon icon="mdi-creation" size="18" />
          </div>
          <div class="stat-meta">
            <span class="stat-value">{{ upcomingCount }} em construção</span>
            <span class="stat-label">Próximos recursos</span>
          </div>
        </div>

        <div class="stat-divider" aria-hidden="true" />

        <!-- Item 4: Status do Produto -->
        <div class="stat-item">
          <div class="stat-icon-wrapper status">
            <span class="status-pulse-dot" />
          </div>
          <div class="stat-meta">
            <span class="stat-value live-text">Evolução Contínua</span>
            <span class="stat-label">Deploy frequente</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-bar-section {
  padding: 0 0 3rem;
  position: relative;
  z-index: 2;
}

.stats-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.stats-bar-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(255, 183, 77, 0.2);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrapper.year {
  background: #fff0f3;
  color: #ff5f8f;
}

.stat-icon-wrapper.releases {
  background: #fff7ed;
  color: #ea580c;
}

.stat-icon-wrapper.upcoming {
  background: #f5f3ff;
  color: #7c3aed;
}

.stat-icon-wrapper.status {
  background: #ecfdf5;
}

.status-pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.6; }
}

.stat-meta {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}

.stat-value.live-text {
  color: #059669;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(226, 232, 240, 0.9);
}

@media (max-width: 960px) {
  .stats-bar-card {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
    padding: 1.25rem;
  }

  .stat-divider {
    display: none;
  }
}

@media (max-width: 520px) {
  .stats-bar-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
