<script setup lang="ts">
  import type { DiscoverEventCard } from './types'

  import { useWindowScroll, useWindowSize } from '@vueuse/core'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { unwrapList } from '@/api'
  import { getAllPublicEvents, getPublicTrendingEvents } from '@/api/event'
  import AppFooter from '@/components/UI/AppFooter/AppFooter.vue'
  import LoginRequiredDialog from '@/components/UI/LoginRequiredDialog/LoginRequiredDialog.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { usePwaInstall } from '@/composables/usePwaInstall'
  import { logger } from '@/utils/logger'
  import LandingAppShowcaseSection from './LandingAppShowcaseSection.vue'
  import LandingDiscoverSection from './LandingDiscoverSection.vue'
  import LandingFaqSection from './LandingFaqSection.vue'
  import LandingFeaturesSection from './LandingFeaturesSection.vue'
  import LandingHeroSection from './LandingHeroSection.vue'
  import LandingHowItWorksSection from './LandingHowItWorksSection.vue'
  import LandingUpdatesTeaser from './LandingUpdatesTeaser.vue'

  gsap.registerPlugin(ScrollTrigger)

  const router = useRouter()
  const route = useRoute()
  const { requireLogin: _requireLogin } = useGuestMode()

  // PWA — instalação do app a partir do header, do banner e do rodapé
  const { canInstall, isIOS, showIOSInstructions, promptInstall } = usePwaInstall()

  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('#ff9800')

  function showSnackbar (message: string, color = '#ff9800') {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbarVisible.value = true
  }

  async function installApp () {
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      showSnackbar('App instalado com sucesso!', '#22c55e')
    } else if (outcome === 'unavailable' && !isIOS) {
      showSnackbar('Instalação não disponível neste navegador agora. Tente pelo Chrome ou Edge.', '#ff9800')
    }
  }

  // Element Refs
  const landingEl = ref<HTMLElement | null>(null)
  const headerEl = ref<HTMLElement | null>(null)

  // Animation refs & GSAP context
  const isLoaded = ref(false)
  const navSolid = ref(false)
  const reducedMotion = ref(false)
  let heroObserver: IntersectionObserver | null = null
  let ctx: gsap.Context | null = null

  // Scroll tracking
  useWindowScroll()
  const { width: windowWidth } = useWindowSize()

  // Mobile menu state
  const isMobileMenuOpen = ref(false)

  function toggleMobileMenu () {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function closeMobileMenu () {
    isMobileMenuOpen.value = false
  }

  // Bloqueia o scroll do body enquanto o menu mobile está aberto
  watch(isMobileMenuOpen, open => {
    document.body.style.overflow = open ? 'hidden' : ''
  })

  // Fecha automaticamente o menu ao voltar para o layout desktop
  watch(windowWidth, width => {
    if (width > 768 && isMobileMenuOpen.value) {
      closeMobileMenu()
    }
  })

  // Data
  const fallbackDiscoverEvents: DiscoverEventCard[] = [
    {
      emoji: '🎶', category: 'Música', tag: 'Festa', tagColor: '#F978A3', title: 'Festa na Cobertura',
      likes: 84, comments: 12, when: 'Hoje, 22h', gradient: 'linear-gradient(135deg, #ffb27a, #F978A3)', image: '',
    },
    {
      emoji: '🎭', category: 'Comédia', tag: 'Stand-up', tagColor: '#8b5cf6', title: 'Noite de Stand-up',
      likes: 42, comments: 6, when: 'Sáb, 20h', gradient: 'linear-gradient(135deg, #8b5cf6, #ff8bc4)', image: '',
    },
    {
      emoji: '🎪', category: 'Ao ar livre', tag: 'Festival', tagColor: '#FF9F3D', title: 'Festival de Verão',
      likes: 310, comments: 48, when: 'Dom, 14h', gradient: 'linear-gradient(135deg, #ffd93d, #FF9F3D)', image: '',
    },
  ]

  const discoverCardStyles = [
    { emoji: '🎶', tagColor: '#F978A3', gradient: 'linear-gradient(135deg, #ffb27a, #F978A3)' },
    { emoji: '🎭', tagColor: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #ff8bc4)' },
    { emoji: '🎪', tagColor: '#FF9F3D', gradient: 'linear-gradient(135deg, #ffd93d, #FF9F3D)' },
  ]

  const discoverEvents = ref<DiscoverEventCard[]>(fallbackDiscoverEvents)

  function extractEventImage (event: any): string {
    const fromImages = Array.isArray(event.images) && event.images.length > 0
      ? (typeof event.images[0] === 'string' ? event.images[0] : event.images[0]?.url)
      : ''
    return fromImages || event.bannerUrl || event.banner || event.image || event.imageUrl || event.cover || event.thumbnail || ''
  }

  function formatEventWhen (event: any): string {
    const raw = event.date || event.startDate || event.dateTime || event.startAt || event.eventDate || event.start_date
    if (!raw) return 'Data a definir'
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return 'Data a definir'

    const now = new Date()
    const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)

    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':00', 'h')

    if (isSameDay(date, now)) return `Hoje, ${time}`
    if (isSameDay(date, tomorrow)) return `Amanhã, ${time}`

    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${time}`
  }

  function mapToDiscoverCard (event: any, index: number): DiscoverEventCard {
    const style = discoverCardStyles[index % discoverCardStyles.length]!
    const rawInterests = event.eventInterests || event.interests || event.categories || event.tags || []
    const interestName = rawInterests
      .map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name)
      .find(Boolean)

    return {
      emoji: style.emoji,
      category: interestName || 'Evento',
      tag: interestName || 'Evento',
      tagColor: style.tagColor,
      title: event.name || event.title || 'Evento sem nome',
      likes: event.likesCount ?? event.likes ?? event._count?.likes ?? 0,
      comments: event.commentsCount ?? event._count?.comments ?? 0,
      when: formatEventWhen(event),
      gradient: style.gradient,
      image: extractEventImage(event),
    }
  }

  async function fetchDiscoverEvents () {
    try {
      let response = await getPublicTrendingEvents(1, 3)
      let rawEvents = unwrapList<any>(response, 'events', 'data', 'content')
      if (rawEvents.length === 0) {
        response = await getAllPublicEvents(1, 3)
        rawEvents = unwrapList<any>(response, 'events', 'data', 'content')
      }
      if (rawEvents.length === 0) return

      discoverEvents.value = rawEvents.slice(0, 3).map((event, index) => mapToDiscoverCard(event, index))
    } catch (error) {
      logger.error('Erro ao buscar eventos reais para a landing page:', error)
    }
  }

  // Live counter
  const usersOnline = ref(0)
  const targetUsersOnline = 157

  // ═══════════════════════════════════════════════════════════════════════════
  // MICROINTERAÇÕES: Efeito Magnético nos CTAs Principais
  // ═══════════════════════════════════════════════════════════════════════════
  function setupMagneticButtons (container: HTMLElement) {
    const buttons = container.querySelectorAll<HTMLElement>('.btn-cta-primary, .btn-primary-glow, .btn-pwa-install')
    for (const btn of buttons) {
      const text = btn.querySelector<HTMLElement>('span, .v-icon, .btn-glow')
      const onMove = (e: MouseEvent) => {
        if (reducedMotion.value || windowWidth.value < 1024) return
        const rect = btn.getBoundingClientRect()
        const x = e.clientX - (rect.left + rect.width / 2)
        const y = e.clientY - (rect.top + rect.height / 2)
        gsap.to(btn, { x: x * 0.28, y: y * 0.28, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
        if (text) {
          gsap.to(text, { x: x * 0.12, y: y * 0.12, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
        }
      }
      const onLeave = () => {
        if (reducedMotion.value) return
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
        if (text) {
          gsap.to(text, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
        }
      }
      btn.addEventListener('mousemove', onMove)
      btn.addEventListener('mouseleave', onLeave)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSINATURA VISUAL 1: Interatividade 3D nos Cards da Seção Descubra
  // ═══════════════════════════════════════════════════════════════════════════
  function setupDiscoverCardsInteractivity (cardsContainer: HTMLElement) {
    const cards = cardsContainer.querySelectorAll<HTMLElement>('.discover-event-card')
    const baseRotations = [-6, 5, -3]

    for (const [idx, card] of cards.entries()) {
      const img = card.querySelector<HTMLElement>('.discover-event-image')
      const baseRot = baseRotations[idx % 3] ?? 0

      const onMove = (e: MouseEvent) => {
        if (reducedMotion.value || windowWidth.value < 1024) return
        const rect = card.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5

        gsap.to(card, {
          rotateX: -py * 14,
          rotateY: px * 16,
          rotateZ: 0,
          y: -10,
          scale: 1.04,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        })
        if (img) {
          gsap.to(img, {
            scale: 1.08,
            x: px * 6,
            y: py * 6,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        }
      }

      const onLeave = () => {
        if (reducedMotion.value) return
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          rotateZ: baseRot,
          y: 0,
          scale: 1,
          duration: 0.85,
          ease: 'elastic.out(1, 0.45)',
          overwrite: 'auto',
        })
        if (img) {
          gsap.to(img, {
            scale: 1,
            x: 0,
            y: 0,
            duration: 0.85,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        }
      }

      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPOTLIGHT NO GRID DE FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  function setupFeaturesSpotlight (gridEl: HTMLElement) {
    const cards = gridEl.querySelectorAll<HTMLElement>('.feature-secondary, .feature-main')
    for (const card of cards) {
      const onMove = (e: MouseEvent) => {
        if (reducedMotion.value || windowWidth.value < 1024) return
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        card.style.setProperty('--mouse-x', `${x}px`)
        card.style.setProperty('--mouse-y', `${y}px`)
      }
      card.addEventListener('mousemove', onMove)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GSAP MASTER MOTION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  function initAnimations () {
    if (!landingEl.value) return

    ctx = gsap.context(() => {
      // 2. Contador ao vivo dinâmico
      gsap.to({ val: 0 }, {
        val: targetUsersOnline,
        duration: 2.4,
        ease: 'power3.out',
        delay: 0.3,
        onUpdate: function () {
          usersOnline.value = Math.round(this.targets()[0].val)
        },
      })

      // 3. Hero — Master Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      heroTl
        .from('.header', { y: -25, opacity: 0, duration: 1, ease: 'power3.out' })
        .from('.hero-wordmark-wrap', { y: 70, opacity: 0, scale: 0.94, duration: 1.2, ease: 'power4.out' }, '-=0.6')
        .from('.hero-tagline-wrap', { y: 35, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.7')
        .from('.hero-scroll-indicator', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')

      // 4. Header — Morphing contínuo de full-width para floating pill
      if (!reducedMotion.value) {
        const isMobile = windowWidth.value <= 768
        const headerTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: '+=280',
            scrub: 0.5,
            onUpdate: self => {
              navSolid.value = self.progress > 0.5
            },
          },
        })

        headerTimeline
          .to('.header', {
            paddingTop: '1rem',
            paddingBottom: '0.5rem',
            ease: 'none',
          }, 0)
          .fromTo(
            '.header-content',
            {
              width: '100%',
              maxWidth: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0)',
              backdropFilter: 'blur(0px)',
              WebkitBackdropFilter: 'blur(0px)',
              borderColor: 'rgba(255, 154, 77, 0)',
              boxShadow: '0 0 0 rgba(255, 95, 143, 0)',
              borderRadius: '0px',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
            },
            {
              width: '100%',
              maxWidth: '1100px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderColor: 'rgba(255, 154, 77, 0.18)',
              boxShadow: '0 16px 40px rgba(255, 95, 143, 0.2)',
              borderRadius: '16px',
              paddingTop: isMobile ? '0.55rem' : '0.65rem',
              paddingBottom: isMobile ? '0.55rem' : '0.65rem',
              paddingLeft: isMobile ? '1.15rem' : '1.75rem',
              paddingRight: isMobile ? '0.6rem' : '0.85rem',
              ease: 'none',
            },
            0,
          )
          .to(
            '.btn-ghost',
            {
              color: '#334155',
              textShadow: '0 0 0 rgba(0, 0, 0, 0)',
              ease: 'none',
            },
            0,
          )
          .to(
            '.mobile-menu-btn',
            {
              color: '#2c3e50',
              textShadow: '0 0 0 rgba(0, 0, 0, 0)',
              ease: 'none',
            },
            0,
          )
      }

      // 5. Hero — Scroll Storytelling Scrub (transição suave para a próxima seção)
      // Hero agora é LandingHeroSection.vue (Fase 5, parte 6) — o ScrollTrigger
      // mira a seção pelo seletor CSS, mesmo padrão das fatias anteriores.
      if (!reducedMotion.value) {
        gsap.timeline({
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1,
          },
        })
          .to('.hero-video', { scale: 1.08, yPercent: 12, opacity: 0.45, ease: 'none' }, 0)
          .to('.hero-v2-content', { yPercent: 22, opacity: 0, ease: 'none' }, 0)
          .to('.hero-scroll-indicator', { opacity: 0, ease: 'none' }, 0)
      }

      // 5. Descubra — Entrada dos Textos & Assinatura "Deal the Cards" Fan-Out
      gsap.from('.discover-badge', {
        scrollTrigger: {
          trigger: '#descubra',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 25,
        opacity: 0,
        scale: 0.9,
        duration: 0.8,
        ease: 'back.out(1.4)',
      })

      gsap.from('.discover-title', {
        scrollTrigger: {
          trigger: '#descubra',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      })

      gsap.from('.discover-text, .discover-actions, .discover-live-card', {
        scrollTrigger: {
          trigger: '#descubra',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        y: 30,
        opacity: 0,
        stagger: 0.12,
        duration: 0.85,
        ease: 'power3.out',
      })

      // Assinatura Visual 1: Efeito "Deal the Cards"
      const discoverCards = gsap.utils.toArray<HTMLElement>('.discover-event-card')
      if (discoverCards.length > 0) {
        gsap.timeline({
          scrollTrigger: {
            trigger: '.discover-cards',
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        }).from(discoverCards, {
          y: 90,
          x: i => (i === 1 ? 50 : -50),
          rotateZ: 0,
          scale: 0.84,
          opacity: 0,
          stagger: 0.16,
          duration: 1.15,
          ease: 'power4.out',
        })
      }

      // 6. Features Grid Reveal
      gsap.from('.features-v2 .section-header', {
        scrollTrigger: {
          trigger: '#features',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 35,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      })

      gsap.from('.feature-main', {
        scrollTrigger: {
          trigger: '.features-grid-v2',
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
        y: 50,
        opacity: 0,
        scale: 0.96,
        duration: 1,
        ease: 'power3.out',
      })

      gsap.from('.feature-secondary', {
        scrollTrigger: {
          trigger: '.features-grid-v2',
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        stagger: 0.14,
        duration: 0.9,
        ease: 'power3.out',
      })

      // Floating lento no emoji da feature principal
      gsap.to('.feature-main-emoji', {
        y: -12,
        rotation: 3,
        duration: 3.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      // 7. App em Ação — Header e Tabs
      gsap.from('.app-showcase-v2 .section-header', {
        scrollTrigger: {
          trigger: '#app-showcase',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 35,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      })

      gsap.from('.showcase-tab', {
        scrollTrigger: {
          trigger: '.showcase-tabs',
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
        x: -40,
        opacity: 0,
        stagger: 0.14,
        duration: 0.9,
        ease: 'power3.out',
      })

      // 8. Como Funciona — Assinatura Visual 2 ("Linha Viva & Parallax")
      gsap.from('.how-it-works-v2 .section-header', {
        scrollTrigger: {
          trigger: '#como-funciona',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 35,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      })

      // Linha viva da jornada que se desenha com o scroll
      gsap.to('.timeline-live-line', {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.timeline',
          start: 'top 75%',
          end: 'bottom 85%',
          scrub: 0.4,
        },
      })

      const timelineRows = gsap.utils.toArray<HTMLElement>('.timeline-row')
      for (const [i, row] of timelineRows.entries()) {
        const isReverse = i % 2 === 1

        gsap.from(row, {
          scrollTrigger: {
            trigger: row,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          x: isReverse ? 40 : -40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
        })

        // Parallax sutil no número gigante de fundo
        const bigNum = row.querySelector('.timeline-bignum')
        if (bigNum && !reducedMotion.value) {
          gsap.to(bigNum, {
            yPercent: isReverse ? -24 : 24,
            ease: 'none',
            scrollTrigger: {
              trigger: row,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          })
        }
      }

      // 9. FAQ Balões de Chat
      gsap.from('.faq-intro', {
        scrollTrigger: {
          trigger: '.faq-v2',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 35,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
      })

      gsap.from('.faq-intro-card', {
        scrollTrigger: {
          trigger: '.faq-intro',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        scale: 0.92,
        opacity: 0,
        duration: 0.9,
        ease: 'back.out(1.4)',
      })

      gsap.from('.faq-chat-item', {
        scrollTrigger: {
          trigger: '.faq-chat-list',
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
        x: 35,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
      })

      // 10. Novidades — Banner de convite pra página de updates
      gsap.from('.updates-banner', {
        scrollTrigger: {
          trigger: '.updates-banner',
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        scale: 0.97,
        duration: 0.9,
        ease: 'power3.out',
      })

      // 11. Banner PWA
      gsap.from('.pwa-banner', {
        scrollTrigger: {
          trigger: '.pwa-banner',
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        scale: 0.97,
        duration: 0.9,
        ease: 'power3.out',
      })

      // 12. Footer
      gsap.from('.footer-grid-v2 > *', {
        scrollTrigger: {
          trigger: '.footer-v2',
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
      })

      // Configura microinterações do mouse
      setupMagneticButtons(landingEl.value!)
      // Grid de discover/features agora são LandingDiscoverSection.vue
      // (Fase 5, parte 5) e LandingFeaturesSection.vue (parte 3) —
      // setupDiscoverCardsInteractivity/setupFeaturesSpotlight só fazem
      // querySelectorAll, então passar a raiz da página (landingEl)
      // funciona igual, sem precisar de defineExpose pro ref interno do
      // componente filho.
      setupDiscoverCardsInteractivity(landingEl.value!)
      setupFeaturesSpotlight(landingEl.value!)
    }, landingEl.value)
  }

  // Smartphone 3D do "app em ação": migrou pra LandingAppShowcaseSection.vue
  // (Fase 5, parte 7) — junto com o `onMounted`/`onUnmounted` da própria
  // seção, diferente das fatias anteriores (ver comentário no <script> do
  // componente).

  onMounted(async () => {
    reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    try {
      await nextTick()
      isLoaded.value = true
      initAnimations()
      fetchDiscoverEvents()
    } catch (error) {
      logger.error('Erro ao inicializar landing page:', error)
      isLoaded.value = true
    }

    // Chegada com #hash (ex.: clique em "Como funciona"/"Recursos" no
    // AppFooter vindo de outra página) — rola até a seção já no load.
    if (route.hash) {
      goToSection(route.hash)
    }

    // heroSection/heroVideo eram refs Vue; hero agora é LandingHeroSection.vue
    // (Fase 5, parte 6) — IntersectionObserver/`.pause()` só precisam de um
    // Element de verdade, então buscamos pelo seletor a partir de landingEl.
    const heroSectionEl = landingEl.value?.querySelector<HTMLElement>('.hero') ?? null

    if (reducedMotion.value) {
      landingEl.value?.querySelector<HTMLVideoElement>('.hero-video')?.pause()
    }

    if (heroSectionEl && reducedMotion.value) {
      const headerHeight = headerEl.value?.offsetHeight ?? 80
      heroObserver = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          if (entry) navSolid.value = !entry.isIntersecting
        },
        { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 },
      )
      heroObserver.observe(heroSectionEl)
    }
  })

  onUnmounted(() => {
    heroObserver?.disconnect()
    ctx?.revert()
    for (const t of ScrollTrigger.getAll()) t.kill()
    document.body.style.overflow = ''
  })

  // Navigation
  function goToSection (sectionId: string) {
    closeMobileMenu()
    nextTick(() => {
      const el = document.querySelector(sectionId)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  // Já montada e o #hash muda (ex.: clique no AppFooter enquanto já está
  // na Landingpage) — router-push com hash não remonta o componente.
  watch(() => route.hash, hash => {
    if (hash) goToSection(hash)
  })
</script>

<template>
  <div ref="landingEl" class="landing-page" :class="{ 'is-loaded': isLoaded }">
    <div class="gradient-overlay" />

    <!-- Header -->
    <header ref="headerEl" class="header" :class="{ 'header-solid': navSolid }">
      <div class="container">
        <div class="header-content">
          <div class="logo" @click="router.push('/')">
            <img alt="We Party Logo" class="logo-img" src="/logoweparty.png">
            <span class="logo-text">We Party</span>
          </div>
          <nav aria-label="Menu principal">
            <div class="auth-buttons">
              <router-link v-slot="{ href, navigate }" custom to="/login">
                <a class="btn-ghost" :href="href" @click="navigate">Entrar</a>
              </router-link>
              <router-link v-slot="{ href, navigate }" custom to="/signup">
                <a class="btn-primary-glow" :href="href" @click="navigate">
                  <span>CADASTRO</span>
                </a>
              </router-link>
            </div>
          </nav>
          <button
            aria-controls="mobile-menu"
            :aria-expanded="isMobileMenuOpen"
            :aria-label="isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'"
            class="mobile-menu-btn"
            type="button"
            @click="toggleMobileMenu"
          >
            <v-icon :icon="isMobileMenuOpen ? 'mdi-close' : 'mdi-menu'" size="26" />
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Menu -->
    <Transition name="mobile-menu-fade">
      <div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click.self="closeMobileMenu">
        <nav id="mobile-menu" aria-label="Menu mobile" class="mobile-menu-panel">
          <a class="mobile-nav-link" href="#como-funciona" @click.prevent="goToSection('#como-funciona')">
            <v-icon icon="mdi-information-outline" size="20" />
            <span>Como funciona</span>
          </a>

          <div class="mobile-menu-divider" />

          <router-link v-slot="{ href, navigate }" custom to="/login">
            <a class="mobile-menu-ghost" :href="href" @click="(event: MouseEvent) => { closeMobileMenu(); navigate(event) }">Entrar</a>
          </router-link>
          <router-link v-slot="{ href, navigate }" custom to="/signup">
            <a class="mobile-menu-primary" :href="href" @click="(event: MouseEvent) => { closeMobileMenu(); navigate(event) }">
              <span>CADASTRO</span>
            </a>
          </router-link>
        </nav>
      </div>
    </Transition>

    <!-- Hero Cinematográfica -->
    <!-- Hero — extraído pra LandingHeroSection.vue na Fase 5 do
         REFACTOR_AUDIT_PLAN.md (6ª fatia da decomposição). `goToSection`
         fecha o menu mobile antes de rolar, por isso continua no pai — o
         filho só emite o evento. -->
    <LandingHeroSection @go-to-section="goToSection" />

    <!-- Descubra eventos -->
    <!-- Descubra — extraído pra LandingDiscoverSection.vue na Fase 5 do
         REFACTOR_AUDIT_PLAN.md (5ª fatia da decomposição). `discoverEvents`/
         `usersOnline` continuam aqui porque "app-showcase" (abaixo, ainda
         não extraída) também os usa. -->
    <LandingDiscoverSection :events="discoverEvents" :users-online="usersOnline" />

    <!-- Features — extraído pra LandingFeaturesSection.vue na Fase 5 do
         REFACTOR_AUDIT_PLAN.md (3ª fatia da decomposição). -->
    <LandingFeaturesSection />

    <!-- App em ação — extraído pra LandingAppShowcaseSection.vue na Fase 5
         do REFACTOR_AUDIT_PLAN.md (7ª e última fatia da decomposição de
         LandingPage.vue). `discoverEvents` alimenta o preview do tab
         "Detalhes do Evento"; `canInstall`/`@install-app` continuam aqui
         porque usePwaInstall() não é singleton em todos os campos (ver
         comentário no <script> do componente). -->
    <LandingAppShowcaseSection :can-install="canInstall" :discover-events="discoverEvents" @install-app="installApp" />

    <!-- Como funciona — Linha Viva & Parallax -->
    <!-- Como funciona — extraído pra LandingHowItWorksSection.vue na Fase 5
         do REFACTOR_AUDIT_PLAN.md (4ª fatia da decomposição). -->
    <LandingHowItWorksSection />

    <!-- FAQ — extraído pra LandingFaqSection.vue na Fase 5 do
         REFACTOR_AUDIT_PLAN.md (1ª fatia da decomposição). -->
    <LandingFaqSection />

    <!-- Novidades — extraído pra LandingUpdatesTeaser.vue na Fase 5 do
         REFACTOR_AUDIT_PLAN.md (2ª fatia da decomposição). -->
    <LandingUpdatesTeaser />

    <!-- Footer único do app (REFACTOR_AUDIT_PLAN.md, Fase 1) — inclui o
         modal de Termos/Privacidade, que morava aqui e virou autocontido. -->
    <AppFooter />

    <!-- Instruções de instalação no iOS -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showIOSInstructions" class="ios-modal-overlay" @click.self="showIOSInstructions = false">
          <div class="ios-modal">
            <div class="ios-modal-header">
              <img alt="We Party" class="ios-modal-logo" src="/logoweparty.png">
              <h3 class="ios-modal-title">Instalar o app We Party</h3>
              <button aria-label="Fechar" class="ios-modal-close" type="button" @click="showIOSInstructions = false">
                <v-icon icon="mdi-close" size="20" />
              </button>
            </div>
            <div class="ios-modal-body">
              <p class="ios-modal-text">Adicione a We Party à tela de início em poucos toques:</p>
              <ol class="ios-steps">
                <li>
                  <span class="ios-step-num">1</span>
                  <span>Toque no botão <strong>Compartilhar</strong>
                    <v-icon icon="mdi-export-variant" size="18" /> na barra do Safari.</span>
                </li>
                <li>
                  <span class="ios-step-num">2</span>
                  <span>Selecione <strong>Adicionar à Tela de Início</strong>
                    <v-icon icon="mdi-plus-box-outline" size="18" />.</span>
                </li>
                <li>
                  <span class="ios-step-num">3</span>
                  <span>Confirme em <strong>Adicionar</strong> e pronto! 🎉</span>
                </li>
              </ol>
            </div>
            <div class="ios-modal-footer">
              <button class="ios-close-btn" type="button" @click="showIOSInstructions = false">Entendi</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Login Required Dialog -->
    <LoginRequiredDialog />
    <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="4000" />

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════════
   VARIÁVEIS E BASE
   ═══════════════════════════════════════════════════════════════════════════ */
.landing-page {
  --primary: #FFC947;
  --primary-dark: #FF9F3D;
  --secondary: #F978A3;
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
  --glass-border: rgba(255, 201, 71, 0.1);
  --gradient: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
  --gradient-hero: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  --gradient-purple: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  --shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.12);
  --shadow-colored: 0 20px 60px rgba(255, 201, 71, 0.25);

  background: var(--gradient-hero);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
  width: 100%;
  opacity: 1;
  visibility: visible;
}

* {
  box-sizing: border-box;
}

img {
  max-width: 100%;
  height: auto;
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

@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   BARRA DE PROGRESSO DE SCROLL GLOBAL
   ═══════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
   OVERLAY DE FUNDO
   ═══════════════════════════════════════════════════════════════════════════ */
.gradient-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(255, 201, 71, 0.03) 0%, transparent 50%),
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
  padding: 1.25rem 0 0.5rem;
  background: transparent;
  will-change: transform, opacity, padding;
}

.header .container {
  max-width: 100%;
  padding: 0 clamp(1rem, 3.5vw, 3rem);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  border-radius: 0px;
  border: 1px solid transparent;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0.5rem 1rem;
  background: transparent;
  will-change: max-width, background-color, box-shadow, padding, border-radius;
}

/* Fallback para prefers-reduced-motion ou antes do JS carregar */
.header.header-solid {
  padding-top: 1rem;
}

.header.header-solid .header-content {
  max-width: 1100px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-color: rgba(255, 154, 77, 0.18);
  box-shadow: 0 16px 40px rgba(255, 95, 143, 0.2);
  border-radius: 16px;
  padding: 0.65rem 0.85rem 0.65rem 1.75rem;
}

@media (max-width: 768px) {
  .header.header-solid .header-content {
    padding: 0.55rem 0.6rem 0.55rem 1.15rem;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.3s ease;
  transform: translateZ(0);
}

.logo:hover {
  transform: scale(1.05) translateZ(0);
}

.logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  animation: gentle-float 3s ease-in-out infinite;
}

/* O título do logo nunca quebra em duas linhas (em 320px o flex do header o
   espremia até virar "We / Party"): o logo não encolhe e o texto não quebra. */
.logo {
  flex-shrink: 0;
}

.logo .logo-text {
  white-space: nowrap;
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
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* h2 .logo-text, .section-title .logo-text: migrou pra
   LandingAppShowcaseSection.vue (Fase 5, parte 7) — era só o `<h2>` do
   app-showcase que precisava. */

.auth-buttons {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: #fff;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  transition: color 0.25s ease, background-color 0.25s ease;
  border-radius: 10px;
  transform: translateZ(0);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.btn-ghost:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.15);
}

.header-solid .btn-ghost {
  text-shadow: none;
}

.header-solid .btn-ghost:hover {
  color: var(--primary-dark) !important;
  background: rgba(255, 154, 77, 0.08);
}

.btn-primary-glow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  border: none;
  color: white;
  font-weight: 700;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(255, 95, 143, 0.35);
  transform: translateZ(0);
  will-change: transform;
}

.btn-primary-glow:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow: 0 8px 30px rgba(255, 95, 143, 0.45);
}

.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  transition: background-color 0.25s ease, color 0.25s ease;
}

.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff !important;
}

.header-solid .mobile-menu-btn {
  text-shadow: none;
}

.header-solid .mobile-menu-btn:hover {
  background: rgba(255, 154, 77, 0.1);
  color: var(--primary-dark) !important;
}

/* Mobile Menu (drawer) */
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  padding-top: 84px;
  background: rgba(26, 26, 46, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.mobile-menu-panel {
  width: min(82vw, 320px);
  margin: 0.75rem 1rem 0 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 201, 71, 0.18);
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(26, 26, 46, 0.18);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  color: #334155;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.98rem;
  border-radius: 12px;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.mobile-nav-link .v-icon {
  color: var(--primary);
}

.mobile-nav-link:hover,
.mobile-nav-link:active {
  background: rgba(255, 201, 71, 0.08);
  color: var(--primary);
}

.mobile-menu-divider {
  height: 1px;
  margin: 0.5rem 0.25rem;
  background: linear-gradient(90deg, transparent, rgba(255, 201, 71, 0.25), transparent);
}

.mobile-menu-ghost {
  padding: 0.85rem 1rem;
  background: transparent;
  border: 1.5px solid rgba(51, 65, 85, 0.15);
  border-radius: 12px;
  color: #334155;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.mobile-menu-ghost:hover {
  background: rgba(255, 201, 71, 0.06);
  color: var(--primary);
}

.mobile-menu-primary {
  padding: 0.9rem 1rem;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 95, 143, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.mobile-menu-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(255, 201, 71, 0.45);
}

.mobile-menu-fade-enter-active,
.mobile-menu-fade-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-menu-fade-enter-active .mobile-menu-panel,
.mobile-menu-fade-leave-active .mobile-menu-panel {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
}

.mobile-menu-fade-enter-from,
.mobile-menu-fade-leave-to {
  opacity: 0;
}

.mobile-menu-fade-enter-from .mobile-menu-panel,
.mobile-menu-fade-leave-to .mobile-menu-panel {
  transform: translateY(-10px) scale(0.97);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-fade-enter-active,
  .mobile-menu-fade-leave-active,
  .mobile-menu-fade-enter-active .mobile-menu-panel,
  .mobile-menu-fade-leave-active .mobile-menu-panel {
    transition: none;
  }

  /* .showcase-phone-3d-tilt/.showcase-phone-3d-shadow: migraram pra
     LandingAppShowcaseSection.vue (Fase 5, parte 7). */
}

/* .live-dot + @keyframes blink: migraram pra LandingDiscoverSection.vue
   (Fase 5, parte 5) — nada de "MISC" pra guardar aqui. */

/* Hero: migrou pra LandingHeroSection.vue (Fase 5, parte 6). */

/* Seção "Descubra": migrou pra LandingDiscoverSection.vue (Fase 5, parte
   5). Resto de "Descubra" (live counter, cards de evento): migrou junto.
   .btn-cta-primary/.btn-glow: só era usado por hero/discover (ambos já
   extraídos, cada um com sua própria cópia) — confirmado sem uso neste
   arquivo, removido daqui na Fase 5 parte 7 (a nota antiga achava que
   "app-showcase" também usava, mas não usa). .discover-avatars/
   .avatar-*: migraram pra LandingAppShowcaseSection.vue (Fase 5, parte
   7) — só o preview do tab "Detalhes do Evento" ainda usava. */

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADERS
   ═══════════════════════════════════════════════════════════════════════════ */
/* .section-header/.section-title/.section-description: migraram pra
   LandingAppShowcaseSection.vue (Fase 5, parte 7) — eram a última seção
   deste arquivo que ainda usava essas classes-base (as demais já têm
   suas próprias cópias). .section-overline/.gradient-text abaixo já
   estavam sem uso neste arquivo antes desta fatia — fora de escopo
   mexer agora. */
.section-overline {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 201, 71, 0.2);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 1.25rem;
}

.gradient-text {
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Seção "Features": migrou pra LandingFeaturesSection.vue (Fase 5, parte 3)
   — nada pra estilizar aqui. */

/* Seção "App em ação" (mockup interativo + banner PWA): migrou pra
   LandingAppShowcaseSection.vue (Fase 5, parte 7) — nada pra estilizar
   aqui. */

/* Seção "Como funciona" (timeline): migrou pra
   LandingHowItWorksSection.vue (Fase 5, parte 4) — nada pra estilizar
   aqui. */

/* Seção "Novidades" (banner de convite): migrou pra
   LandingUpdatesTeaser.vue (Fase 5, parte 2) — nada pra estilizar aqui. */

/* Footer: migrou pra src/components/UI/AppFooter/AppFooter.vue
   (REFACTOR_AUDIT_PLAN.md, Fase 1) — nada de footer pra estilizar aqui. */

/* ═══════════════════════════════════════════════════════════════════════════
   MODAIS
   ═══════════════════════════════════════════════════════════════════════════ */
.ios-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 3000;
}

.ios-modal {
  background: #fff;
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
}

.ios-modal-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem 1.25rem;
  background: linear-gradient(180deg, rgba(255, 201, 71, 0.12), transparent);
}

.ios-modal-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.ios-modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-dark);
  text-align: center;
  margin: 0;
}

.ios-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ios-modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.ios-modal-body {
  padding: 0.5rem 1.75rem 1.5rem;
}

.ios-modal-text {
  color: var(--text-light);
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
  text-align: center;
}

.ios-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ios-steps li {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  color: var(--text-dark);
  font-size: 0.95rem;
  line-height: 1.5;
}

.ios-steps li .v-icon {
  color: var(--primary-dark);
  vertical-align: middle;
}

.ios-step-num {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--gradient);
  color: #fff;
  font-weight: 800;
  font-size: 0.9rem;
}

.ios-modal-footer {
  padding: 0 1.75rem 1.75rem;
}

.ios-close-btn {
  width: 100%;
  padding: 0.9rem;
  background: var(--gradient);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 201, 71, 0.35);
  transition: transform 0.2s ease;
}

.ios-close-btn:hover {
  transform: translateY(-1px);
}

/* Modal de Termos/Privacidade: migrou pra dentro do AppFooter (autocontido,
   ver src/components/UI/AppFooter/AppFooter.vue) — só o .ios-modal usa
   `.modal-fade` aqui agora. */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .ios-modal,
.modal-fade-leave-active .ios-modal {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .ios-modal,
.modal-fade-leave-to .ios-modal {
  transform: scale(0.9) translateY(30px);
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVO
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .footer-grid-v2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }
}

@media (max-width: 768px) {
  .nav-menu,
  .auth-buttons {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }

  .footer-grid-v2 {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

@media (max-width: 480px) {
  .footer-bottom-v2 {
    flex-direction: column;
    text-align: center;
  }
}
</style>
