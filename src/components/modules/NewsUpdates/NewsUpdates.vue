<script setup lang="ts">
  import type { ReleasedNewsUpdate, UpcomingNewsUpdate } from '@/constants/newsUpdates'
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { LATEST_UPDATES_COUNT, NEWS_CATEGORY_META, NEWS_UPDATES } from '@/constants/newsUpdates'

  const router = useRouter()

  const dayMonthYear = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

  // Datas vêm como `YYYY-MM-DD`; new Date() as leria em UTC e poderia exibir o
  // dia anterior em fusos negativos, então montamos a data no fuso local.
  function parseDate (iso: string) {
    const [year, month, day] = iso.split('-').map(Number)
    return new Date(year!, month! - 1, day!)
  }

  const released = computed(() =>
    NEWS_UPDATES
      .filter((u): u is ReleasedNewsUpdate => u.status === 'released')
      .toSorted((a, b) => b.releasedAt.localeCompare(a.releasedAt)),
  )

  const latest = computed(() => released.value.slice(0, LATEST_UPDATES_COUNT))
  const history = computed(() => released.value.slice(LATEST_UPDATES_COUNT))

  // Regra de negócio: item futuro sem previsão de data não é exibido.
  const upcoming = computed(() =>
    NEWS_UPDATES
      .filter((u): u is UpcomingNewsUpdate & { expectedAt: string } =>
        u.status === 'upcoming' && Boolean(u.expectedAt))
      .toSorted((a, b) => a.expectedAt.localeCompare(b.expectedAt)),
  )

  function goToFeed () {
    router.push('/public/explore')
  }
  function goToSignup () {
    router.push('/public/Signup')
  }
</script>

<template>
  <div class="news-page">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo" @click="router.push('/')">
            <img alt="We Party Logo" class="logo-img" src="/logoweparty.png">
            <span class="logo-text">We Party</span>
          </div>
          <div class="auth-buttons">
            <button class="btn-ghost" type="button" @click="goToFeed">Explorar eventos</button>
            <button class="btn-primary-glow" type="button" @click="goToSignup">
              <span>CADASTRO</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-glow" />
      <div class="container">
        <div class="section-header">
          <span class="section-overline">Novidades</span>
          <h1 class="section-title">
            O que há de novo na <span class="logo-text">We Party</span>
          </h1>
          <p class="section-description">
            Acompanhe o que acabou de chegar, o que estamos construindo e tudo o que já entregamos.
          </p>
        </div>
      </div>
    </section>

    <!-- Últimas entregas -->
    <section class="latest">
      <div class="container">
        <h2 class="block-title">
          <v-icon icon="mdi-rocket-launch-outline" size="24" />
          Últimas entregas
        </h2>

        <div class="latest-grid">
          <article v-for="update in latest" :key="update.id" class="update-card">
            <div class="card-top">
              <span
                class="category-chip"
                :style="{ background: NEWS_CATEGORY_META[update.category].color }"
              >
                <v-icon :icon="NEWS_CATEGORY_META[update.category].icon" size="14" />
                {{ NEWS_CATEGORY_META[update.category].label }}
              </span>
              <time class="card-date" :datetime="update.releasedAt">
                {{ dayMonthYear.format(parseDate(update.releasedAt)) }}
              </time>
            </div>
            <h3 class="card-title">{{ update.title }}</h3>
            <p class="card-description">{{ update.description }}</p>
            <ul v-if="update.highlights?.length" class="card-highlights">
              <li v-for="highlight in update.highlights" :key="highlight">
                <v-icon
                  icon="mdi-check-circle"
                  size="16"
                  :style="{ color: NEWS_CATEGORY_META[update.category].color }"
                />
                {{ highlight }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA intermediário: feed -->
    <section class="cta-inline">
      <div class="container">
        <div class="cta-card">
          <div class="cta-text">
            <h2 class="cta-title">Tudo isso já está no ar</h2>
            <p class="cta-subtitle">Veja os eventos acontecendo perto de você agora mesmo.</p>
          </div>
          <button class="btn-cta-large" type="button" @click="goToFeed">
            <span>Ir para o feed</span>
            <v-icon icon="mdi-arrow-right" size="20" />
          </button>
        </div>
      </div>
    </section>

    <!-- Em breve -->
    <section v-if="upcoming.length > 0" class="upcoming">
      <div class="container">
        <h2 class="block-title">
          <v-icon icon="mdi-clock-outline" size="24" />
          Em breve
        </h2>

        <div class="upcoming-grid">
          <article v-for="update in upcoming" :key="update.id" class="upcoming-card">
            <span class="upcoming-eta">
              <v-icon icon="mdi-calendar-clock" size="16" />
              Previsão: {{ monthYear.format(parseDate(update.expectedAt)) }}
            </span>
            <h3 class="card-title">{{ update.title }}</h3>
            <p class="card-description">{{ update.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Histórico -->
    <section v-if="history.length > 0" class="history">
      <div class="container">
        <h2 class="block-title">
          <v-icon icon="mdi-history" size="24" />
          Histórico
        </h2>

        <ol class="timeline">
          <li v-for="update in history" :key="update.id" class="timeline-item">
            <span
              class="timeline-dot"
              :style="{ background: NEWS_CATEGORY_META[update.category].color }"
            />
            <div class="timeline-body">
              <div class="timeline-meta">
                <time :datetime="update.releasedAt">
                  {{ dayMonthYear.format(parseDate(update.releasedAt)) }}
                </time>
                <span
                  class="timeline-category"
                  :style="{ color: NEWS_CATEGORY_META[update.category].color }"
                >{{ NEWS_CATEGORY_META[update.category].label }}</span>
              </div>
              <h3 class="timeline-title">{{ update.title }}</h3>
              <p class="card-description">{{ update.description }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- CTA final: cadastro -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title-large">Quer fazer parte do que vem por aí?</h2>
          <p class="cta-subtitle">Crie sua conta gratuita e participe dos próximos eventos.</p>
          <button class="btn-cta-large" type="button" @click="goToSignup">
            <span>Criar minha conta</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand" @click="router.push('/')">
            <img alt="We Party Logo" class="logo-img" src="/logoweparty.png">
            <span class="logo-text">We Party</span>
          </div>
          <p class="footer-copy">© 2026 We Party. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   VARIÁVEIS E BASE — espelham os tokens da LandingPage
   ═══════════════════════════════════════════════════════════════════════════ */
.news-page {
  --primary: #FFB74D;
  --primary-dark: #FF9F3D;
  --secondary: #FF9AB5;
  --text: #2c3e50;
  --gradient: linear-gradient(135deg, #FFB74D, #FF9AB5);
  --gradient-hero: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);

  background: var(--gradient-hero);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  width: 100%;
}

.news-page * {
  box-sizing: border-box;
}

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

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════════════════ */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1.25rem 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 183, 77, 0.08);
  box-shadow: 0 2px 20px rgba(255, 183, 77, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: 'Baloo Thambi 2', cursive;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: #334155;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  border-radius: 10px;
  transition: color 0.3s ease, background-color 0.3s ease;
}

.btn-ghost:hover {
  color: var(--primary);
  background: rgba(255, 183, 77, 0.05);
}

.btn-primary-glow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gradient);
  border: none;
  color: white;
  font-weight: 700;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 20px rgba(255, 183, 77, 0.35);
}

.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 183, 77, 0.45);
}

@media (max-width: 600px) {
  .btn-ghost {
    display: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════════════ */
.hero {
  padding: 11rem 0 4rem;
  position: relative;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, rgba(255, 183, 77, 0.18) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.section-header {
  text-align: center;
  max-width: 880px;
  margin: 0 auto;
}

.section-header .section-description {
  max-width: 750px;
  margin: 0 auto;
}

.section-overline {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 183, 77, 0.2);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1.25rem;
  line-height: 1.3;
  color: #1e293b;
  letter-spacing: -0.02em;
}

/* A marca dentro de um título herda o tamanho dele, mas mantém a fonte e o
   gradiente do logo. `nowrap`: a quebra acontece antes de "We Party", nunca
   entre as duas palavras. */
.section-title .logo-text {
  font-size: inherit;
  display: inline;
  white-space: nowrap;
}

.section-description {
  font-size: 1.15rem;
  color: #64748b;
  line-height: 1.75;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCOS
   ═══════════════════════════════════════════════════════════════════════════ */
.block-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 2rem;
}

.block-title .v-icon {
  color: var(--primary);
}

.latest,
.upcoming,
.history {
  padding: 4rem 0;
}

.upcoming {
  background: linear-gradient(180deg, #FFF8FA 0%, #FFFDFE 100%);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARDS DE ENTREGA
   ═══════════════════════════════════════════════════════════════════════════ */
.latest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.update-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 183, 77, 0.15);
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.update-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(255, 183, 77, 0.2);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-date {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.6rem;
  line-height: 1.4;
}

.card-description {
  font-size: 0.98rem;
  color: #64748b;
  line-height: 1.65;
}

.card-highlights {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-highlights li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #475569;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EM BREVE
   ═══════════════════════════════════════════════════════════════════════════ */
.upcoming-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.upcoming-card {
  background: rgba(255, 255, 255, 0.75);
  border: 1px dashed rgba(139, 92, 246, 0.35);
  border-radius: 20px;
  padding: 1.75rem;
}

.upcoming-eta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIMELINE DO HISTÓRICO
   ═══════════════════════════════════════════════════════════════════════════ */
.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  left: 7px;
  width: 2px;
  background: linear-gradient(180deg, rgba(255, 183, 77, 0.5), rgba(255, 154, 181, 0.15));
}

.timeline-item {
  position: relative;
  padding: 0 0 2rem 2.5rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 0.4rem;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px rgba(255, 183, 77, 0.25);
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.35rem;
  flex-wrap: wrap;
}

.timeline-category {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.08);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.35rem;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CTAs
   ═══════════════════════════════════════════════════════════════════════════ */
.cta-inline {
  padding: 2rem 0;
}

.cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 2.5rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 183, 77, 0.2);
  box-shadow: 0 10px 40px rgba(255, 183, 77, 0.12);
}

.cta-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.35rem;
}

.cta-subtitle {
  color: #64748b;
  font-size: 1rem;
}

.cta-section {
  padding: 5rem 0 6rem;
  text-align: center;
}

.cta-content {
  max-width: 640px;
  margin: 0 auto;
}

.cta-title-large {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.cta-section .cta-subtitle {
  margin-bottom: 2rem;
}

.btn-cta-large {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 2.5rem;
  background: var(--gradient);
  border: none;
  border-radius: 20px;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 15px 50px rgba(255, 183, 77, 0.4);
  white-space: nowrap;
}

.btn-cta-large:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 183, 77, 0.5);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
.footer {
  padding: 2.5rem 0;
  border-top: 1px solid rgba(255, 183, 77, 0.15);
  background: rgba(255, 255, 255, 0.6);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}

.footer-brand .logo-img {
  width: 32px;
  height: 32px;
}

.footer-brand .logo-text {
  font-size: 1.35rem;
}

.footer-copy {
  font-size: 0.85rem;
  color: #64748b;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVO
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .hero {
    padding: 9rem 0 3rem;
  }

  .latest,
  .upcoming,
  .history {
    padding: 3rem 0;
  }

  .cta-card {
    padding: 1.75rem;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .btn-cta-large {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .update-card,
  .btn-cta-large,
  .btn-primary-glow,
  .logo {
    transition: none;
  }

  .update-card:hover,
  .btn-cta-large:hover,
  .btn-primary-glow:hover,
  .logo:hover {
    transform: none;
  }
}
</style>
