<script setup lang="ts">
  import type { ReleasedNewsUpdate } from '@/constants/newsUpdates'
  import { useRouter } from 'vue-router'
  import { NEWS_CATEGORY_META } from '@/constants/newsUpdates'
  import UpdateVisualMockup from './UpdateVisualMockup.vue'

  const props = defineProps<{
    update: ReleasedNewsUpdate
  }>()

  const router = useRouter()

  const dayMonthYear = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  function parseDate (iso: string) {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year!, month! - 1, day!)
  }

  function handleActionClick () {
    const targetPath = props.update.actionPath || '/public/explore'
    router.push(targetPath)
  }
</script>

<template>
  <section class="featured-update-section" aria-labelledby="featured-update-heading">
    <div class="featured-container">
      <div class="section-label-row">
        <span class="sparkle-bullet">✦</span>
        <h2 id="featured-update-heading" class="section-header-title">
          Último Grande Lançamento
        </h2>
      </div>

      <article class="featured-card">
        <!-- Card Background Gradient Flare -->
        <div class="card-flare" aria-hidden="true" />

        <!-- Left Column: Content & Metadata -->
        <div class="featured-content-col">
          <div class="featured-top-badges">
            <span class="spotlight-pill">
              <v-icon icon="mdi-star" size="14" />
              <span>DESTAQUE</span>
            </span>

            <span
              class="category-pill"
              :style="{
                background: NEWS_CATEGORY_META[update.category]?.bgSoft || 'rgba(255, 95, 143, 0.1)',
                color: NEWS_CATEGORY_META[update.category]?.color || '#ff5f8f',
                borderColor: NEWS_CATEGORY_META[update.category]?.borderSoft || 'rgba(255, 95, 143, 0.3)',
              }"
            >
              <v-icon :icon="NEWS_CATEGORY_META[update.category]?.icon || 'mdi-star-four-points'" size="14" />
              {{ NEWS_CATEGORY_META[update.category]?.label || 'Novidade' }}
            </span>

            <span v-if="update.version" class="version-pill">
              {{ update.version }}
            </span>

            <time class="featured-date" :datetime="update.releasedAt">
              {{ dayMonthYear.format(parseDate(update.releasedAt)) }}
            </time>
          </div>

          <h3 class="featured-title">
            {{ update.title }}
          </h3>

          <p class="featured-description">
            {{ update.description }}
          </p>

          <!-- Highlights List -->
          <ul v-if="update.highlights?.length" class="featured-highlights">
            <li v-for="highlight in update.highlights" :key="highlight">
              <span class="check-icon-box">
                <v-icon icon="mdi-check" size="14" />
              </span>
              <span>{{ highlight }}</span>
            </li>
          </ul>

          <!-- Action Button -->
          <div class="featured-action-row">
            <button
              class="btn-featured-action"
              type="button"
              @click="handleActionClick"
            >
              <span>{{ update.actionLabel || 'Explorar no feed' }}</span>
              <v-icon icon="mdi-arrow-right" size="18" />
            </button>
            <span class="live-badge-note">Já disponível na plataforma</span>
          </div>
        </div>

        <!-- Right Column: Rich Visual Mockup -->
        <div class="featured-visual-col">
          <UpdateVisualMockup
            :update-id="update.id"
            :category="update.category"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.featured-update-section {
  padding: 1rem 0 4rem;
  position: relative;
  z-index: 2;
}

.featured-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-label-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.sparkle-bullet {
  color: #ff5f8f;
  font-size: 1.1rem;
}

.section-header-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Featured Card */
.featured-card {
  position: relative;
  background: #ffffff;
  border-radius: 28px;
  padding: 2.5rem;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 2.5rem;
  align-items: center;
  border: 1px solid rgba(255, 154, 77, 0.28);
  box-shadow: 0 20px 60px rgba(255, 95, 143, 0.08), 0 4px 16px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.featured-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 24px 70px rgba(255, 95, 143, 0.14), 0 8px 24px rgba(0, 0, 0, 0.04);
}

.card-flare {
  position: absolute;
  top: -40%;
  right: -20%;
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(255, 154, 77, 0.12) 0%, rgba(255, 95, 143, 0.06) 50%, transparent 70%);
  pointer-events: none;
}

/* Content Col */
.featured-content-col {
  display: flex;
  flex-direction: column;
}

.featured-top-badges {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.spotlight-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  letter-spacing: 0.06em;
  box-shadow: 0 2px 10px rgba(255, 95, 143, 0.35);
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.version-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.featured-date {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  margin-left: auto;
}

.featured-title {
  font-size: clamp(1.65rem, 3vw, 2.35rem);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 0.85rem;
}

.featured-description {
  font-size: 1.05rem;
  color: #475569;
  line-height: 1.65;
  margin-bottom: 1.5rem;
}

/* Highlights */
.featured-highlights {
  list-style: none;
  padding: 0;
  margin: 0 0 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.featured-highlights li {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.95rem;
  color: #334155;
  font-weight: 500;
}

.check-icon-box {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Action row */
.featured-action-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.btn-featured-action {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.85rem 1.75rem;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 95, 143, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.btn-featured-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(255, 95, 143, 0.45);
}

.btn-featured-action:focus-visible {
  outline: 2px solid #ff5f8f;
  outline-offset: 2px;
}

.live-badge-note {
  font-size: 0.82rem;
  color: #10b981;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.live-badge-note::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

/* Visual Col */
.featured-visual-col {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 960px) {
  .featured-card {
    grid-template-columns: 1fr;
    padding: 1.75rem;
    gap: 1.75rem;
  }

  .featured-date {
    margin-left: 0;
  }
}
</style>
