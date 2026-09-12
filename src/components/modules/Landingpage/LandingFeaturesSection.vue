<script setup lang="ts">
  // Extraído de LandingPage.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 3ª fatia
  // da decomposição.
  //
  // O grid tinha um `ref="featuresGridEl"` usado só pra escopar
  // `setupFeaturesSpotlight` (efeito de spotlight que segue o mouse nos
  // cards) — como essa função só faz `gridEl.querySelectorAll(...)` (busca
  // no DOM, não depende de identidade de componente), o chamador em
  // LandingPage.vue passou a usar `landingEl.value` (a raiz da página, já
  // usada pro mesmo propósito em `setupMagneticButtons`) em vez do ref
  // específico — não precisou de `defineExpose`.
  //
  // `.container`/`.section-title`/`.gradient-text`/`.section-header` são
  // duplicados de propósito: ainda usados por seções não extraídas
  // (`.section-header` também por "app-showcase" e "how-it-works").
  const features = [
    {
      icon: 'mdi-map-marker-radius',
      title: 'Descubra eventos perto de você',
      description: 'Explore festas, shows e experiências na sua cidade, filtradas pelo que você realmente gosta.',
      emoji: '📍',
      gradient: 'var(--gradient)',
    },
    {
      icon: 'mdi-account-group',
      title: 'Veja quem vai participar',
      description: 'Saiba quem confirmou presença antes mesmo do evento começar.',
      emoji: '👥',
      gradient: 'linear-gradient(135deg, #ffd93d, #FF9F3D)',
    },
    {
      icon: 'mdi-chat',
      title: 'Interaja com participantes',
      description: 'Converse, combine de ir e conheça novas pessoas.',
      emoji: '💬',
      gradient: 'linear-gradient(135deg, #8b5cf6, #F978A3)',
      highlight: true,
    },
    {
      icon: 'mdi-calendar-plus',
      title: 'Crie e compartilhe eventos',
      description: 'Organize seus próprios eventos e alcance mais pessoas.',
      emoji: '🎟️',
      gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    },
  ]

  const mainFeature = features[0]!
  const secondaryFeatures = features.slice(1)
</script>

<template>
  <section id="features" class="features features-v2">
    <div class="features-bg" />
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">
          Uma nova forma de descobrir e <span class="gradient-text">viver eventos</span>
        </h2>
      </div>

      <div class="features-grid-v2">
        <div class="feature-main">
          <div>
            <span class="feature-main-index">01</span>
            <h3 class="feature-main-title">{{ mainFeature.title }}</h3>
            <p class="feature-main-desc">{{ mainFeature.description }}</p>
          </div>
          <div class="feature-main-footer">
            <div class="feature-main-icon"><v-icon icon="mdi-crosshairs-gps" size="22" /></div>
            <span>Baseado na sua localização,<br>atualizado em tempo real</span>
          </div>
          <span class="feature-main-emoji">{{ mainFeature.emoji }}</span>
        </div>

        <div class="feature-secondary-list">
          <div
            v-for="feature in secondaryFeatures"
            :key="feature.title"
            class="feature-secondary"
          >
            <div class="feature-secondary-icon" :style="{ background: feature.gradient }">
              <v-icon :icon="feature.icon" size="22" />
            </div>
            <div class="feature-secondary-body">
              <div class="feature-secondary-heading">
                <h4>{{ feature.title }}</h4>
                <span v-if="feature.highlight" class="feature-badge">MAIS USADO</span>
              </div>
              <p>{{ feature.description }}</p>
            </div>
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

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1.25rem;
  line-height: 1.3;
  color: #1e293b;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-header {
  text-align: center;
  max-width: 750px;
  margin: 0 auto 4.5rem;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════════════════════════════════════ */
.features-v2 {
  padding: 8rem 0;
  position: relative;
}

.features-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.features-v2 .container {
  max-width: 1320px;
}

.features-grid-v2 {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 1.75rem;
  align-items: stretch;
}

.feature-main {
  position: relative;
  background: linear-gradient(150deg, var(--primary), var(--secondary));
  border-radius: 28px;
  padding: 2.75rem 2.5rem;
  box-shadow: 0 24px 50px rgba(249, 120, 163, 0.3);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  will-change: transform;
}

.feature-main-index {
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.85;
  letter-spacing: 0.05em;
}

.feature-main-title {
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1.3;
  margin: 1.1rem 0 0.85rem;
}

.feature-main-desc {
  font-size: 0.97rem;
  line-height: 1.6;
  opacity: 0.92;
  max-width: 380px;
  margin: 0;
}

.feature-main-footer {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.85;
}

.feature-main-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-main-emoji {
  position: absolute;
  right: -20px;
  bottom: -30px;
  font-size: 130px;
  opacity: 0.15;
  pointer-events: none;
  will-change: transform;
}

.feature-secondary-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.feature-secondary {
  position: relative;
  background: #fff;
  border-radius: 22px;
  padding: 1.5rem 1.6rem;
  box-shadow: 0 14px 34px rgba(249, 120, 163, 0.12);
  display: flex;
  align-items: flex-start;
  gap: 1.15rem;
  transition: box-shadow 0.3s ease;
  will-change: transform;
  overflow: hidden;
}

.feature-secondary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle 200px at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(249, 120, 163, 0.12), transparent);
  pointer-events: none;
  opacity: 1;
}

.feature-secondary:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 44px rgba(249, 120, 163, 0.2);
}

.feature-secondary-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-secondary-body {
  flex: 1;
  min-width: 0;
}

.feature-secondary-heading {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.feature-secondary-heading h4 {
  font-weight: 800;
  font-size: 1.05rem;
  color: #1a1a2e;
  margin: 0;
}

.feature-badge {
  background: #fff0e8;
  color: var(--primary-dark);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
}

.feature-secondary-body p {
  font-size: 0.9rem;
  color: var(--text-light);
  line-height: 1.55;
  margin: 0.4rem 0 0;
}

/* Responsivo — movido de LandingPage.vue junto com o resto da seção. */
@media (max-width: 1024px) {
  .features-grid-v2 {
    grid-template-columns: 1fr;
  }

  .feature-main {
    min-height: 280px;
  }
}

@media (max-width: 768px) {
  .features-v2 {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }
}
</style>
