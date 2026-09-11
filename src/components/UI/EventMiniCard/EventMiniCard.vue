<script setup lang="ts">
/**
 * Card compacto de evento (banner + data + título + localização), usado em
 * grids de "eventos curtidos"/"eventos confirmados". Consolidado na Fase 3
 * do REFACTOR_AUDIT_PLAN.md — auditoria 3a encontrou 3 cópias quase
 * idênticas (`Profile.vue` 2x + `PublicProfile.vue` 1x) já divergindo em
 * CSS (banner com altura fixa vs. aspect-ratio, badge de data em cantos
 * diferentes).
 *
 * O rodapé de estatísticas varia de verdade entre quem usa (com botão de
 * descurtir vs. só texto read-only) — por isso é slot, não prop fixa.
 */
  withDefaults(
    defineProps<{
      title: string
      bannerUrl: string
      /** Já formatado pelo chamador (ex. `formatShortDate`) — evita repetir a mesma lógica de data em cada tela que usa o card. */
      dateLabel: string
      location: string
      /** Mostra o selo de "confirmado" sobre o banner. */
      confirmed?: boolean
    }>(),
    {
      confirmed: false,
    },
  )

  defineEmits<{
    click: []
  }>()
</script>

<template>
  <div
    class="event-mini-card"
    :class="{ 'event-mini-card--confirmed': confirmed }"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
  >
    <div class="banner">
      <img :alt="title" :src="bannerUrl">
      <div class="date-badge">
        <i class="mdi mdi-calendar" />
        {{ dateLabel }}
      </div>
      <div v-if="confirmed" class="confirmed-badge">
        <i class="mdi mdi-check-circle" />
      </div>
    </div>
    <div class="content">
      <h4 class="title">{{ title }}</h4>
      <div class="location">
        <i class="mdi mdi-map-marker" />
        {{ location }}
      </div>
      <div v-if="$slots.stats" class="stats">
        <slot name="stats" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-mini-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.event-mini-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 95, 166, 0.15);
}

.event-mini-card--confirmed {
  border-color: rgba(76, 175, 80, 0.2);
}

.event-mini-card--confirmed:hover {
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
}

.banner {
  position: relative;
  /* 160px é o valor que efetivamente renderiza hoje em Profile.vue — havia
     uma 2ª declaração de `.mini-card-banner` (sem media query) mais abaixo
     no arquivo que já sobrescrevia os 140px "base" antigos. */
  height: 160px;
  overflow: hidden;
}

.banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.event-mini-card:hover .banner img {
  transform: scale(1.05);
}

.date-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.date-badge i {
  font-size: 0.9rem;
}

.confirmed-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
}

.content {
  padding: 1rem;
}

.title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1c2e;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.location {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #9aa0b8;
  font-size: 0.8rem;
}

.location i {
  font-size: 1rem;
}

.stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.event-mini-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (prefers-contrast: high) {
  .event-mini-card {
    border: 2px solid currentColor;
  }
}

</style>
