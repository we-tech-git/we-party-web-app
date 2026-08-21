<script setup lang="ts">
  import type { UpcomingNewsUpdate } from '@/constants/newsUpdates'
  import UpdateVisualMockup from './UpdateVisualMockup.vue'

  defineProps<{
    upcomingUpdates: (UpcomingNewsUpdate & { expectedAt: string })[]
  }>()

  const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

  function parseDate (iso: string) {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year!, month! - 1, day!)
  }
</script>

<template>
  <section v-if="upcomingUpdates.length > 0" class="upcoming-section" aria-labelledby="upcoming-heading">
    <div class="upcoming-container">
      <!-- Section Header -->
      <div class="upcoming-header">
        <div class="upcoming-eyebrow">
          <v-icon icon="mdi-creation" size="16" />
          <span>ROADMAP & FUTURO</span>
        </div>
        <h2 id="upcoming-heading" class="upcoming-title">
          O que vem por aí na We Party
        </h2>
        <p class="upcoming-subtitle">
          Estamos preparando novas formas de descobrir, compartilhar e viver festas inesquecíveis. Veja o que já está na bancada de desenvolvimento:
        </p>
      </div>

      <!-- Upcoming Cards Grid -->
      <div class="upcoming-grid">
        <article
          v-for="item in upcomingUpdates"
          :key="item.id"
          class="upcoming-card"
        >
          <div class="upcoming-card-top">
            <span class="eta-badge">
              <v-icon icon="mdi-calendar-clock" size="14" />
              <span>Previsão: {{ monthYear.format(parseDate(item.expectedAt)) }}</span>
            </span>

            <span class="wip-pill">
              <span class="wip-dot" />
              <span>Em desenvolvimento</span>
            </span>
          </div>

          <h3 class="upcoming-card-title">{{ item.title }}</h3>
          <p class="upcoming-card-desc">{{ item.description }}</p>

          <ul v-if="item.highlights?.length" class="upcoming-highlights">
            <li v-for="hl in item.highlights" :key="hl">
              <v-icon icon="mdi-sparkles" size="14" color="#8b5cf6" />
              <span>{{ hl }}</span>
            </li>
          </ul>

          <div class="upcoming-mockup-slot">
            <UpdateVisualMockup :update-id="item.id" :category="item.category" />
          </div>
        </article>

        <!-- Conceptual Mystery Teaser Card -->
        <article class="upcoming-teaser-card">
          <div class="teaser-content">
            <div class="teaser-icon-glow">
              <v-icon icon="mdi-party-popper" size="32" />
            </div>
            <h3 class="teaser-title">E muito mais por vir...</h3>
            <p class="teaser-desc">
              Novas ferramentas para criadores de eventos, integração com playlists e experiências imersivas estão no nosso horizonte.
            </p>
            <span class="teaser-badge">Fique ligado</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.upcoming-section {
  padding: 5rem 0;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF5F8 50%, #FFFFFF 100%);
  position: relative;
  overflow: hidden;
}

.upcoming-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
}

/* Header */
.upcoming-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 3.5rem;
}

.upcoming-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #7c3aed;
  background: rgba(139, 92, 246, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 1rem;
  letter-spacing: 0.08em;
}

.upcoming-title {
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.25;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.upcoming-subtitle {
  font-size: 1.05rem;
  color: #64748b;
  line-height: 1.6;
}

/* Grid */
.upcoming-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;
}

.upcoming-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px dashed rgba(139, 92, 246, 0.35);
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.upcoming-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 16px 40px rgba(139, 92, 246, 0.1);
}

.upcoming-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.eta-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #7c3aed;
  background: rgba(139, 92, 246, 0.1);
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
}

.wip-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #c2410c;
  background: #fff7ed;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
}

.wip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f97316;
  animation: pulse-orange 1.5s infinite;
}

@keyframes pulse-orange {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
}

.upcoming-card-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.upcoming-card-desc {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.upcoming-highlights {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.upcoming-highlights li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #334155;
  font-weight: 500;
}

.upcoming-mockup-slot {
  margin-top: auto;
  border-radius: 16px;
  overflow: hidden;
}

/* Teaser Card */
.upcoming-teaser-card {
  background: radial-gradient(120% 120% at 50% 10%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 240, 245, 0.85) 100%);
  border: 1px solid rgba(255, 154, 77, 0.25);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
}

.teaser-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.teaser-icon-glow {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 8px 24px rgba(255, 95, 143, 0.35);
}

.teaser-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.6rem;
}

.teaser-desc {
  font-size: 0.92rem;
  color: #64748b;
  line-height: 1.6;
  max-width: 280px;
  margin-bottom: 1.5rem;
}

.teaser-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: #ffffff;
  color: #ff5f8f;
  border: 1px solid rgba(255, 95, 143, 0.3);
  padding: 0.4rem 1rem;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

@media (max-width: 640px) {
  .upcoming-grid {
    grid-template-columns: 1fr;
  }

  .upcoming-card {
    padding: 1.5rem;
  }
}
</style>
