<script setup lang="ts">
  import type { DiscoverEventCard } from './types'

  // Extraído de LandingPage.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 5ª
  // fatia da decomposição.
  //
  // Diferente das 4 fatias anteriores: esta seção **não** é 100%
  // autocontida — `discoverEvents`/`usersOnline` continuam vivendo em
  // LandingPage.vue porque a seção "app-showcase" (ainda não extraída)
  // também lê `discoverEvents[0]` pro preview do celular, e `usersOnline`
  // é atualizado por um tween GSAP no componente pai. Por isso viram props
  // (fluxo de dados normal do Vue), não estado local duplicado.
  //
  // `ref="discoverCardsEl"` (usado por `setupDiscoverCardsInteractivity`,
  // efeito de tilt 3D ao passar o mouse) foi removido do template — a
  // função só faz `querySelectorAll`, então o pai passou a chamá-la com
  // `landingEl.value` (mesmo padrão já usado em `setupMagneticButtons` e
  // `setupFeaturesSpotlight`).
  //
  // `.container`/`.btn-cta-primary`/`.btn-glow`/`.discover-avatars`/
  // `.avatar-dot`/`.avatar-1`/`.avatar-2`/`.avatar-3` são duplicados de
  // propósito: `.btn-cta-primary` ainda é usado por "updates-teaser" (já
  // migrado, também duplicou) e os avatares também aparecem dentro do
  // preview do celular em "app-showcase" (ainda não extraída).
  defineProps<{
    events: DiscoverEventCard[]
    usersOnline: number
  }>()
</script>

<template>
  <section id="descubra" class="discover">
    <div class="discover-bg" />
    <div class="container discover-grid">
      <div class="discover-content">
        <div class="discover-badge">
          <span>🎉</span>
          <span>Feito para quem ama sair de casa</span>
        </div>

        <h2 class="discover-title">
          Descubra eventos perto de você e conecte-se
          <span class="title-gradient"> com pessoas que também vão</span>
        </h2>

        <p class="discover-text">
          Encontre festas, shows e experiências na sua cidade, veja quem vai participar e interaja
          com outros usuários antes mesmo do evento começar.
        </p>

        <div class="discover-actions">
          <router-link v-slot="{ href, navigate }" custom to="/public/explore">
            <a class="btn-cta-primary" :href="href" @click="navigate">
              <span>Experimentar</span>
              <div class="btn-glow" />
            </a>
          </router-link>
          <div class="discover-avatars">
            <span class="avatar-dot avatar-1" />
            <span class="avatar-dot avatar-2" />
            <span class="avatar-dot avatar-3" />
            <span class="avatar-label">+2.3k na sua região</span>
          </div>
        </div>

        <div class="discover-live-card">
          <span class="discover-live-emoji">🔥</span>
          <div class="discover-live-body">
            <div class="discover-live-top">
              <span class="discover-live-number">+{{ usersOnline }}</span>
              <span class="discover-live-badge"><span class="live-dot" />AO VIVO</span>
            </div>
            <div class="discover-live-text">pessoas descobrindo eventos agora</div>
          </div>
        </div>
      </div>

      <div class="discover-cards">
        <div
          v-for="(event, index) in events"
          :key="event.title"
          class="discover-event-card"
          :class="`discover-event-card-${index + 1}`"
        >
          <div class="discover-event-media" :style="{ background: event.gradient }">
            <img
              v-if="event.image"
              :alt="`Foto do evento ${event.title}`"
              class="discover-event-image"
              loading="lazy"
              :src="event.image"
            >
            <span class="discover-event-category">{{ event.emoji }} {{ event.category }}</span>
            <span class="discover-event-share"><v-icon icon="mdi-share-variant-outline" size="14" /></span>
            <div class="discover-event-overlay">
              <span class="discover-event-tag" :style="{ background: event.tagColor }">{{ event.tag }}</span>
              <div class="discover-event-title">{{ event.title }}</div>
            </div>
          </div>
          <div class="discover-event-footer">
            <div class="discover-event-stats">
              <span>❤️ {{ event.likes }}</span>
              <span>💬 {{ event.comments }}</span>
            </div>
            <span class="discover-event-when" :style="{ color: event.tagColor }">{{ event.when }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Duplicado de LandingPage.vue — ver comentário no <script>. */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 2;
  width: 100%;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1.25rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
}

.btn-cta-primary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 2.25rem;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  border: none;
  border-radius: 14px;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(255, 95, 143, 0.35);
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  will-change: transform;
}

.btn-cta-primary .btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.btn-cta-primary:hover .btn-glow {
  transform: translateX(100%);
}

.btn-cta-primary:hover {
  transform: translateY(-3px) translateZ(0);
  box-shadow: 0 16px 40px rgba(255, 95, 143, 0.45);
}

.discover-avatars {
  display: flex;
  align-items: center;
}

.avatar-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #fff8f0;
  margin-left: -10px;
  display: inline-block;
}

.avatar-dot:first-child {
  margin-left: 0;
}

.avatar-1 {
  background: linear-gradient(135deg, #ffb27a, #F978A3);
}

.avatar-2 {
  background: linear-gradient(135deg, #ff9a9a, #c48bff);
}

.avatar-3 {
  background: linear-gradient(135deg, #8bd3ff, #a58bff);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESCUBRA
   ═══════════════════════════════════════════════════════════════════════════ */
.discover {
  position: relative;
  padding: 5rem 0 8rem;
  overflow: hidden;
}

.discover-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 10% 20%, rgba(255, 201, 71, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 95% 85%, rgba(139, 92, 246, 0.12) 0%, transparent 45%);
}

.discover-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 4rem;
  align-items: center;
}

.discover-content {
  text-align: left;
}

.discover-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.75);
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(249, 120, 163, 0.18);
}

.discover-title {
  font-size: clamp(1.85rem, 3.4vw, 2.75rem);
  line-height: 1.28;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0 0 1.5rem;
}

.title-gradient {
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.discover-text {
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text-light);
  max-width: 460px;
  margin: 0 0 2.25rem;
}

.discover-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.avatar-label {
  font-size: 0.85rem;
  color: var(--text-light);
  font-weight: 600;
  margin-left: 0.6rem;
}

.discover-live-card {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border-radius: 18px;
  padding: 1.1rem 1.6rem;
  box-shadow: 0 16px 40px rgba(249, 120, 163, 0.2);
}

.discover-live-emoji {
  font-size: 1.6rem;
}

.discover-live-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.discover-live-number {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary);
}

.discover-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--secondary);
  letter-spacing: 0.05em;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: var(--gradient);
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
  display: inline-block;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.discover-live-text {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 600;
  margin-top: 0.15rem;
}

.discover-cards {
  position: relative;
  min-height: 620px;
  perspective: 1200px;
}

.discover-event-card {
  position: absolute;
  width: 240px;
  background: #fff;
  border-radius: 22px;
  padding: 10px;
  box-shadow: 0 20px 45px rgba(249, 120, 163, 0.22);
  transform-style: preserve-3d;
  will-change: transform;
  backface-visibility: hidden;
  cursor: pointer;
}

.discover-event-card-1 {
  top: 0;
  left: 0;
  transform: rotate(-6deg);
  z-index: 1;
}

.discover-event-card-2 {
  top: 240px;
  right: 0;
  transform: rotate(5deg);
  z-index: 2;
}

.discover-event-card-3 {
  bottom: 0;
  left: 5%;
  transform: rotate(-3deg);
  z-index: 1;
}

.discover-event-media {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
}

.discover-event-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
}

.discover-event-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.72) 100%);
}

.discover-event-category {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 700;
  color: #1a1a2e;
}

.discover-event-share {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.discover-event-overlay {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  z-index: 1;
}

.discover-event-tag {
  display: inline-block;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  margin-bottom: 7px;
}

.discover-event-title {
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  line-height: 1.2;
}

.discover-event-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px 2px;
}

.discover-event-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #9a9aab;
  font-weight: 600;
}

.discover-event-when {
  font-size: 11px;
  font-weight: 700;
}

/* Responsivo — movido de LandingPage.vue junto com o resto da seção. */
@media (max-width: 1024px) {
  .discover-grid {
    grid-template-columns: 1fr;
  }

  .discover-cards {
    min-height: 460px;
    max-width: 460px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .discover {
    padding: 2rem 0 5rem;
  }

  .discover-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .discover-content {
    text-align: center;
  }

  .discover-text {
    margin-left: auto;
    margin-right: auto;
  }

  .discover-actions {
    justify-content: center;
  }

  .discover-live-card {
    margin: 0 auto;
  }

  /* No mobile a colagem rotacionada não cabe — vira uma lista empilhada normal */
  .discover-cards {
    position: static;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-height: auto;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    perspective: none;
  }

  .discover-event-card,
  .discover-event-card-1,
  .discover-event-card-2,
  .discover-event-card-3 {
    position: static;
    width: 100%;
    top: auto;
    bottom: auto;
    left: auto;
    right: auto;
    transform: none;
  }
}
</style>
