<script setup lang="ts">
  import type { ReleasedNewsUpdate } from '@/constants/newsUpdates'
  import { useRouter } from 'vue-router'
  import { NEWS_CATEGORY_META } from '@/constants/newsUpdates'
  import UpdateVisualMockup from './UpdateVisualMockup.vue'

  const props = defineProps<{
    update: ReleasedNewsUpdate
    index: number
    isEven: boolean
  }>()

  const router = useRouter()

  const dayMonthYear = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
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
  <div
    :id="`update-${update.id}`"
    class="timeline-item"
    :class="{ 'item-reversed': !isEven }"
  >
    <!-- Timeline Center Node Indicator (Desktop) -->
    <div class="timeline-center-node" aria-hidden="true">
      <div
        class="node-circle"
        :style="{
          background: NEWS_CATEGORY_META[update.category]?.color || '#ff5f8f',
          boxShadow: `0 0 0 4px #ffffff, 0 0 0 6px ${NEWS_CATEGORY_META[update.category]?.bgSoft || 'rgba(255, 95, 143, 0.2)'}`,
        }"
      >
        <v-icon :icon="NEWS_CATEGORY_META[update.category]?.icon || 'mdi-star-four-points'" size="12" color="white" />
      </div>
    </div>

    <!-- Text / Info Side -->
    <div class="timeline-card-side">
      <article class="timeline-card">
        <!-- Top metadata -->
        <div class="card-meta-row">
          <span
            class="item-category-chip"
            :style="{
              background: NEWS_CATEGORY_META[update.category]?.bgSoft || 'rgba(255, 95, 143, 0.1)',
              color: NEWS_CATEGORY_META[update.category]?.color || '#ff5f8f',
              borderColor: NEWS_CATEGORY_META[update.category]?.borderSoft || 'rgba(255, 95, 143, 0.3)',
            }"
          >
            <v-icon :icon="NEWS_CATEGORY_META[update.category]?.icon || 'mdi-star-four-points'" size="13" />
            {{ NEWS_CATEGORY_META[update.category]?.label || 'Novidade' }}
          </span>

          <span v-if="update.tag" class="item-tag-chip">
            {{ update.tag }}
          </span>

          <time class="item-date" :datetime="update.releasedAt">
            {{ dayMonthYear.format(parseDate(update.releasedAt)) }}
          </time>
        </div>

        <!-- Title -->
        <h3 class="item-title">
          {{ update.title }}
        </h3>

        <!-- Description -->
        <p class="item-description">
          {{ update.description }}
        </p>

        <!-- Highlights -->
        <ul v-if="update.highlights?.length" class="item-highlights">
          <li v-for="highlight in update.highlights" :key="highlight">
            <v-icon
              icon="mdi-check-circle-outline"
              size="15"
              :style="{ color: NEWS_CATEGORY_META[update.category]?.color || '#ff5f8f' }"
            />
            <span>{{ highlight }}</span>
          </li>
        </ul>

        <!-- Optional action link -->
        <div v-if="update.actionLabel" class="item-action-footer">
          <button
            class="btn-item-link"
            type="button"
            @click="handleActionClick"
          >
            <span>{{ update.actionLabel }}</span>
            <v-icon icon="mdi-chevron-right" size="16" />
          </button>
        </div>
      </article>
    </div>

    <!-- Visual Mockup Side -->
    <div class="timeline-visual-side">
      <div class="visual-container-box">
        <UpdateVisualMockup
          :update-id="update.id"
          :category="update.category"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-item {
  display: grid;
  grid-template-columns: 1fr 48px 1fr;
  align-items: center;
  gap: 2rem;
  position: relative;
  margin-bottom: 4rem;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

/* Alternating Layout */
.timeline-item.item-reversed .timeline-card-side {
  order: 3;
}

.timeline-item.item-reversed .timeline-visual-side {
  order: 1;
}

.timeline-item.item-reversed .timeline-center-node {
  order: 2;
}

/* Timeline Center Node */
.timeline-center-node {
  order: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
}

.node-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease;
}

.timeline-item:hover .node-circle {
  transform: scale(1.2);
}

/* Card Side */
.timeline-card-side {
  order: 1;
}

.timeline-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.timeline-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 154, 77, 0.35);
  box-shadow: 0 16px 40px rgba(255, 95, 143, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03);
}

.card-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.item-category-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.item-tag-chip {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.item-date {
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 600;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.item-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  margin-bottom: 0.6rem;
  letter-spacing: -0.01em;
}

.item-description {
  font-size: 0.98rem;
  color: #475569;
  line-height: 1.65;
  margin-bottom: 1.15rem;
}

/* Highlights */
.item-highlights {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.item-highlights li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #334155;
  font-weight: 500;
}

/* Action Footer */
.item-action-footer {
  margin-top: 1.25rem;
  padding-top: 0.85rem;
  border-top: 1px solid #f1f5f9;
}

.btn-item-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: none;
  color: #ff5f8f;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s ease;
}

.btn-item-link:hover {
  transform: translateX(3px);
  color: #e11d48;
}

/* Visual Side */
.timeline-visual-side {
  order: 3;
}

.visual-container-box {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.timeline-item:hover .visual-container-box {
  transform: scale(1.02);
}

/* Mobile & Tablet Styles */
@media (max-width: 960px) {
  .timeline-item {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 3rem;
  }

  .timeline-item.item-reversed .timeline-card-side,
  .timeline-card-side {
    order: 1 !important;
    width: 100%;
  }

  .timeline-item.item-reversed .timeline-visual-side,
  .timeline-visual-side {
    order: 2 !important;
    width: 100%;
  }

  .timeline-center-node {
    display: none;
  }

  .timeline-card {
    padding: 1.5rem;
  }

  .item-title {
    font-size: 1.25rem;
  }
}
</style>
