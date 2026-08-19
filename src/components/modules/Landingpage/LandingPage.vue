<script setup lang="ts">
  import { useWindowScroll, useWindowSize } from '@vueuse/core'

  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'
  import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { unwrapList } from '@/api'
  import { getAllPublicEvents, getPublicTrendingEvents } from '@/api/event'
  import GradientText from '@/components/UI/GradientText/GradientText.vue'
  import LoginRequiredDialog from '@/components/UI/LoginRequiredDialog/LoginRequiredDialog.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { usePwaInstall } from '@/composables/usePwaInstall'
  import { logger } from '@/utils/logger'

  gsap.registerPlugin(ScrollTrigger)

  const router = useRouter()
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
  const heroSection = ref<HTMLElement | null>(null)
  const heroVideo = ref<HTMLVideoElement | null>(null)
  const featuresGridEl = ref<HTMLElement | null>(null)
  const discoverCardsEl = ref<HTMLElement | null>(null)

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

  // FAQ state
  const faqOpen = ref<number | null>(null)

  function toggleFaq (index: number) {
    faqOpen.value = faqOpen.value === index ? null : index
  }

  // Showcase "We Party em ação" — aba ativa do mockup do celular
  const activeShowcase = ref(0)

  // Aba "Feed de Eventos" embute o app real num iframe com viewport fixo de celular
  const FEED_EMBED_WIDTH = 390
  const phoneScreenEl = ref<HTMLElement | null>(null)
  const feedEmbedScale = ref(1)
  let phoneScreenObserver: ResizeObserver | null = null

  // Smartphone 3D
  const PHONE_BASE_ROTATE_X = 3
  const PHONE_BASE_ROTATE_Y = -14
  const PHONE_TILT_RANGE_X = 3
  const PHONE_TILT_RANGE_Y = 5
  const phoneStageEl = ref<HTMLElement | null>(null)
  const phoneTiltEl = ref<HTMLElement | null>(null)
  const badgeConfirmedEl = ref<HTMLElement | null>(null)

  let badgeConfirmedX: ReturnType<typeof gsap.quickTo> | null = null
  let badgeConfirmedY: ReturnType<typeof gsap.quickTo> | null = null
  let phoneFloatTl: gsap.core.Timeline | null = null

  function setPhoneTilt (rotateX: number, rotateY: number, duration = 0.9) {
    if (!phoneTiltEl.value) return
    gsap.to(phoneTiltEl.value, { rotateX, rotateY, duration, ease: 'power3.out', overwrite: 'auto' })
  }

  function onPhonePointerMove (event: MouseEvent) {
    if (reducedMotion.value || windowWidth.value < 1024) return
    if (!phoneStageEl.value) return

    const rect = phoneStageEl.value.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    setPhoneTilt(
      PHONE_BASE_ROTATE_X - (py - 0.5) * 2 * PHONE_TILT_RANGE_X,
      PHONE_BASE_ROTATE_Y + (px - 0.5) * 2 * PHONE_TILT_RANGE_Y,
    )

    badgeConfirmedX?.((px - 0.5) * -10)
    badgeConfirmedY?.((py - 0.5) * -8)
  }

  function onPhonePointerLeave () {
    if (reducedMotion.value) return
    setPhoneTilt(PHONE_BASE_ROTATE_X, PHONE_BASE_ROTATE_Y)
    badgeConfirmedX?.(0)
    badgeConfirmedY?.(0)
  }

  // Data
  const faqs = [
    {
      question: 'A We Party é gratuita?',
      answer: 'Sim! Criar uma conta, descobrir eventos e conversar com outras pessoas é 100% gratuito. Alguns eventos parceiros podem cobrar ingresso à parte.',
    },
    {
      question: 'Posso criar eventos na plataforma?',
      answer: 'Claro! Qualquer usuário pode publicar um evento, público ou privado, e convidar sua comunidade em poucos cliques.',
    },
    {
      question: 'Como encontro eventos perto de mim?',
      answer: 'Ative sua localização e o feed mostra automaticamente o que está rolando perto de você, com filtros por categoria, data e distância.',
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Sim. Usamos criptografia nas conversas e nunca compartilhamos seus dados pessoais com terceiros sem sua autorização.',
    },
    {
      question: 'Preciso pagar para participar de eventos?',
      answer: 'Depende do evento. Muitos são gratuitos, e para os pagos você vê o valor e compra o ingresso direto pelo app.',
    },
  ]

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

  interface DiscoverEventCard {
    emoji: string
    category: string
    tag: string
    tagColor: string
    title: string
    likes: number
    comments: number
    when: string
    gradient: string
    image: string
  }

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

  const appScreenshots = [
    {
      title: 'Feed de Eventos',
      description: 'Navegue por eventos próximos em tempo real, com filtros que aprendem o que você gosta.',
      image: '/Feedparty.png',
      icon: 'mdi-view-dashboard',
      color: 'var(--gradient)',
      tag: 'Descoberta',
    },
    {
      title: 'Perfil Interativo',
      description: 'Personalize seu perfil, siga amigos e acompanhe o histórico de eventos que você viveu.',
      image: '/perfilweparty.png',
      icon: 'mdi-account-circle',
      color: '#8b5cf6',
      tag: 'Social',
    },
    {
      title: 'Detalhes do Evento',
      description: 'Mapa integrado, lista de participantes e todas as informações completas do evento.',
      image: '',
      icon: 'mdi-calendar-star',
      color: '#3b82f6',
      tag: 'Informações',
    },
  ]

  const mainFeature = features[0]!
  const secondaryFeatures = features.slice(1)

  const howItWorks = [
    { number: '01', title: 'Crie sua conta', description: 'Cadastre-se gratuitamente em poucos segundos e comece a explorar.', icon: 'mdi-account-plus', color: 'var(--gradient)' },
    { number: '02', title: 'Descubra eventos', description: 'Explore eventos próximos ou baseados nos seus interesses.', icon: 'mdi-compass', color: '#8b5cf6' },
    { number: '03', title: 'Conecte-se com pessoas', description: 'Veja quem vai participar e interaja com a comunidade.', icon: 'mdi-heart-multiple', color: '#ec4899' },
    { number: '04', title: 'Viva novas experiências', description: 'Participe de eventos e descubra novos lugares e pessoas.', icon: 'mdi-party-popper', color: 'linear-gradient(135deg, #ffd93d, #FF9F3D)' },
  ]

  const instagramUrl = 'https://instagram.com/weparty'

  // Terms and Privacy Modal
  const showTermsModal = ref(false)
  const termsModalPdf = ref<'terms' | 'privacy'>('terms')

  function openTermsModal (type: 'terms' | 'privacy') {
    termsModalPdf.value = type
    showTermsModal.value = true
  }

  // Live counter
  const usersOnline = ref(0)
  const targetUsersOnline = 157

  // ═══════════════════════════════════════════════════════════════════════════
  // MICROINTERAÇÕES: Efeito Magnético nos CTAs Principais
  // ═══════════════════════════════════════════════════════════════════════════
  function setupMagneticButtons (container: HTMLElement) {
    const buttons = container.querySelectorAll<HTMLElement>('.btn-cta-primary, .btn-primary-glow, .btn-pwa-install, .btn-install')
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
        .from('.header', { y: -25, opacity: 0, duration: 1.0, ease: 'power3.out' })
        .from('.hero-wordmark-wrap', { y: 70, opacity: 0, scale: 0.94, duration: 1.2, ease: 'power4.out' }, '-=0.6')
        .from('.hero-tagline-wrap', { y: 35, opacity: 0, duration: 1.0, ease: 'power3.out' }, '-=0.7')
        .from('.hero-scroll-indicator', { y: 20, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')

      // 4. Hero — Scroll Storytelling Scrub (transição suave para a próxima seção)
      if (!reducedMotion.value && heroSection.value) {
        gsap.timeline({
          scrollTrigger: {
            trigger: heroSection.value,
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
        duration: 1.0,
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

      // 10. Banner PWA
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

      // 11. Footer
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

      // Inicializa o Smartphone 3D
      initPhoneShowcase()

      // Configura microinterações do mouse
      setupMagneticButtons(landingEl.value!)
      if (discoverCardsEl.value) {
        setupDiscoverCardsInteractivity(discoverCardsEl.value)
      }
      if (featuresGridEl.value) {
        setupFeaturesSpotlight(featuresGridEl.value)
      }
    }, landingEl.value)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMARTPHONE 3D (Refinado e Integrado)
  // ═══════════════════════════════════════════════════════════════════════════
  function initPhoneShowcase () {
    if (!phoneTiltEl.value || !phoneStageEl.value) return

    gsap.set(phoneTiltEl.value, { transformPerspective: 1600 })

    if (reducedMotion.value) {
      gsap.set(phoneTiltEl.value, { rotateX: PHONE_BASE_ROTATE_X, rotateY: PHONE_BASE_ROTATE_Y, opacity: 1 })
      gsap.set(badgeConfirmedEl.value, { opacity: 1 })
      return
    }

    gsap.set(phoneTiltEl.value, { rotateX: PHONE_BASE_ROTATE_X, rotateY: PHONE_BASE_ROTATE_Y })

    if (badgeConfirmedEl.value) {
      badgeConfirmedX = gsap.quickTo(badgeConfirmedEl.value, 'x', { duration: 1.1, ease: 'power3.out' })
      badgeConfirmedY = gsap.quickTo(badgeConfirmedEl.value, 'y', { duration: 1.1, ease: 'power3.out' })
    }

    const floatAmplitude = windowWidth.value < 768 ? 3 : 7
    phoneFloatTl = gsap.timeline({ repeat: -1, yoyo: true, paused: true, defaults: { ease: 'sine.inOut', duration: 3.6 } })
      .to(phoneTiltEl.value, { y: -floatAmplitude, rotateZ: 0.3 }, 0)
      .to('.showcase-phone-3d-shadow', { scale: 0.96, opacity: 0.7 }, 0)

    const entranceTl = gsap.timeline({
      scrollTrigger: {
        trigger: phoneStageEl.value,
        start: 'top 82%',
        toggleActions: 'play none none reverse',
        onEnter: () => {
          gsap.set(phoneTiltEl.value, { rotateY: PHONE_BASE_ROTATE_Y - 11 })
          setPhoneTilt(PHONE_BASE_ROTATE_X, PHONE_BASE_ROTATE_Y, 1.1)
        },
        onLeaveBack: () => setPhoneTilt(PHONE_BASE_ROTATE_X, PHONE_BASE_ROTATE_Y - 11, 0.6),
      },
      onComplete: () => {
        phoneFloatTl?.play()
      },
      onReverseComplete: () => {
        phoneFloatTl?.pause(0)
      },
    })

    entranceTl
      .from(phoneTiltEl.value, {
        opacity: 0, y: 60, scale: 0.92, duration: 1.1, ease: 'power3.out',
      })
      .from(badgeConfirmedEl.value, {
        opacity: 0, y: 16, scale: 0.9, duration: 0.6, ease: 'power3.out',
      }, '-=0.55')

    const phoneBodyEl = phoneTiltEl.value.querySelector('.showcase-phone-3d-body')
    if (phoneBodyEl) {
      gsap.to(phoneBodyEl, {
        scale: 1.03,
        scrollTrigger: {
          trigger: phoneStageEl.value,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    }
  }

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

    if (reducedMotion.value) {
      heroVideo.value?.pause()
    }

    if (heroSection.value) {
      const headerHeight = headerEl.value?.offsetHeight ?? 80
      heroObserver = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          if (entry) navSolid.value = !entry.isIntersecting
        },
        { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 },
      )
      heroObserver.observe(heroSection.value)
    }

    if (phoneScreenEl.value) {
      phoneScreenObserver = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width
        if (width) feedEmbedScale.value = width / FEED_EMBED_WIDTH
      })
      phoneScreenObserver.observe(phoneScreenEl.value)
    }
  })

  onUnmounted(() => {
    heroObserver?.disconnect()
    phoneScreenObserver?.disconnect()
    phoneFloatTl?.kill()
    ctx?.revert()
    for (const t of ScrollTrigger.getAll()) t.kill()
    document.body.style.overflow = ''
  })

  // Navigation
  function goToSignup () {
    router.push('/public/Signup')
  }
  function goToLogin () {
    router.push('/public/Login')
  }
  function goToFeed () {
    router.push('/public/explore')
  }

  function goToLoginMobile () {
    closeMobileMenu()
    goToLogin()
  }
  function goToSignupMobile () {
    closeMobileMenu()
    goToSignup()
  }
  function installAppMobile () {
    closeMobileMenu()
    installApp()
  }

  function goToSection (sectionId: string) {
    closeMobileMenu()
    nextTick(() => {
      const el = document.querySelector(sectionId)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
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
          <div class="auth-buttons">
            <button
              v-if="canInstall"
              class="btn-install"
              title="Instalar o app da We Party"
              type="button"
              @click="installApp"
            >
              <v-icon icon="mdi-download" size="20" />
              <span>Baixar app</span>
            </button>
            <button class="btn-ghost" type="button" @click="goToLogin">Entrar</button>
            <button class="btn-primary-glow" type="button" @click="goToSignup">
              <span>CADASTRO</span>
            </button>
          </div>
          <button
            v-if="canInstall"
            aria-label="Instalar o app da We Party"
            class="btn-install-mobile"
            type="button"
            @click="installApp"
          >
            <v-icon icon="mdi-download" size="22" />
          </button>
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
        <nav id="mobile-menu" aria-label="Menu principal" class="mobile-menu-panel">
          <a class="mobile-nav-link" href="#como-funciona" @click.prevent="goToSection('#como-funciona')">
            <v-icon icon="mdi-information-outline" size="20" />
            <span>Como funciona</span>
          </a>

          <div class="mobile-menu-divider" />

          <button
            v-if="canInstall"
            class="mobile-menu-install"
            type="button"
            @click="installAppMobile"
          >
            <v-icon icon="mdi-download" size="20" />
            <span>Baixar app</span>
          </button>
          <button class="mobile-menu-ghost" type="button" @click="goToLoginMobile">Entrar</button>
          <button class="mobile-menu-primary" type="button" @click="goToSignupMobile">
            <span>CADASTRO</span>
          </button>
        </nav>
      </div>
    </Transition>

    <!-- Hero Cinematográfica -->
    <section ref="heroSection" class="hero hero-v2">
      <video
        ref="heroVideo"
        autoplay
        class="hero-video"
        loop
        muted
        playsinline
        preload="auto"
      >
        <source src="/hero-video.mp4" type="video/mp4">
      </video>
      <div class="hero-video-overlay" />

      <div class="container">
        <div class="hero-v2-content">
          <div class="hero-wordmark-wrap">
            <GradientText
              tag="h1"
              class="hero-wordmark"
              :colors="['#ff9a4d', '#ff5f8f']"
              :animation-speed="4"
            >
              We Party
            </GradientText>
          </div>
          <div class="hero-tagline-wrap">
            <GradientText
              tag="p"
              class="hero-tagline"
              :colors="['#ff9a4d', '#ff5f8f']"
              :animation-speed="4"
            >
              A rede social feita para quem ama eventos
            </GradientText>
          </div>
        </div>
      </div>

      <!-- Indicador de Scroll -->
      <div class="hero-scroll-indicator" @click="goToSection('#descubra')">
        <span class="indicator-mouse"><span class="indicator-wheel" /></span>
        <span class="indicator-text">Role para explorar</span>
      </div>
    </section>

    <!-- Descubra eventos -->
    <section id="descubra" class="discover">
      <div class="discover-bg" />
      <div class="container discover-grid">
        <div class="discover-content">
          <div class="discover-badge">
            <span>🎉</span>
            <span>Feito para quem ama sair de casa</span>
          </div>

          <h2 class="discover-title">
            Descubra eventos perto de você e conecte-se
            <span class="title-gradient"> com pessoas que também vão</span>
          </h2>

          <p class="discover-text">
            Encontre festas, shows e experiências na sua cidade, veja quem vai participar e interaja
            com outros usuários antes mesmo do evento começar.
          </p>

          <div class="discover-actions">
            <button class="btn-cta-primary" type="button" @click="goToFeed">
              <span>Experimentar</span>
              <div class="btn-glow" />
            </button>
            <div class="discover-avatars">
              <span class="avatar-dot avatar-1" />
              <span class="avatar-dot avatar-2" />
              <span class="avatar-dot avatar-3" />
              <span class="avatar-label">+2.3k na sua região</span>
            </div>
          </div>

          <div class="discover-live-card">
            <span class="discover-live-emoji">🔥</span>
            <div class="discover-live-body">
              <div class="discover-live-top">
                <span class="discover-live-number">+{{ usersOnline }}</span>
                <span class="discover-live-badge"><span class="live-dot" />AO VIVO</span>
              </div>
              <div class="discover-live-text">pessoas descobrindo eventos agora</div>
            </div>
          </div>
        </div>

        <div ref="discoverCardsEl" class="discover-cards">
          <div
            v-for="(event, index) in discoverEvents"
            :key="event.title"
            class="discover-event-card"
            :class="`discover-event-card-${index + 1}`"
          >
            <div class="discover-event-media" :style="{ background: event.gradient }">
              <img
                v-if="event.image"
                alt=""
                class="discover-event-image"
                loading="lazy"
                :src="event.image"
              >
              <span class="discover-event-category">{{ event.emoji }} {{ event.category }}</span>
              <span class="discover-event-share"><v-icon icon="mdi-share-variant-outline" size="14" /></span>
              <div class="discover-event-overlay">
                <span class="discover-event-tag" :style="{ background: event.tagColor }">{{ event.tag }}</span>
                <div class="discover-event-title">{{ event.title }}</div>
              </div>
            </div>
            <div class="discover-event-footer">
              <div class="discover-event-stats">
                <span>❤️ {{ event.likes }}</span>
                <span>💬 {{ event.comments }}</span>
              </div>
              <span class="discover-event-when" :style="{ color: event.tagColor }">{{ event.when }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section id="features" class="features features-v2">
      <div class="features-bg" />
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            Uma nova forma de descobrir e <span class="gradient-text">viver eventos</span>
          </h2>
        </div>

        <div ref="featuresGridEl" class="features-grid-v2">
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

    <!-- App em ação -->
    <section id="app-showcase" class="app-showcase-v2">
      <div class="container">
        <div class="section-header">
          <span class="section-overline">PLATAFORMA</span>
          <h2 class="section-title">
            Veja o <span class="logo-text">We Party</span> em ação
          </h2>
          <p class="section-description">Conheça a plataforma e descubra como é fácil explorar eventos</p>
        </div>

        <div class="showcase-grid">
          <div class="showcase-tabs">
            <button
              v-for="(screenshot, index) in appScreenshots"
              :key="screenshot.title"
              class="showcase-tab"
              :class="{ active: activeShowcase === index }"
              type="button"
              @click="activeShowcase = index"
            >
              <div class="showcase-tab-top">
                <div
                  class="showcase-tab-badge"
                  :style="activeShowcase === index ? { background: screenshot.color } : {}"
                >
                  <v-icon :icon="screenshot.icon" size="22" />
                </div>
                <div class="showcase-tab-heading">
                  <span class="showcase-tab-pill" :class="{ active: activeShowcase === index }">{{ screenshot.tag }}</span>
                  <div class="showcase-tab-title">{{ screenshot.title }}</div>
                </div>
              </div>
              <p class="showcase-tab-desc">{{ screenshot.description }}</p>
            </button>
          </div>

          <div
            ref="phoneStageEl"
            class="showcase-phone-wrap"
            @mouseleave="onPhonePointerLeave"
            @mousemove="onPhonePointerMove"
          >
            <div class="showcase-phone-3d-shadow" />

            <div ref="phoneTiltEl" class="showcase-phone-3d-tilt">
              <div class="showcase-phone-3d-body">
                <div class="showcase-phone-3d-core" />

                <div class="showcase-phone-3d-face face-right">
                  <span class="showcase-phone-3d-btn btn-power" />
                </div>
                <div class="showcase-phone-3d-face face-left">
                  <span class="showcase-phone-3d-btn btn-vol-up" />
                  <span class="showcase-phone-3d-btn btn-vol-down" />
                </div>
                <div class="showcase-phone-3d-face face-top" />
                <div class="showcase-phone-3d-face face-bottom" />

                <div class="showcase-phone-3d-face face-front">
                  <div class="showcase-phone-3d-speaker">
                    <span class="showcase-phone-3d-camera" />
                  </div>
                  <div ref="phoneScreenEl" class="showcase-phone-3d-screen">
                    <Transition mode="out-in" name="phone-fade">
                      <div v-if="activeShowcase === 0" key="feed-embed" class="showcase-feed-embed-wrap">
                        <iframe
                          class="showcase-feed-embed"
                          loading="lazy"
                          src="/public/explore"
                          :style="{ transform: `scale(${feedEmbedScale})` }"
                          title="Feed de Eventos da We Party, ao vivo"
                        />
                      </div>
                      <div v-else-if="activeShowcase === 2" key="event-mock" class="event-mock">
                        <div class="event-mock-cover" :style="{ background: discoverEvents[0]!.gradient }">
                          <span class="event-mock-back"><v-icon icon="mdi-arrow-left" size="14" /></span>
                          <span class="event-mock-like"><v-icon icon="mdi-heart-outline" size="14" /></span>
                          <span class="event-mock-emoji">{{ discoverEvents[0]!.emoji }}</span>
                        </div>
                        <div class="event-mock-body">
                          <span class="event-mock-tag" :style="{ background: discoverEvents[0]!.tagColor }">{{ discoverEvents[0]!.tag }}</span>
                          <div class="event-mock-title">{{ discoverEvents[0]!.title }}</div>
                          <div class="event-mock-meta">
                            <span><v-icon icon="mdi-calendar-blank-outline" size="12" /> {{ discoverEvents[0]!.when }}</span>
                          </div>
                          <div class="event-mock-map">
                            <span class="event-mock-map-pin"><v-icon icon="mdi-map-marker" size="16" /></span>
                          </div>
                          <div class="event-mock-participants">
                            <div class="discover-avatars">
                              <span class="avatar-dot avatar-1" />
                              <span class="avatar-dot avatar-2" />
                              <span class="avatar-dot avatar-3" />
                            </div>
                            <span class="event-mock-participants-text">+312 confirmados</span>
                          </div>
                          <div class="event-mock-cta">
                            <v-icon icon="mdi-check-circle-outline" size="15" />
                            <span>Confirmar presença</span>
                          </div>
                        </div>
                      </div>
                      <img
                        v-else
                        :key="activeShowcase"
                        :alt="appScreenshots[activeShowcase]!.title"
                        class="showcase-phone-img"
                        :src="appScreenshots[activeShowcase]!.image"
                      >
                    </Transition>
                    <div class="showcase-phone-3d-glass" />
                  </div>
                </div>
              </div>
            </div>

            <div ref="badgeConfirmedEl" class="showcase-floating-badge badge-confirmed">
              <v-icon color="#4ade80" icon="mdi-check-circle" size="16" /> Presença confirmada
            </div>
          </div>
        </div>

        <div v-if="canInstall" class="pwa-banner">
          <span class="pwa-banner-deco pwa-banner-deco-1">✨</span>
          <span class="pwa-banner-deco pwa-banner-deco-2">🎉</span>
          <div class="pwa-banner-info">
            <div class="pwa-banner-icon">📲</div>
            <div>
              <div class="pwa-banner-title">Baixe também nossa versão PWA</div>
              <div class="pwa-banner-desc">Instale direto do navegador, sem loja de apps, e leve o We Party pra onde você for.</div>
            </div>
          </div>
          <button class="btn-pwa-install" type="button" @click="installApp">
            <v-icon icon="mdi-download" size="20" />
            <span>Instalar PWA</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Como funciona — Linha Viva & Parallax -->
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

    <!-- FAQ — Balões de Chat -->
    <section class="faq faq-v2">
      <div class="faq-bg" />
      <div class="container">
        <div class="faq-grid">
          <div class="faq-intro">
            <h2 class="section-title">Perguntas <span class="gradient-text">frequentes</span></h2>
            <p class="section-description">Toque em uma pergunta para ver a resposta na hora</p>

            <div class="faq-intro-card">
              <div class="faq-chat-avatar faq-intro-avatar"><v-icon color="#fff" icon="mdi-party-popper" size="18" /></div>
              <p class="faq-intro-text">
                <strong>Oi! 👋</strong> Separei as dúvidas que mais chegam por aqui. Bora conferir?
              </p>
            </div>
          </div>

          <div class="faq-chat-list">
            <div v-for="(faq, index) in faqs" :key="faq.question" class="faq-chat-item">
              <div class="faq-chat-question-row">
                <button class="faq-chat-bubble-q" type="button" @click="toggleFaq(index)">
                  <span>{{ faq.question }}</span>
                  <v-icon class="faq-chat-icon" :class="{ rotated: faqOpen === index }" icon="mdi-chevron-down" size="18" />
                </button>
              </div>
              <Transition name="faq-expand">
                <div v-if="faqOpen === index" class="faq-chat-answer-row">
                  <div class="faq-chat-avatar"><v-icon color="#fff" icon="mdi-party-popper" size="18" /></div>
                  <div class="faq-chat-bubble-a">{{ faq.answer }}</div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer footer-v2">
      <div class="container">
        <div class="footer-grid-v2">
          <div class="footer-col-brand">
            <div class="footer-brand">
              <img alt="We Party Logo" class="logo-img" src="/logoweparty.png">
              <span class="logo-text">We Party</span>
            </div>
            <p class="footer-brand-desc">O jeito mais fácil de descobrir, criar e viver os melhores eventos perto de você.</p>
            <div class="footer-social">
              <a
                aria-label="Instagram"
                class="social-link"
                :href="instagramUrl"
                rel="noopener noreferrer"
                target="_blank"
              >
                <v-icon icon="mdi-instagram" />
              </a>
            </div>
          </div>

          <div class="footer-col">
            <div class="footer-col-title">PRODUTO</div>
            <button class="footer-link-btn" type="button" @click="goToSection('#como-funciona')">Como funciona</button>
            <button class="footer-link-btn" type="button" @click="goToSection('#features')">Recursos</button>
            <button class="footer-link-btn" type="button" @click="goToSignup">Criar evento</button>
          </div>

          <div class="footer-col">
            <div class="footer-col-title">EMPRESA</div>
            <button class="footer-link-btn" type="button" @click="router.push('/public/updates')">Novidades</button>
            <a
              class="footer-link-a"
              href="https://www.wetechhub.com.br/"
              rel="noopener noreferrer"
              target="_blank"
            >We TechHub</a>
          </div>
        </div>

        <div class="footer-bottom-v2">
          <span>© 2026 We Party. Todos os direitos reservados.</span>
          <div class="footer-legal-links">
            <button class="footer-link-btn" type="button" @click="openTermsModal('privacy')">Privacidade</button>
            <button class="footer-link-btn" type="button" @click="openTermsModal('terms')">Termos de uso</button>
            <button class="footer-link-btn" type="button" @click="openTermsModal('privacy')">Cookies</button>
          </div>
        </div>
      </div>
    </footer>

    <!-- Modal de Termos / Política -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTermsModal" class="terms-modal-overlay" @click.self="showTermsModal = false">
          <div class="terms-modal">
            <div class="terms-modal-header">
              <h3 class="terms-modal-title">
                {{ termsModalPdf === 'terms' ? 'Termos de Uso' : 'Política de Privacidade' }}
              </h3>
              <button class="terms-modal-close" type="button" @click="showTermsModal = false">
                <svg
                  fill="none"
                  height="18"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="terms-modal-body">
              <iframe
                class="terms-pdf-viewer"
                :src="termsModalPdf === 'terms' ? '/termos-de-uso.pdf' : '/politica-de-privacidade.pdf'"
                title="Documento legal"
              />
            </div>
            <div class="terms-modal-footer">
              <button class="terms-close-btn" type="button" @click="showTermsModal = false">
                Fechar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
  padding: 1.25rem 0;
  background: transparent;
  transition: top 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.header.header-solid {
  top: 1rem;
  padding: 0;
}

.header:not(.header-solid) .container {
  max-width: none;
  padding: 0 clamp(1.5rem, 5vw, 4.5rem);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: background 0.35s ease, box-shadow 0.35s ease,
    border-color 0.35s ease, padding 0.35s ease, max-width 0.35s ease;
}

.header-solid .header-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.65rem 0.85rem 0.65rem 1.75rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border-color: rgba(255, 154, 77, 0.15);
  box-shadow: 0 16px 40px rgba(255, 95, 143, 0.2);
}

@media (max-width: 768px) {
  .header-solid .header-content {
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

h2 .logo-text,
.section-title .logo-text {
  font-size: inherit;
  display: inline;
}

.footer-brand .logo-text {
  font-size: 1.35rem;
}

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
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  transform: translateZ(0);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.btn-ghost:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.header-solid .btn-ghost {
  color: #334155;
  text-shadow: none;
}

.header-solid .btn-ghost:hover {
  color: var(--primary-dark);
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

/* Botão de instalação do PWA (desktop) */
.btn-install {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.16);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease;
  transform: translateZ(0);
  will-change: transform;
}

.btn-install:hover {
  transform: translateY(-2px) translateZ(0);
  background: rgba(255, 255, 255, 0.26);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.header-solid .btn-install {
  background: rgba(255, 154, 77, 0.1);
  border-color: rgba(255, 154, 77, 0.4);
  color: var(--primary-dark);
}

.header-solid .btn-install:hover {
  background: rgba(255, 154, 77, 0.18);
  box-shadow: 0 6px 20px rgba(255, 95, 143, 0.25);
}

.btn-install .v-icon {
  animation: install-bounce 2s ease-in-out infinite;
}

@keyframes install-bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(2px);
  }
}

/* Botão de instalação do PWA (mobile) */
.btn-install-mobile {
  display: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: var(--gradient);
  border: none;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 201, 71, 0.35);
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
  color: #fff;
}

.header-solid .mobile-menu-btn {
  color: var(--text);
  text-shadow: none;
}

.header-solid .mobile-menu-btn:hover {
  background: rgba(255, 154, 77, 0.1);
  color: var(--primary-dark);
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

.mobile-menu-install {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  background: rgba(255, 201, 71, 0.1);
  border: 1.5px solid rgba(255, 201, 71, 0.45);
  border-radius: 12px;
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.mobile-menu-install:hover {
  background: rgba(255, 201, 71, 0.18);
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

  .showcase-phone-3d-tilt,
  .showcase-phone-3d-shadow {
    transition: none;
    animation: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   MISC
   ═══════════════════════════════════════════════════════════════════════════ */
.live-dot {
  width: 8px;
  height: 8px;
  background: var(--gradient);
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
  display: inline-block;
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

/* ═══════════════════════════════════════════════════════════════════════════
   DESCUBRA EVENTOS
   ═══════════════════════════════════════════════════════════════════════════ */
.discover {
  position: relative;
  padding: 5rem 0 8rem;
  overflow: hidden;
}

.discover-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 10% 20%, rgba(255, 201, 71, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 95% 85%, rgba(139, 92, 246, 0.12) 0%, transparent 45%);
}

.discover-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 4rem;
  align-items: center;
}

.discover-content {
  text-align: left;
}

.discover-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.75);
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(249, 120, 163, 0.18);
}

.discover-title {
  font-size: clamp(1.85rem, 3.4vw, 2.75rem);
  line-height: 1.28;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0 0 1.5rem;
}

.title-gradient {
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.discover-text {
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--text-light);
  max-width: 460px;
  margin: 0 0 2.25rem;
}

.discover-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn-cta-primary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 2.25rem;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  border: none;
  border-radius: 999px;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(255, 95, 143, 0.35);
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  will-change: transform;
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
  transform: translateY(-3px) translateZ(0);
  box-shadow: 0 16px 40px rgba(255, 95, 143, 0.45);
}

.discover-avatars {
  display: flex;
  align-items: center;
}

.avatar-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid #fff8f0;
  margin-left: -10px;
  display: inline-block;
}

.avatar-dot:first-child {
  margin-left: 0;
}

.avatar-1 {
  background: linear-gradient(135deg, #ffb27a, #F978A3);
}

.avatar-2 {
  background: linear-gradient(135deg, #ff9a9a, #c48bff);
}

.avatar-3 {
  background: linear-gradient(135deg, #8bd3ff, #a58bff);
}

.avatar-label {
  font-size: 0.85rem;
  color: var(--text-light);
  font-weight: 600;
  margin-left: 0.6rem;
}

.discover-live-card {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border-radius: 18px;
  padding: 1.1rem 1.6rem;
  box-shadow: 0 16px 40px rgba(249, 120, 163, 0.2);
}

.discover-live-emoji {
  font-size: 1.6rem;
}

.discover-live-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.discover-live-number {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary);
}

.discover-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--secondary);
  letter-spacing: 0.05em;
}

.discover-live-text {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 600;
  margin-top: 0.15rem;
}

.discover-cards {
  position: relative;
  min-height: 620px;
  perspective: 1200px;
}

.discover-event-card {
  position: absolute;
  width: 240px;
  background: #fff;
  border-radius: 22px;
  padding: 10px;
  box-shadow: 0 20px 45px rgba(249, 120, 163, 0.22);
  transform-style: preserve-3d;
  will-change: transform;
  backface-visibility: hidden;
  cursor: pointer;
}

.discover-event-card-1 {
  top: 0;
  left: 0;
  transform: rotate(-6deg);
  z-index: 1;
}

.discover-event-card-2 {
  top: 240px;
  right: 0;
  transform: rotate(5deg);
  z-index: 2;
}

.discover-event-card-3 {
  bottom: 0;
  left: 5%;
  transform: rotate(-3deg);
  z-index: 1;
}

.discover-event-media {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
}

.discover-event-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
}

.discover-event-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.72) 100%);
}

.discover-event-category {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 700;
  color: #1a1a2e;
}

.discover-event-share {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.discover-event-overlay {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  z-index: 1;
}

.discover-event-tag {
  display: inline-block;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  margin-bottom: 7px;
}

.discover-event-title {
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  line-height: 1.2;
}

.discover-event-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px 2px;
}

.discover-event-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #9a9aab;
  font-weight: 600;
}

.discover-event-when {
  font-size: 11px;
  font-weight: 700;
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

.section-description {
  font-size: 1.15rem;
  color: #64748b;
  line-height: 1.75;
  font-weight: 400;
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

/* ═══════════════════════════════════════════════════════════════════════════
   APP EM AÇÃO — MOCKUP INTERATIVO
   ═══════════════════════════════════════════════════════════════════════════ */
.app-showcase-v2 {
  padding: 8rem 0;
  position: relative;
}

.app-showcase-v2 .container {
  max-width: 1320px;
}

.showcase-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 3.5rem;
  align-items: center;
}

.showcase-tabs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.showcase-tab {
  text-align: left;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  padding: 1.35rem 1.5rem;
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  font-family: inherit;
  will-change: transform;
}

.showcase-tab.active {
  background: #fff;
  border-color: transparent;
  box-shadow: 0 16px 36px rgba(249, 120, 163, 0.22);
}

.showcase-tab-top {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.showcase-tab-badge {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.06);
  filter: grayscale(0.4) opacity(0.7);
  transition: all 0.25s ease;
}

.showcase-tab.active .showcase-tab-badge {
  filter: none;
}

.showcase-tab-heading {
  flex: 1;
  min-width: 0;
}

.showcase-tab-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  color: #9a9aab;
}

.showcase-tab-pill.active {
  background: #fff0e8;
  color: var(--primary-dark);
}

.showcase-tab-title {
  font-weight: 800;
  font-size: 1.1rem;
  color: #1a1a2e;
  margin-top: 0.45rem;
}

.showcase-tab-desc {
  font-size: 0.87rem;
  color: var(--text-light);
  line-height: 1.6;
  margin: 0.85rem 0 0;
  padding-left: 4rem;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SMARTPHONE 3D
   ═══════════════════════════════════════════════════════════════════════════ */
.showcase-phone-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 3rem 0 4rem;
  perspective: 1700px;
}

.showcase-phone-3d-shadow {
  position: absolute;
  left: 50%;
  bottom: 12px;
  width: 62%;
  height: 70px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, rgba(249, 120, 163, 0.5) 0%, rgba(249, 120, 163, 0.22) 45%, rgba(249, 120, 163, 0) 75%);
  filter: blur(22px);
  z-index: 0;
  pointer-events: none;
}

.showcase-phone-3d-tilt {
  position: relative;
  z-index: 1;
  transform-style: preserve-3d;
  will-change: transform;
}

.showcase-phone-3d-body {
  position: relative;
  width: 280px;
  height: 560px;
  transform-style: preserve-3d;
  will-change: transform;
}

.showcase-phone-3d-face {
  position: absolute;
  background: linear-gradient(180deg, #26263f 0%, #101020 100%);
}

.showcase-phone-3d-core {
  position: absolute;
  inset: 0;
  border-radius: 44px;
  background: linear-gradient(180deg, #1c1c34 0%, #0b0b16 100%);
  transform: translateZ(0);
}

.face-front {
  inset: 0;
  border-radius: 44px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateZ(8px);
  background:
    radial-gradient(circle at 14% 8%, rgba(139, 92, 246, 0.2), transparent 40%),
    radial-gradient(circle at 88% 96%, rgba(249, 120, 163, 0.25), transparent 45%),
    linear-gradient(155deg, #14142a 0%, #1a1a2e 45%, #20203f 100%);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.16),
    inset 0 -1px 1px rgba(0, 0, 0, 0.4),
    0 34px 60px -12px rgba(20, 10, 30, 0.45),
    0 12px 24px -8px rgba(249, 120, 163, 0.25);
}

.face-right,
.face-left {
  width: 16px;
  height: 472px;
  top: 44px;
  left: 132px;
  border-radius: 16px;
  background: linear-gradient(90deg, #0b0b14 0%, #2c2c48 35%, #3c3c5e 50%, #2c2c48 65%, #0b0b14 100%);
}

.face-right {
  transform: rotateY(90deg) translateZ(140px);
}

.face-left {
  transform: rotateY(-90deg) translateZ(140px);
}

.face-top,
.face-bottom {
  width: 192px;
  height: 16px;
  top: 272px;
  left: 44px;
  background: linear-gradient(180deg, #26263f 0%, #101020 100%);
}

.face-top {
  transform: rotateX(90deg) translateZ(280px);
  border-radius: 44px 44px 0 0;
}

.face-bottom {
  transform: rotateX(-90deg) translateZ(280px);
  border-radius: 0 0 44px 44px;
}

.showcase-phone-3d-btn {
  position: absolute;
  left: 2px;
  right: 2px;
  border-radius: 3px;
  background: linear-gradient(90deg, #3a3a5c, #14141f);
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.1);
}

.btn-power {
  top: 130px;
  height: 72px;
}

.btn-vol-up {
  top: 108px;
  height: 44px;
}

.btn-vol-down {
  top: 164px;
  height: 44px;
}

.showcase-phone-3d-speaker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 22px;
  flex-shrink: 0;
}

.showcase-phone-3d-speaker::before {
  content: '';
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
}

.showcase-phone-3d-camera {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #4a4a66, #0a0a14 70%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.showcase-phone-3d-screen {
  position: relative;
  flex: 1;
  width: 100%;
  border-radius: 32px;
  overflow: hidden;
  background: #fdeef4;
  /* .showcase-phone-3d-body/-tilt usam transform-style: preserve-3d para o
     tilt 3D do mockup. Sem isolar esta tela num contexto "flat" próprio, o
     overflow: hidden acima deixa vazar conteúdo composto separadamente
     (o iframe do feed e o v-menu teleportado do dropdown de usuário),
     que passa a ignorar os limites arredondados da tela durante o scroll. */
  transform-style: flat;
  isolation: isolate;
}

.showcase-phone-3d-glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.05) 16%, rgba(255, 255, 255, 0) 34%, rgba(255, 255, 255, 0) 64%, rgba(255, 255, 255, 0.05) 84%, rgba(255, 255, 255, 0.14) 100%);
  mix-blend-mode: overlay;
  opacity: 0.6;
}

.showcase-phone-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

.event-mock {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.event-mock-cover {
  position: relative;
  flex-shrink: 0;
  height: 40%;
  min-height: 130px;
}

.event-mock-back,
.event-mock-like {
  position: absolute;
  top: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-mock-back {
  left: 12px;
}

.event-mock-like {
  right: 12px;
}

.event-mock-emoji {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.6rem;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.15));
}

.event-mock-body {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-mock-tag {
  align-self: flex-start;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}

.event-mock-title {
  font-weight: 800;
  font-size: 15px;
  line-height: 1.25;
  color: var(--text-dark);
}

.event-mock-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-light);
}

.event-mock-map {
  position: relative;
  height: 76px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle, rgba(139, 92, 246, 0.16) 1px, transparent 1px) 0 0 / 14px 14px,
    linear-gradient(135deg, #e9f4ff 0%, #f3edff 100%);
}

.event-mock-map-pin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(249, 120, 163, 0.4);
}

.event-mock-participants {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-mock-participants-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-dark);
}

.event-mock-cta {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.3);
}

.showcase-feed-embed-wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.showcase-feed-embed {
  width: 390px;
  height: 844px;
  border: none;
  transform-origin: top left;
}

.phone-fade-enter-active,
.phone-fade-leave-active {
  transition: opacity 0.3s ease;
}

.phone-fade-enter-from,
.phone-fade-leave-to {
  opacity: 0;
}

.showcase-floating-badge {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border-radius: 16px;
  padding: 0.7rem 1.1rem;
  box-shadow: 0 16px 34px -6px rgba(249, 120, 163, 0.3), 0 2px 6px rgba(26, 26, 46, 0.06);
  font-size: 0.8rem;
  font-weight: 700;
  color: #1a1a2e;
  will-change: transform;
}

.badge-confirmed {
  bottom: 14%;
  right: -6%;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PWA BANNER
   ═══════════════════════════════════════════════════════════════════════════ */
.pwa-banner {
  margin-top: 5rem;
  background: linear-gradient(120deg, var(--dark) 0%, #33244d 60%, #4a2650 100%);
  border-radius: 28px;
  padding: 2.75rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2.5rem;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.pwa-banner-deco {
  position: absolute;
  opacity: 0.08;
  pointer-events: none;
}

.pwa-banner-deco-1 {
  left: -20px;
  top: -30px;
  font-size: 130px;
}

.pwa-banner-deco-2 {
  right: 10%;
  bottom: -20px;
  font-size: 90px;
}

.pwa-banner-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  text-align: left;
  position: relative;
  z-index: 1;
}

.pwa-banner-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 20px;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: 0 12px 30px rgba(249, 120, 163, 0.35);
}

.pwa-banner-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.4rem;
}

.pwa-banner-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
}

.btn-pwa-install {
  background: #fff;
  color: var(--dark);
  font-family: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.95rem 2rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  will-change: transform;
}

.btn-pwa-install:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
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
  transform: translateY(-50%);
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
  left: 0;
}

.timeline-bignum-right {
  right: 0;
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

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ — BALÕES DE CONVERSA
   ═══════════════════════════════════════════════════════════════════════════ */
.faq-v2 {
  padding: 6rem 0 9rem;
  position: relative;
}

.faq-v2 .container {
  max-width: 1320px;
}

.faq-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 55%);
}

.faq-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 5rem;
  align-items: center;
}

.faq-intro {
  text-align: left;
  max-width: 420px;
}

.faq-intro .section-title {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  margin-bottom: 1rem;
}

.faq-intro .section-description {
  font-size: 1.35rem;
  margin-bottom: 2.25rem;
}

.faq-intro-card {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px 22px 22px 22px;
  padding: 1.1rem 1.3rem;
  box-shadow: 0 14px 32px rgba(249, 120, 163, 0.14);
}

.faq-intro-avatar {
  animation: faq-avatar-bounce 3.2s ease-in-out infinite;
}

@keyframes faq-avatar-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.faq-intro-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #4a4a58;
  margin: 0;
}

.faq-intro-text strong {
  color: #1e293b;
}

.faq-chat-list {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.faq-chat-question-row {
  display: flex;
  justify-content: flex-end;
}

.faq-chat-bubble-q {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  border: none;
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 1rem 1.5rem;
  border-radius: 22px 22px 4px 22px;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(255, 95, 143, 0.28);
  max-width: 100%;
  text-align: left;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.faq-chat-bubble-q:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(255, 95, 143, 0.38);
}

.faq-chat-icon {
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.faq-chat-icon.rotated {
  transform: rotate(180deg);
}

.faq-chat-answer-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.faq-chat-avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(249, 120, 163, 0.3);
}

.faq-chat-bubble-a {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #4a4a58;
  font-size: 1.05rem;
  line-height: 1.65;
  padding: 1rem 1.35rem;
  border-radius: 4px 22px 22px 22px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  max-width: 100%;
}

.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 220px;
  overflow: hidden;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
.footer-v2 {
  padding: 5rem 0 2rem;
  background: linear-gradient(160deg, var(--dark), #100f1a);
  position: relative;
  isolation: isolate;
}

.footer-grid-v2 {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 3rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
}

.footer-brand-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.7;
  max-width: 300px;
  margin: 0 0 1.4rem;
}

.footer-social {
  display: flex;
  gap: 0.75rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.social-link:hover {
  background: var(--gradient);
  transform: translateY(-4px) rotate(10deg);
  box-shadow: 0 8px 20px rgba(255, 201, 71, 0.3);
}

.footer-col-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 1.25rem;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.footer-link-btn,
.footer-link-a {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.92rem;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  text-align: left;
  transition: color 0.25s ease;
}

.footer-link-btn:hover,
.footer-link-a:hover {
  color: var(--primary);
}

.footer-bottom-v2 {
  max-width: 1320px;
  margin: 3.5rem auto 0;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.4);
}

.footer-legal-links {
  display: flex;
  gap: 1.6rem;
}

.footer-legal-links .footer-link-btn {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.82rem;
}

.footer-legal-links .footer-link-btn:hover {
  color: var(--primary);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAIS
   ═══════════════════════════════════════════════════════════════════════════ */
.terms-modal-overlay,
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

.terms-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.terms-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #FFF8FA 0%, #FFFDFE 100%);
}

.terms-modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.terms-modal-close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.terms-modal-close:hover {
  background: rgba(249, 120, 163, 0.15);
  color: #F978A3;
  transform: rotate(90deg);
}

.terms-modal-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.terms-pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: none;
}

.terms-modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #FAFAFA;
  justify-content: flex-end;
}

.terms-close-btn {
  padding: 0.85rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(0, 0, 0, 0.1);
  background: white;
  color: #666;
}

.terms-close-btn:hover {
  border-color: #F978A3;
  color: #F978A3;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(249, 120, 163, 0.2);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .terms-modal,
.modal-fade-leave-active .terms-modal,
.modal-fade-enter-active .ios-modal,
.modal-fade-leave-active .ios-modal {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .terms-modal,
.modal-fade-leave-to .terms-modal,
.modal-fade-enter-from .ios-modal,
.modal-fade-leave-to .ios-modal {
  transform: scale(0.9) translateY(30px);
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVO
   ═══════════════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .discover-grid,
  .showcase-grid,
  .faq-grid {
    grid-template-columns: 1fr;
  }

  .faq-intro {
    max-width: 100%;
    text-align: center;
  }

  .faq-intro-card {
    max-width: 480px;
    margin: 0 auto;
  }

  .discover-cards {
    min-height: 460px;
    max-width: 460px;
    margin: 0 auto;
  }

  .features-grid-v2 {
    grid-template-columns: 1fr;
  }

  .feature-main {
    min-height: 280px;
  }

  .footer-grid-v2 {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }

  .pwa-banner {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .btn-pwa-install {
    align-self: stretch;
    justify-content: center;
  }

  .showcase-phone-wrap {
    perspective: 1300px;
    padding: 2.5rem 0 3.5rem;
  }

  .badge-confirmed {
    right: 4%;
  }
}

@media (max-width: 768px) {
  .nav-menu,
  .auth-buttons {
    display: none;
  }

  .btn-install-mobile,
  .mobile-menu-btn {
    display: inline-flex;
  }

  .hero {
    padding: 8rem 0 3rem;
  }

  .discover {
    padding: 2rem 0 5rem;
  }

  .discover-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .discover-content {
    text-align: center;
  }

  .discover-text {
    margin-left: auto;
    margin-right: auto;
  }

  .discover-actions {
    justify-content: center;
  }

  .discover-live-card {
    margin: 0 auto;
  }

  /* No mobile a colagem rotacionada não cabe — vira uma lista empilhada normal */
  .discover-cards {
    position: static;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-height: auto;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    perspective: none;
  }

  .discover-event-card,
  .discover-event-card-1,
  .discover-event-card-2,
  .discover-event-card-3 {
    position: static;
    width: 100%;
    top: auto;
    bottom: auto;
    left: auto;
    right: auto;
    transform: none;
  }

  .features-v2,
  .app-showcase-v2,
  .how-it-works-v2,
  .faq-v2 {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }

  .showcase-tab-desc {
    padding-left: 0;
  }

  .showcase-phone-3d-body {
    width: 240px;
    height: 480px;
  }

  .face-right,
  .face-left {
    height: 392px;
    top: 44px;
    left: 112px;
  }

  .face-right {
    transform: rotateY(90deg) translateZ(120px);
  }

  .face-left {
    transform: rotateY(-90deg) translateZ(120px);
  }

  .face-top,
  .face-bottom {
    width: 152px;
    top: 232px;
    left: 44px;
  }

  .face-top {
    transform: rotateX(90deg) translateZ(240px);
  }

  .face-bottom {
    transform: rotateX(-90deg) translateZ(240px);
  }

  .badge-confirmed {
    display: none;
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

  .faq-chat-bubble-q,
  .faq-chat-bubble-a {
    max-width: 100%;
  }

  .footer-grid-v2 {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

@media (max-width: 480px) {
  .hero-wordmark {
    font-size: 3rem;
  }

  .showcase-phone-wrap {
    perspective: 900px;
    padding: 1.5rem 0 2.5rem;
  }

  .showcase-phone-3d-shadow {
    height: 46px;
    filter: blur(16px);
  }

  .section-title {
    font-size: 1.65rem;
  }

  .section-description {
    font-size: 0.95rem;
  }

  .pwa-banner-info {
    flex-direction: column;
    text-align: center;
  }

  .footer-bottom-v2 {
    flex-direction: column;
    text-align: center;
  }
}
</style>
