<script setup lang="ts">
  // Extraído de Feed.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 1ª fatia da
  // decomposição do mega-arquivo. Botão flutuante (FAB) + bottom sheet de
  // tendências, exclusivos do layout mobile. Autocontido: CSS/template sem
  // nenhuma classe genérica compartilhada com o resto do arquivo (diferente
  // dos modais de Profile.vue, aqui não existe um "esqueleto" repetido em
  // outro lugar do Feed).
  //
  // `displayedTrends` continua no pai — também alimenta o `FeedTrendsPanel`
  // (painel de desktop), que já existia como componente separado. `goTo*`
  // e a checagem de `guestMode`/`requireLogin` foram movidos pra cá porque
  // eram exclusivos desta lista mobile — mesmo padrão já usado em
  // `FeedTrendsPanel.vue` (`goToMainEvent`), inclusive o import direto de
  // `router` em vez de `useRouter()`, pra ficar consistente com o
  // componente irmão.
  import { useI18n } from 'vue-i18n'
  import { useGuestMode } from '@/composables/useGuestMode'
  import router from '@/router'

  interface TrendItem {
    id: number | string
    title: string
    highlight: string
    engagement: string
  }

  const props = defineProps<{
    trends: TrendItem[]
    visible: boolean
    isMobile: boolean
    guestMode?: boolean
  }>()

  const emit = defineEmits<{
    'update:visible': [value: boolean]
  }>()

  const { t } = useI18n()
  const { requireLogin } = useGuestMode()

  function goToTrendingEvent (eventId: number | string) {
    if (props.guestMode) {
      requireLogin('ver detalhes do evento')
      return
    }
    router.push(`/event/${eventId}`)
    emit('update:visible', false)
  }
</script>

<template>
  <!-- Mobile Trending FAB Button -->
  <Transition name="fab-fade">
    <button
      v-if="isMobile && !visible && trends.length > 0"
      aria-label="Ver tendências"
      class="trending-fab"
      type="button"
      @click="emit('update:visible', true)"
    >
      <svg
        fill="none"
        height="22"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        width="22"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
      <span class="fab-badge">{{ trends.length }}</span>
    </button>
  </Transition>

  <!-- Mobile Trending Bottom Sheet -->
  <Transition name="bottom-sheet">
    <div
      v-if="visible"
      class="trending-overlay"
      @click.self="emit('update:visible', false)"
      @keydown.esc="emit('update:visible', false)"
    >
      <div
        aria-labelledby="trending-sheet-title"
        aria-modal="true"
        class="trending-sheet"
        role="dialog"
      >
        <div class="sheet-header">
          <div aria-hidden="true" class="sheet-handle" />
          <h3 id="trending-sheet-title" class="sheet-title">🔥 {{ t('feed.trending.title') }}</h3>
          <button
            aria-label="Fechar tendências"
            class="sheet-close"
            type="button"
            @click="emit('update:visible', false)"
          >
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              viewBox="0 0 24 24"
              width="20"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
        <div class="sheet-content">
          <ul class="trending-list-mobile">
            <li v-for="(item, index) in trends" :key="item.id">
              <button
                class="trending-item-mobile"
                type="button"
                @click="goToTrendingEvent(item.id)"
              >
                <span aria-hidden="true" class="trend-rank">{{ index + 1 }}</span>
                <div class="trend-info">
                  <span class="trend-highlight">{{ item.highlight }}</span>
                  <span class="trend-title">{{ item.title }}</span>
                  <span class="trend-engagement">{{ item.engagement }}</span>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* FAB Button - Positioned above bottom navigation */
.trending-fab {
  position: fixed;
  /* Posicionar bem acima da bottom navigation (que tem ~70px de altura) */
  bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
  right: 1rem;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(255, 95, 166, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Mobile: Elevar FAB mais acima para não sobrepor a bottom nav */
@media (max-width: 960px) {
  .trending-fab {
    bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
  }
}

.trending-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 32px rgba(255, 95, 166, 0.5),
    0 6px 16px rgba(0, 0, 0, 0.2);
}

.trending-fab:active {
  transform: scale(0.95);
}

.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 14px;
  background: #fff;
  color: #ff5fa6;
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* FAB Transition */
.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

/* Bottom Sheet Overlay */
.trending-overlay {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Bottom Sheet */
.trending-sheet {
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  background: linear-gradient(180deg, #fff 0%, #fef9fa 100%);
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

.sheet-handle {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.15);
}

.sheet-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1c2e;
}

.sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sheet-close:hover {
  background: rgba(255, 95, 166, 0.1);
  color: #ff5fa6;
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}

/* Trending List Mobile */
.trending-list-mobile {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trending-item-mobile {
  display: flex;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  text-align: left;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.trending-item-mobile:hover {
  background: rgba(255, 95, 166, 0.04);
  border-color: rgba(255, 95, 166, 0.15);
  transform: translateX(4px);
}

.trending-item-mobile:active {
  transform: scale(0.98);
}

.trend-rank {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 154, 77, 0.15) 0%, rgba(255, 95, 143, 0.15) 100%);
  color: #ff5fa6;
  font-weight: 800;
  font-size: 0.9rem;
}

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.trend-highlight {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #ff5fa6;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.trend-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1c2e;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.trend-engagement {
  font-size: 0.78rem;
  color: #9aa0b8;
}

/* Bottom Sheet Transition */
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-sheet-enter-active .trending-sheet,
.bottom-sheet-leave-active .trending-sheet {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0);
}

.bottom-sheet-enter-from .trending-sheet,
.bottom-sheet-leave-to .trending-sheet {
  transform: translateY(100%);
}
</style>
