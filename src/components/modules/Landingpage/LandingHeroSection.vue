<script setup lang="ts">
  // Extraído de LandingPage.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 6ª fatia
  // da decomposição (parte de maior risco: hero fica acoplada ao estado de
  // scroll do header no pai).
  //
  // `heroSection`/`heroVideo` eram refs Vue no pai, usados por
  // `IntersectionObserver`/`ScrollTrigger`/`.pause()` — todos esses usos só
  // precisam de um `Element`/`HTMLVideoElement`, não de uma ref Vue
  // propriamente dita. Por isso, em vez de `defineExpose`, o pai passou a
  // fazer `landingEl.value.querySelector('.hero'/'.hero-video')`, mesmo
  // padrão já usado nas fatias anteriores (features/discover) para funções
  // que só fazem busca no DOM.
  //
  // O clique no indicador de scroll chamava `goToSection` do pai (que
  // também fecha o menu mobile antes de rolar) — em vez de duplicar essa
  // lógica aqui, o componente emite `go-to-section` e o pai decide o que
  // fazer, preservando o comportamento exato.
  //
  // `.container` é duplicado de propósito — ainda usado por "app-showcase"
  // e outras seções não extraídas.
  const emit = defineEmits<{
    'go-to-section': [sectionId: string]
  }>()
</script>

<template>
  <section class="hero hero-v2">
    <video
      autoplay
      class="hero-video"
      height="720"
      loop
      muted
      playsinline
      poster="/hero-poster.jpg"
      preload="metadata"
      width="1280"
    >
      <source src="/hero-video.mp4" type="video/mp4">
    </video>
    <div class="hero-video-overlay" />

    <div class="container">
      <div class="hero-v2-content">
        <div class="hero-wordmark-wrap">
          <GradientText
            :animation-speed="4"
            class="hero-wordmark"
            :colors="['#ff9a4d', '#ff5f8f']"
            tag="h1"
          >
            We Party
          </GradientText>
        </div>
        <div class="hero-tagline-wrap">
          <GradientText
            :animation-speed="4"
            class="hero-tagline"
            :colors="['#ff9a4d', '#ff5f8f']"
            tag="p"
          >
            A rede social feita para quem ama eventos
          </GradientText>
        </div>
      </div>
    </div>

    <!-- Indicador de Scroll -->
    <div class="hero-scroll-indicator" @click="emit('go-to-section', '#descubra')">
      <span class="indicator-mouse"><span class="indicator-wheel" /></span>
      <span class="indicator-text">Role para explorar</span>
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

/* ═══════════════════════════════════════════════════════════════════════════
   HERO CINEMATOGRÁFICA
   ═══════════════════════════════════════════════════════════════════════════ */
.hero {
  min-height: 94vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 11rem 0 5rem;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.hero-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  will-change: transform, opacity;
}

.hero-video-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(circle at 50% 65%, rgba(255, 95, 143, 0.3), transparent 50%),
    radial-gradient(circle at 15% 15%, rgba(255, 154, 60, 0.22), transparent 45%),
    radial-gradient(circle at 85% 25%, rgba(139, 92, 246, 0.25), transparent 45%),
    linear-gradient(180deg, rgba(20, 18, 32, 0.55) 0%, rgba(20, 18, 32, 0.4) 45%, rgba(20, 18, 32, 0.72) 100%);
  pointer-events: none;
}

.hero-v2-content {
  position: relative;
  z-index: 2;
  max-width: 1500px;
  margin: 0 auto;
  will-change: transform, opacity;
}

.hero-wordmark-wrap,
.hero-tagline-wrap {
  display: block;
}

.hero-wordmark {
  font-family: 'Baloo Thambi 2', cursive;
  font-size: clamp(4.5rem, 19vw, 15rem);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 1.5rem;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.35));
}

.hero-tagline {
  font-size: clamp(1.4rem, 3.2vw, 2.5rem);
  font-weight: 600;
  margin: 0;
  filter: drop-shadow(0 4px 15px rgba(0, 0, 0, 0.3));
}

/* Indicador de scroll cinematográfico */
.hero-scroll-indicator {
  position: absolute;
  bottom: 2.2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.75);
  transition: opacity 0.3s ease, transform 0.3s ease;
  will-change: transform, opacity;
}

.hero-scroll-indicator:hover {
  color: #fff;
  transform: translateX(-50%) translateY(2px);
}

.indicator-mouse {
  width: 22px;
  height: 34px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  position: relative;
  display: flex;
  justify-content: center;
}

.indicator-wheel {
  width: 4px;
  height: 6px;
  background: #fff;
  border-radius: 2px;
  margin-top: 6px;
  animation: scroll-wheel 1.8s ease-in-out infinite;
}

@keyframes scroll-wheel {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  60% {
    transform: translateY(10px);
    opacity: 0;
  }
  61% {
    transform: translateY(0);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.indicator-text {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Responsivo — movido de LandingPage.vue junto com o resto da seção. */
@media (max-width: 768px) {
  .hero {
    padding: 8rem 0 3rem;
  }
}

@media (max-width: 480px) {
  .hero-wordmark {
    font-size: 3rem;
  }
}
</style>
