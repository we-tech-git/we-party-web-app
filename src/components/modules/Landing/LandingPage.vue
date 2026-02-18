<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()

  // Estado
  const isScrolled = ref(false)
  const activeCategory = ref('todos')
  const searchQuery = ref('')
  const currentHeroSlide = ref(0)
  const currentCarouselIndex = ref(0)
  const mouseX = ref(0)
  const mouseY = ref(0)
  const isHoveringCard = ref<number | null>(null)
  const carouselRef = ref<HTMLElement | null>(null)

  // Eventos em destaque (Hero Carousel)
  const heroEvents = ref([
    {
      id: 1,
      banner: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&h=900&fit=crop',
      title: 'Festival de Música Eletrônica 2026',
      date: { day: '15', month: 'FEV', weekday: 'SÁB' },
      time: '22:00',
      location: 'Arena Parque, São Paulo / SP',
      venue: 'Arena Parque',
    },
    {
      id: 2,
      banner: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&h=900&fit=crop',
      title: 'Carnaval 2026 - Bloco das Marchinhas',
      date: { day: '28', month: 'FEV', weekday: 'SAB' },
      time: '16:00',
      location: 'Av. Paulista, São Paulo / SP',
      venue: 'Av. Paulista',
    },
    {
      id: 3,
      banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
      title: 'Rock in Rio - Dia do Rock',
      date: { day: '05', month: 'MAR', weekday: 'QUI' },
      time: '18:00',
      location: 'Cidade do Rock, Rio de Janeiro / RJ',
      venue: 'Cidade do Rock',
    },
  ])

  // Eventos principais (Grid estilo Ticket360/Sympla)
  const allEvents = ref([
    {
      id: 1,
      banner: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
      title: 'Show Salgadinho e Encontro de Batuqueiros',
      date: { day: '30', month: 'JAN', weekday: 'SEX' },
      time: '21:00',
      location: 'São Paulo / SP',
      venue: 'Espaço Usine',
      category: 'shows',
    },
    {
      id: 2,
      banner: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop',
      title: 'SANA 2026 Parte 1 - Anime Festival',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '10:00',
      location: 'Fortaleza / CE',
      venue: 'Centro de Eventos do Ceará',
      category: 'festivais',
    },
    {
      id: 3,
      banner: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&h=400&fit=crop',
      title: 'Bloco Dos Rosa - Carnaval 2026',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '16:00',
      location: 'Rio de Janeiro / RJ',
      venue: 'Farmasi Arena',
      category: 'festas',
    },
    {
      id: 4,
      banner: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&h=400&fit=crop',
      title: 'Gregorio Duvivier - O Céu da Língua',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '18:00',
      location: 'São Paulo / SP',
      venue: 'Espaço Unimed',
      category: 'shows',
    },
    {
      id: 5,
      banner: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop',
      title: 'Turnê Gregorio Duvivier',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '20:00',
      location: 'São Paulo / SP',
      venue: 'Espaço Unimed',
      category: 'shows',
    },
    {
      id: 6,
      banner: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=600&h=400&fit=crop',
      title: 'Fábio Jr. - Turnê 2026',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '19:00',
      location: 'Rio de Janeiro / RJ',
      venue: 'Vivo Rio',
      category: 'shows',
    },
    {
      id: 7,
      banner: 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=600&h=400&fit=crop',
      title: 'STONE BEATS com Illusionize',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '20:00',
      location: 'Leopoldina / MG',
      venue: 'Stone House',
      category: 'festas',
    },
    {
      id: 8,
      banner: 'https://images.unsplash.com/photo-1571266028243-d220c6fe2d28?w=600&h=400&fit=crop',
      title: 'Ensaios Monobloco',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '21:00',
      location: 'São Paulo / SP',
      venue: 'Audio',
      category: 'festas',
    },
    {
      id: 9,
      banner: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=400&fit=crop',
      title: 'Festival De Rap GEEK IN SANA',
      date: { day: '01', month: 'FEV', weekday: 'DOM' },
      time: '18:00',
      location: 'Fortaleza / CE',
      venue: 'Centro de Eventos do Ceará',
      category: 'festivais',
    },
    {
      id: 10,
      banner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
      title: 'Ney Matogrosso - 20+ Anos de Carreira',
      date: { day: '04', month: 'FEV', weekday: 'QUA' },
      time: '19:00',
      location: 'Rio de Janeiro / RJ',
      venue: 'Vivo Rio',
      category: 'shows',
    },
    {
      id: 11,
      banner: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
      title: 'João Gomes e Vanessa da Mata',
      date: { day: '30', month: 'JAN', weekday: 'SEX' },
      time: '20:00',
      location: 'Recife / PE',
      venue: 'Classic Hall',
      category: 'shows',
    },
    {
      id: 12,
      banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
      title: 'Villa Gávea Samba Clube',
      date: { day: '31', month: 'JAN', weekday: 'SÁB' },
      time: '22:00',
      location: 'Rio de Janeiro / RJ',
      venue: 'Villa',
      category: 'festas',
    },
  ])

  // Eventos de Carnaval
  const carnivalEvents = ref([
    {
      id: 101,
      banner: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=750&fit=crop',
      title: 'Ensaios da Anitta - Curitiba',
      date: { day: '31', month: 'JAN' },
      location: 'Curitiba / PR',
    },
    {
      id: 102,
      banner: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=600&h=750&fit=crop',
      title: 'Ensaios da Anitta - Ribeirão Preto',
      date: { day: '01', month: 'FEV' },
      location: 'Ribeirão Preto / SP',
    },
    {
      id: 103,
      banner: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=750&fit=crop',
      title: 'Bloco do Serro - Rio de Janeiro',
      date: { day: '31', month: 'JAN' },
      location: 'Rio de Janeiro / RJ',
    },
    {
      id: 104,
      banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=750&fit=crop',
      title: 'Vou Pro Sereno',
      date: { day: '08', month: 'FEV' },
      location: 'Mirante do Arvrão',
    },
    {
      id: 105,
      banner: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=750&fit=crop',
      title: 'Pagode da Vitória',
      date: { day: '14', month: 'FEV' },
      location: 'Exc Rio',
    },
  ])

  // Cursos e Workshops
  const workshopEvents = ref([
    {
      id: 201,
      banner: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
      title: 'AULÃO FITDANCE COLORS 2026',
      date: { day: '29', month: 'MAR', weekday: 'DOM' },
      time: '10:00',
      location: 'Belo Horizonte / MG',
    },
    {
      id: 202,
      banner: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=400&fit=crop',
      title: 'SUPERTRAMP EXPERIENCE',
      date: { day: '24', month: 'ABR', weekday: 'SEX' },
      time: '21:30',
      location: 'Belo Horizonte / MG',
    },
    {
      id: 203,
      banner: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=400&fit=crop',
      title: 'O PODER É VOCÊ! - Carol Pinelli',
      date: { day: '07', month: 'FEV', weekday: 'SÁB' },
      time: '08:30',
      location: 'Belo Horizonte / MG',
    },
    {
      id: 204,
      banner: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      title: 'WORKSHOP DE POWER TRAINING',
      date: { day: '07', month: 'FEV', weekday: 'SÁB' },
      time: '08:00',
      location: 'Belo Horizonte / MG',
    },
  ])

  // Categorias
  const categories = [
    { id: 'todos', name: 'Todos', icon: '🎯' },
    { id: 'shows', name: 'Shows', icon: '🎤' },
    { id: 'festas', name: 'Festas', icon: '🎉' },
    { id: 'festivais', name: 'Festivais', icon: '🎪' },
    { id: 'teatro', name: 'Teatro', icon: '🎭' },
    { id: 'esportes', name: 'Esportes', icon: '⚽' },
    { id: 'cursos', name: 'Cursos', icon: '📚' },
  ]

  // Filtrar eventos
  const filteredEvents = computed(() => {
    let events = allEvents.value

    if (activeCategory.value !== 'todos') {
      events = events.filter(e => e.category === activeCategory.value)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      events = events.filter(e =>
        e.title.toLowerCase().includes(query)
        || e.location.toLowerCase().includes(query)
        || e.venue.toLowerCase().includes(query),
      )
    }

    return events
  })

  // Hero Carousel Autoplay
  let heroInterval: number | null = null

  function startHeroAutoplay () {
    heroInterval = window.setInterval(() => {
      currentHeroSlide.value = (currentHeroSlide.value + 1) % heroEvents.value.length
    }, 6000)
  }

  function stopHeroAutoplay () {
    if (heroInterval) {
      clearInterval(heroInterval)
      heroInterval = null
    }
  }

  function goToHeroSlide (index: number) {
    currentHeroSlide.value = index
    stopHeroAutoplay()
    startHeroAutoplay()
  }

  // Scroll handler
  function handleScroll () {
    isScrolled.value = window.scrollY > 20
  }

  // Mouse tracking para efeito parallax
  function handleMouseMove (e: MouseEvent) {
    mouseX.value = (e.clientX / window.innerWidth - 0.5) * 20
    mouseY.value = (e.clientY / window.innerHeight - 0.5) * 20
  }

  // Carrossel de eventos em destaque
  const carouselEvents = computed(() => {
    return allEvents.value.slice(0, 8)
  })

  function nextCarouselSlide () {
    const maxIndex = Math.max(0, carouselEvents.value.length - 4)
    currentCarouselIndex.value = Math.min(currentCarouselIndex.value + 1, maxIndex)
  }

  function prevCarouselSlide () {
    currentCarouselIndex.value = Math.max(currentCarouselIndex.value - 1, 0)
  }

  // Navigation
  const goToSignup = () => router.push('/public/signup')
  const goToLogin = () => router.push('/public/login')

  // Lifecycle
  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    startHeroAutoplay()

    // Intersection Observer para animações
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        }
      },
      { threshold: 0.1, rootMargin: '50px' },
    )

    for (const el of document.querySelectorAll('.fade-in-section')) {
      observer.observe(el)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('mousemove', handleMouseMove)
    stopHeroAutoplay()
  })
</script>

<template>
  <div class="landing" @mousemove="handleMouseMove">
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
    <header class="header" :class="{ scrolled: isScrolled }">
      <div class="header-inner">
        <div class="logo" @click="router.push('/')">
          <span class="logo-emoji">🎉</span>
          <span class="logo-text">WeParty</span>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <svg
            class="search-icon"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="Pesquise por artista, evento ou local..."
            type="text"
          >
        </div>

        <nav class="nav">
          <a class="nav-link" href="#eventos">Eventos</a>
          <a class="nav-link" href="#categorias">Categorias</a>
          <button class="btn-login" @click="goToLogin">Entrar</button>
          <button class="btn-signup" @click="goToSignup">Criar Conta</button>
        </nav>
      </div>
    </header>

    <!-- Hero Carousel -->
    <section class="hero" @mouseenter="stopHeroAutoplay" @mouseleave="startHeroAutoplay">
      <div class="hero-carousel">
        <div
          v-for="(event, index) in heroEvents"
          :key="event.id"
          class="hero-slide"
          :class="{ active: currentHeroSlide === index }"
        >
          <img :alt="event.title" class="hero-image" :src="event.banner">
          <div class="hero-overlay" />
          <div class="hero-content">
            <div class="hero-date-badge">
              <span class="hero-date-day">{{ event.date.day }}</span>
              <span class="hero-date-month">{{ event.date.month }}</span>
            </div>
            <h1 class="hero-title">{{ event.title }}</h1>
            <p class="hero-location">
              <svg
                class="location-icon"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {{ event.location }}
            </p>
            <button class="hero-cta" @click="goToSignup">
              Ver Detalhes
              <svg
                class="arrow-icon"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Hero Dots -->
      <div class="hero-dots">
        <button
          v-for="(event, index) in heroEvents"
          :key="event.id"
          class="hero-dot"
          :class="{ active: currentHeroSlide === index }"
          @click="goToHeroSlide(index)"
        />
      </div>
    </section>

    <!-- Categories -->
    <section id="categorias" class="categories fade-in-section">
      <div class="container">
        <div class="categories-header">
          <h3 class="categories-title">Explore por categoria</h3>
          <div class="categories-line" />
        </div>
        <div class="categories-wrapper">
          <div class="categories-scroll">
            <button
              v-for="(cat, index) in categories"
              :key="cat.id"
              class="category-chip"
              :class="{ active: activeCategory === cat.id }"
              :style="{ '--index': index }"
              @click="activeCategory = cat.id"
            >
              <span class="chip-bg" />
              <span class="chip-glow" />
              <span class="category-icon">{{ cat.icon }}</span>
              <span class="category-name">{{ cat.name }}</span>
              <span v-if="activeCategory === cat.id" class="chip-indicator" />
            </button>
          </div>
          <div class="scroll-fade left" />
          <div class="scroll-fade right" />
        </div>
      </div>
    </section>

    <!-- Featured Events Carousel -->
    <section class="featured-carousel-section fade-in-section">
      <div class="container">
        <div class="featured-header">
          <div class="featured-title-wrapper">
            <span class="featured-icon">🔥</span>
            <div class="featured-title-content">
              <h2 class="featured-title">Em Destaque</h2>
              <p class="featured-subtitle">Os eventos mais quentes da semana</p>
            </div>
          </div>
          <div class="carousel-controls">
            <span class="carousel-counter">{{ currentCarouselIndex + 1 }} / {{ Math.max(1, carouselEvents.length - 3)
            }}</span>
            <button class="carousel-btn prev" :disabled="currentCarouselIndex === 0" @click="prevCarouselSlide">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              class="carousel-btn next"
              :disabled="currentCarouselIndex >= carouselEvents.length - 4"
              @click="nextCarouselSlide"
            >
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div ref="carouselRef" class="carousel-wrapper">
          <div class="carousel-track" :style="{ transform: `translateX(-${currentCarouselIndex * 340}px)` }">
            <article
              v-for="(event, index) in carouselEvents"
              :key="event.id"
              class="carousel-card"
              :class="{ hovering: isHoveringCard === index, active: index === currentCarouselIndex }"
              :style="{
                '--delay': `${index * 0.1}s`,
                '--card-index': index,
              }"
              @click="goToSignup"
              @mouseenter="isHoveringCard = index"
              @mouseleave="isHoveringCard = null"
            >
              <div class="carousel-card-shine" />
              <div class="carousel-card-glow" />
              <div class="carousel-card-border" />
              <div class="carousel-card-inner">
                <div class="carousel-image-wrapper">
                  <img :alt="event.title" class="carousel-image" :src="event.banner">
                  <div class="carousel-overlay" />
                  <div class="carousel-sparkle">
                    <span>✨</span>
                    <span>✨</span>
                    <span>✨</span>
                  </div>
                  <div class="carousel-date-badge">
                    <span class="badge-day">{{ event.date.day }}</span>
                    <span class="badge-month">{{ event.date.month }}</span>
                  </div>
                  <div class="carousel-category-badge">
                    <span class="category-dot" />
                    {{ event.category }}
                  </div>
                  <div v-if="index < 3" class="carousel-hot-badge">
                    🔥 HOT
                  </div>
                </div>
                <div class="carousel-content">
                  <h3 class="carousel-title">{{ event.title }}</h3>
                  <div class="carousel-meta">
                    <div class="meta-item">
                      <span class="meta-icon">📍</span>
                      <span class="meta-text">{{ event.venue }}</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-icon">🕐</span>
                      <span class="meta-text">{{ event.time }}</span>
                    </div>
                  </div>
                  <div class="carousel-footer">
                    <div class="carousel-interest">
                      <div class="interest-avatars">
                        <span class="avatar">👤</span>
                        <span class="avatar">👤</span>
                        <span class="avatar">👤</span>
                      </div>
                      <span class="interest-count">+{{ 50 + index * 12 }} interessados</span>
                    </div>
                    <button class="carousel-cta">
                      <span>Ver</span>
                      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="carousel-dots">
          <button
            v-for="(_, index) in Math.max(1, carouselEvents.length - 3)"
            :key="index"
            class="carousel-dot"
            :class="{ active: currentCarouselIndex === index }"
            @click="currentCarouselIndex = index"
          />
        </div>
      </div>
    </section>

    <!-- Events Grid Section -->
    <section id="eventos" class="events-section fade-in-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Próximos Eventos</h2>
          <a class="see-all" href="#">Ver todos →</a>
        </div>

        <div class="events-grid">
          <article
            v-for="(event, index) in filteredEvents"
            :key="event.id"
            class="event-card"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="goToSignup"
          >
            <div class="event-image-wrapper">
              <img :alt="event.title" class="event-image" :src="event.banner">
              <div class="event-date-tag">
                <span class="date-month">{{ event.date.month }}</span>
                <span class="date-day">{{ event.date.day }}</span>
                <span class="date-weekday">{{ event.date.weekday }}</span>
              </div>
            </div>
            <div class="event-info">
              <div class="event-time">
                Abertura: {{ event.time }}
                <span class="event-location-short">{{ event.location }}</span>
              </div>
              <div class="event-venue">
                <span class="venue-icon">📍</span>
                {{ event.venue }}
              </div>
              <h3 class="event-title">{{ event.title }}</h3>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Carnival Section (Horizontal Scroll) -->
    <section class="carnival-section fade-in-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">🎭 Carnaval 2026</h2>
          <a class="see-all" href="#">Ver todos →</a>
        </div>

        <div class="horizontal-scroll">
          <article v-for="event in carnivalEvents" :key="event.id" class="carnival-card" @click="goToSignup">
            <div class="carnival-image-wrapper">
              <img :alt="event.title" class="carnival-image" :src="event.banner">
              <div class="carnival-date">
                <span class="carnival-day">{{ event.date.day }}</span>
                <span class="carnival-month">{{ event.date.month }}</span>
              </div>
            </div>
            <div class="carnival-info">
              <h3 class="carnival-title">{{ event.title }}</h3>
              <p class="carnival-location">{{ event.location }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Workshops Section -->
    <section class="workshops-section fade-in-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">📚 Cursos e Workshops</h2>
          <a class="see-all" href="#">Ver todos →</a>
        </div>

        <div class="workshops-grid">
          <article v-for="event in workshopEvents" :key="event.id" class="workshop-card" @click="goToSignup">
            <div class="workshop-image-wrapper">
              <img :alt="event.title" class="workshop-image" :src="event.banner">
            </div>
            <div class="workshop-info">
              <h3 class="workshop-title">{{ event.title }}</h3>
              <p class="workshop-meta">{{ event.location }}</p>
              <p class="workshop-date">
                {{ event.date.weekday }}, {{ event.date.day }} de {{ event.date.month }} às {{ event.time }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section fade-in-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Descubra os melhores eventos</h2>
          <p class="cta-subtitle">
            Crie sua conta gratuitamente e tenha acesso a milhares de eventos,
            receba recomendações personalizadas e nunca perca uma festa!
          </p>
          <div class="cta-buttons">
            <button class="btn-cta-primary" @click="goToSignup">
              Criar Conta Grátis
              <svg
                class="btn-icon"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
            <button class="btn-cta-secondary" @click="goToLogin">
              Já tenho conta
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="logo">
              <span class="logo-emoji">🎉</span>
              <span class="logo-text">WeParty</span>
            </div>
            <p class="footer-desc">
              A melhor plataforma para descobrir eventos e festas perto de você.
            </p>
          </div>
          <div class="footer-links">
            <h4>Eventos</h4>
            <a href="#">Próximos Eventos</a>
            <a href="#">Categorias</a>
            <a href="#">Cidades</a>
          </div>
          <div class="footer-links">
            <h4>Empresa</h4>
            <a href="#">Sobre</a>
            <a href="#">Blog</a>
            <a href="#">Carreiras</a>
          </div>
          <div class="footer-links">
            <h4>Suporte</h4>
            <a href="#">Central de Ajuda</a>
            <a href="#">Termos de Uso</a>
            <a href="#">Privacidade</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 WeParty. Todos os direitos reservados.</p>
          <div class="social-icons">
            <a class="social-icon" href="#">📷</a>
            <a class="social-icon" href="#">🐦</a>
            <a class="social-icon" href="#">👤</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ====== BASE ====== */
.landing {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow-x: hidden;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ====== FLOATING DECORATIONS ====== */
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
  opacity: 0.25;
  animation: floatBounce var(--duration) ease-in-out infinite;
  animation-delay: var(--delay);
  filter: drop-shadow(0 4px 8px rgba(255, 107, 107, 0.2));
  transition: opacity 0.3s ease;
}

.float-emoji.size-sm {
  font-size: 28px;
  opacity: 0.2;
}

.float-emoji.size-md {
  font-size: 40px;
  opacity: 0.25;
}

.float-emoji.size-lg {
  font-size: 56px;
  opacity: 0.3;
}

.float-emoji.size-xl {
  font-size: 72px;
  opacity: 0.2;
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
    transform: translateY(-20px) rotate(10deg) scale(1.1);
  }

  50% {
    transform: translateY(-10px) rotate(-5deg) scale(1);
  }

  75% {
    transform: translateY(-25px) rotate(5deg) scale(1.05);
  }
}

/* ====== HEADER ====== */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header.scrolled {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-emoji {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-text {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header.scrolled .logo-text {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Search Bar */
.search-bar {
  flex: 1;
  max-width: 600px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #999;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 20px 14px 48px;
  border: 2px solid transparent;
  border-radius: 50px;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header.scrolled .search-input {
  background: #f5f5f5;
  box-shadow: none;
}

.search-input:focus {
  outline: none;
  border-color: #ff6b6b;
  box-shadow: 0 4px 25px rgba(255, 107, 107, 0.15);
}

.search-input::placeholder {
  color: #aaa;
}

/* Navigation */
.nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: color 0.3s ease;
}

.header.scrolled .nav-link {
  color: #333;
}

.nav-link:hover {
  color: #ff6b6b;
}

.btn-login {
  padding: 10px 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  background: transparent;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header.scrolled .btn-login {
  border-color: #ddd;
  color: #333;
}

.btn-login:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
}

.header.scrolled .btn-login:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn-signup {
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.btn-signup:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
}

/* ====== HERO CAROUSEL ====== */
.hero {
  position: relative;
  height: 70vh;
  min-height: 500px;
  max-height: 700px;
  overflow: hidden;
}

.hero-carousel {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-slide.active {
  opacity: 1;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.1) 40%,
      rgba(0, 0, 0, 0.7) 100%);
}

.hero-content {
  position: absolute;
  bottom: 80px;
  left: 0;
  right: 0;
  padding: 0 48px;
  max-width: 1400px;
  margin: 0 auto;
  animation: slideUp 0.8s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-date-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 8px 30px rgba(255, 107, 107, 0.4);
}

.hero-date-day {
  font-size: 32px;
  font-weight: 900;
  color: #fff;
  line-height: 1;
}

.hero-date-month {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 900;
  color: #fff;
  margin-bottom: 16px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.hero-location {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
}

.location-icon {
  width: 20px;
  height: 20px;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  border: none;
  border-radius: 50px;
  background: #fff;
  color: #1a1a2e;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.hero-cta:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.arrow-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.hero-cta:hover .arrow-icon {
  transform: translateX(4px);
}

.hero-dots {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
}

.hero-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hero-dot.active {
  background: #fff;
  border-color: #fff;
  transform: scale(1.2);
}

/* ====== CATEGORIES ====== */
.categories {
  padding: 40px 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 107, 107, 0.08);
  position: sticky;
  top: 70px;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(255, 107, 107, 0.05);
}

.categories-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.categories-title {
  font-size: 14px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  white-space: nowrap;
}

.categories-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 107, 107, 0.3) 0%, transparent 100%);
}

.categories-wrapper {
  position: relative;
}

.scroll-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 60px;
  pointer-events: none;
  z-index: 2;
}

.scroll-fade.left {
  left: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, transparent 100%);
}

.scroll-fade.right {
  right: 0;
  background: linear-gradient(-90deg, rgba(255, 255, 255, 0.9) 0%, transparent 100%);
}

.categories-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 12px 4px;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.categories-scroll::-webkit-scrollbar {
  display: none;
}

.category-chip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border: none;
  border-radius: 60px;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: chipAppear 0.5s ease-out both;
  animation-delay: calc(var(--index) * 0.05s);
}

@keyframes chipAppear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.chip-bg {
  position: absolute;
  inset: 0;
  border-radius: 60px;
  background: #fff;
  border: 2px solid #eaeaea;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -2;
}

.chip-glow {
  position: absolute;
  inset: -3px;
  border-radius: 65px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53, #ffd93d);
  opacity: 0;
  z-index: -3;
  transition: opacity 0.4s ease;
  filter: blur(8px);
}

.category-chip:hover .chip-bg {
  border-color: #ff6b6b;
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.15);
}

.category-chip:hover .chip-glow {
  opacity: 0.4;
}

.category-chip:hover {
  transform: translateY(-4px);
  color: #ff6b6b;
}

.category-chip:active {
  transform: translateY(-2px) scale(0.98);
}

.category-chip.active {
  color: #fff;
  transform: translateY(-4px);
}

.category-chip.active .chip-bg {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ff6b6b 100%);
  background-size: 200% 200%;
  border-color: transparent;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {

  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

.category-chip.active .chip-glow {
  opacity: 0.6;
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {

  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

.chip-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 3px;
  animation: indicatorAppear 0.3s ease-out;
}

@keyframes indicatorAppear {
  from {
    width: 0;
    opacity: 0;
  }

  to {
    width: 20px;
    opacity: 1;
  }
}

.category-icon {
  font-size: 20px;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.category-chip:hover .category-icon {
  transform: scale(1.2) rotate(-5deg);
}

.category-chip.active .category-icon {
  animation: iconBounce 0.5s ease;
}

@keyframes iconBounce {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.3) rotate(10deg);
  }
}

.category-name {
  position: relative;
  z-index: 1;
  font-weight: 600;
}

/* ====== FEATURED CAROUSEL ====== */
.featured-carousel-section {
  padding: 80px 0;
  background: linear-gradient(180deg, rgba(255, 107, 107, 0.06) 0%, rgba(255, 142, 83, 0.02) 50%, transparent 100%);
  position: relative;
  overflow: hidden;
}

.featured-carousel-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -20%;
  width: 60%;
  height: 200%;
  background: radial-gradient(ellipse, rgba(255, 107, 107, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.featured-carousel-section::after {
  content: '';
  position: absolute;
  bottom: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: radial-gradient(ellipse, rgba(255, 142, 83, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.featured-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.featured-title-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.featured-icon {
  font-size: 48px;
  animation: fireFlicker 1s ease-in-out infinite;
}

@keyframes fireFlicker {

  0%,
  100% {
    transform: scale(1) rotate(-5deg);
  }

  25% {
    transform: scale(1.1) rotate(5deg);
  }

  50% {
    transform: scale(1.05) rotate(-3deg);
  }

  75% {
    transform: scale(1.15) rotate(3deg);
  }
}

.featured-title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.featured-title {
  font-size: 32px;
  font-weight: 900;
  color: #1a1a2e;
  margin: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.featured-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.carousel-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.carousel-counter {
  font-size: 14px;
  font-weight: 600;
  color: #888;
  min-width: 50px;
  text-align: center;
}

.carousel-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #eee;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.carousel-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.carousel-btn svg {
  width: 22px;
  height: 22px;
  color: #333;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.carousel-btn:hover:not(:disabled) {
  border-color: transparent;
  transform: scale(1.15);
  box-shadow: 0 10px 35px rgba(255, 107, 107, 0.4);
}

.carousel-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.carousel-btn:hover:not(:disabled) svg {
  color: #fff;
}

.carousel-btn:active:not(:disabled) {
  transform: scale(1.05);
}

.carousel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-wrapper {
  overflow: hidden;
  margin: 0 -20px;
  padding: 30px 20px;
}

.carousel-track {
  display: flex;
  gap: 28px;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-card {
  flex: 0 0 320px;
  position: relative;
  border-radius: 28px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardAppear 0.7s ease-out both;
  animation-delay: var(--delay);
  transform-style: preserve-3d;
}

.carousel-card:hover {
  transform: translateY(-12px) scale(1.02);
  z-index: 10;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.85) rotateX(10deg);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0);
  }
}

.carousel-card-shine {
  position: absolute;
  inset: 0;
  border-radius: 28px;
  background: linear-gradient(105deg,
      transparent 40%,
      rgba(255, 255, 255, 0.4) 45%,
      rgba(255, 255, 255, 0.6) 50%,
      rgba(255, 255, 255, 0.4) 55%,
      transparent 60%);
  background-size: 200% 100%;
  background-position: 200% 0;
  opacity: 0;
  z-index: 10;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.carousel-card:hover .carousel-card-shine {
  opacity: 1;
  animation: shine 0.8s ease forwards;
}

@keyframes shine {
  to {
    background-position: -200% 0;
  }
}

.carousel-card-glow {
  position: absolute;
  inset: -4px;
  border-radius: 32px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53, #ffd93d, #ff6b6b);
  background-size: 300% 300%;
  opacity: 0;
  z-index: -1;
  transition: opacity 0.4s ease;
  animation: glowRotate 4s linear infinite;
  filter: blur(8px);
}

.carousel-card-border {
  position: absolute;
  inset: -2px;
  border-radius: 30px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

@keyframes glowRotate {
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

.carousel-card:hover .carousel-card-glow,
.carousel-card.hovering .carousel-card-glow {
  opacity: 0.8;
}

.carousel-card:hover .carousel-card-border {
  opacity: 1;
}

.carousel-card-inner {
  background: #fff;
  border-radius: 28px;
  overflow: hidden;
  height: 100%;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
  position: relative;
  z-index: 1;
}

.carousel-card:hover .carousel-card-inner,
.carousel-card.hovering .carousel-card-inner {
  box-shadow: 0 30px 80px rgba(255, 107, 107, 0.25);
}

.carousel-image-wrapper {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-card:hover .carousel-image {
  transform: scale(1.2);
}

.carousel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(0, 0, 0, 0.7) 100%);
}

.carousel-sparkle {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.carousel-card:hover .carousel-sparkle {
  opacity: 1;
}

.carousel-sparkle span {
  position: absolute;
  font-size: 16px;
  animation: sparkle 1.5s ease-in-out infinite;
}

.carousel-sparkle span:nth-child(1) {
  top: 20%;
  left: 30%;
  animation-delay: 0s;
}

.carousel-sparkle span:nth-child(2) {
  top: 40%;
  right: 25%;
  animation-delay: 0.5s;
}

.carousel-sparkle span:nth-child(3) {
  bottom: 30%;
  left: 50%;
  animation-delay: 1s;
}

@keyframes sparkle {

  0%,
  100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }

  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

.carousel-date-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-card:hover .carousel-date-badge {
  transform: scale(1.15) rotate(-5deg);
  box-shadow: 0 15px 40px rgba(255, 107, 107, 0.3);
}

.badge-day {
  font-size: 30px;
  font-weight: 900;
  color: #ff6b6b;
  line-height: 1;
}

.badge-month {
  font-size: 13px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
}

.carousel-category-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 24px;
  transition: all 0.3s ease;
}

.category-dot {
  width: 6px;
  height: 6px;
  background: #ff6b6b;
  border-radius: 50%;
  animation: dotPulse 1.5s ease-in-out infinite;
}

@keyframes dotPulse {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

.carousel-hot-badge {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.5);
  animation: hotPulse 2s ease-in-out infinite;
}

@keyframes hotPulse {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.5);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 25px rgba(255, 107, 107, 0.7);
  }
}

.carousel-content {
  padding: 24px;
}

.carousel-title {
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 14px;
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}

.carousel-card:hover .carousel-title {
  color: #ff6b6b;
}

.carousel-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-icon {
  font-size: 14px;
}

.meta-text {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.carousel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.carousel-interest {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interest-avatars {
  display: flex;
}

.interest-avatars .avatar {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: -8px;
}

.interest-avatars .avatar:first-child {
  margin-left: 0;
}

.interest-count {
  font-size: 11px;
  color: #888;
  font-weight: 600;
}

.carousel-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.carousel-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.carousel-cta:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
}

.carousel-cta:hover::before {
  opacity: 1;
}

.carousel-cta svg {
  width: 16px;
  height: 16px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.carousel-cta span {
  position: relative;
  z-index: 1;
}

.carousel-cta:hover svg {
  transform: translateX(4px);
}

/* Carousel Navigation Dots */
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 32px;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.carousel-dot::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: -1;
}

.carousel-dot:hover {
  transform: scale(1.3);
  background: #bbb;
}

.carousel-dot.active {
  width: 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.carousel-dot.active::before {
  opacity: 0.3;
  filter: blur(6px);
}

/* ====== EVENTS SECTION ====== */
.events-section {
  padding: 48px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a2e;
}

.see-all {
  color: #ff6b6b;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s ease;
}

.see-all:hover {
  color: #ff8e53;
}

/* Events Grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.event-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  animation: fadeInUp 0.6s ease-out both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.event-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
}

.event-image-wrapper {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.event-card:hover .event-image {
  transform: scale(1.08);
}

.event-date-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.date-month {
  font-size: 11px;
  font-weight: 700;
  color: #ff6b6b;
  text-transform: uppercase;
}

.date-day {
  font-size: 22px;
  font-weight: 900;
  color: #1a1a2e;
  line-height: 1;
}

.date-weekday {
  font-size: 10px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.event-info {
  padding: 16px;
}

.event-time {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-location-short {
  font-size: 12px;
  color: #999;
}

.event-venue {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin-bottom: 8px;
}

.venue-icon {
  font-size: 14px;
}

.event-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.4;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ====== CARNIVAL SECTION ====== */
.carnival-section {
  padding: 60px 0;
  background: linear-gradient(180deg, rgba(255, 107, 107, 0.05) 0%, transparent 100%);
  position: relative;
}

.carnival-section::before {
  content: '🎭';
  position: absolute;
  top: 50%;
  right: 5%;
  transform: translateY(-50%);
  font-size: 200px;
  opacity: 0.03;
  pointer-events: none;
}

.horizontal-scroll {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding: 20px 0;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.carnival-card {
  flex: 0 0 220px;
  scroll-snap-align: start;
  cursor: pointer;
  transition: transform 0.4s ease;
}

.carnival-card:hover {
  transform: translateY(-8px) scale(1.02);
}

.carnival-image-wrapper {
  position: relative;
  aspect-ratio: 3/4;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.carnival-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.carnival-card:hover .carnival-image {
  transform: scale(1.1);
}

.carnival-date {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.carnival-day {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
  line-height: 1;
}

.carnival-month {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.carnival-info {
  padding: 16px 4px;
}

.carnival-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.carnival-location {
  font-size: 13px;
  color: #666;
}

/* ====== WORKSHOPS SECTION ====== */
.workshops-section {
  padding: 48px 0;
}

.workshops-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.workshop-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.workshop-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.workshop-image-wrapper {
  aspect-ratio: 16/9;
  overflow: hidden;
}

.workshop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.workshop-card:hover .workshop-image {
  transform: scale(1.05);
}

.workshop-info {
  padding: 16px;
}

.workshop-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workshop-meta {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.workshop-date {
  font-size: 12px;
  color: #999;
}

/* ====== CTA SECTION ====== */
.cta-section {
  padding: 80px 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.cta-content {
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

.cta-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  color: #fff;
  margin-bottom: 20px;
}

.cta-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.7;
  margin-bottom: 40px;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 18px 36px;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 30px rgba(255, 107, 107, 0.4);
}

.btn-cta-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(255, 107, 107, 0.5);
}

.btn-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.btn-cta-primary:hover .btn-icon {
  transform: translateX(4px);
}

.btn-cta-secondary {
  padding: 18px 36px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  background: transparent;
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

/* ====== FOOTER ====== */
.footer {
  padding: 60px 0 30px;
  background: #0d0d1a;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

.footer-brand .logo {
  margin-bottom: 16px;
}

.footer-brand .logo-text {
  color: #fff;
  background: none;
  -webkit-text-fill-color: #fff;
}

.footer-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.7;
  max-width: 300px;
}

.footer-links h4 {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
}

.footer-links a {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #ff6b6b;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-bottom p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.social-icons {
  display: flex;
  gap: 16px;
}

.social-icon {
  font-size: 20px;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.social-icon:hover {
  transform: scale(1.2);
}

/* ====== ANIMATIONS ====== */
.fade-in-section {
  opacity: 0;
  transform: translateY(60px);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in-section.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger animation for grid items */
.events-grid .event-card,
.workshops-grid .workshop-card {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in-section.visible .event-card,
.fade-in-section.visible .workshop-card {
  opacity: 1;
  transform: translateY(0);
}

.fade-in-section.visible .event-card:nth-child(1),
.fade-in-section.visible .workshop-card:nth-child(1) {
  transition-delay: 0.1s;
}

.fade-in-section.visible .event-card:nth-child(2),
.fade-in-section.visible .workshop-card:nth-child(2) {
  transition-delay: 0.2s;
}

.fade-in-section.visible .event-card:nth-child(3),
.fade-in-section.visible .workshop-card:nth-child(3) {
  transition-delay: 0.3s;
}

.fade-in-section.visible .event-card:nth-child(4),
.fade-in-section.visible .workshop-card:nth-child(4) {
  transition-delay: 0.4s;
}

.fade-in-section.visible .event-card:nth-child(5) {
  transition-delay: 0.5s;
}

.fade-in-section.visible .event-card:nth-child(6) {
  transition-delay: 0.6s;
}

.fade-in-section.visible .event-card:nth-child(7) {
  transition-delay: 0.7s;
}

.fade-in-section.visible .event-card:nth-child(8) {
  transition-delay: 0.8s;
}

/* Pulse animation for CTAs */
@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 8px 30px rgba(255, 107, 107, 0.4);
  }

  50% {
    box-shadow: 0 8px 40px rgba(255, 107, 107, 0.6);
  }
}

.btn-cta-primary {
  animation: pulse 2s ease-in-out infinite;
}

.btn-cta-primary:hover {
  animation: none;
}

/* Shimmer effect for cards on hover */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

/* ====== RESPONSIVE ====== */
@media (max-width: 1200px) {

  .events-grid,
  .workshops-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {

  .events-grid,
  .workshops-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .nav-link {
    display: none;
  }

  .carousel-card {
    flex: 0 0 260px;
  }

  .floating-decorations {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-inner {
    flex-wrap: wrap;
    gap: 16px;
  }

  .search-bar {
    order: 3;
    flex: 1 1 100%;
    max-width: none;
  }

  .nav {
    gap: 12px;
  }

  .btn-login {
    display: none;
  }

  .hero {
    height: 60vh;
    min-height: 400px;
  }

  .hero-content {
    padding: 0 24px;
    bottom: 60px;
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .events-grid,
  .workshops-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .carnival-card {
    flex: 0 0 180px;
  }

  .section-title {
    font-size: 22px;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn-cta-primary,
  .btn-cta-secondary {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }

  .carousel-card {
    flex: 0 0 85vw;
    max-width: 300px;
  }

  .carousel-controls {
    display: none;
  }

  .carousel-wrapper {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }

  .carousel-track {
    transform: none !important;
  }

  .carousel-card {
    scroll-snap-align: center;
  }
}

@media (max-width: 480px) {
  .logo-text {
    display: none;
  }

  .btn-signup {
    padding: 10px 18px;
    font-size: 13px;
  }

  .categories {
    top: 60px;
  }

  .category-chip {
    padding: 10px 18px;
    font-size: 13px;
  }

  .carousel-card {
    flex: 0 0 90vw;
  }

  .hero-date-badge {
    padding: 8px 12px;
  }

  .badge-day {
    font-size: 20px;
  }
}
</style>
