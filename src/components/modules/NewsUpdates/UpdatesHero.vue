<script setup lang="ts">
  const emit = defineEmits<{
    (e: 'scrollToTimeline'): void
  }>()

  function handleExploreClick () {
    emit('scrollToTimeline')
  }
</script>

<template>
  <section class="updates-hero" aria-labelledby="hero-heading">
    <!-- Ambient Glow Layers -->
    <div class="hero-glow-blob-1" aria-hidden="true" />
    <div class="hero-glow-blob-2" aria-hidden="true" />

    <div class="hero-container">
      <!-- Floating Social Energy Chips (Desktop/Tablet) -->
      <div class="floating-chip chip-left-top" aria-hidden="true">
        <span class="chip-icon-box pink">
          <v-icon icon="mdi-comment-processing-outline" size="14" />
        </span>
        <span class="chip-label">Comentários no feed</span>
        <span class="pulse-indicator" />
      </div>

      <div class="floating-chip chip-right-top" aria-hidden="true">
        <span class="chip-icon-box orange">
          <v-icon icon="mdi-map-marker-radius" size="14" />
        </span>
        <span class="chip-label">Eventos perto de você</span>
      </div>

      <div class="floating-chip chip-left-bottom" aria-hidden="true">
        <span class="chip-icon-box purple">
          <v-icon icon="mdi-party-popper" size="14" />
        </span>
        <span class="chip-label">+5.4k presenças confirmadas</span>
      </div>

      <div class="floating-chip chip-right-bottom" aria-hidden="true">
        <span class="chip-icon-box blue">
          <v-icon icon="mdi-lightning-bolt" size="14" />
        </span>
        <span class="chip-label">Carregamento instantâneo</span>
      </div>

      <!-- Main Central Content -->
      <div class="hero-main-content">
        <!-- Eyebrow Pill -->
        <div class="hero-eyebrow">
          <span class="sparkle-icon">✨</span>
          <span>WEPARTY • PRODUCT UPDATES</span>
          <span class="version-tag">2026</span>
        </div>

        <!-- Main Headline -->
        <h1 id="hero-heading" class="hero-title">
          A WeParty não para de
          <span class="gradient-word">evoluir.</span>
        </h1>

        <!-- Subtitle -->
        <p class="hero-description">
          Novos recursos, melhorias e experiências que estamos criando para transformar como você descobre festas, reúne sua galera e vive momentos inesquecíveis.
        </p>

        <!-- Hero Actions -->
        <div class="hero-actions">
          <button
            class="btn-hero-primary"
            type="button"
            @click="handleExploreClick"
          >
            <v-icon icon="mdi-arrow-down" size="18" />
            <span>Ver o que mudou</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.updates-hero {
  position: relative;
  padding: 8.5rem 0 3rem;
  overflow: hidden;
  background: radial-gradient(100% 80% at 50% 0%, #FFF5F7 0%, #FFFFFF 100%);
}

/* Glow Blobs */
.hero-glow-blob-1 {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 720px;
  height: 480px;
  background: radial-gradient(circle, rgba(255, 154, 77, 0.22) 0%, rgba(255, 95, 143, 0.12) 50%, transparent 70%);
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;
}

.hero-glow-blob-2 {
  position: absolute;
  top: 15%;
  right: 5%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 60%);
  filter: blur(40px);
  pointer-events: none;
  z-index: 0;
}

.hero-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 1;
}

.hero-main-content {
  text-align: center;
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Eyebrow */
.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 154, 77, 0.3);
  box-shadow: 0 2px 12px rgba(255, 154, 77, 0.12);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #c2410c;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(8px);
}

.sparkle-icon {
  font-size: 0.9rem;
}

.version-tag {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
}

/* Title */
.hero-title {
  font-size: clamp(2.35rem, 5vw, 3.8rem);
  font-weight: 900;
  line-height: 1.15;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
}

.gradient-word {
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  white-space: nowrap;
}

/* Description */
.hero-description {
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  color: #475569;
  line-height: 1.65;
  max-width: 680px;
  margin-bottom: 2rem;
  font-weight: 400;
}

/* Actions */
.hero-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-hero-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 0.8rem 1.6rem;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.25s ease;
}

.btn-hero-primary:hover {
  transform: translateY(-2px);
  border-color: #ff5f8f;
  color: #ff5f8f;
  box-shadow: 0 8px 30px rgba(255, 95, 143, 0.15);
}

.btn-hero-primary:focus-visible {
  outline: 2px solid #ff5f8f;
  outline-offset: 2px;
}

/* ═══════════════════════════════════════════════════════════════
   FLOATING CHIPS (Social Energy)
   ═══════════════════════════════════════════════════════════════ */
.floating-chip {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  animation: float-chip 6s ease-in-out infinite alternate;
}

.chip-icon-box {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.chip-icon-box.pink { background: linear-gradient(135deg, #ff9a4d, #ff5f8f); }
.chip-icon-box.orange { background: linear-gradient(135deg, #ff9a4d, #f59e0b); }
.chip-icon-box.purple { background: linear-gradient(135deg, #8b5cf6, #ec4899); }
.chip-icon-box.blue { background: linear-gradient(135deg, #3b82f6, #06b6d4); }

.chip-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
}

.pulse-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.chip-left-top {
  top: 10%;
  left: 2%;
  animation-delay: 0s;
}

.chip-right-top {
  top: 14%;
  right: 2%;
  animation-delay: 1.5s;
}

.chip-left-bottom {
  bottom: 8%;
  left: 4%;
  animation-delay: 3s;
}

.chip-right-bottom {
  bottom: 12%;
  right: 4%;
  animation-delay: 4.5s;
}

@keyframes float-chip {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
  100% { transform: translateY(4px) rotate(-1deg); }
}

@media (max-width: 1080px) {
  .floating-chip {
    display: none;
  }

  .updates-hero {
    padding: 7.5rem 0 2.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-chip {
    animation: none;
  }

  .btn-hero-primary {
    transition: none;
  }

  .btn-hero-primary:hover {
    transform: none;
  }
}
</style>
