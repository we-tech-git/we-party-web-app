<script setup lang="ts">
  import type { FeedItem } from '@/stores/events'
  import { useWindowSize } from '@vueuse/core'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'

  import { useRoute, useRouter } from 'vue-router'

  import { isRequestCanceled, unwrapItem, unwrapList } from '@/api'
  import {
    getAllEvents,
    getAllPublicEvents,
    getEventRecomendations,
    getEventsToday,
    getFavoriteEvents,
    getPublicEventRecomendations,
    getPublicEventsToday,
    getPublicTrendingEvents,
    getTrendingEvents,
    searchByEvents,
    searchPublicEvents,
  } from '@/api/event'
  import { getUserInterests, getUserProfile } from '@/api/users'

  import EventSearchAutocomplete from '@/components/modules/Feed/EventSearchAutocomplete.vue'
  import FeedTrendsPanel from '@/components/modules/Feed/FeedTrendsPanel.vue'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useGeolocation } from '@/composables/useGeolocation'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { useLoading } from '@/composables/useLoading'
  import { useEventsStore } from '@/stores/events'
  import { logger } from '@/utils/logger'
  import FeedCard from './FeedCard.vue'
  import FeedSidebarNav from './FeedSidebarNav.vue'
  import FeedTopHeader from './FeedTopHeader.vue'

  // Props do componente
  const props = defineProps<{
    guestMode?: boolean
  }>()

  interface NavItem {
    id: string
    label: string
    icon: 'home' | 'top' | 'bookmark' | 'bell' | 'profile'
  }

  interface TabItem {
    id: string
    label: string
  }

  interface TrendItem {
    id: number
    title: string
    highlight: string
    baseCount: number
  }

  const { t } = useI18n()
  const eventsStore = useEventsStore()
  const router = useRouter()
  const route = useRoute()
  const { loggedUser, userDisplayName } = useAuth()
  const { requireLogin } = useGuestMode()
  const { getCoords } = useGeolocation()

  // Valores aceitos para o query param `tab`; qualquer outro valor é uma URL inválida
  const VALID_TABS = new Set(['top-events', 'favorites'])

  function isValidTab (tab: string | undefined): boolean {
    return tab === undefined || VALID_TABS.has(tab)
  }

  // Redireciona para o catch-all de 404, igual ao que já acontece em rotas inválidas (home/perfil)
  function redirectToNotFound () {
    router.replace({ path: '/pagina-nao-encontrada', query: {} })
  }

  if (!isValidTab(route.query.tab as string | undefined)) {
    redirectToNotFound()
  }

  // Coordenadas do usuário enviadas ao backend nas recomendações (headers x-user-latitude/longitude)
  const userCoords = ref<{ lat: number, lng: number } | null>(null)

  // Dados adicionais do usuário para o header
  const userBio = ref('')
  const userStats = ref({ followers: 0, following: 0 })

  // Mobile trending drawer
  const showTrendingMobile = ref(false)
  // useWindowSize do VueUse atualiza reativamente sem addEventListener manual
  const { width: windowWidth } = useWindowSize()
  const isMobile = computed(() => windowWidth.value <= 960)

  const activeNav = ref((route.query.tab as string) || 'home')
  // Inicia sempre com 'for-you'
  const activeTab = ref('for-you')
  const searchQuery = ref('')
  const isSearching = ref(false)

  const rawEventDates = ref<Record<string, Date>>({})

  const navItems = computed<NavItem[]>(() => [
    { id: 'home', label: t('feed.nav.home'), icon: 'home' },
    { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
    { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
    { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
  ])

  // IDs de navegação que requerem autenticação
  const protectedNavIds = new Set(['favorites', 'profile'])

  /**
   * Gerencia seleção de navegação com verificação de modo guest
   */
  function handleNavSelect (navId: string) {
    if (props.guestMode && protectedNavIds.has(navId)) {
      const actionName = navId === 'favorites' ? 'ver seus favoritos' : 'acessar seu perfil'
      requireLogin(actionName)
      return
    }
    activeNav.value = navId

    // Atualiza a URL para manter o estado após reload
    router.replace({
      query: navId === 'home' ? {} : { tab: navId },
    })
  }

  const tabs = computed<TabItem[]>(() => {
    // Na página de top eventos e favoritos, não mostrar abas
    if (activeNav.value === 'top-events' || activeNav.value === 'favorites') {
      return []
    }

    // Na home (guest ou autenticado), mostrar apenas "Para Você" e "Hoje"
    return [
      { id: 'for-you', label: t('feed.tabs.forYou') },
      { id: 'today', label: t('feed.tabs.today') },
    ]
  })

  const items = ref<FeedItem[]>([])
  // null = sem busca ativa; array = resultados da pesquisa em vigor
  const searchResults = ref<FeedItem[] | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const page = ref(1)
  const limit = 10
  const hasMore = ref(true)
  const userInterests = ref<string[]>([])

  function getFirstValidString (...values: unknown[]): string {
    for (const val of values) {
      if (val && typeof val === 'string' && val.trim() !== '') {
        return val
      }
    }
    return ''
  }

  /**
   * Busca os interesses do usuário autenticado
   */
  async function fetchUserInterests () {
    if (props.guestMode) return

    try {
      const response = await getUserInterests()

      // Extrai os nomes dos interesses e normaliza para comparação
      // (unwrapList aceita todos os envelopes conhecidos da API)
      const interests = unwrapList(response, 'interests')
        .map((item: any) => (item.interest?.name || item.name || '').toLowerCase())
        .filter(Boolean)

      userInterests.value = interests
      logger.log('📋 Interesses do usuário carregados:', interests)
    } catch (error) {
      logger.error('Erro ao buscar interesses do usuário:', error)
      userInterests.value = []
    }
  }

  /**
   * Busca dados completos do perfil do usuário para exibir no header
   */
  async function fetchUserProfileData () {
    if (props.guestMode || !loggedUser.value?.id) return

    try {
      const response = await getUserProfile(loggedUser.value.id)
      const userData = unwrapItem(response) ?? {}

      userBio.value = userData.bio || ''
      userStats.value = {
        followers: userData.followersCount || userData.stats?.followers || 0,
        following: userData.followingCount || userData.stats?.following || 0,
      }
    } catch (error) {
      logger.error('Erro ao buscar dados do perfil:', error)
    }
  }

  /**
   * Calcula o número de interesses em comum entre evento e usuário
   */
  function calculateInterestMatch (eventInterests: string[]): number {
    if (userInterests.value.length === 0 || eventInterests.length === 0) return 0

    const normalizedEventInterests = new Set(eventInterests.map(i => i.toLowerCase()))

    return userInterests.value.filter(userInterest =>
      normalizedEventInterests.has(userInterest),
    ).length
  }

  /**
   * Ordena eventos priorizando aqueles com mais interesses em comum
   */
  function sortEventsByInterestMatch (events: FeedItem[]): FeedItem[] {
    if (userInterests.value.length === 0) return events

    return events.toSorted((a, b) => {
      const matchA = calculateInterestMatch(a.interests || [])
      const matchB = calculateInterestMatch(b.interests || [])

      // Eventos com mais matches primeiro
      if (matchB !== matchA) {
        return matchB - matchA
      }

      // Mantém ordem original para eventos com mesmo score
      return 0
    })
  }

  /**
   * Extrai a melhor imagem disponível do objeto images da API
   * Prioriza: original > large > medium > small > thumbnail
   */
  function extractBestImage (images: any): string {
    if (!images || typeof images !== 'object') return ''

    // Ordem de preferência para máxima qualidade no feed
    return images.original
      || images.large
      || images.medium
      || images.small
      || images.thumbnail
      || ''
  }

  /**
   * Extrai a melhor URL de foto do objeto photos
   * Suporta array de URLs, objetos com resoluções, e URLs simples
   */
  function extractPhotoUrl (photos: unknown): string {
    if (!photos) return ''

    // Se for array, procura pela melhor resolução
    if (Array.isArray(photos)) {
      if (photos.length === 0) return ''

      // Se o array contém objetos com resoluções, extrai a melhor
      if (typeof photos[0] === 'object' && photos[0] !== null) {
        const photo = photos[0] as any
        return photo.original || photo.large || photo.url || photo.src || String(photo)
      }

      // Se é array de strings, pega a primeira
      return photos[0] || ''
    }

    // Se for objeto, busca pelas propriedades de maior resolução
    if (typeof photos === 'object' && photos !== null) {
      const photoObj = photos as Record<string, any>

      // Tenta propriedades comuns de alta resolução primeiro
      const highQualityKeys = ['original', 'large', 'high', 'hd', '1920', '1080', 'full']
      for (const key of highQualityKeys) {
        if (photoObj[key]) return photoObj[key]
      }

      // Tenta propriedades de resolução média
      const mediumQualityKeys = ['medium', 'med', '720', '800']
      for (const key of mediumQualityKeys) {
        if (photoObj[key]) return photoObj[key]
      }

      // Fallback para primeira propriedade disponível
      const keys = Object.keys(photoObj)
      if (keys.length > 0) {
        const firstKey = keys[0]
        if (firstKey) return photoObj[firstKey] || ''
      }
    }

    return ''
  }

  function resolveLikesCount (event: any): number {
    if (typeof event.likesCount === 'number') return event.likesCount
    if (typeof event.likes === 'number') return event.likes
    if (Array.isArray(event.likes)) return event.likes.length
    if (typeof event._count?.likes === 'number') return event._count.likes
    if (typeof event.likes_count === 'number') return event.likes_count
    if (typeof event.totalLikes === 'number') return event.totalLikes
    if (typeof event.likeCount === 'number') return event.likeCount
    if (typeof event.confirmedCount === 'number') return event.confirmedCount
    if (typeof event._count?.attendances === 'number') return event._count.attendances
    return 0
  }

  function resolveSchedule (event: any): string {
    const candidates = [
      event.date,
      event.startDate,
      event.dateTime,
      event.startAt,
      event.eventDate,
      event.start_date,
      event.schedule,
    ]
    for (const val of candidates) {
      if (!val) continue
      const parsed = new Date(val)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      }
    }
    return 'Data a definir'
  }

  function mapEventToFeedItem (event: any): FeedItem {
    // Capture raw date for client-side date filtering
    const rawDateVal = event.date || event.startDate || event.dateTime || event.startAt || event.eventDate || event.start_date
    if (rawDateVal) {
      const parsedRaw = new Date(rawDateVal)
      if (!Number.isNaN(parsedRaw.getTime())) {
        rawEventDates.value[String(event.id)] = parsedRaw
      }
    }

    // Extrai a melhor imagem disponível com múltiplos fallbacks
    const bestImageFromImages = extractBestImage(event.images)
    const bestPhotoUrl = extractPhotoUrl(event.photos)

    const rawBanner = bestImageFromImages || bestPhotoUrl || getFirstValidString(
      event.bannerUrl,
      event.banner,
      event.image,
      event.imageUrl,
      event.cover,
      event.thumbnail,
    )

    const calculatedHostName = event.organizer?.name || event.hostName || event.creator?.name || 'Organizador'

    const likesCount = resolveLikesCount(event)

    // Extrai interesses do evento
    const eventInterests = (event.eventInterests || event.interests || event.categories || event.tags || [])
      .map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name)
      .filter(Boolean)

    // Calcula quais interesses do evento correspondem aos do usuário
    const matchedInterests = eventInterests.filter((interest: string) =>
      userInterests.value.includes(interest.toLowerCase()),
    )

    return {
      id: event.id,
      banner: rawBanner,
      creator: { name: calculatedHostName },
      hostAvatar: event.organizer?.avatar || event.hostAvatar || event.creator?.profileImage || '',
      schedule: resolveSchedule(event),
      location: event.location || event.address || event.place || 'Local a definir',
      title: event.name || event.title || 'Untitled Event',
      description: event.description || '',
      confirmed: event.confirmedCount || event._count?.attendances || 0,
      interested: event.interestedCount || 0,
      likes: likesCount,
      interests: eventInterests,
      matchedInterests,
      commentsCount: event.commentsCount ?? event._count?.comments ?? 0,
      sourceUrl: event.sourceUrl || event.source_url || event.externalUrl || event.external_url || undefined,
      images: event.images || undefined,
    }
  }

  /**
   * Retorna a função de fetch correta com base no modo (guest/autenticado)
   * e na aba/seção ativa. Elimina a IIFE que existia dentro de fetchEvents.
   */
  function selectFetchFn () {
    if (props.guestMode) {
      if (activeNav.value === 'top-events') {
        logger.info('→ Calling: getPublicTrendingEvents')
        return getPublicTrendingEvents
      }
      if (activeTab.value === 'today') {
        logger.info('→ Calling: getPublicEventsToday')
        return getPublicEventsToday
      }
      if (activeTab.value === 'all-events') {
        logger.info('→ Calling: getAllPublicEvents')
        return getAllPublicEvents
      }
      logger.info('→ Calling: getPublicEventRecomendations (with geo)')
      return (page: number, limit: number) =>
        getPublicEventRecomendations(page, limit, userCoords.value?.lat, userCoords.value?.lng)
    }

    if (activeNav.value === 'top-events') {
      logger.info('→ Calling: getTrendingEvents (authenticated)')
      return getTrendingEvents
    }
    if (activeTab.value === 'today') {
      logger.info('→ Calling: getEventsToday (authenticated)')
      return getEventsToday
    }
    if (activeTab.value === 'all-events') {
      logger.info('→ Calling: getAllEvents (authenticated)')
      return getAllEvents
    }
    logger.info('→ Calling: getEventRecomendations (authenticated, with geo)')
    return (page: number, limit: number) =>
      getEventRecomendations(page, limit, userCoords.value?.lat, userCoords.value?.lng)
  }

  async function fetchEvents (isLoadMore = false) {
    if (isLoadMore) {
      loadingMore.value = true
      page.value = page.value + 1
    } else {
      loading.value = true
      page.value = 1
      items.value = []
      hasMore.value = true
    }

    try {
      logger.info('📡 Fetching events...', {
        guestMode: props.guestMode,
        activeNav: activeNav.value,
        activeTab: activeTab.value,
        page: page.value,
      })

      const response = await selectFetchFn()(page.value, limit)

      logger.info('✅ API Response received:', {
        status: response.status,
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      })

      // Extrai eventos da resposta (unwrapList aceita os envelopes conhecidos
      // e garante que o retorno seja sempre um array)
      let events = unwrapList<any>(response, 'events', 'content')

      logger.info('📊 Events extracted from API:', {
        total: events.length,
        firstEventTitle: events[0]?.title || 'N/A',
        uniqueTitles: new Set(events.map((e: any) => e.title)).size,
      })

      // Remove duplicatas baseado em propriedades únicas do evento
      // (não apenas ID, pois eventos iguais podem ter IDs diferentes)
      if (events.length > 0) {
        const originalLength = events.length

        // Cria uma chave única baseada nas propriedades que definem um evento
        const createEventKey = (event: any) => {
          const title = (event.title || '').trim().toLowerCase()
          const date = event.startDate || ''
          const location = (event.location || '').trim().toLowerCase()
          return `${title}|${date}|${location}`
        }

        // Remove duplicatas mantendo apenas a primeira ocorrência
        const seen = new Set<string>()
        events = events.filter((event: any) => {
          const key = createEventKey(event)
          if (seen.has(key)) {
            return false
          }
          seen.add(key)
          return true
        })

        if (events.length !== originalLength) {
          logger.warn('⚠️ Eventos duplicados removidos!', {
            total: originalLength,
            únicos: events.length,
            removidos: originalLength - events.length,
          })
        }
      }

      // Filtra eventos encerrados (com data no passado)
      const now = new Date()
      // Aba "Acontecendo esse mês": limita estritamente ao mês atual.
      // (Não se aplica em "top-events", que retorna trending independente da aba.)
      const monthOnly = activeTab.value === 'today' && activeNav.value !== 'top-events'
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const beforeFilterCount = events.length
      events = events.filter((event: any) => {
        const rawDate = event.date || event.startDate || event.dateTime || event.startAt || event.eventDate || event.start_date
        if (!rawDate) return true // Mantém eventos sem data definida
        const eventDate = new Date(rawDate)
        if (Number.isNaN(eventDate.getTime())) return true // Mantém se data inválida
        if (monthOnly) {
          // Mantém apenas eventos ainda por acontecer dentro do mês atual
          return eventDate >= now && eventDate < monthEnd
        }
        return eventDate >= now // Remove eventos passados
      })

      if (events.length !== beforeFilterCount) {
        logger.info('📅 Eventos encerrados removidos do feed:', {
          total: beforeFilterCount,
          ativos: events.length,
          removidos: beforeFilterCount - events.length,
        })
      }

      logger.info('🎯 Final events after deduplication:', {
        count: events.length,
        titles: events.map((e: any) => e.title).slice(0, 5),
      })

      // Fallback: Se modo autenticado retornou poucos eventos únicos, complementa com públicos.
      // Não aplica na aba "Acontecendo esse mês", pois as recomendações não respeitam o mês.
      const MIN_EVENTS = 5
      if (!props.guestMode && !monthOnly && events.length < MIN_EVENTS && !isLoadMore) {
        logger.warn('⚠️ Poucos eventos únicos retornados, buscando eventos públicos para complementar...')

        try {
          // Busca eventos públicos para complementar
          const publicResponse = await getPublicEventRecomendations(page.value, limit, userCoords.value?.lat, userCoords.value?.lng)
          const publicEvents = unwrapList<any>(publicResponse, 'events', 'content')

          if (Array.isArray(publicEvents) && publicEvents.length > 0) {
            // Cria Set com chaves dos eventos já existentes
            const existingKeys = new Set(
              events.map((e: any) => {
                const title = (e.title || '').trim().toLowerCase()
                const date = e.startDate || ''
                const location = (e.location || '').trim().toLowerCase()
                return `${title}|${date}|${location}`
              }),
            )

            // Filtra eventos públicos que não estão duplicados e não estão encerrados
            const newPublicEvents = publicEvents.filter((event: any) => {
              const title = (event.title || '').trim().toLowerCase()
              const date = event.startDate || ''
              const location = (event.location || '').trim().toLowerCase()
              const key = `${title}|${date}|${location}`

              // Verifica se está duplicado
              if (existingKeys.has(key)) return false

              // Verifica se está encerrado
              const rawDate = event.date || event.startDate || event.dateTime || event.startAt || event.eventDate || event.start_date
              if (rawDate) {
                const eventDate = new Date(rawDate)
                if (!Number.isNaN(eventDate.getTime()) && eventDate < now) {
                  return false // Remove eventos passados
                }
              }

              return true
            })

            // Adiciona eventos públicos ao final (priorizando personalizados no topo)
            events = [...events, ...newPublicEvents]

            logger.info('✅ Eventos públicos adicionados:', {
              personalizados: events.length - newPublicEvents.length,
              públicos: newPublicEvents.length,
              total: events.length,
            })
          }
        } catch (error) {
          logger.error('Erro ao buscar eventos públicos de fallback:', error)
        }
      }

      const mappedEvents = events.map((event: any) => mapEventToFeedItem(event))

      // Ordena por interesses matching (eventos com interesses em comum primeiro)
      const sortedEvents = sortEventsByInterestMatch(mappedEvents)

      hasMore.value = sortedEvents.length >= limit

      items.value = isLoadMore ? [...items.value, ...sortedEvents] : sortedEvents

      if (isLoadMore && mappedEvents.length === 0) {
        // Reverte o incremento de página se não trouxe resultados
        page.value = page.value - 1
      }
    } catch (error) {
      logger.error('Failed to fetch events', error)
      if (!isLoadMore) {
        items.value = []
      }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  onMounted(async () => {
    // Redirecionamento para 404 já disparado (tab inválido) — evita disparar fetches à toa
    if (!isValidTab(route.query.tab as string | undefined)) return

    // Busca os interesses do usuário primeiro (se autenticado)
    if (!props.guestMode) {
      await Promise.all([
        fetchUserInterests(),
        fetchUserProfileData(),
      ])
    }

    // Captura a localização uma vez por sessão antes de buscar eventos
    userCoords.value = await getCoords()

    // Em modo guest, não tenta carregar favoritos
    if (props.guestMode) {
      fetchEvents()
    } else if (activeNav.value === 'favorites') {
      fetchFavoriteEvents()
    } else {
      fetchEvents()
    }
    fetchTrends()
  })

  const { startLoading, stopLoading, isLoading: checkLoading } = useLoading()

  const trends = ref<TrendItem[]>([])

  // Tempo mínimo (ms) que o skeleton dos trends fica visível, para o loader
  // aparecer mesmo quando a resposta vem rápida (ou do cache HTTP).
  const MIN_TRENDS_SKELETON_MS = 500

  async function fetchTrends () {
    startLoading('feed:trends')
    const trendsStartedAt = Date.now()
    try {
      const response = props.guestMode
        ? await getPublicTrendingEvents()
        : await getTrendingEvents()
      const data = unwrapList<any>(response, 'events')

      trends.value = data.map((evt: any) => ({
        id: evt.id,
        title: evt.name || evt.title || 'Evento sem nome',
        highlight: evt.location || evt.city || t('feed.trending.cityHighlight'),
        baseCount: evt.likesCount || evt.likes || evt._count?.likes || evt.confirmedCount || 0,
      }))
    } catch (error) {
      logger.error('Error fetching trends', error)
    } finally {
      const elapsed = Date.now() - trendsStartedAt
      setTimeout(() => stopLoading('feed:trends'), Math.max(0, MIN_TRENDS_SKELETON_MS - elapsed))
    }
  }

  const displayedTrends = computed(() => {
    return trends.value.map(item => {
      const isLiked = eventsStore.isLiked(item.id)
      const total = item.baseCount + (isLiked ? 1 : 0)
      return {
        id: item.id,
        title: item.title,
        highlight: item.highlight,
        engagement: `${total} curtidas`,
        rawCount: total,
      }
    // eslint-disable-next-line unicorn/no-array-sort
    }).slice().sort((a: any, b: any) => b.rawCount - a.rawCount)
  })

  const user = computed(() => ({
    name: userDisplayName.value,
    avatar: loggedUser.value?.profileImage || '',
    username: loggedUser.value?.username ? `@${loggedUser.value.username}` : '',
    bio: userBio.value || '',
    stats: {
      followers: userStats.value.followers,
      following: userStats.value.following,
    },
  }))

  // Filter panel state
  const filterOpen = ref(false)
  const showCategorySearch = ref(false)
  const categorySearchQuery = ref('')
  const searchingCategories = ref(false)
  const loadingCategories = ref(false)
  const allInterestsCache = ref<Array<{ id: string, label: string }>>([])
  const activeCategories = ref<string[]>([])
  const activeDateFilter = ref<string>('')

  // Date filter chips
  const DATE_CHIPS = [
    { id: 'today', label: 'Hoje' },
    { id: 'tomorrow', label: 'Amanhã' },
    { id: 'this-week', label: 'Esta Semana' },
    { id: 'this-weekend', label: 'Fim de Semana' },
    { id: 'next-week', label: 'Próxima Semana' },
  ]

  // Computed: user interest chips
  const userInterestChips = computed(() => {
    return userInterests.value.map((name, idx) => ({
      id: `user-${idx}`,
      label: name.charAt(0).toUpperCase() + name.slice(1),
    }))
  })

  // Computed: active category labels
  const activeCategoryLabels = computed(() => {
    return activeCategories.value.map(id => {
      const found = allInterestsCache.value.find(cat => cat.id === id)
      return found || { id, label: id }
    })
  })

  // Computed: displayed categories (filtered by search)
  const displayedCategories = computed(() => {
    if (!categorySearchQuery.value.trim()) {
      return showCategorySearch.value ? allInterestsCache.value : userInterestChips.value
    }

    const query = categorySearchQuery.value.toLowerCase()
    return allInterestsCache.value.filter(cat =>
      cat.label.toLowerCase().includes(query),
    )
  })

  // Computed: search results count
  const searchResultsCount = computed(() => displayedCategories.value.length)

  // Computed: has active filters
  const hasActiveFilters = computed(() => {
    return activeCategories.value.length > 0 || activeDateFilter.value !== ''
  })

  // Toggle explore mode
  function toggleExploreMode () {
    showCategorySearch.value = !showCategorySearch.value
    categorySearchQuery.value = ''
  }

  // Toggle category filter
  function toggleCategory (categoryId: string) {
    const idx = activeCategories.value.indexOf(categoryId)
    if (idx === -1) {
      activeCategories.value.push(categoryId)
    } else {
      activeCategories.value.splice(idx, 1)
    }
  }

  // Toggle date filter
  function toggleDateFilter (dateId: string) {
    activeDateFilter.value = activeDateFilter.value === dateId ? '' : dateId
  }

  // Clear all filters
  function clearFilters () {
    activeCategories.value = []
    activeDateFilter.value = ''
    categorySearchQuery.value = ''
  }

  function selectTab (id: string) {
    if (activeTab.value === id) return

    if (props.guestMode && id === 'today') {
      requireLogin('ver acontecendo esse mês')
      return
    }

    activeTab.value = id
  }

  function handleBackNavigation () {
    if (activeNav.value === 'favorites') {
      activeNav.value = 'top-events'
      router.replace({ query: { tab: 'top-events' } })
    } else if (activeNav.value === 'top-events') {
      activeNav.value = 'home'
      router.replace({ query: {} })
    } else {
      activeNav.value = 'home'
      router.replace({ query: {} })
    }
  }

  const feedMainRef = ref<HTMLElement | null>(null)

  function scrollToTop () {
    if (feedMainRef.value) {
      feedMainRef.value.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Cancela a busca anterior quando uma nova é disparada (evita respostas fora de ordem)
  let searchCtrl: AbortController | null = null

  async function requestSearchEvents (normalizedSearch: string, signal?: AbortSignal) {
    // Usa versão pública no modo guest
    const resp = props.guestMode
      ? await searchPublicEvents(normalizedSearch, 1, 20, signal)
      : await searchByEvents(normalizedSearch, 1, 20, signal)
    return unwrapList<any>(resp, 'events')
  }

  // Handler para o evento search do SearchInput (já com debounce)
  async function handleSearch (query: string) {
    const normalized = query.trim()

    if (!normalized) {
      searchCtrl?.abort()
      isSearching.value = false
      searchResults.value = null
      return
    }

    // Aborta a busca anterior antes de disparar a nova
    searchCtrl?.abort()
    searchCtrl = new AbortController()
    const { signal } = searchCtrl

    isSearching.value = true

    try {
      const events = await requestSearchEvents(normalized, signal)
      searchResults.value = (events || []).map((event: any) => mapEventToFeedItem(event))
      isSearching.value = false
    } catch (error) {
      // Requisição substituída por outra mais recente: mantém o loading do request atual
      if (isRequestCanceled(error)) return
      logger.error(error)
      searchResults.value = []
      isSearching.value = false
    }
  }

  // Handler para limpar a busca
  function handleClearSearch () {
    searchResults.value = null
    isSearching.value = false
  }

  // Mantém activeNav em sincronia quando o query param muda externamente
  // (back/forward do browser, navegação direta pela URL, links externos)
  watch(() => route.query.tab as string | undefined, newTab => {
    if (!isValidTab(newTab)) {
      redirectToNotFound()
      return
    }

    const navId = newTab || 'home'
    if (activeNav.value !== navId) {
      activeNav.value = navId
    }
  })

  watch(activeTab, () => {
    if (activeNav.value === 'favorites') return
    fetchEvents()
  })

  watch(activeNav, val => {
    if (val === 'profile') {
      router.push('/private/profile')
      return
    }

    // Reset active tab when switching nav sections
    if (val === 'home') {
      activeTab.value = 'for-you'
    } else if (val === 'top-events') {
      activeTab.value = 'for-you'
    }

    if (searchQuery.value) {
      searchQuery.value = ''
    }

    if (feedMainRef.value) {
      feedMainRef.value.scrollTo({ top: 0, behavior: 'instant' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    if (val === 'favorites') {
      fetchFavoriteEvents()
    } else {
      fetchEvents()
    }
    // Recarrega os trends ao trocar de seção para exibir o skeleton de loading
    fetchTrends()
  })

  /**
   * Busca eventos favoritos da API
   */
  async function fetchFavoriteEvents (isLoadMore = false) {
    try {
      if (isLoadMore) {
        loadingMore.value = true
        page.value = page.value + 1
      } else {
        loading.value = true
        page.value = 1
      }

      const response = await getFavoriteEvents(page.value, limit)

      // Extrai eventos da resposta (unwrapList aceita os envelopes conhecidos)
      const events = unwrapList<any>(response, 'events')

      hasMore.value = events.length >= limit

      const mappedEvents = events.map((evt: any) => mapEventToFeedItem(evt))

      // Ordena por interesses matching (eventos com interesses em comum primeiro)
      const sortedEvents = sortEventsByInterestMatch(mappedEvents)

      items.value = isLoadMore ? [...items.value, ...sortedEvents] : sortedEvents
    } catch (error) {
      logger.error('Erro ao buscar eventos favoritos:', error)
      if (!isLoadMore) {
        items.value = []
      }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  function getCategoryLabel (id: string): string {
    if (id.startsWith('user-')) {
      const idx = Number.parseInt(id.replace('user-', ''), 10)
      return userInterests.value[idx] ?? ''
    }
    return (allInterestsCache.value.find(cat => cat.id === id)?.label ?? '').toLowerCase()
  }

  function matchesDateFilter (item: FeedItem): boolean {
    const rawDate = rawEventDates.value[String(item.id)]
    if (!rawDate) return true

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDay = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate())

    switch (activeDateFilter.value) {
      case 'today': {
        return eventDay.getTime() === today.getTime()
      }
      case 'tomorrow': {
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        return eventDay.getTime() === tomorrow.getTime()
      }
      case 'this-week': {
        const endOfWeek = new Date(today)
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()))
        return rawDate >= today && rawDate <= endOfWeek
      }
      case 'this-weekend': {
        const daysUntilSat = (6 - today.getDay() + 7) % 7
        const saturday = new Date(today)
        saturday.setDate(today.getDate() + daysUntilSat)
        const sunday = new Date(saturday)
        sunday.setDate(saturday.getDate() + 1)
        return eventDay.getTime() === saturday.getTime() || eventDay.getTime() === sunday.getTime()
      }
      case 'next-week': {
        const daysUntilMon = (8 - today.getDay()) % 7 || 7
        const nextMonday = new Date(today)
        nextMonday.setDate(today.getDate() + daysUntilMon)
        const nextSunday = new Date(nextMonday)
        nextSunday.setDate(nextMonday.getDate() + 6)
        return rawDate >= nextMonday && rawDate <= nextSunday
      }
      default: {
        return true
      }
    }
  }

  const displayedItems = computed(() => {
    // searchResults !== null significa que uma busca está ativa — usa os resultados dela;
    // caso contrário usa os itens normais do feed como fonte de verdade.
    let result = searchResults.value ?? items.value

    if (activeCategories.value.length > 0) {
      result = result.filter((item: FeedItem) => {
        const eventInterests = new Set((item.interests ?? []).map((i: string) => i.toLowerCase()))
        return activeCategories.value.some(catId => {
          const label = getCategoryLabel(catId)
          return label !== '' && eventInterests.has(label)
        })
      })
    }

    if (activeDateFilter.value) {
      result = result.filter((item: FeedItem) => matchesDateFilter(item))
    }

    return result
  })

  /**
   * Gerencia o toggle de favorito com atualização da lista quando necessário
   */
  async function handleToggleSave (item: FeedItem) {
    const wasSaved = eventsStore.isSaved(item.id)

    // Chama o toggleSave do store
    await eventsStore.toggleSave(item)

    // Se estava na aba de favoritos e foi desfavoritado, remove imediatamente da lista
    if (activeNav.value === 'favorites' && wasSaved) {
      items.value = items.value.filter((e: FeedItem) => e.id !== item.id)
    }
  }

  /**
   * Remove evento da lista de favoritos com feedback visual imediato.
   * displayedItems atualiza automaticamente via computed.
   */
  async function handleRemoveFavorite (item: FeedItem) {
    items.value = items.value.filter((e: FeedItem) => e.id !== item.id)
    await eventsStore.toggleSave(item)
  }

</script>
<template>
  <div class="feed-page">
    <FeedTopHeader :guest-mode="props.guestMode" :user="user">
      <template #center-content>
        <section class="feed-controls">
          <div class="search-wrapper">
            <EventSearchAutocomplete
              v-model="searchQuery"
              :guest-mode="props.guestMode"
              :placeholder="t('feed.searchPlaceholder')"
              @clear="handleClearSearch"
              @search="handleSearch"
            />
          </div>

          <Transition name="filter-expand">
            <div v-if="filterOpen" class="filter-panel">
              <div class="filter-section">
                <div class="filter-section-header">
                  <span class="filter-section-label">Categoria</span>
                  <button
                    v-if="userInterestChips.length > 0"
                    class="explore-categories-btn"
                    type="button"
                    @click="toggleExploreMode"
                  >
                    {{ showCategorySearch ? '✨ Meus interesses' : '🔍 Explorar categorias' }}
                  </button>
                </div>

                <!-- Tags removíveis das categorias selecionadas -->
                <div v-if="activeCategoryLabels.length > 0" class="active-tags">
                  <button
                    v-for="cat in activeCategoryLabels"
                    :key="'tag-' + cat.id"
                    class="active-tag"
                    type="button"
                    @click="toggleCategory(cat.id)"
                  >
                    {{ cat.label }}
                    <span class="active-tag-x">×</span>
                  </button>
                </div>

                <div v-if="showCategorySearch" class="category-search-box">
                  <SearchInput
                    v-model="categorySearchQuery"
                    placeholder="Buscar categorias..."
                    size="small"
                  />
                </div>

                <!-- Contador de resultados -->
                <div
                  v-if="showCategorySearch && categorySearchQuery.trim() && !searchingCategories"
                  class="search-results-count"
                >
                  <span v-if="searchResultsCount > 0">{{ searchResultsCount }} categoria{{ searchResultsCount !== 1 ?
                    's' : '' }} encontrada{{ searchResultsCount !== 1 ? 's' : '' }}</span>
                  <span v-else class="no-results">Nenhum resultado</span>
                </div>

                <!-- Label "Populares" quando no modo explorar sem busca -->
                <span
                  v-if="showCategorySearch && !categorySearchQuery.trim() && allInterestsCache.length > 0"
                  class="filter-subsection-label"
                >
                  Populares
                </span>

                <div v-if="searchingCategories && categorySearchQuery.trim()" class="empty-categories">
                  <p>🔍 Buscando categorias...</p>
                </div>
                <div v-else-if="displayedCategories.length > 0" class="filter-chips">
                  <button
                    v-for="cat in displayedCategories"
                    :key="cat.id"
                    class="filter-chip"
                    :class="{ active: activeCategories.includes(cat.id) }"
                    type="button"
                    @click="toggleCategory(cat.id)"
                  >
                    {{ cat.label }}
                  </button>
                </div>
                <div
                  v-else-if="showCategorySearch && categorySearchQuery.trim() && !searchingCategories"
                  class="empty-categories"
                >
                  <p>Nenhuma categoria encontrada para "{{ categorySearchQuery }}"</p>
                  <p class="hint">Tente outros termos de busca</p>
                </div>
                <div
                  v-else-if="!loadingCategories && userInterestChips.length === 0 && !showCategorySearch"
                  class="empty-categories"
                >
                  <p>Você ainda não escolheu seus interesses.</p>
                  <p class="hint">Complete seu perfil para ver categorias personalizadas!</p>
                </div>
              </div>

              <div class="filter-section">
                <span class="filter-section-label">Quando</span>
                <div class="filter-chips">
                  <button
                    v-for="d in DATE_CHIPS"
                    :key="d.id"
                    class="filter-chip filter-chip--date"
                    :class="{ active: activeDateFilter === d.id }"
                    type="button"
                    @click="toggleDateFilter(d.id)"
                  >
                    {{ d.label }}
                  </button>
                </div>
              </div>

              <Transition name="fade">
                <div v-if="hasActiveFilters" class="filter-clear-row">
                  <span class="filter-results-hint">
                    {{ displayedItems.length }} evento{{ displayedItems.length !== 1 ? 's' : '' }} encontrado{{
                      displayedItems.length !== 1 ? 's' : '' }}
                  </span>
                  <button class="filter-clear-btn" type="button" @click="clearFilters">
                    <svg
                      fill="none"
                      height="12"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      viewBox="0 0 24 24"
                      width="12"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                    Limpar filtros
                  </button>
                </div>
              </Transition>
            </div>
          </Transition>
        </section>
      </template>
    </FeedTopHeader>

    <section class="feed-shell">
      <FeedSidebarNav
        :active="activeNav"
        class="feed-sidebar"
        :items="navItems"
        @select="handleNavSelect"
      />

      <main ref="feedMainRef" class="feed-main">
        <!-- Breadcrumb Navigation -->
        <div v-if="activeNav !== 'home'" class="breadcrumb-nav">
          <button class="breadcrumb-back" type="button" @click="handleBackNavigation">
            <span class="back-icon">
              <svg
                fill="none"
                height="16"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="back-text">Voltar</span>
          </button>
          <span class="breadcrumb-separator">
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="breadcrumb-current">
            {{ activeNav === 'top-events' ? t('feed.nav.topEvents') : activeNav === 'favorites' ?
              t('feed.nav.favorites') :
              '' }}
          </span>
        </div>

        <nav v-if="tabs.length > 0" aria-label="Seções do feed" class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="{ active: activeTab === tab.id }"
            type="button"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <WePartyLoader
          v-if="loading"
          :messages="[
            'Carregando seu feed...',
            'Buscando eventos pra você...',
            'Quase lá...',
          ]"
        />
        <section v-else-if="displayedItems.length > 0" class="cards-stack">
          <FeedCard
            v-for="(item, index) in displayedItems"
            :id="item.id"
            :key="item.id"
            :banner="item.banner"
            :comments-count="item.commentsCount"
            :confirmed="item.confirmed"
            :description="item.description"
            :event-data="item"
            :guest-mode="props.guestMode"
            :highlight="activeNav === 'top-events'"
            :host-avatar="item.hostAvatar"
            :host-name="item.creator.name"
            :interested="item.interested"
            :interests="item.interests"
            :is-saved="eventsStore.isSaved(item.id)"
            :liked="eventsStore.isLiked(item.id)"
            :likes="(item.likes || 0) + (eventsStore.isLiked(item.id) ? 1 : 0)"
            :location="item.location"
            :matched-interests="item.matchedInterests"
            :priority="index < 2"
            :rank="activeNav === 'top-events' ? index + 1 : undefined"
            :schedule="item.schedule"
            :show-remove-button="activeNav === 'favorites'"
            :source-url="item.sourceUrl"
            :title="item.title"
            @remove-favorite="handleRemoveFavorite(item)"
            @toggle-like="eventsStore.toggleLike(item.id)"
            @toggle-save="handleToggleSave(item)"
          />
        </section>

        <div v-if="!loading && hasMore && displayedItems.length > 0 && !isSearching && searchResults === null" class="load-more-container">
          <button
            class="load-more-btn"
            :disabled="loadingMore"
            type="button"
            @click="activeNav === 'favorites' ? fetchFavoriteEvents(true) : fetchEvents(true)"
          >
            <AppLoader v-if="loadingMore" size="sm" text="Carregando mais..." variant="text" />
            <span v-else>Carregar mais eventos</span>
          </button>
          <button class="scroll-to-top-btn" type="button" @click="scrollToTop">
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              viewBox="0 0 24 24"
              width="20"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Voltar ao topo
          </button>
        </div>

        <div v-else-if="!loading && !hasMore && displayedItems.length > 0 && !isSearching" class="end-of-results">
          <div aria-hidden="true" class="end-icon">✓</div>
          <p class="end-message">
            Você visualizou todos os eventos disponíveis.
          </p>
          <p class="end-hint">
            Novos eventos são adicionados diariamente.
          </p>
        </div>

        <p v-else-if="!loading && displayedItems.length === 0" class="empty">
          {{ t('feed.empty') }}
        </p>
      </main>

      <FeedTrendsPanel class="feed-trends" :items="displayedTrends" :loading="checkLoading('feed:trends')" :guest-mode="props.guestMode" />
    </section>

    <!-- Mobile Trending FAB Button -->
    <Transition name="fab-fade">
      <button
        v-if="isMobile && !showTrendingMobile && displayedTrends.length > 0"
        aria-label="Ver tendências"
        class="trending-fab"
        type="button"
        @click="showTrendingMobile = true"
      >
        <svg
          fill="none"
          height="22"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="22"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <span class="fab-badge">{{ displayedTrends.length }}</span>
      </button>
    </Transition>

    <!-- Mobile Trending Bottom Sheet -->
    <Transition name="bottom-sheet">
      <div
        v-if="showTrendingMobile"
        class="trending-overlay"
        @click.self="showTrendingMobile = false"
        @keydown.esc="showTrendingMobile = false"
      >
        <div
          aria-labelledby="trending-sheet-title"
          aria-modal="true"
          class="trending-sheet"
          role="dialog"
        >
          <div class="sheet-header">
            <div aria-hidden="true" class="sheet-handle" />
            <h3 id="trending-sheet-title" class="sheet-title">🔥 {{ t('feed.trending.title') }}</h3>
            <button aria-label="Fechar tendências" class="sheet-close" type="button" @click="showTrendingMobile = false">
              <svg
                fill="none"
                height="20"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                viewBox="0 0 24 24"
                width="20"
              >
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          </div>
          <div class="sheet-content">
            <ul class="trending-list-mobile">
              <li v-for="(item, index) in displayedTrends" :key="item.id">
                <button
                  class="trending-item-mobile"
                  type="button"
                  @click="router.push(`/private/event/${item.id}`); showTrendingMobile = false"
                >
                  <span aria-hidden="true" class="trend-rank">{{ index + 1 }}</span>
                  <div class="trend-info">
                    <span class="trend-highlight">{{ item.highlight }}</span>
                    <span class="trend-title">{{ item.title }}</span>
                    <span class="trend-engagement">{{ item.engagement }}</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.feed-page {
  height: 100vh;
  background: linear-gradient(142.35deg, rgba(252, 162, 89, 0.07) -1.66%, rgba(255, 98, 159, 0.11) 100.44%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.feed-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(180px, 250px) 1fr minmax(200px, 280px);
  grid-template-areas: 'sidebar main trends';
  column-gap: 1rem;
  row-gap: 0;
  width: min(100%, 1280px);
  margin: 0 auto;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  align-items: stretch;
  padding: 0 1rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.feed-sidebar {
  grid-area: sidebar;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 10;
}

.feed-sidebar::-webkit-scrollbar {
  display: none;
}

.feed-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: none;
  position: relative;
  z-index: 1;
  padding: 0 10px 3rem;
  background-color: #ff5fa70a;
}

.feed-main::-webkit-scrollbar {
  display: none;
}

.feed-trends {
  grid-area: trends;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 10;
}

.feed-trends::-webkit-scrollbar {
  display: none;
}

.feed-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 810px;
  margin: 0 auto;
  /* padding: 0.75rem 0.5rem 1rem; */
  /* background: linear-gradient(180deg, rgba(249, 249, 255, 0.92) 0%, rgba(255, 255, 255, 0.92) 100%); */
  /* backdrop-filter: blur(8px); */
  /* border-radius: 24px; */
}

@media (max-width: 768px) {
  .feed-controls {
    backdrop-filter: blur(4px);
    background: linear-gradient(180deg, rgba(249, 249, 255, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%);
  }
}

.search-wrapper {
  width: 100%;
}

/* Estilo personalizado para o SearchInput no Feed (tamanho large com sombra) */
.search-wrapper :deep(.search-input-container) {
  box-shadow: 0 20px 45px rgba(14, 23, 58, 0.12);
  border-radius: 20px;
}

.search-wrapper :deep(.search-input-field) {
  border-radius: 20px;
  background: #ffffff;
  border-color: transparent;
}

.search-wrapper :deep(.search-input-field:focus) {
  border-color: #ff5fa6;
}

.tabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding-left: 0;
  width: 100%;
}

.tabs button {
  position: relative;
  border: none;
  background: transparent;
  font-size: 1.05rem;
  font-weight: 600;
  color: #9aa0b8;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
}

.tabs button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.4rem;
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.2s ease;
}

.tabs button.active {
  color: #2d2f55;
}

.tabs button.active::after {
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
}

.tab-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 95, 166, 0.1);
  color: #ff5fa6;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: all 0.2s ease;
}

.tab-back-btn:hover {
  background: rgba(255, 95, 166, 0.2);
  transform: translateX(-2px);
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 250, 0.95) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.08);
  border: 1px solid rgba(255, 186, 75, 0.15);
  margin-bottom: 0.5rem;
}

.breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.15) 0%, rgba(255, 95, 166, 0.15) 100%);
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.breadcrumb-back:hover {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  transform: translateX(-3px);
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

.breadcrumb-back:active {
  transform: scale(0.97);
}

.back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.breadcrumb-back:hover .back-icon {
  background: rgba(255, 255, 255, 0.3);
}

.back-text {
  letter-spacing: 0.02em;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  color: #c4c9de;
}

.breadcrumb-current {
  font-weight: 700;
  font-size: 0.95rem;
  color: #2d2f55;
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1) 0%, rgba(255, 95, 166, 0.1) 100%);
  border-radius: 10px;
}

.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

/* Mobile: ajustar para evitar corte dos cards */
@media (max-width: 960px) {
  .cards-stack {
    width: 100%;
    max-width: 100%;
    overflow: visible;
  }
}

.empty {
  margin: 0;
  padding: 2.5rem;
  border-radius: 20px;
  background: #ffffff;
  color: #7a8199;
  box-shadow: inset 0 0 0 1px rgba(122, 129, 153, 0.15);
  text-align: center;
  font-weight: 600;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
}

.load-more-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 0;
  width: 100%;
}

.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.8rem 2.5rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.4);
}

.load-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.scroll-to-top-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.15), rgba(255, 95, 166, 0.15));
  color: #ff5fa6;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 2px rgba(255, 95, 166, 0.3);
}

.scroll-to-top-btn:hover {
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.4);
}

.scroll-to-top-btn svg {
  transition: transform 0.3s ease;
}

.scroll-to-top-btn:hover svg {
  transform: translateY(-2px);
}

.end-of-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.5rem;
  margin: 1rem 0;
  text-align: center;
  width: 100%;
}

.end-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.15), rgba(255, 95, 166, 0.15));
  color: #ff5fa6;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  border: 2px solid rgba(255, 95, 166, 0.2);
}

.end-message {
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  margin: 0 0 0.5rem 0;
}

.end-hint {
  font-size: 0.88rem;
  color: rgba(0, 0, 0, 0.45);
  margin: 0;
}

@media (max-width: 1240px) {
  .feed-shell {
    grid-template-columns: 220px 1fr;
    grid-template-areas: 'sidebar main';
    width: min(100%, 960px);
    padding: 0 2.25rem;
    margin: 0 auto;
    border-radius: 0;
  }

  .feed-trends {
    display: none;
  }
}

@media (max-width: 1100px) {
  .feed-shell {
    --feed-sticky-offset: 180px;
    grid-template-columns: 72px 1fr 200px;
    grid-template-areas: 'sidebar main trends';
  }

  .feed-trends {
    display: block;
    max-width: 200px;
    min-width: 0;
  }

  .feed-controls {
    background: transparent;
    backdrop-filter: none;
    padding: 0;
  }
}

@media (max-width: 960px) {
  .feed-page {
    height: auto;
    min-height: 100vh;
    overflow-y: visible;
  }

  .feed-shell {
    grid-template-columns: 1fr;
    grid-template-areas: 'main';
    width: 100%;
    padding: 1rem 1.25rem calc(6rem + env(safe-area-inset-bottom, 0px));
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    position: relative;
    transform: none;
    overflow: visible;
    flex: unset;
    min-height: auto;
  }

  .feed-sidebar {
    grid-area: unset !important;
    position: static !important;
    top: auto !important;
    max-height: none !important;
    overflow-y: visible !important;
    z-index: auto !important;
    align-self: auto !important;
  }

  .feed-main {
    z-index: 1;
    padding-bottom: 2rem;
    min-height: unset;
    overflow-y: visible;
    scrollbar-width: auto;
  }

  .feed-trends {
    display: none;
  }

  .feed-controls {
    position: static;
    top: auto;
    padding: 0;
    margin: 0;
    backdrop-filter: none;
    background: transparent;
    border-radius: 0;
    gap: 1rem;
    width: 100%;
    /* Ensure it takes full width */
  }

}

@media (max-width: 640px) {
  .feed-shell {
    padding: 0.5rem 0.5rem calc(6rem + env(safe-area-inset-bottom, 0px));
  }

  .cards-stack {
    padding: 0 0.25rem;
  }

  .feed-controls {
    gap: 0.5rem;
  }

  .tabs {
    overflow-x: auto;
    gap: 1rem;
    padding-bottom: 0.25rem;
    /* Space for scrollbar if needed */
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    /* Firefox */
  }

  .tabs button {
    font-size: 0.95rem;
    padding: 0.15rem 0;
  }

  .tabs::-webkit-scrollbar {
    display: none;
    /* Chrome/Safari */
  }

  .load-more-container {
    flex-direction: column;
    gap: 0.75rem;
  }

  .load-more-btn,
  .scroll-to-top-btn {
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }

  .breadcrumb-nav {
    padding: 0.6rem 1rem;
    border-radius: 14px;
    gap: 0.5rem;
  }

  .breadcrumb-back {
    padding: 0.4rem 0.85rem;
    font-size: 0.85rem;
    gap: 0.4rem;
  }

  .back-icon {
    width: 22px;
    height: 22px;
  }

  .back-icon svg {
    width: 14px;
    height: 14px;
  }

  .breadcrumb-current {
    font-size: 0.85rem;
    padding: 0.3rem 0.7rem;
  }

  .breadcrumb-separator svg {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 480px) {
  .breadcrumb-nav {
    padding: 0.5rem 0.85rem;
    border-radius: 12px;
    gap: 0.4rem;
  }

  .breadcrumb-back {
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
    border-radius: 10px;
  }

  .back-icon {
    width: 20px;
    height: 20px;
    border-radius: 6px;
  }

  .back-text {
    display: none;
  }

  .breadcrumb-current {
    font-size: 0.8rem;
    padding: 0.25rem 0.6rem;
    border-radius: 8px;
  }
}

/* ─── Filter ─── */
.tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.tabs-row .tabs {
  flex: 1;
  justify-content: flex-start;
}

.filter-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #5a6080;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-toggle-btn:hover {
  border-color: rgba(255, 95, 166, 0.4);
  color: #ff5fa6;
  box-shadow: 0 2px 12px rgba(255, 95, 166, 0.12);
}

.filter-toggle-btn.filter-active {
  border-color: #ff5fa6;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.08) 0%, rgba(255, 95, 166, 0.08) 100%);
  color: #ff5fa6;
}

.filter-toggle-btn.filter-open {
  border-color: #ff5fa6;
  color: #ff5fa6;
}

.filter-btn-label {
  letter-spacing: 0.01em;
}

.filter-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
}

.filter-chevron {
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.filter-chevron.rotated {
  transform: rotate(180deg);
}

/* Filter panel */
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 252, 0.98) 100%);
  border: 1px solid rgba(255, 95, 166, 0.14);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(255, 95, 166, 0.09), 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.filter-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.filter-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.38);
}

.explore-categories-btn {
  background: transparent;
  border: none;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #e91e63;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.explore-categories-btn:hover {
  background: rgba(233, 30, 99, 0.08);
  transform: translateY(-1px);
}

.explore-categories-btn:active {
  transform: translateY(0);
}

.active-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
  margin-bottom: 0.25rem;
}

.active-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.55rem;
  border: none;
  border-radius: 999px;
  font-size: 0.72rem;
  font-family: inherit;
  font-weight: 600;
  background: #e91e63;
  color: white;
  cursor: pointer;
  transition: background 0.15s ease;
}

.active-tag:hover {
  background: #c2185b;
}

.active-tag-x {
  font-size: 0.85rem;
  line-height: 1;
  opacity: 0.8;
}

.category-search-box {
  position: relative;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
}

.search-results-count {
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 0.25rem;
  padding-left: 0.1rem;
}

.search-results-count .no-results {
  color: #e91e63;
}

.filter-subsection-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
  margin-bottom: 0.1rem;
}

.search-loading {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }
}

.empty-categories {
  padding: 1.5rem 1rem;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1.5px dashed rgba(0, 0, 0, 0.1);
}

.empty-categories p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
}

.empty-categories .hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.4);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.32rem 0.85rem;
  border-radius: 999px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #4a5070;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.filter-chip:hover {
  border-color: rgba(255, 95, 166, 0.45);
  color: #ff5fa6;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(255, 95, 166, 0.15);
}

.filter-chip.active {
  border-color: transparent;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  box-shadow: 0 3px 12px rgba(255, 95, 166, 0.3);
  transform: translateY(-1px);
}

.filter-chip--date {
  padding: 0.32rem 0.95rem;
}

.filter-clear-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.filter-results-hint {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
}

.filter-clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid rgba(255, 95, 166, 0.3);
  background: rgba(255, 95, 166, 0.06);
  color: #ff5fa6;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-clear-btn:hover {
  background: rgba(255, 95, 166, 0.12);
  border-color: #ff5fa6;
}

/* Filter transitions */
.filter-expand-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.filter-expand-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px) scaleY(0.95);
  max-height: 0;
}

.filter-expand-enter-to,
.filter-expand-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1);
  max-height: 400px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .filter-btn-label {
    display: none;
  }

  .filter-toggle-btn {
    padding: 0.45rem 0.65rem;
    gap: 0.3rem;
  }

  .filter-chip {
    font-size: 0.75rem;
    padding: 0.28rem 0.7rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE TRENDING FAB & BOTTOM SHEET
   ═══════════════════════════════════════════════════════════════════════════ */

/* FAB Button - Positioned above bottom navigation */
.trending-fab {
  position: fixed;
  /* Posicionar bem acima da bottom navigation (que tem ~70px de altura) */
  bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
  right: 1rem;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(255, 95, 166, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Mobile: Elevar FAB mais acima para não sobrepor a bottom nav */
@media (max-width: 960px) {
  .trending-fab {
    bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
  }
}

.trending-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 32px rgba(255, 95, 166, 0.5),
    0 6px 16px rgba(0, 0, 0, 0.2);
}

.trending-fab:active {
  transform: scale(0.95);
}

.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  background: #fff;
  color: #ff5fa6;
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* FAB Transition */
.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

/* Bottom Sheet Overlay */
.trending-overlay {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Bottom Sheet */
.trending-sheet {
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  background: linear-gradient(180deg, #fff 0%, #fef9fa 100%);
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
}

.sheet-handle {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.15);
}

.sheet-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1c2e;
}

.sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sheet-close:hover {
  background: rgba(255, 95, 166, 0.1);
  color: #ff5fa6;
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}

/* Trending List Mobile */
.trending-list-mobile {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trending-item-mobile {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.trending-item-mobile:hover {
  background: rgba(255, 95, 166, 0.04);
  border-color: rgba(255, 95, 166, 0.15);
  transform: translateX(4px);
}

.trending-item-mobile:active {
  transform: scale(0.98);
}

.trend-rank {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.15) 0%, rgba(255, 95, 166, 0.15) 100%);
  color: #ff5fa6;
  font-weight: 800;
  font-size: 0.9rem;
}

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.trend-highlight {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #ff5fa6;
  font-weight: 600;
}

.trend-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1c2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trend-engagement {
  font-size: 0.78rem;
  color: #9aa0b8;
}

/* Bottom Sheet Transition */
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-sheet-enter-active .trending-sheet,
.bottom-sheet-leave-active .trending-sheet {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0);
}

.bottom-sheet-enter-from .trending-sheet,
.bottom-sheet-leave-to .trending-sheet {
  transform: translateY(100%);
}

/* Mobile: Garantir que não haja overflow horizontal */
@media (max-width: 960px) {
  .feed-page {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }
}
</style>
