<script setup lang="ts">
  import { useWindowScroll, useWindowSize } from '@vueuse/core'
  import gsap from 'gsap'

  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import * as THREE from 'three'
  import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
  import { useRouter } from 'vue-router'

  gsap.registerPlugin(ScrollTrigger)

  const router = useRouter()

  // Three.js refs
  const canvasContainer = ref<HTMLDivElement | null>(null)
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let particles: THREE.Points
  let animationFrameId: number
  let mouseX = 0
  let mouseY = 0

  // Animation refs
  const isLoaded = ref(false)

  // Scroll tracking
  const { y: scrollY } = useWindowScroll()
  const { width: windowWidth } = useWindowSize()

  // Parallax effect
  const _parallaxY = computed(() => scrollY.value * 0.3)

  // FAQ state
  const faqOpen = ref<number | null>(null)

  function toggleFaq (index: number) {
    faqOpen.value = faqOpen.value === index ? null : index
  }

  // Data
  const faqs = [
    {
      question: 'A We Party é gratuita?',
      answer: 'Sim, você pode criar conta e explorar eventos gratuitamente. Nossa missão é conectar pessoas a experiências incríveis.',
    },
    {
      question: 'Posso criar eventos na plataforma?',
      answer: 'Sim, qualquer usuário pode criar eventos. Seja uma festa íntima ou um grande show, nossa plataforma suporta todos os tamanhos.',
    },
    {
      question: 'Como encontrar eventos perto de mim?',
      answer: 'A plataforma usa geolocalização inteligente para mostrar eventos próximos, além de recomendar com base nos seus interesses.',
    },
    {
      question: 'Preciso pagar para participar de eventos?',
      answer: 'Depende do evento! Alguns são gratuitos e outros podem ter ingressos. Você sempre verá o valor antes de confirmar.',
    },
  ]

  const features = [
    {
      icon: 'mdi-map-marker-radius',
      title: 'Descubra eventos perto de você',
      description: 'Explore festas, shows e experiências únicas na sua cidade com nossa busca inteligente.',
      gradient: 'gradient-coral',
      emoji: '📍',
    },
    {
      icon: 'mdi-account-group',
      title: 'Veja quem vai participar',
      description: 'Saiba quem confirmou presença e conecte-se antes mesmo do evento começar.',
      gradient: 'gradient-purple',
      emoji: '👥',
    },
    {
      icon: 'mdi-chat',
      title: 'Interaja em tempo real',
      description: 'Converse, combine de ir junto e faça novos amigos com interesses em comum.',
      gradient: 'gradient-sunset',
      emoji: '💬',
    },
    {
      icon: 'mdi-calendar-plus',
      title: 'Crie eventos incríveis',
      description: 'Organize seus próprios eventos e alcance milhares de pessoas interessadas.',
      gradient: 'gradient-ocean',
      emoji: '✨',
    },
  ]

  const appScreenshots = [
    {
      title: 'Feed de Eventos',
      description: 'Navegue por eventos próximos em tempo real.',
      image: '/Feedparty.png',
      icon: 'mdi-view-dashboard',
      color: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
      tag: 'Descoberta',
      features: ['Eventos em tempo real', 'Filtros inteligentes', 'Feed personalizado'],
    },
    {
      title: 'Perfil Interativo',
      description: 'Personalize seu perfil e siga amigos.',
      image: '/perfilweparty.png',
      icon: 'mdi-account-circle',
      color: '#8b5cf6',
      tag: 'Social',
      features: ['Perfil customizável', 'Rede de amigos', 'Histórico de eventos'],
    },
    {
      title: 'Detalhes do Evento',
      description: 'Informações completas e participantes.',
      image: '/pagdetalhesdeevento.png',
      icon: 'mdi-calendar-star',
      color: '#3b82f6',
      tag: 'Informações',
      features: ['Info completas', 'Mapa integrado', 'Lista de participantes'],
    },
  ]

  const howItWorks = [
    { number: '01', title: 'Crie sua conta', description: 'Cadastre-se gratuitamente em segundos.', icon: 'mdi-account-plus', color: 'linear-gradient(135deg, #ff6b6b, #ff8e53)' },
    { number: '02', title: 'Descubra eventos', description: 'Explore eventos próximos e filtrados.', icon: 'mdi-compass', color: '#8b5cf6' },
    { number: '03', title: 'Conecte-se', description: 'Veja quem vai e faça novos amigos.', icon: 'mdi-heart-multiple', color: '#ec4899' },
    { number: '04', title: 'Viva experiências', description: 'Participe e crie memórias incríveis.', icon: 'mdi-party-popper', color: 'linear-gradient(135deg, #ff6b6b, #ff8e53)' },
  ]

  const stats = [
    { value: '50K+', label: 'Usuários Ativos', icon: '👥' },
    { value: '2K+', label: 'Eventos/Mês', icon: '🎉' },
    { value: '100+', label: 'Cidades', icon: '🌎' },
    { value: '4.9', label: 'Avaliação', icon: '⭐' },
  ]

  // Live counter
  const usersOnline = ref(0)
  const targetUsersOnline = 1847

  // Three.js setup
  function initThreeJS () {
    if (!canvasContainer.value) return

    const container = canvasContainer.value
    const width = container.clientWidth
    const height = container.clientHeight

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 50

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x00_00_00, 0)
    container.append(renderer.domElement)

    // Particles
    const particleCount = windowWidth.value < 768 ? 250 : 500
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const colorPalette = [
      new THREE.Color('#ff6b6b'),
      new THREE.Color('#ff8e53'),
      new THREE.Color('#ffd93d'),
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#ec4899'),
      new THREE.Color('#3b82f6'),
    ]

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 100
      positions[i3 + 1] = (Math.random() - 0.5) * 100
      positions[i3 + 2] = (Math.random() - 0.5) * 50

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]!
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
      sizes[i] = Math.random() * 2 + 0.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vec3 pos = position;
          pos.y += sin(time * 0.5 + position.x * 0.1) * 2.0;
          pos.x += cos(time * 0.3 + position.y * 0.1) * 1.5;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * pixelRatio * (60.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    particles = new THREE.Points(geometry, material)
    scene.add(particles)

    function animate () {
      animationFrameId = requestAnimationFrame(animate)
      const time = performance.now() * 0.001
      ; (material.uniforms.time as { value: number }).value = time
      particles.rotation.x += (mouseY * 0.000_03 - particles.rotation.x) * 0.05
      particles.rotation.y += (mouseX * 0.000_03 - particles.rotation.y) * 0.05
      particles.rotation.z += 0.0002
      renderer.render(scene, camera)
    }
    animate()

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX - window.innerWidth / 2
      mouseY = e.clientY - window.innerHeight / 2
    }
    window.addEventListener('mousemove', handleMouseMove)

    const handleResize = () => {
      if (!canvasContainer.value) return
      const w = canvasContainer.value.clientWidth
      const h = canvasContainer.value.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)
  }

  function destroyThreeJS () {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    if (renderer) {
      renderer.dispose()
      if (canvasContainer.value && renderer.domElement.parentNode) {
        renderer.domElement.remove()
      }
    }
    if (particles) {
      particles.geometry.dispose()
      ; (particles.material as THREE.Material).dispose()
    }
  }

  // GSAP Animations
  function initAnimations () {
    gsap.to({ val: 0 }, {
      val: targetUsersOnline,
      duration: 2.5,
      ease: 'power2.out',
      delay: 0.5,
      onUpdate: function () {
        usersOnline.value = Math.round(this.targets()[0].val)
      },
    })

    const heroTl = gsap.timeline({ delay: 0.2 })
    heroTl
      .from('.hero-badge-animated', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .from('.hero-title-animated', { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-subtitle-animated', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-cta-animated', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.15 }, '-=0.3')
      .from('.hero-stats-animated', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2')

    for (const [i, card] of gsap.utils.toArray('.feature-card-animated').entries()) {
      gsap.from(card as Element, {
        scrollTrigger: { trigger: card as Element, start: 'top 85%', toggleActions: 'play none none reverse' },
        y: 60, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out',
      })
    }

    for (const item of gsap.utils.toArray('.showcase-animated')) {
      gsap.from(item as Element, {
        scrollTrigger: { trigger: item as Element, start: 'top 80%', toggleActions: 'play none none reverse' },
        y: 80, opacity: 0, duration: 1, ease: 'power3.out',
      })
    }

    for (const [i, step] of gsap.utils.toArray('.step-animated').entries()) {
      gsap.from(step as Element, {
        scrollTrigger: { trigger: step as Element, start: 'top 85%', toggleActions: 'play none none reverse' },
        y: 50, opacity: 0, duration: 0.8, delay: i * 0.15, ease: 'power3.out',
      })
    }

    for (const header of gsap.utils.toArray('.section-header-animated')) {
      gsap.from(header as Element, {
        scrollTrigger: { trigger: header as Element, start: 'top 85%', toggleActions: 'play none none reverse' },
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      })
    }
  }

  onMounted(async () => {
    await nextTick()
    initThreeJS()
    initAnimations()
    setTimeout(() => {
      isLoaded.value = true
    }, 100)
  })

  onUnmounted(() => {
    destroyThreeJS()
    for (const t of ScrollTrigger.getAll()) t.kill()
  })

  // Navigation
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
  <div class="landing-page" :class="{ 'is-loaded': isLoaded }">
    <!-- Three.js Canvas -->
    <div ref="canvasContainer" class="three-canvas" />
    <div class="gradient-overlay" />

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

      <!-- Grupo Extra para mais densidade -->
      <span class="float-emoji size-sm glow" style="--x: 18%; --y: 42%; --delay: 1.3s; --duration: 5s;">⭐</span>
      <span class="float-emoji size-sm glow" style="--x: 82%; --y: 65%; --delay: 2.6s; --duration: 4s;">✨</span>
      <span class="float-emoji size-sm glow" style="--x: 48%; --y: 68%; --delay: 3.2s; --duration: 5s;">💫</span>
    </div>

    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo" @click="router.push('/')">
            <img alt="We Party Logo" class="logo-img" src="/logoweparty.png">
            <span class="logo-text">We Party</span>
          </div>
          <nav class="nav-menu">
            <a class="nav-link" href="#features">Recursos</a>
            <a class="nav-link" href="#como-funciona">Como funciona</a>
            <a class="nav-link" href="#app">App</a>
            <a class="nav-link" href="#contato">Contato</a>
          </nav>
          <div class="auth-buttons">
            <button class="btn-ghost" type="button" @click="goToLogin">Entrar</button>
            <button class="btn-primary-glow" type="button" @click="goToSignup">
              <span>Começar Grátis</span>
              <v-icon icon="mdi-arrow-right" size="18" />
            </button>
          </div>
          <button class="mobile-menu-btn" type="button">
            <v-icon icon="mdi-menu" size="24" />
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-glow hero-glow-1" />
      <div class="hero-glow hero-glow-2" />
      <div class="hero-glow hero-glow-3" />

      <div class="container">
        <div class="hero-content">
          <div class="hero-badge-animated hero-badge">
            <div class="badge-pulse" />
            <span class="badge-icon">✨</span>
            <span>A rede social #1 para eventos</span>
          </div>

          <h1 class="hero-title-animated hero-title">
            <span class="title-line">Descubra eventos.</span>
            <span class="title-line">Conecte-se com</span>
            <span class="title-line title-gradient">pessoas incríveis.</span>
          </h1>

          <p class="hero-subtitle-animated hero-subtitle">
            Encontre festas, shows e experiências únicas.
            Veja quem vai participar e <span class="highlight">conecte-se</span> antes do evento começar.
          </p>

          <div class="hero-cta-group">
            <button class="hero-cta-animated btn-cta-primary" type="button" @click="goToSignup">
              <span>Começar Agora</span>
              <v-icon icon="mdi-arrow-right" size="20" />
              <div class="btn-glow" />
            </button>
            <button class="hero-cta-animated btn-cta-secondary" type="button" @click="goToFeed">
              <v-icon icon="mdi-play-circle-outline" size="22" />
              <span>Explorar Eventos</span>
            </button>
          </div>

          <div class="hero-stats-animated hero-stats">
            <div v-for="(stat, index) in stats" :key="index" class="stat-item">
              <span class="stat-emoji">{{ stat.icon }}</span>
              <div class="stat-info">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Counter -->
    <section class="live-counter">
      <div class="container">
        <div class="counter-card">
          <div class="counter-pulse" />
          <div class="counter-content">
            <v-icon class="counter-icon" icon="mdi-account-group" size="28" />
            <div class="counter-info">
              <span class="counter-number">{{ usersOnline.toLocaleString() }}</span>
              <span class="counter-text">pessoas descobrindo eventos agora</span>
            </div>
            <div class="counter-live">
              <span class="live-dot" />
              <span>AO VIVO</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="features">
      <div class="features-bg" />
      <div class="container">
        <div class="section-header-animated section-header">
          <span class="section-overline">RECURSOS</span>
          <h2 class="section-title">
            Tudo que você precisa para
            <span class="gradient-text">viver experiências</span>
          </h2>
          <p class="section-description">
            Nossa plataforma conecta pessoas através de eventos incríveis
          </p>
        </div>

        <div class="features-grid">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="feature-card-animated feature-card"
            :class="feature.gradient"
          >
            <div class="feature-emoji">{{ feature.emoji }}</div>
            <div class="feature-icon-wrapper">
              <div class="feature-icon-bg" />
              <div class="feature-icon">
                <v-icon :icon="feature.icon" size="32" />
              </div>
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
            <div class="feature-arrow">→</div>
          </div>
        </div>
      </div>
    </section>

    <!-- App Screenshots -->
    <section id="app" class="app-showcase">
      <div class="container">
        <div class="section-header-animated section-header">
          <span class="section-overline">PLATAFORMA</span>
          <h2 class="section-title">
            Veja o We Party
            <span class="gradient-text">em ação</span>
          </h2>
          <p class="section-description">
            Conheça nossa plataforma e descubra como é fácil explorar eventos
          </p>
        </div>

        <div class="screenshots-grid">
          <div v-for="(screenshot, index) in appScreenshots" :key="index" class="showcase-animated screenshot-card">
            <div class="screenshot-image-wrapper">
              <img v-if="screenshot.image" :alt="screenshot.title" class="screenshot-img" :src="screenshot.image">
              <div
                v-else
                class="screenshot-placeholder"
                :style="{ borderColor: screenshot.color.includes('gradient') ? '#ff6b6b' : screenshot.color }"
              >
                <v-icon
                  :color="screenshot.color.includes('gradient') ? '#ff6b6b' : screenshot.color"
                  :icon="screenshot.icon"
                  size="64"
                />
                <p class="placeholder-text">{{ screenshot.title }}</p>
                <p class="placeholder-hint">Adicione seu screenshot aqui</p>
              </div>
            </div>
            <div class="screenshot-content">
              <span class="screenshot-tag" :style="{ background: screenshot.color }">
                {{ screenshot.tag }}
              </span>
              <h3 class="screenshot-title">{{ screenshot.title }}</h3>
              <p class="screenshot-description">{{ screenshot.description }}</p>
              <ul class="screenshot-features">
                <li v-for="(feat, i) in screenshot.features" :key="i">
                  <v-icon
                    icon="mdi-check-circle"
                    size="16"
                    :style="{ color: screenshot.color.includes('gradient') ? '#ff6b6b' : screenshot.color }"
                  />
                  {{ feat }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="como-funciona" class="how-it-works">
      <div class="container">
        <div class="section-header-animated section-header">
          <span class="section-overline">PROCESSO</span>
          <h2 class="section-title">
            Como funciona o
            <span class="gradient-text">We Party</span>
          </h2>
          <p class="section-description">
            Em 4 passos simples você estará pronto para descobrir eventos
          </p>
        </div>

        <div class="steps-grid">
          <div class="steps-line" />
          <div v-for="(step, index) in howItWorks" :key="index" class="step-animated step-card">
            <div class="step-number" :style="{ background: step.color }">
              <v-icon :icon="step.icon" size="24" />
              <span class="step-badge">{{ step.number }}</span>
            </div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-description">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-bg" />
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Pronto para descobrir seu próximo rolê?</h2>
          <p class="cta-subtitle">Junte-se a milhares de pessoas que já estão vivendo experiências incríveis</p>
          <button class="btn-cta-large" type="button" @click="goToSignup">
            <span>Começar Agora - É Grátis</span>
            <v-icon icon="mdi-arrow-right" size="24" />
          </button>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq">
      <div class="container">
        <div class="section-header-animated section-header">
          <span class="section-overline">FAQ</span>
          <h2 class="section-title">Perguntas Frequentes</h2>
        </div>

        <div class="faq-list">
          <div v-for="(faq, index) in faqs" :key="index" class="faq-item" :class="{ active: faqOpen === index }">
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

    <!-- Contact -->
    <section id="contato" class="contact">
      <div class="container">
        <div class="section-header-animated section-header">
          <span class="section-overline">CONTATO</span>
          <h2 class="section-title">Fale com a gente</h2>
          <p class="section-description">Tem dúvidas ou quer divulgar um evento?</p>
        </div>
        <a class="btn-contact" href="mailto:contato@weparty.com">
          <v-icon icon="mdi-email-outline" size="20" />
          <span>Entrar em contato</span>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <img alt="We Party Logo" class="logo-img" src="/logoweparty.png">
            <span class="logo-text">We Party</span>
          </div>
          <div class="footer-links">
            <a href="#sobre">Sobre</a>
            <a href="#termos">Termos</a>
            <a href="#privacidade">Privacidade</a>
          </div>
          <div class="footer-social">
            <a aria-label="Instagram" class="social-link" href="#">
              <v-icon icon="mdi-instagram" />
            </a>
            <a aria-label="Facebook" class="social-link" href="#">
              <v-icon icon="mdi-facebook" />
            </a>
            <a aria-label="Twitter" class="social-link" href="#">
              <v-icon icon="mdi-twitter" />
            </a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 We Party. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   VARIÁVEIS E BASE
   ═══════════════════════════════════════════════════════════════════════════ */
.landing-page {
  --primary: #ff6b6b;
  --primary-dark: #ff5252;
  --secondary: #ff8e53;
  --accent: #ffd93d;
  --purple: #8b5cf6;
  --pink: #ec4899;
  --blue: #3b82f6;
  --dark: #1a1a2e;
  --dark-2: #16213e;
  --text-dark: #2c3e50;
  --text-light: #6c757d;
  --light: #ffffff;
  --bg-light: #f5f5f5;
  --text: #2c3e50;
  --text-muted: #6c757d;
  --glass: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(255, 107, 107, 0.1);
  --gradient: linear-gradient(135deg, #ff6b6b, #ff8e53);
  --gradient-hero: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  --gradient-purple: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  --shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.12);
  --shadow-colored: 0 20px 60px rgba(255, 107, 107, 0.25);

  background: var(--gradient-hero);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 2;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DECORAÇÕES FLUTUANTES
   ═══════════════════════════════════════════════════════════════════════════ */
.floating-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.float-emoji {
  position: absolute;
  left: var(--x);
  top: var(--y);
  font-size: 40px;
  opacity: 0.18;
  animation: floatBounce var(--duration) ease-in-out infinite;
  animation-delay: var(--delay);
  filter: drop-shadow(0 4px 8px rgba(255, 107, 107, 0.15));
  transition: opacity 0.4s ease;
}

.float-emoji.size-sm {
  font-size: 28px;
  opacity: 0.15;
}

.float-emoji.size-md {
  font-size: 40px;
  opacity: 0.18;
}

.float-emoji.size-lg {
  font-size: 56px;
  opacity: 0.22;
}

.float-emoji.size-xl {
  font-size: 72px;
  opacity: 0.16;
}

.float-emoji.glow {
  filter: drop-shadow(0 0 10px rgba(255, 200, 100, 0.6));
  animation: floatBounce var(--duration) ease-in-out infinite, glowTwinkle 2s ease-in-out infinite;
}

@keyframes glowTwinkle {

  0%,
  100% {
    opacity: 0.15;
    filter: drop-shadow(0 0 8px rgba(255, 200, 100, 0.4));
  }

  50% {
    opacity: 0.4;
    filter: drop-shadow(0 0 20px rgba(255, 200, 100, 0.8));
  }
}

@keyframes floatBounce {

  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }

  25% {
    transform: translateY(-15px) rotate(5deg) scale(1.05);
  }

  50% {
    transform: translateY(-8px) rotate(-3deg) scale(1);
  }

  75% {
    transform: translateY(-18px) rotate(3deg) scale(1.03);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   THREE.JS CANVAS & OVERLAYS
   ═══════════════════════════════════════════════════════════════════════════ */
.three-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.gradient-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(255, 107, 107, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.02) 0%, transparent 70%);
  z-index: 1;
  pointer-events: none;
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
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 107, 107, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 20px rgba(255, 107, 107, 0.06);
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
  animation: gentle-float 3s ease-in-out infinite;
}

@keyframes gentle-float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: 'Baloo Thambi 2', cursive;
  font-style: normal;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  gap: 2.5rem;
}

.nav-link {
  color: #334155;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--gradient);
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: var(--primary);
}

.nav-link:hover::after {
  width: 100%;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
}

.btn-ghost:hover {
  color: var(--primary);
  background: rgba(255, 107, 107, 0.05);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.35);
}

.btn-primary-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 107, 107, 0.45);
}

.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════════════════ */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10rem 0 8rem;
  position: relative;
  text-align: center;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: pulse-glow 4s ease-in-out infinite;
}

.hero-glow-1 {
  width: 500px;
  height: 500px;
  background: var(--primary);
  top: 10%;
  left: -10%;
}

.hero-glow-2 {
  width: 400px;
  height: 400px;
  background: var(--purple);
  top: 30%;
  right: -5%;
  animation-delay: 1s;
}

.hero-glow-3 {
  width: 300px;
  height: 300px;
  background: var(--pink);
  bottom: 10%;
  left: 30%;
  animation-delay: 2s;
}

@keyframes pulse-glow {

  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.35rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 107, 107, 0.15);
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.12);
}

.badge-pulse {
  position: absolute;
  inset: 0;
  background: var(--gradient);
  opacity: 0.1;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {

  0%,
  100% {
    opacity: 0.1;
  }

  50% {
    opacity: 0.2;
  }
}

.badge-icon {
  animation: sparkle 1.5s ease-in-out infinite;
}

@keyframes sparkle {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 2rem;
  letter-spacing: -0.03em;
  color: #1a1a2e;
}

.title-line {
  display: block;
}

.title-gradient {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  color: #64748b;
  line-height: 1.8;
  margin-bottom: 3.5rem;
  max-width: 620px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
}

.hero-subtitle .highlight {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}

.hero-cta-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
}

.btn-cta-primary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 2.5rem;
  background: var(--gradient);
  border: none;
  border-radius: 16px;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 40px rgba(255, 107, 107, 0.35);
  position: relative;
  overflow: hidden;
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
  transform: translateY(-3px);
  box-shadow: 0 16px 50px rgba(255, 107, 107, 0.45);
}

.btn-cta-secondary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(255, 107, 107, 0.15);
  border-radius: 16px;
  color: #ff6b6b;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.btn-cta-secondary:hover {
  background: white;
  border-color: rgba(255, 107, 107, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 107, 107, 0.1);
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  max-width: 700px;
  margin: 0 auto;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-emoji {
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;
}

.stat-label {
  font-size: 0.85rem;
  color: #999;
  font-weight: 600;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE COUNTER
   ═══════════════════════════════════════════════════════════════════════════ */
.live-counter {
  padding: 2rem 0;
  position: relative;
  z-index: 10;
}

.counter-card {
  display: flex;
  justify-content: center;
  position: relative;
}

.counter-pulse {
  position: absolute;
  inset: 0;
  background: var(--gradient);
  border-radius: 16px;
  opacity: 0.1;
  animation: counter-pulse 2s ease-in-out infinite;
}

@keyframes counter-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.1;
  }

  50% {
    transform: scale(1.02);
    opacity: 0.15;
  }
}

.counter-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.counter-icon {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.counter-info {
  display: flex;
  flex-direction: column;
}

.counter-number {
  font-size: 1.5rem;
  font-weight: 800;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.counter-text {
  font-size: 0.9rem;
  color: #333;
  font-weight: 600;
}

.counter-live {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: var(--gradient);
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
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

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADERS
   ═══════════════════════════════════════════════════════════════════════════ */
.section-header {
  text-align: center;
  max-width: 750px;
  margin: 0 auto 4.5rem;
}

.section-overline {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
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

.gradient-text {
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  font-size: 1.15rem;
  color: #64748b;
  line-height: 1.75;
  font-weight: 400;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════════════════════════════════════ */
.features {
  padding: 10rem 0;
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

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
  margin-top: 4rem;
}

.feature-card {
  position: relative;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 28px;
  padding: 3rem 2.5rem;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
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
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(255, 107, 107, 0.12),
    0 0 0 1px rgba(255, 107, 107, 0.08);
  border-color: rgba(255, 107, 107, 0.15);
}

.feature-card:hover::before {
  opacity: 0.05;
}

.feature-emoji {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  font-size: 2rem;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-emoji {
  opacity: 0.6;
  transform: scale(1.2) rotate(10deg);
}

.feature-icon-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

.feature-icon {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  background: var(--gradient);
  border-radius: 26px;
  color: white;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.25);
  transition: transform 0.3s;
}

.feature-icon-bg {
  position: absolute;
  inset: -10px;
  background: var(--gradient);
  border-radius: 32px;
  opacity: 0.15;
  filter: blur(15px);
  transition: all 0.3s;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
}

.feature-card:hover .feature-icon-bg {
  opacity: 0.3;
  transform: scale(1.2);
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1e293b;
  line-height: 1.4;
  position: relative;
  z-index: 1;
  letter-spacing: -0.01em;
}

.feature-description {
  color: #64748b;
  line-height: 1.7;
  font-size: 1.05rem;
  font-size: 1rem;
  position: relative;
  z-index: 1;
}

.feature-arrow {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  font-size: 1.5rem;
  background: var(--gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.feature-card:hover .feature-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP SHOWCASE
   ═══════════════════════════════════════════════════════════════════════════ */
.app-showcase {
  padding: 10rem 0;
  position: relative;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 3.5rem;
  margin-top: 4rem;
}

.screenshot-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.screenshot-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
}

.screenshot-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.screenshot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease, filter 0.3s ease;
}

.screenshot-card:hover .screenshot-img {
  transform: scale(1.05);
  filter: brightness(1.05);
}

.screenshot-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 3rem;
  border: 3px dashed rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  margin: 1.5rem;
  transition: all 0.3s;
}

.screenshot-card:hover .screenshot-placeholder {
  border-color: inherit;
  transform: scale(1.02);
}

.placeholder-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.placeholder-hint {
  font-size: 0.9rem;
  color: #999;
  margin: 0;
  border-radius: 24px;
}

.screenshot-content {
  padding: 2.5rem;
}

.screenshot-tag {
  display: inline-block;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.25rem;
}

.screenshot-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1e293b;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.screenshot-description {
  color: #64748b;
  font-size: 1.05rem;
  line-height: 1.7;
  margin-bottom: 2rem;
}

.screenshot-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.screenshot-features li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #666;
  font-weight: 500;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════════════════════════════ */
.how-it-works {
  padding: 10rem 0;
  position: relative;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
  position: relative;
}

.steps-line {
  display: none;
}

.step-card {
  text-align: center;
  position: relative;
}

.step-number {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  color: white;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.step-card:hover .step-number {
  transform: scale(1.1) rotate(5deg);
}

.step-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  background: var(--dark);
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
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

/* ═══════════════════════════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════════════════════════ */
.cta-section {
  padding: 8rem 0;
  position: relative;
  overflow: hidden;
}

.cta-bg {
  position: absolute;
  inset: 0;
  background: var(--gradient);
  opacity: 0.1;
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

.cta-subtitle {
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
}

.btn-cta-large {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 3rem;
  background: var(--gradient);
  border: none;
  border-radius: 20px;
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 15px 50px rgba(255, 107, 107, 0.4);
}

.btn-cta-large:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 60px rgba(255, 107, 107, 0.5);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════════════════ */
.faq {
  padding: 8rem 0;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  border-color: #ff6b6b;
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

/* ═══════════════════════════════════════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════════════════════════════════════ */
.contact {
  padding: 8rem 0;
  text-align: center;
}

.btn-contact {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 2px solid #ff6b6b;
  color: #ff6b6b;
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

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
.footer {
  padding: 4rem 0 2rem;
  border-top: 1px solid rgba(255, 107, 107, 0.15);
  background: linear-gradient(180deg, #fff 0%, #fff5f5 100%);
  position: relative;
  isolation: isolate;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 3rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-links {
  display: flex;
  gap: 2rem;
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
  border-top: 1px solid var(--glass-border);
}

.footer-bottom p {
  color: #999;
  font-size: 0.9rem;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .screenshots-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {

  .nav-menu,
  .auth-buttons {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .hero {
    padding: 7rem 0 4rem;
  }

  .hero-glow-1,
  .hero-glow-2,
  .hero-glow-3 {
    width: 200px;
    height: 200px;
  }

  .hero-cta-group {
    flex-direction: column;
  }

  .btn-cta-primary,
  .btn-cta-secondary {
    width: 100%;
    justify-content: center;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1.5rem;
  }

  .stat-item {
    justify-content: center;
  }

  .counter-content {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .features-grid,
  .screenshots-grid,
  .steps-grid {
    grid-template-columns: 1fr;
  }

  .phone-mockup {
    width: 180px;
    height: 360px;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-links {
    flex-direction: column;
    gap: 1rem;
  }

  .scroll-indicator {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .btn-cta-primary,
  .btn-cta-secondary {
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }

  .feature-card,
  .screenshot-card {
    padding: 1.5rem;
  }

  .phone-mockup {
    width: 160px;
    height: 320px;
  }
}
</style>
