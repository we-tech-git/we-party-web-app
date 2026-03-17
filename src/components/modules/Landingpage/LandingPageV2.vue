<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  // Estado do FAQ
  const faqOpen = ref<number | null>(null)

  function toggleFaq (index: number) {
    faqOpen.value = faqOpen.value === index ? null : index
  }

  const faqs = [
    {
      question: 'A We Party é gratuita?',
      answer: 'Sim, você pode criar conta e explorar eventos gratuitamente.',
    },
    {
      question: 'Posso criar eventos na plataforma?',
      answer: 'Sim, qualquer usuário pode criar eventos.',
    },
    {
      question: 'Como encontrar eventos perto de mim?',
      answer: 'A plataforma mostra eventos próximos com base na sua localização e interesses.',
    },
    {
      question: 'Preciso pagar para participar de eventos?',
      answer: 'Alguns eventos são gratuitos e outros podem ter ingressos.',
    },
  ]

  const features = [
    {
      icon: 'mdi-map-marker-radius',
      title: 'Descubra eventos perto de você',
      description: 'Explore festas, shows e experiências na sua cidade.',
      gradient: 'from-pink-500 to-orange-500',
      delay: '0s',
    },
    {
      icon: 'mdi-account-group',
      title: 'Veja quem vai participar',
      description: 'Saiba quem confirmou presença antes mesmo do evento começar.',
      gradient: 'from-purple-500 to-pink-500',
      delay: '0.1s',
    },
    {
      icon: 'mdi-chat',
      title: 'Interaja com outros participantes',
      description: 'Converse, combine de ir e conheça novas pessoas.',
      gradient: 'from-orange-500 to-yellow-500',
      delay: '0.2s',
    },
    {
      icon: 'mdi-calendar-plus',
      title: 'Crie e compartilhe eventos',
      description: 'Organize seus próprios eventos e alcance mais pessoas.',
      gradient: 'from-blue-500 to-purple-500',
      delay: '0.3s',
    },
  ]

  const appScreenshots = [
    {
      title: 'Feed de Eventos',
      description: 'Navegue por eventos próximos e veja o que está acontecendo na sua cidade em tempo real.',
      image: '/screenshots/feed.png',
      icon: 'mdi-view-dashboard',
      color: '#ff6b6b',
      tag: 'Descoberta',
    },
    {
      title: 'Perfil Interativo',
      description: 'Personalize seu perfil, siga amigos e acompanhe eventos que você confirmou presença.',
      image: '/screenshots/profile.png',
      icon: 'mdi-account-circle',
      color: '#8b5cf6',
      tag: 'Social',
    },
    {
      title: 'Detalhes do Evento',
      description: 'Veja informações completas, localização, participantes confirmados e comente sobre o evento.',
      image: '/screenshots/event-details.png',
      icon: 'mdi-calendar-star',
      color: '#3b82f6',
      tag: 'Informações',
    },
    {
      title: 'Chat e Interações',
      description: 'Converse com outros participantes, faça perguntas e conecte-se antes do evento começar.',
      image: '/screenshots/chat.png',
      icon: 'mdi-message-text',
      color: '#10b981',
      tag: 'Comunicação',
    },
    {
      title: 'Criar Evento',
      description: 'Interface simples e intuitiva para criar seus próprios eventos e alcançar milhares de pessoas.',
      image: '/screenshots/create-event.png',
      icon: 'mdi-plus-circle',
      color: '#f59e0b',
      tag: 'Criação',
    },
    {
      title: 'Explorar Categorias',
      description: 'Filtre por interesses e descubra eventos perfeitos para você: festas, shows, esportes e mais.',
      image: '/screenshots/categories.png',
      icon: 'mdi-format-list-bulleted-type',
      color: '#ec4899',
      tag: 'Filtros',
    },
  ]

  const howItWorks = [
    {
      number: '1',
      title: 'Crie sua conta',
      description: 'Cadastre-se gratuitamente em poucos segundos.',
      icon: 'mdi-account-plus',
      color: '#ff6b6b',
    },
    {
      number: '2',
      title: 'Descubra eventos',
      description: 'Explore eventos próximos ou baseados nos seus interesses.',
      icon: 'mdi-magnify',
      color: '#ff8e53',
    },
    {
      number: '3',
      title: 'Conecte-se com pessoas',
      description: 'Veja quem vai participar e interaja com a comunidade.',
      icon: 'mdi-account-multiple',
      color: '#ffd93d',
    },
    {
      number: '4',
      title: 'Viva novas experiências',
      description: 'Participe de eventos e descubra novos lugares e pessoas.',
      icon: 'mdi-star',
      color: '#ff6b6b',
    },
  ]

  // Simulação de contador de usuários online
  const usersOnline = ref(157)

  function goToSignup () {
    router.push('/public/Signup')
  }

  function goToLogin () {
    router.push('/public/Login')
  }

  function goToFeed () {
    router.push('/private/feed')
  }
</script>

<template>
  <div class="landing-page">
    <!-- Floating Decorations -->
    <div class="floating-decorations">
      <!-- Grupo Superior -->
      <span class="float-emoji size-lg" style="--x: 5%; --y: 15%; --delay: 0s; --duration: 8s;">🎉</span>
      <span class="float-emoji size-md" style="--x: 92%; --y: 12%; --delay: 1s; --duration: 7s;">🎊</span>
      <span class="float-emoji size-sm" style="--x: 25%; --y: 8%; --delay: 2.5s; --duration: 6s;">✨</span>
      <span class="float-emoji size-md" style="--x: 70%; --y: 18%; --delay: 0.5s; --duration: 9s;">🎈</span>

      <!-- Grupo Meio-Superior -->
      <span class="float-emoji size-lg" style="--x: 3%; --y: 35%; --delay: 1.5s; --duration: 7s;">🎵</span>
      <span class="float-emoji size-sm" style="--x: 95%; --y: 30%; --delay: 3s; --duration: 6s;">💃</span>
      <span class="float-emoji size-md" style="--x: 45%; --y: 25%; --delay: 2s; --duration: 8s;">🕺</span>
      <span class="float-emoji size-sm" style="--x: 80%; --y: 38%; --delay: 0.8s; --duration: 5s;">🌟</span>

      <!-- Grupo Central -->
      <span class="float-emoji size-xl" style="--x: 8%; --y: 55%; --delay: 0.3s; --duration: 10s;">🎤</span>
      <span class="float-emoji size-md" style="--x: 88%; --y: 50%; --delay: 2.2s; --duration: 7s;">🎧</span>
      <span class="float-emoji size-sm" style="--x: 35%; --y: 48%; --delay: 1.8s; --duration: 6s;">💿</span>
      <span class="float-emoji size-lg" style="--x: 60%; --y: 52%; --delay: 4s; --duration: 8s;">🎸</span>

      <!-- Grupo Inferior -->
      <span class="float-emoji size-md" style="--x: 12%; --y: 75%; --delay: 0.7s; --duration: 7s;">🪩</span>
      <span class="float-emoji size-lg" style="--x: 90%; --y: 72%; --delay: 1.2s; --duration: 9s;">🎭</span>
      <span class="float-emoji size-sm" style="--x: 55%; --y: 80%; --delay: 3.5s; --duration: 6s;">🍾</span>
      <span class="float-emoji size-md" style="--x: 30%; --y: 85%; --delay: 2.8s; --duration: 8s;">🥳</span>
      <span class="float-emoji size-xl" style="--x: 75%; --y: 88%; --delay: 0.2s; --duration: 10s;">🎪</span>

      <!-- Grupo Extra com brilho -->
      <span class="float-emoji size-sm glow" style="--x: 18%; --y: 42%; --delay: 1.3s; --duration: 5s;">⭐</span>
      <span class="float-emoji size-sm glow" style="--x: 82%; --y: 65%; --delay: 2.6s; --duration: 4s;">✨</span>
      <span class="float-emoji size-sm glow" style="--x: 48%; --y: 68%; --delay: 3.2s; --duration: 5s;">💫</span>
      <span class="float-emoji size-md" style="--x: 15%; --y: 60%; --delay: 1.8s; --duration: 6s;">🎶</span>
      <span class="float-emoji size-sm glow" style="--x: 65%; --y: 35%; --delay: 2.5s; --duration: 5s;">🌈</span>
    </div>

    <!-- Menu/Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <span class="logo-emoji">🎉</span>
            <span class="logo-text">We Party</span>
          </div>
          <nav class="nav-menu">
            <a class="nav-link" href="#como-funciona">Como funciona</a>
            <a class="nav-link" href="#contato">Entre em contato</a>
          </nav>
          <div class="auth-buttons">
            <button class="btn-text" type="button" @click="goToLogin">Login</button>
            <button class="btn-primary" type="button" @click="goToSignup">CADASTRO</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Bloco 1 - Hero -->
    <section class="hero">
      <div class="hero-decoration-1" />
      <div class="hero-decoration-2" />
      <div class="hero-decoration-3" />
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="sparkle">✨</span>
            <span>A rede social feita para quem ama eventos</span>
          </div>
          <h1 class="hero-title">
            Descubra eventos perto de você e
            <span class="hero-highlight">conecte-se</span>
            com pessoas que também vão
          </h1>
          <p class="hero-subtitle">
            Encontre festas, shows e experiências na sua cidade, veja quem vai participar e
            <strong>interaja</strong> com outros usuários antes mesmo do evento começar.
          </p>
          <div class="hero-cta-group">
            <button class="btn-cta btn-cta-primary" type="button" @click="goToSignup">
              <span>Experimentar Grátis</span>
              <v-icon icon="mdi-arrow-right" size="20" />
            </button>
            <button class="btn-cta btn-cta-secondary" type="button" @click="goToFeed">
              <v-icon icon="mdi-play-circle" size="20" />
              <span>Ver como funciona</span>
            </button>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">10k+</span>
              <span class="stat-label">Usuários ativos</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-number">500+</span>
              <span class="stat-label">Eventos/mês</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-number">50+</span>
              <span class="stat-label">Cidades</span>
            </div>
          </div>
        </div>
      </div>
      <div class="hero-bg" />
      <div class="hero-shape-1" />
      <div class="hero-shape-2" />
    </section>

    <!-- Bloco 2 - Contador de usuários -->
    <section class="users-online">
      <div class="container">
        <div class="users-badge">
          <span class="pulse-dot" />
          <span class="users-text">+{{ usersOnline }} pessoas descobrindo eventos AGORA</span>
        </div>
      </div>
    </section>

    <!-- Bloco 3 - Features -->
    <section id="features" class="features">
      <div class="features-decoration" />
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Recursos</span>
          <h2 class="section-title">Uma nova forma de descobrir e viver eventos</h2>
          <p class="section-subtitle">Conecte-se, explore e aproveite experiências únicas com pessoas incríveis</p>
        </div>
        <div class="features-grid">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="feature-card"
            :style="{ animationDelay: feature.delay }"
          >
            <div class="feature-icon-wrapper">
              <div class="feature-icon" :class="feature.gradient">
                <v-icon :icon="feature.icon" size="36" />
              </div>
              <div class="feature-icon-bg" :class="feature.gradient" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
            <div class="feature-arrow">→</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bloco 3.5 - App Screenshots / Veja em Ação -->
    <section class="app-screenshots">
      <div class="screenshots-decoration-1" />
      <div class="screenshots-decoration-2" />
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Plataforma</span>
          <h2 class="section-title split-text">
            <span class="title-line">Veja o We Party</span>
            <span class="title-line highlight-text">em ação</span>
          </h2>
          <p class="section-subtitle">
            Conheça cada detalhe da nossa plataforma e descubra como é fácil explorar e criar eventos incríveis
          </p>
        </div>

        <!-- Grid principal com alternância de layout -->
        <div v-if="appScreenshots && appScreenshots.length >= 3" class="screenshots-showcase">
          <!-- Item 1 - Feed (Imagem à direita) -->
          <div class="showcase-item fade-in-up" data-delay="0">
            <div class="showcase-content">
              <div class="showcase-badge" :style="{ background: appScreenshots[0]?.color }">
                <v-icon :icon="appScreenshots[0]?.icon" size="20" />
                <span>{{ appScreenshots[0]?.tag }}</span>
              </div>
              <h3 class="showcase-title">{{ appScreenshots[0]?.title }}</h3>
              <p class="showcase-description">{{ appScreenshots[0]?.description }}</p>
              <div class="showcase-features">
                <div class="feature-item">✓ Eventos em tempo real</div>
                <div class="feature-item">✓ Filtros inteligentes</div>
                <div class="feature-item">✓ Feed personalizado</div>
              </div>
            </div>
            <div class="showcase-image-wrapper">
              <div class="browser-mockup">
                <div class="browser-window">
                  <div class="browser-header">
                    <div class="browser-dots">
                      <span class="dot red" />
                      <span class="dot yellow" />
                      <span class="dot green" />
                    </div>
                    <div class="browser-url">
                      <v-icon icon="mdi-lock" size="14" />
                      <span>weparty.com/{{ appScreenshots[0]?.title?.toLowerCase().replace(/\s+/g, '-') }}</span>
                    </div>
                  </div>
                  <div class="browser-content">
                    <div class="screenshot-placeholder" :style="{ borderColor: appScreenshots[0]?.color }">
                      <v-icon :color="appScreenshots[0]?.color" :icon="appScreenshots[0]?.icon" size="64" />
                      <p class="placeholder-text">{{ appScreenshots[0]?.title }}</p>
                      <p class="placeholder-hint">Adicione seu screenshot aqui</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Item 2 - Perfil (Imagem à esquerda) -->
          <div class="showcase-item reverse fade-in-up" data-delay="100">
            <div class="showcase-content">
              <div class="showcase-badge" :style="{ background: appScreenshots[1]?.color }">
                <v-icon :icon="appScreenshots[1]?.icon" size="20" />
                <span>{{ appScreenshots[1]?.tag }}</span>
              </div>
              <h3 class="showcase-title">{{ appScreenshots[1]?.title }}</h3>
              <p class="showcase-description">{{ appScreenshots[1]?.description }}</p>
              <div class="showcase-features">
                <div class="feature-item">✓ Perfil customizável</div>
                <div class="feature-item">✓ Rede de amigos</div>
                <div class="feature-item">✓ Histórico de eventos</div>
              </div>
            </div>
            <div class="showcase-image-wrapper">
              <div class="browser-mockup">
                <div class="browser-window">
                  <div class="browser-header">
                    <div class="browser-dots">
                      <span class="dot red" />
                      <span class="dot yellow" />
                      <span class="dot green" />
                    </div>
                    <div class="browser-url">
                      <v-icon icon="mdi-lock" size="14" />
                      <span>weparty.com/{{ appScreenshots[1]?.title?.toLowerCase().replace(/\s+/g, '-') }}</span>
                    </div>
                  </div>
                  <div class="browser-content">
                    <div class="screenshot-placeholder" :style="{ borderColor: appScreenshots[1]?.color }">
                      <v-icon :color="appScreenshots[1]?.color" :icon="appScreenshots[1]?.icon" size="64" />
                      <p class="placeholder-text">{{ appScreenshots[1]?.title }}</p>
                      <p class="placeholder-hint">Adicione seu screenshot aqui</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Item 3 - Detalhes (Imagem à direita) -->
          <div class="showcase-item fade-in-up" data-delay="200">
            <div class="showcase-content">
              <div class="showcase-badge" :style="{ background: appScreenshots[2]?.color }">
                <v-icon :icon="appScreenshots[2]?.icon" size="20" />
                <span>{{ appScreenshots[2]?.tag }}</span>
              </div>
              <h3 class="showcase-title">{{ appScreenshots[2]?.title }}</h3>
              <p class="showcase-description">{{ appScreenshots[2]?.description }}</p>
              <div class="showcase-features">
                <div class="feature-item">✓ Informações completas</div>
                <div class="feature-item">✓ Mapa integrado</div>
                <div class="feature-item">✓ Lista de participantes</div>
              </div>
            </div>
            <div class="showcase-image-wrapper">
              <div class="browser-mockup">
                <div class="browser-window">
                  <div class="browser-header">
                    <div class="browser-dots">
                      <span class="dot red" />
                      <span class="dot yellow" />
                      <span class="dot green" />
                    </div>
                    <div class="browser-url">
                      <v-icon icon="mdi-lock" size="14" />
                      <span>weparty.com/{{ appScreenshots[2]?.title?.toLowerCase().replace(/\s+/g, '-') }}</span>
                    </div>
                  </div>
                  <div class="browser-content">
                    <div class="screenshot-placeholder" :style="{ borderColor: appScreenshots[2]?.color }">
                      <v-icon :color="appScreenshots[2]?.color" :icon="appScreenshots[2]?.icon" size="64" />
                      <p class="placeholder-text">{{ appScreenshots[2]?.title }}</p>
                      <p class="placeholder-hint">Adicione seu screenshot aqui</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid secundário compacto -->
        <div class="screenshots-grid-compact">
          <div
            v-for="(screenshot, index) in appScreenshots.slice(3)"
            :key="index + 3"
            class="screenshot-card-compact fade-in-up"
            :style="{ animationDelay: `${(index + 3) * 0.1}s` }"
          >
            <div class="compact-icon" :style="{ background: screenshot.color }">
              <v-icon :icon="screenshot.icon" size="32" :style="{ color: 'white' }" />
            </div>
            <h4 class="compact-title">{{ screenshot.title }}</h4>
            <p class="compact-description">{{ screenshot.description }}</p>
          </div>
        </div>

        <div class="screenshots-cta">
          <p class="screenshots-cta-text">✨ Pronto para começar sua jornada?</p>
          <button class="btn-screenshots-cta" type="button" @click="goToSignup">
            <span>Criar Conta Grátis</span>
            <v-icon icon="mdi-arrow-right" size="20" />
          </button>
        </div>
      </div>
    </section>

    <!-- Bloco 4 - Como funciona -->
    <section id="como-funciona" class="how-it-works">
      <div class="container">
        <div class="section-header">
          <span class="section-badge">Processo Simples</span>
          <h2 class="section-title">Como funciona o We Party</h2>
          <p class="section-subtitle">Em 4 passos simples você estará pronto para descobrir eventos incríveis</p>
        </div>
        <div class="steps-wrapper">
          <div class="steps-connector" />
          <div class="steps-grid">
            <div v-for="(step, index) in howItWorks" :key="index" class="step-card">
              <div class="step-icon-wrapper">
                <div class="step-number" :style="{ background: step.color }">
                  <v-icon :icon="step.icon" size="28" />
                </div>
                <div class="step-badge">{{ step.number }}</div>
              </div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-description">{{ step.description }}</p>
              <div v-if="index < howItWorks.length - 1" class="step-arrow">
                <v-icon icon="mdi-arrow-right" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bloco 5 - CTA -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Pronto para descobrir seu próximo rolê?</h2>
          <button class="btn-cta-large" type="button" @click="goToFeed">
            Explorar
          </button>
        </div>
      </div>
    </section>

    <!-- Bloco 6 - FAQ -->
    <section class="faq">
      <div class="container">
        <h2 class="section-title">Perguntas Frequentes</h2>
        <div class="faq-list">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="faq-item"
            :class="{ active: faqOpen === index }"
          >
            <button class="faq-question" type="button" @click="toggleFaq(index)">
              <span>{{ faq.question }}</span>
              <v-icon :icon="faqOpen === index ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
            </button>
            <Transition name="faq-slide">
              <div v-if="faqOpen === index" class="faq-answer">
                <p>{{ faq.answer }}</p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Bloco 7 - Contato -->
    <section id="contato" class="contact">
      <div class="container">
        <h2 class="section-title">Contato</h2>
        <div class="contact-content">
          <h3 class="contact-subtitle">Fale com a gente</h3>
          <p class="contact-text">Tem dúvidas ou quer divulgar um evento?</p>
          <a class="btn-contact" href="mailto:contato@weparty.com">Entrar em contato</a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-links">
            <a href="#sobre">Sobre</a>
            <a href="#termos">Termos</a>
            <a href="#privacidade">Privacidade</a>
            <a href="#contato">Contato</a>
          </div>
          <div class="footer-social">
            <a aria-label="Instagram" class="social-link" href="#" target="_blank">
              <v-icon icon="mdi-instagram" />
            </a>
            <a aria-label="Facebook" class="social-link" href="#" target="_blank">
              <v-icon icon="mdi-facebook" />
            </a>
            <a aria-label="Twitter" class="social-link" href="#" target="_blank">
              <v-icon icon="mdi-twitter" />
            </a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 We Party. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ─── Variáveis ────────────────────────────────────────────────────────── */
.landing-page {
  --primary: #ff6b6b;
  --primary-dark: #ff5252;
  --secondary: #ff8e53;
  --accent: #ffd93d;
  --purple: #8b5cf6;
  --blue: #3b82f6;
  --dark: #1a1a2e;
  --dark-2: #16213e;
  --text-dark: #2c3e50;
  --text-light: #6c757d;
  --light: #ffffff;
  --bg-light: #f5f5f5;
  --gradient: linear-gradient(135deg, #ff6b6b, #ff8e53);
  --gradient-hero: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  --shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.12);
  --shadow-colored: 0 20px 60px rgba(255, 107, 107, 0.25);
}

/* ─── Reset e Base ─────────────────────────────────────────────────────── */
.landing-page {
  background: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  color: var(--text-dark);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  isolation: isolate;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 1;
}

/* ─── Floating Decorations ─────────────────────────────────────────────── */
.floating-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  opacity: 0.08;
}

.float-emoji {
  position: absolute;
  left: var(--x);
  top: var(--y);
  font-size: 40px;
  opacity: 0.5;
  animation: floatBounce var(--duration) ease-in-out infinite;
  animation-delay: var(--delay);
  filter: blur(1px);
  will-change: transform;
}

.float-emoji.size-sm {
  font-size: 28px;
}

.float-emoji.size-md {
  font-size: 40px;
}

.float-emoji.size-lg {
  font-size: 56px;
}

.float-emoji.size-xl {
  font-size: 72px;
}

.float-emoji.glow {
  animation: floatBounce var(--duration) ease-in-out infinite;
}

@keyframes floatBounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.05);
  }
}

/* ─── Animações ────────────────────────────────────────────────────────── */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rotate-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-100%) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

/* ─── Header ───────────────────────────────────────────────────────────── */
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 107, 107, 0.1);
  padding: 1rem 0;
  box-shadow: 0 2px 20px rgba(255, 107, 107, 0.08);
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
  gap: 0.5rem;
  cursor: pointer;
  transition: transform 0.3s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-emoji {
  font-size: 1.8rem;
  animation: floatBounce 3s ease-in-out infinite;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: var(--text-dark);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.3s;
}

.nav-link:hover {
  color: var(--primary);
}

.auth-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-text {
  background: transparent;
  border: none;
  color: var(--text-dark);
  font-weight: 600;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: color 0.3s;
}

.btn-text:hover {
  color: var(--primary);
}

.btn-primary {
  background: var(--gradient);
  border: none;
  color: white;
  font-weight: 700;
  padding: 0.7rem 1.8rem;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(255, 95, 166, 0.5);
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */
.hero {
  position: relative;
  padding: 10rem 0 8rem;
  text-align: center;
  overflow: hidden;
  background: var(--gradient-hero);
  isolation: isolate;
  margin-bottom: 4rem;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(255, 107, 107, 0.12), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.hero-decoration-1,
.hero-decoration-2,
.hero-decoration-3 {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.2;
  animation: float 6s ease-in-out infinite;
  z-index: 0;
}

.hero-decoration-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  top: -200px;
  left: -100px;
}

.hero-decoration-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  top: 50%;
  right: -150px;
  animation-delay: 2s;
}

.hero-decoration-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #ffd93d, #ff8e53);
  bottom: -100px;
  left: 50%;
  animation-delay: 4s;
}

.hero-shape-1,
.hero-shape-2 {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 107, 107, 0.15);
  animation: rotate-slow 20s linear infinite;
  z-index: 0;
}

.hero-shape-1 {
  width: 600px;
  height: 600px;
  top: -300px;
  right: -300px;
}

.hero-shape-2 {
  width: 400px;
  height: 400px;
  bottom: -200px;
  left: -200px;
  animation-direction: reverse;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  margin: 0 auto;
  animation: slide-up 0.8s ease-out;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.15);
}

.sparkle {
  animation: sparkle 1.5s ease-in-out infinite;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1.15;
  margin-bottom: 1.5rem;
  color: #1a1a2e;
  letter-spacing: -0.02em;
  animation: slideInFromBottom 0.8s ease-out 0.2s backwards;
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-highlight {
  position: relative;
  display: inline-block;
  animation: highlight-reveal 1s ease-out 0.5s backwards;
}

@keyframes highlight-reveal {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.hero-highlight::after {
  content: '';
  position: absolute;
  bottom: 10%;
  left: -5%;
  width: 110%;
  height: 40%;
  background: linear-gradient(135deg, #ffd93d, #ff8e53);
  border-radius: 8px;
  opacity: 0.3;
  z-index: -1;
  transform: rotate(-2deg) scaleX(0);
  transform-origin: left;
  animation: underlineGrow 0.6s ease-out 0.8s forwards;
}

@keyframes underlineGrow {
  to {
    transform: rotate(-2deg) scaleX(1);
  }
}

.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  color: #666;
  line-height: 1.7;
  margin-bottom: 3rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  animation: fadeIn 1s ease-out 0.4s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.hero-subtitle strong {
  color: #333;
  font-weight: 700;
}

.hero-cta-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
  animation: fadeIn 1s ease-out 0.6s backwards;
}

.btn-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.2rem 2.5rem;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.btn-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.btn-cta:hover::before {
  transform: translateX(100%);
}

.btn-cta-primary {
  background: var(--gradient);
  color: white;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.35);
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.btn-cta-primary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 15px 40px rgba(255, 107, 107, 0.5);
  animation: none;
}

.btn-cta-secondary {
  background: rgba(255, 255, 255, 0.9);
  color: var(--primary);
  border: 2px solid rgba(255, 107, 107, 0.2);
  backdrop-filter: blur(10px);
}

.btn-cta-secondary:hover {
  transform: translateY(-3px);
  background: white;
  border-color: var(--primary);
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.2);
}

.hero-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 107, 107, 0.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  margin: 0 auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 900;
  color: #1a1a2e;
}

.stat-label {
  font-size: 0.85rem;
  color: #999;
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(0, 0, 0, 0.1);
}

/* ─── Users Online ─────────────────────────────────────────────────────── */
.users-online {
  padding: 2rem 0;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.users-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: #4CAF50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.users-text {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

/* ─── Features ─────────────────────────────────────────────────────────── */
.features {
  padding: 8rem 0;
  position: relative;
  background: linear-gradient(180deg, rgba(255, 107, 107, 0.03) 0%, transparent 50%, rgba(255, 142, 83, 0.03) 100%);
  isolation: isolate;
}

.features-decoration {
  position: absolute;
  top: 10%;
  right: 0;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 107, 107, 0.08), transparent 70%);
  border-radius: 50%;
  filter: blur(60px);
  z-index: 0;
}

.section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;
  position: relative;
  z-index: 2;
}

.section-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.1));
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  margin-bottom: 1rem;
  color: #1a1a2e;
  line-height: 1.2;
}

.section-subtitle {
  font-size: 1.15rem;
  color: #666;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  position: relative;
  z-index: 2;
}

.feature-card {
  position: relative;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 28px;
  padding: 2.5rem 2rem;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  animation: slide-up 0.6s ease-out backwards;
  overflow: hidden;
  isolation: isolate;
}

.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 142, 83, 0.05));
  opacity: 0;
  transition: opacity 0.3s;
}

.feature-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 50px rgba(255, 107, 107, 0.15),
    0 0 0 1px rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.2);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
  display: inline-block;
}

.feature-icon {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--gradient);
  border-radius: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.25);
  transition: transform 0.3s;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
}

.feature-icon-bg {
  position: absolute;
  inset: -10px;
  background: var(--gradient);
  border-radius: 30px;
  opacity: 0.15;
  filter: blur(15px);
  transition: all 0.3s;
}

.feature-card:hover .feature-icon-bg {
  opacity: 0.3;
  transform: scale(1.2);
}

.from-pink-500 {
  background: linear-gradient(135deg, #ec4899, #f97316) !important;
}

.from-purple-500 {
  background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
}

.from-orange-500 {
  background: linear-gradient(135deg, #f97316, #fbbf24) !important;
}

.from-blue-500 {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6) !important;
}

.feature-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #333;
  line-height: 1.3;
}

.feature-description {
  color: #666;
  line-height: 1.7;
  font-size: 1rem;
}

.feature-arrow {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  font-size: 1.5rem;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s;
}

.feature-card:hover .feature-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ─── App Screenshots ──────────────────────────────────────────────────── */
.app-screenshots {
  padding: 10rem 0;
  background: linear-gradient(180deg,
    rgba(139, 92, 246, 0.03) 0%,
    rgba(59, 130, 246, 0.03) 50%,
    rgba(236, 72, 153, 0.03) 100%);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.screenshots-decoration-1 {
  position: absolute;
  top: 15%;
  left: -200px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%);
  border-radius: 50%;
  filter: blur(100px);
  animation: float 10s ease-in-out infinite;
  z-index: 0;
}

.screenshots-decoration-2 {
  position: absolute;
  bottom: 10%;
  right: -200px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.08), transparent 70%);
  border-radius: 50%;
  filter: blur(100px);
  animation: float 12s ease-in-out infinite reverse;
  animation-delay: 2s;
  z-index: 0;
}

/* Typography dinâmica */
.split-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title-line {
  display: block;
}

.highlight-text {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Showcase alternado */
.screenshots-showcase {
  display: flex;
  flex-direction: column;
  gap: 10rem;
  margin: 6rem 0;
  position: relative;
  z-index: 2;
}

.showcase-item {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5rem;
  align-items: center;
  opacity: 0;
  transform: translateY(50px);
  animation: fadeInUp 0.8s ease-out forwards;
  position: relative;
  z-index: 2;
  padding: 2rem 0;
}

.showcase-item.reverse {
  direction: rtl;
}

.showcase-item.reverse > * {
  direction: ltr;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up[data-delay="0"] { animation-delay: 0.2s; }
.fade-in-up[data-delay="100"] { animation-delay: 0.4s; }
.fade-in-up[data-delay="200"] { animation-delay: 0.6s; }

.showcase-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 2;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(255, 107, 107, 0.1);
}

.showcase-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: var(--primary);
  color: white;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  width: fit-content;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.showcase-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1.2;
  margin: 0;
}

.showcase-description {
  font-size: 1.2rem;
  color: #666;
  line-height: 1.8;
  margin: 0;
}

.showcase-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

/* Browser Mockup com efeito parallax */
.showcase-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  min-height: 500px;
  z-index: 2;
}

.browser-mockup {
  width: 100%;
  max-width: 600px;
  position: relative;
  z-index: 2;
}

.browser-mockup::before {
  content: '';
  position: absolute;
  inset: -30px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent 70%);
  border-radius: 50%;
  filter: blur(40px);
  z-index: -1;
}

.browser-window {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.browser-header {
  background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.browser-dots {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: transform 0.2s;
}

.dot.red {
  background: linear-gradient(135deg, #ff5f57, #ff3b30);
  box-shadow: 0 2px 4px rgba(255, 59, 48, 0.3);
}

.dot.yellow {
  background: linear-gradient(135deg, #ffbd2e, #ffa500);
  box-shadow: 0 2px 4px rgba(255, 165, 0, 0.3);
}

.dot.green {
  background: linear-gradient(135deg, #28ca42, #20c997);
  box-shadow: 0 2px 4px rgba(32, 201, 151, 0.3);
}

.browser-mockup:hover .dot {
  transform: scale(1.2);
}

.browser-url {
  flex: 1;
  background: white;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #666;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.browser-url v-icon {
  opacity: 0.6;
}

.browser-content {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.browser-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent,
    rgba(139, 92, 246, 0.3),
    transparent
  );
  animation: loading 2s ease-in-out infinite;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.browser-content .screenshot-placeholder {
  width: 90%;
  height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 3rem;
  border: 3px dashed rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  margin: 1.5rem;
  transition: all 0.3s;
}

.browser-mockup:hover .screenshot-placeholder {
  border-color: inherit;
  transform: scale(1.02);
}

/* Grid compacto */
.screenshots-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin: 4rem 0;
  position: relative;
  z-index: 2;
}

.screenshot-card-compact {
  background: white;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.6s ease-out forwards;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  isolation: isolate;
}

.screenshot-card-compact:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.compact-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.screenshot-card-compact:hover .compact-icon {
  transform: scale(1.1) rotate(5deg);
}

.compact-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.75rem;
}

.compact-description {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.screenshots-cta {
  text-align: center;
  padding: 4rem 2rem 2rem;
  position: relative;
  z-index: 2;
}

.screenshots-cta-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 2rem;
  text-shadow: 0 2px 10px rgba(255, 107, 107, 0.1);
}

.btn-screenshots-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border: none;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  padding: 1.3rem 3rem;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 10px 35px rgba(139, 92, 246, 0.35);
  position: relative;
  overflow: hidden;
}

.btn-screenshots-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.btn-screenshots-cta:hover::before {
  transform: translateX(100%);
}

.btn-screenshots-cta:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 50px rgba(139, 92, 246, 0.5);
}

/* ─── How It Works ────────────────────────────────────────────────────── */
.how-it-works {
  padding: 8rem 0;
  background: linear-gradient(180deg, rgba(255, 107, 107, 0.02) 0%, rgba(255, 142, 83, 0.02) 100%);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.how-it-works::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -200px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}

.steps-wrapper {
  position: relative;
  z-index: 2;
}

.steps-connector {
  position: absolute;
  top: 90px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg,
    rgba(255, 107, 107, 0.3) 0%,
    rgba(255, 142, 83, 0.3) 50%,
    rgba(255, 217, 61, 0.3) 100%);
  z-index: 0;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 3rem;
  position: relative;
  z-index: 2;
}

.step-card {
  text-align: center;
  position: relative;
  animation: slide-up 0.6s ease-out backwards;
}

.step-card:nth-child(1) { animation-delay: 0.1s; }
.step-card:nth-child(2) { animation-delay: 0.2s; }
.step-card:nth-child(3) { animation-delay: 0.3s; }
.step-card:nth-child(4) { animation-delay: 0.4s; }

.step-icon-wrapper {
  position: relative;
  margin-bottom: 2rem;
  display: inline-block;
}

.step-number {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  background: var(--gradient);
  border-radius: 50%;
  color: white;
  box-shadow: 0 10px 35px rgba(255, 107, 107, 0.35);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 4px solid white;
}

.step-card:hover .step-number {
  transform: scale(1.15) rotate(10deg);
  box-shadow: 0 15px 45px rgba(255, 107, 107, 0.5);
}

.step-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ffd93d, #ff8e53);
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 800;
  color: white;
  border: 3px solid white;
  box-shadow: 0 4px 15px rgba(255, 217, 61, 0.4);
}

.step-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #333;
  line-height: 1.3;
}

.step-description {
  color: #666;
  line-height: 1.7;
  font-size: 1rem;
}

.step-arrow {
  position: absolute;
  top: 45px;
  right: -2rem;
  color: var(--primary);
  opacity: 0.3;
  font-size: 1.5rem;
  animation: float 2s ease-in-out infinite;
}

/* ─── CTA Section ──────────────────────────────────────────────────────── */
.cta-section {
  padding: 8rem 0;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53, #ffd93d);
  background-size: 200% 200%;
  animation: gradient-shift 6s ease infinite;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.cta-section::before,
.cta-section::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  filter: blur(80px);
  z-index: 0;
}

.cta-section::before {
  top: -250px;
  left: -250px;
  animation: float 8s ease-in-out infinite;
}

.cta-section::after {
  bottom: -250px;
  right: -250px;
  animation: float 8s ease-in-out infinite reverse;
}

.cta-content {
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.cta-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 900;
  margin-bottom: 2.5rem;
  color: white;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  line-height: 1.2;
}

.btn-cta-large {
  background: white;
  border: none;
  color: var(--primary);
  font-weight: 700;
  font-size: 1.3rem;
  padding: 1.3rem 4rem;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.btn-cta-large::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 107, 107, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.btn-cta-large:hover::before {
  transform: translateX(100%);
}

.btn-cta-large:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

/* ─── FAQ ──────────────────────────────────────────────────────────────── */
.faq {
  padding: 8rem 0;
  background: linear-gradient(180deg, #ffeef2 0%, #fff5f5 50%, #fff 100%);
  position: relative;
  isolation: isolate;
}

.faq::before {
  content: '❓';
  position: absolute;
  font-size: 150px;
  opacity: 0.02;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
  z-index: 2;
}

.faq-item {
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  position: relative;
}

.faq-item.active {
  border-color: var(--primary);
  box-shadow: 0 8px 30px rgba(255, 107, 107, 0.15);
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.75rem 2rem;
  background: transparent;
  border: none;
  color: #333;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s;
  position: relative;
}

.faq-question::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  background: var(--gradient);
  border-radius: 0 4px 4px 0;
  transition: height 0.3s;
}

.faq-item.active .faq-question::before {
  height: 60%;
}

.faq-question:hover {
  background: rgba(255, 107, 107, 0.02);
}

.faq-answer {
  padding: 0 2rem 1.75rem;
  color: #666;
  line-height: 1.8;
  font-size: 1rem;
}

.faq-slide-enter-active,
.faq-slide-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.faq-slide-enter-from,
.faq-slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* ─── Contact ──────────────────────────────────────────────────────────── */
.contact {
  padding: 8rem 0;
  background: linear-gradient(180deg, rgba(255, 142, 83, 0.05) 0%, rgba(255, 217, 61, 0.05) 100%);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.contact::before {
  content: '💬';
  position: absolute;
  font-size: 200px;
  opacity: 0.03;
  top: 20%;
  right: 10%;
  animation: floatBounce 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.contact::after {
  content: '✉️';
  position: absolute;
  font-size: 150px;
  opacity: 0.03;
  bottom: 10%;
  left: 5%;
  animation: floatBounce 8s ease-in-out infinite;
  animation-delay: 2s;
  pointer-events: none;
  z-index: 0;
}

.contact-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.contact-subtitle {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #333;
}

.contact-text {
  color: #666;
  margin-bottom: 2.5rem;
  font-size: 1.15rem;
  line-height: 1.7;
}

.btn-contact {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 2px solid var(--primary);
  color: var(--primary);
  font-weight: 700;
  padding: 1.2rem 3rem;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.1);
  position: relative;
  overflow: hidden;
}

.btn-contact::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s;
  z-index: -1;
}

.btn-contact:hover::before {
  transform: scaleX(1);
}

.btn-contact:hover {
  color: white;
  border-color: transparent;
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
}

/* ─── Footer ───────────────────────────────────────────────────────────── */
.footer {
  padding: 4rem 0 2rem;
  border-top: 1px solid rgba(255, 107, 107, 0.15);
  background: linear-gradient(180deg, #fff 0%, #fff5f5 100%);
  position: relative;
  isolation: isolate;
}

.footer::before {
  content: '🎉';
  position: absolute;
  font-size: 100px;
  opacity: 0.03;
  bottom: 20%;
  right: 5%;
  animation: floatBounce 5s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 3rem;
  position: relative;
  z-index: 2;
}

.footer-links {
  display: flex;
  gap: 2.5rem;
  flex-wrap: wrap;
}

.footer-links a {
  color: #666;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s;
  position: relative;
}

.footer-links a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--gradient);
  transition: width 0.3s;
}

.footer-links a:hover::after {
  width: 100%;
}

.footer-links a:hover {
  color: var(--primary);
}

.footer-social {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.08);
  color: var(--text-light);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-decoration: none;
}

.social-link:hover {
  background: var(--gradient);
  border-color: transparent;
  color: white;
  transform: translateY(-5px) rotate(10deg);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 2;
}

.footer-bottom p {
  color: #999;
  font-size: 0.9rem;
}

/* ─── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .floating-decorations {
    display: none;
  }

  .float-emoji {
    display: none;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-menu {
    flex-direction: column;
    gap: 0.5rem;
  }

  .hero {
    padding: 6rem 0 4rem;
  }

  .hero-decoration-1,
  .hero-decoration-2,
  .hero-decoration-3 {
    display: none;
  }

  .hero-cta-group {
    flex-direction: column;
    width: 100%;
  }

  .btn-cta {
    width: 100%;
    justify-content: center;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1.5rem;
  }

  .stat-divider {
    width: 80%;
    height: 1px;
  }

  .features,
  .how-it-works,
  .app-screenshots,
  .faq,
  .contact {
    padding: 5rem 0;
  }

  .cta-section {
    padding: 6rem 0;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  /* Screenshots responsivo */
  .app-screenshots {
    padding: 6rem 0;
  }

  .screenshots-showcase {
    gap: 5rem;
    margin: 4rem 0;
  }

  .showcase-item {
    grid-template-columns: 1fr;
    gap: 3rem;
    padding: 1rem 0;
  }

  .showcase-item.reverse {
    direction: ltr;
  }

  .showcase-content {
    padding: 1.5rem;
  }

  .showcase-image-wrapper {
    min-height: 350px;
    order: -1;
  }

  .browser-window {
    max-width: 100%;
  }

  .browser-content {
    min-height: 300px;
  }

  .browser-url {
    font-size: 0.65rem;
  }

  .screenshots-grid-compact {
    grid-template-columns: 1fr;
  }

  .screenshots-cta-text {
    font-size: 1.2rem;
  }

  .steps-connector {
    display: none;
  }

  .steps-grid {
    gap: 2rem;
  }

  .step-arrow {
    display: none;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-links {
    flex-direction: column;
    gap: 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .btn-cta-large {
    padding: 1.1rem 2.5rem;
    font-size: 1.1rem;
  }

  .contact::before,
  .contact::after,
  .footer::before,
  .faq::before {
    display: none;
  }
}

@media (max-width: 480px) {
  .floating-decorations {
    display: none;
  }

  .hero-badge {
    font-size: 0.8rem;
    padding: 0.4rem 1rem;
  }

  .hero-stats {
    padding: 1.5rem;
  }

  .stat-number {
    font-size: 1.6rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .feature-card,
  .faq-item {
    padding: 1.5rem;
  }

  .browser-window {
    max-width: 100%;
  }

  .browser-content {
    min-height: 250px;
  }

  .browser-url {
    font-size: 0.6rem;
  }

  .browser-dots {
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }

  .showcase-image-wrapper {
    min-height: 300px;
  }

  .screenshot-card-compact {
    padding: 2rem 1.5rem;
  }

  .compact-icon {
    width: 60px;
    height: 60px;
  }

  .showcase-title {
    font-size: 1.8rem;
  }

  .showcase-description {
    font-size: 1rem;
  }

  .btn-screenshots-cta {
    width: 100%;
    justify-content: center;
    font-size: 1rem;
  }

  .btn-cta {
    padding: 1rem 2rem;
    font-size: 1rem;
  }

  .section-header,
  .cta-content,
  .contact-content {
    padding: 0 1rem;
  }
}
</style>
