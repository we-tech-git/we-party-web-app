<script setup lang="ts">
  // Extraído de LandingPage.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 4ª fatia
  // da decomposição. Seção autocontida: dado (`howItWorks`) e template sem
  // nenhum estado/ref cruzando a fronteira do componente.
  //
  // `.container`/`.section-title`/`.section-header`/`.gradient-text`/
  // `.logo-text` são duplicados de propósito: ainda usados por seções não
  // extraídas ("hero", "discover", "app-showcase" também usam `.logo-text`).
  //
  // Animações GSAP (`gsap.utils.toArray('.timeline-row')`,
  // `gsap.to('.timeline-live-line', ...)`) continuam em LandingPage.vue sem
  // alteração — miram o DOM pela raiz da página (`landingEl`), não uma
  // referência Vue, mesmo padrão confirmado nas 3 fatias anteriores.
  const howItWorks = [
    { number: '01', title: 'Crie sua conta', description: 'Cadastre-se gratuitamente em poucos segundos e comece a explorar.', icon: 'mdi-account-plus', color: 'var(--gradient)' },
    { number: '02', title: 'Descubra eventos', description: 'Explore eventos próximos ou baseados nos seus interesses.', icon: 'mdi-compass', color: '#8b5cf6' },
    { number: '03', title: 'Conecte-se com pessoas', description: 'Veja quem vai participar e interaja com a comunidade.', icon: 'mdi-heart-multiple', color: '#ec4899' },
    { number: '04', title: 'Viva novas experiências', description: 'Participe de eventos e descubra novos lugares e pessoas.', icon: 'mdi-party-popper', color: 'linear-gradient(135deg, #ffd93d, #FF9F3D)' },
  ]
</script>

<template>
  <section id="como-funciona" class="how-it-works how-it-works-v2">
    <div class="how-it-works-bg" />
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">
          Como funciona o <span class="logo-text">We Party</span>
        </h2>
      </div>

      <div class="timeline">
        <!-- Linha conectiva dinâmica -->
        <div class="timeline-live-line" />

        <div
          v-for="(step, index) in howItWorks"
          :key="step.number"
          class="timeline-row"
          :class="{ 'timeline-row-reverse': index % 2 === 1 }"
        >
          <span class="timeline-bignum" :class="index % 2 === 1 ? 'timeline-bignum-right' : 'timeline-bignum-left'">{{ step.number }}</span>
          <div class="timeline-icon" :style="{ background: step.color }">
            <v-icon :icon="step.icon" size="30" />
          </div>
          <div class="timeline-body">
            <div class="timeline-title">{{ step.title }}</div>
            <p class="timeline-desc">{{ step.description }}</p>
          </div>
          <div class="timeline-step-pill">Passo {{ index + 1 }} de {{ howItWorks.length }}</div>
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

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: 'Baloo Thambi 2', cursive;
  font-style: normal;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

h2 .logo-text,
.section-title .logo-text {
  font-size: inherit;
  display: inline;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMO FUNCIONA — TIMELINE & LINHA VIVA
   ═══════════════════════════════════════════════════════════════════════════ */
.how-it-works-v2 {
  padding: 8rem 0 6rem;
  position: relative;
}

.how-it-works-v2 .container {
  max-width: 1320px;
}

.how-it-works-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 100%, rgba(249, 120, 163, 0.1) 0%, transparent 55%);
}

.timeline {
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Linha viva de conexão que se ilumina com o scroll */
.timeline-live-line {
  position: absolute;
  top: 40px;
  bottom: 40px;
  left: 40px;
  width: 3px;
  background: linear-gradient(180deg, #FFC947 0%, #F978A3 50%, #8b5cf6 100%);
  border-radius: 999px;
  transform-origin: top center;
  transform: scaleY(0);
  z-index: 0;
  opacity: 0.45;
  box-shadow: 0 0 12px rgba(249, 120, 163, 0.5);
}

.timeline-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2.5rem;
  padding: 2.25rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  text-align: left;
  will-change: transform;
}

.timeline-row:last-child {
  border-bottom: none;
}

.timeline-row-reverse {
  flex-direction: row-reverse;
  text-align: right;
}

.timeline-bignum {
  position: absolute;
  top: 50%;
  font-size: clamp(4.5rem, 9vw, 8.75rem);
  font-weight: 800;
  color: var(--dark);
  opacity: 0.05;
  line-height: 1;
  z-index: 0;
  font-family: 'Baloo Thambi 2', cursive;
  pointer-events: none;
  will-change: transform;
}

.timeline-bignum-left {
  left: 40px;
  transform: translate(-50%, -50%);
}

.timeline-bignum-right {
  right: 40px;
  transform: translate(50%, -50%);
}

.timeline-icon {
  position: relative;
  z-index: 1;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 18px 36px rgba(249, 120, 163, 0.3);
}

.timeline-body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.timeline-title {
  font-weight: 800;
  font-size: 1.4rem;
  color: #1a1a2e;
  margin-bottom: 0.4rem;
}

.timeline-desc {
  font-size: 0.95rem;
  color: var(--text-light);
  line-height: 1.6;
  max-width: 440px;
  margin: 0;
}

.timeline-row-reverse .timeline-desc {
  margin-left: auto;
}

.timeline-step-pill {
  position: relative;
  z-index: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  background: #fff0e8;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  white-space: nowrap;
}

/* Responsivo — movido de LandingPage.vue junto com o resto da seção. */
@media (max-width: 768px) {
  .how-it-works-v2 {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }

  .timeline-live-line {
    display: none;
  }

  .timeline-row,
  .timeline-row-reverse {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 1.25rem;
  }

  .timeline-row-reverse .timeline-desc {
    margin-left: 0;
  }

  .timeline-bignum {
    display: none;
  }
}
</style>
