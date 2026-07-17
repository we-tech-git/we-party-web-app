<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import AppFooter from '@/components/AppFooter.vue'

  const router = useRouter()

  function goBack () {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/public/Landingpage')
    }
  }
</script>

<template>
  <div class="nf-page">
    <!-- Decorative floating elements -->
    <div aria-hidden="true" class="nf-decorations">
      <span class="deco-dot deco-dot--1" />
      <span class="deco-dot deco-dot--2" />
      <span class="deco-dot deco-dot--3" />
      <span class="deco-dot deco-dot--4" />
      <span class="deco-dot deco-dot--5" />
      <span class="deco-dot deco-dot--6" />
      <span class="deco-star deco-star--1">✦</span>
      <span class="deco-star deco-star--2">✦</span>
      <span class="deco-star deco-star--3">✦</span>
      <span class="deco-triangle deco-triangle--1" />
      <span class="deco-triangle deco-triangle--2" />
    </div>

    <!-- Brand header -->
    <header class="nf-header">
      <router-link class="nf-brand" to="/public/Landingpage">
        <img alt="We Party" class="nf-brand__logo" src="/logoweparty.png">
      </router-link>
    </header>

    <!-- Main content -->
    <main class="nf-main">
      <div class="nf-content">
        <!-- Ghost 404 number -->
        <p aria-hidden="true" class="nf-ghost-number">404</p>

        <span aria-hidden="true" class="nf-emoji" role="img">🎉</span>

        <h1 class="nf-title">A festa mudou de endereço!</h1>
        <p class="nf-subtitle">
          Essa rota flopou. A página que você procura não existe<br class="br-hide-mobile">
          ou foi para outra balada.
        </p>

        <!-- Navigation suggestion cards -->
        <nav aria-label="Sugestões de navegação" class="nf-nav-cards">
          <router-link class="nf-card nf-card--primary" to="/private/feed">
            <span class="nf-card__icon">🎪</span>
            <div class="nf-card__body">
              <span class="nf-card__title">Feed de Eventos</span>
              <span class="nf-card__desc">Veja o que está rolando perto de você</span>
            </div>
            <span aria-hidden="true" class="nf-card__arrow">→</span>
          </router-link>

          <router-link class="nf-card nf-card--accent" :to="{ path: '/public/Login', query: { force: 'true' } }">
            <span class="nf-card__icon">🔑</span>
            <div class="nf-card__body">
              <span class="nf-card__title">Fazer Login</span>
              <span class="nf-card__desc">Entre na sua conta para continuar</span>
            </div>
            <span aria-hidden="true" class="nf-card__arrow">→</span>
          </router-link>

          <router-link class="nf-card nf-card--soft" to="/public/Landingpage">
            <span class="nf-card__icon">🏠</span>
            <div class="nf-card__body">
              <span class="nf-card__title">Página Inicial</span>
              <span class="nf-card__desc">Volte ao começo da festa</span>
            </div>
            <span aria-hidden="true" class="nf-card__arrow">→</span>
          </router-link>
        </nav>

        <button class="nf-back-btn" @click="goBack">← Voltar</button>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
/* ===========================
   PAGE WRAPPER
   =========================== */
.nf-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  position: relative;
  overflow: hidden;
  font-family: var(--font-sans, 'Inter', sans-serif);
}

/* ===========================
   DECORATIVE ELEMENTS
   =========================== */
.nf-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.deco-dot {
  position: absolute;
  border-radius: 50%;
  opacity: 0.35;
}

.deco-dot--1 {
  width: 80px;
  height: 80px;
  background: var(--color-primary, #ffb74d);
  top: 8%;
  left: 5%;
  animation: float 6s ease-in-out infinite;
}

.deco-dot--2 {
  width: 50px;
  height: 50px;
  background: var(--color-secondary, #ff9ab5);
  top: 15%;
  right: 8%;
  animation: float 8s ease-in-out infinite reverse;
}

.deco-dot--3 {
  width: 120px;
  height: 120px;
  background: var(--color-accent, #ffd93d);
  bottom: 20%;
  left: 2%;
  animation: float 7s ease-in-out infinite 1s;
}

.deco-dot--4 {
  width: 60px;
  height: 60px;
  background: var(--color-primary, #ffb74d);
  bottom: 30%;
  right: 5%;
  animation: float 5s ease-in-out infinite 0.5s;
}

.deco-dot--5 {
  width: 35px;
  height: 35px;
  background: var(--color-secondary, #ff9ab5);
  top: 45%;
  left: 10%;
  animation: float 9s ease-in-out infinite 2s;
}

.deco-dot--6 {
  width: 45px;
  height: 45px;
  background: var(--color-purple, #8b5cf6);
  top: 60%;
  right: 12%;
  animation: float 6.5s ease-in-out infinite 1.5s;
}

.deco-star {
  position: absolute;
  font-size: 1.4rem;
  opacity: 0.5;
  animation: spin-float 10s linear infinite;
}

.deco-star--1 {
  color: var(--color-primary, #ffb74d);
  top: 25%;
  left: 18%;
}

.deco-star--2 {
  color: var(--color-secondary, #ff9ab5);
  top: 20%;
  right: 22%;
  animation-delay: -3s;
}

.deco-star--3 {
  color: var(--color-accent, #ffd93d);
  bottom: 35%;
  right: 18%;
  animation-delay: -6s;
}

.deco-triangle {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0.25;
  animation: float 7s ease-in-out infinite;
}

.deco-triangle--1 {
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 35px solid var(--color-primary, #ffb74d);
  top: 35%;
  right: 6%;
  animation-delay: 1s;
}

.deco-triangle--2 {
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-bottom: 24px solid var(--color-secondary, #ff9ab5);
  bottom: 40%;
  left: 7%;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

@keyframes spin-float {
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(180deg); }
  100% { transform: translateY(0) rotate(360deg); }
}

/* ===========================
   HEADER
   =========================== */
.nf-header {
  position: relative;
  z-index: 1;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
}

.nf-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.nf-brand__logo {
  height: 36px;
  width: auto;
}

/* ===========================
   MAIN CONTENT
   =========================== */
.nf-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem 4rem;
}

.nf-content {
  max-width: 680px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* Giant ghost 404 behind content */
.nf-ghost-number {
  font-family: var(--font-display, 'Poppins', sans-serif);
  font-size: clamp(7rem, 22vw, 14rem);
  font-weight: 900;
  line-height: 1;
  background: var(--gradient-primary, linear-gradient(135deg, #ffb74d, #ff9ab5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.18;
  margin: 0;
  user-select: none;
  letter-spacing: -4px;
  position: relative;
}

.nf-emoji {
  font-size: 3.5rem;
  margin-top: -2.5rem;
  position: relative;
  z-index: 1;
  animation: bounce 2s ease-in-out infinite;
  display: block;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

.nf-title {
  font-family: var(--font-display, 'Poppins', sans-serif);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 700;
  color: var(--color-text-dark, #2c3e50);
  margin: 1rem 0 0.5rem;
  line-height: 1.2;
}

.nf-subtitle {
  font-size: 1rem;
  color: var(--color-text-light, #6c757d);
  line-height: 1.6;
  margin: 0 0 2.5rem;
}

.br-hide-mobile {
  display: none;
}

/* ===========================
   NAVIGATION CARDS
   =========================== */
.nf-nav-cards {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.nf-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-lg, 16px);
  text-decoration: none;
  transition: transform var(--transition-base, 0.2s ease), box-shadow var(--transition-base, 0.2s ease);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.08));
}

.nf-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.1));
}

.nf-card--primary {
  background: linear-gradient(135deg, #ffb74d 0%, #ff9ab5 100%);
  color: #fff;
}

.nf-card--accent {
  background: #fff;
  border: 2px solid #ffb74d;
  color: var(--color-text-dark, #2c3e50);
}

.nf-card--soft {
  background: #fff;
  border: 2px solid #ff9ab5;
  color: var(--color-text-dark, #2c3e50);
}

.nf-card__icon {
  font-size: 1.75rem;
  flex-shrink: 0;
  line-height: 1;
}

.nf-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
}

.nf-card__title {
  font-family: var(--font-display, 'Poppins', sans-serif);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
}

.nf-card--primary .nf-card__title {
  color: #fff;
}

.nf-card__desc {
  font-size: 0.8rem;
  opacity: 0.8;
  line-height: 1.3;
}

.nf-card--primary .nf-card__desc {
  color: rgba(255, 255, 255, 0.85);
}

.nf-card__arrow {
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: transform var(--transition-base, 0.2s ease);
}

.nf-card:hover .nf-card__arrow {
  transform: translateX(4px);
}

.nf-card--primary .nf-card__arrow {
  color: #fff;
}

/* ===========================
   BACK BUTTON
   =========================== */
.nf-back-btn {
  background: transparent;
  border: none;
  color: var(--color-text-light, #6c757d);
  font-size: 0.9rem;
  font-family: var(--font-sans, 'Inter', sans-serif);
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full, 999px);
  transition: background var(--transition-fast, 0.15s ease), color var(--transition-fast, 0.15s ease);
}

.nf-back-btn:hover {
  background: rgba(255, 154, 181, 0.12);
  color: var(--color-secondary, #ff9ab5);
}

/* ===========================
   RESPONSIVE
   =========================== */
@media (min-width: 640px) {
  .br-hide-mobile {
    display: inline;
  }

  .nf-nav-cards {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .nf-card {
    flex: 1;
    min-width: 180px;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 1.25rem;
  }

  .nf-card__arrow {
    align-self: flex-end;
    margin-top: auto;
  }

  .nf-card__body {
    align-items: flex-start;
  }
}

@media (min-width: 768px) {
  .nf-ghost-number {
    opacity: 0.22;
  }
}
</style>
