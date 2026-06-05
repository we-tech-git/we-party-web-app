<script setup lang="ts">
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import { addEventComment, deleteEventComment, getEventComments, toggleLikeComment } from '@/api/comments'
  import { getEventById, getMyAttendance } from '@/api/event'
  import { useAuth } from '@/composables/useAuth'
  import { useEventsStore } from '@/stores/events'
  import { useShareStore } from '@/stores/share'

  const props = defineProps<{
    eventId: string | string[]
    eventData?: any | null
  }>()

  const eventsStore = useEventsStore()

  // Mobile detection & responsive states
  const isMobile = ref(false)
  const showMobileActions = ref(true)
  const lastScrollY = ref(0)
  const scrollDirection = ref<'up' | 'down'>('up')

  function checkMobile () {
    isMobile.value = window.innerWidth <= 768
  }

  function handleMobileScroll () {
    const currentScrollY = window.scrollY
    const threshold = 50

    if (Math.abs(currentScrollY - lastScrollY.value) < threshold) return

    if (currentScrollY > lastScrollY.value && currentScrollY > 100) {
      scrollDirection.value = 'down'
      showMobileActions.value = false
    } else {
      scrollDirection.value = 'up'
      showMobileActions.value = true
    }

    lastScrollY.value = currentScrollY
  }

  interface FaqItem {
    icon: string
    question: string
    answer: string
    gradient: string
  }

  type EventDetail = {
    id: string | number
    title: string
    date: string
    rawDate: Date | null
    location: string
    image: string
    description: string
    attractions: (string | { name: string, url?: string })[]
    contactInfo: string
    categories: string[]
    confirmedCount: number
    likes?: number
    organizer?: { name: string, avatar: string }
    sourceUrl?: string
    faq?: FaqItem[]
    images?: {
      thumbnail?: string
      small?: string
      medium?: string
      large?: string
      original?: string
    }
  }

  /**
   * Extrai a melhor imagem de alta qualidade para detalhes do evento
   * Prioriza: original > large > medium > small > thumbnail
   * (Mantida para possível uso futuro)
   */
  function _extractBestQualityImage (images: any): string {
    if (!images || typeof images !== 'object') return ''

    return images.original
      || images.large
      || images.medium
      || images.small
      || images.thumbnail
      || ''
  }

  /**
   * Extrai a melhor URL de foto do objeto photos com suporte a múltiplas resoluções
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

  /**
   * Força parâmetros de alta qualidade na URL da imagem
   */
  function enhanceImageUrl (url: string): string {
    if (!url) return ''

    try {
      // Se já é uma URL completa, tenta adicionar parâmetros de qualidade
      if (/^https?:\/\//i.test(url)) {
        const urlObj = new URL(url)

        // Remove parâmetros de baixa qualidade comuns
        urlObj.searchParams.delete('w')
        urlObj.searchParams.delete('h')
        urlObj.searchParams.delete('width')
        urlObj.searchParams.delete('height')
        urlObj.searchParams.delete('q')
        urlObj.searchParams.delete('quality')
        urlObj.searchParams.delete('fit')
        urlObj.searchParams.delete('crop')

        // Adiciona parâmetros de alta qualidade
        urlObj.searchParams.set('quality', '100')
        urlObj.searchParams.set('fm', 'jpg')
        urlObj.searchParams.set('auto', 'format')

        return urlObj.toString()
      }
    } catch (error) {
      // Se falhar ao parsear URL, retorna original
      console.warn('Erro ao processar URL de imagem:', error)
    }

    return url
  }

  function resolveAsset (val?: string) {
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
    const path = val.startsWith('/') ? val : `/${val}`
    return `${base}${path}`
  }

  const event = ref<EventDetail>({
    id: '',
    title: 'Carregando evento...',
    date: '',
    rawDate: null,
    location: '',
    image: '',
    description: '',
    attractions: [],
    contactInfo: '',
    categories: [],
    confirmedCount: 0,
    likes: 0,
    organizer: { name: '', avatar: '' },
    sourceUrl: undefined,
    faq: [],
    images: undefined,
  })

  const loading = ref(false)
  const errorMessage = ref('')
  const showConfirmModal = ref(false)

  // ── Snackbar ──
  const SNACKBAR_COLORS = {
    success: '#22c55e',
    error: '#ef4444',
  } as const
  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref<string>(SNACKBAR_COLORS.success)

  function showSnackbar (message: string, color: string = SNACKBAR_COLORS.success) {
    snackbarMessage.value = message
    snackbarColor.value = color
    if (snackbarVisible.value) {
      snackbarVisible.value = false
      requestAnimationFrame(() => {
        snackbarVisible.value = true
      })
      return
    }
    snackbarVisible.value = true
  }

  const isModalCanceling = ref(false) // true = modal de cancelar, false = modal de confirmar
  const confirmingAttendance = ref(false)
  const activeTab = ref<'info' | 'location' | 'lineup' | 'comments'>('info')

  // =====================
  // COMMENTS STATE
  // =====================
  const { loggedUser } = useAuth()

  interface Comment {
    id: string
    content: string
    createdAt: string
    likesCount: number
    isLikedByMe: boolean
    parentCommentId?: string | null
    replies?: Comment[]
    user: {
      id: string
      name: string
      profileImage?: string
      role?: string
    }
  }

  const comments = ref<Comment[]>([])
  const newComment = ref('')
  const commentsLoading = ref(false)
  const sendingComment = ref(false)
  const deletingCommentId = ref<string | null>(null)
  const likingCommentId = ref<string | null>(null)
  const commentsContainer = ref<HTMLElement | null>(null)

  // Reply state
  const replyingTo = ref<Comment | null>(null)
  const replyText = ref('')
  const sendingReply = ref(false)

  // Local liked state (optimistic)
  const localLiked = ref<Record<string, boolean>>({})
  const localLikeDelta = ref<Record<string, number>>({})

  // Replies expandidas
  const expandedReplies = ref<Record<string, boolean>>({})

  function _toggleReplies (commentId: string) {
    expandedReplies.value[commentId] = !expandedReplies.value[commentId]
  }

  function formatCommentDate (dateStr: string): string {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD}d`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  function getCommentInitial (name: string): string {
    return (name || 'U').charAt(0).toUpperCase()
  }

  const commentAvatarColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  ]

  function getCommentAvatarColor (name: string): string {
    if (!name) return commentAvatarColors[0] ?? '#F44336'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return commentAvatarColors[Math.abs(hash % commentAvatarColors.length)] ?? '#F44336'
  }

  function isMyComment (comment: Comment): boolean {
    return loggedUser.value?.id === comment.user?.id
  }

  function isCommentLiked (comment: Comment): boolean {
    if (comment.id in localLiked.value) return localLiked.value[comment.id] ?? false
    return comment.isLikedByMe ?? false
  }

  function _commentLikesCount (comment: Comment): number {
    const base = comment.likesCount || 0
    const delta = localLikeDelta.value[comment.id] || 0
    return Math.max(0, base + delta)
  }

  async function fetchComments () {
    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    if (!id) return

    commentsLoading.value = true
    try {
      const res = await getEventComments(id)
      const raw = res?.data?.data || res?.data?.comments || res?.data?.content || res?.data || []
      const dataArr: any[] = Array.isArray(raw) ? raw : []

      function mapComment (c: any): Comment {
        return {
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          likesCount: c.likesCount ?? c._count?.likes ?? c.likes ?? 0,
          isLikedByMe: c.isLikedByMe ?? c.likedByMe ?? false,
          parentCommentId: c.parentCommentId ?? c.parentId ?? null,
          replies: [],
          user: {
            ...(c.user ?? { id: '', name: 'Usuário' }),
            role: c.user?.role ?? c.user?.userType ?? null,
          },
        }
      }

      const allComments: Comment[] = []
      for (const c of dataArr) {
        allComments.push(mapComment(c))
        const nestedReplies = c.replies || c.children || []
        if (Array.isArray(nestedReplies)) {
          for (const r of nestedReplies) {
            const mapped = mapComment(r)
            if (!mapped.parentCommentId) mapped.parentCommentId = c.id
            allComments.push(mapped)
          }
        }
      }

      const topLevel: Comment[] = []
      const byId: Record<string, Comment> = {}
      for (const cm of allComments) byId[cm.id] = cm
      for (const cm of allComments) {
        if (cm.parentCommentId && byId[cm.parentCommentId]) {
          byId[cm.parentCommentId]!.replies!.push(cm)
        } else {
          topLevel.push(cm)
        }
      }
      comments.value = topLevel
      localLiked.value = {}
      localLikeDelta.value = {}
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
      comments.value = []
    } finally {
      commentsLoading.value = false
    }
  }

  async function handleSendComment () {
    const text = newComment.value.trim()
    if (!text || sendingComment.value) return

    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    if (!id) return

    sendingComment.value = true
    try {
      await addEventComment(id, text)
      newComment.value = ''
      await fetchComments()
      await nextTick()
      if (commentsContainer.value) {
        commentsContainer.value.scrollTop = commentsContainer.value.scrollHeight
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
    } finally {
      sendingComment.value = false
    }
  }

  function _startReply (comment: Comment) {
    replyingTo.value = comment
    replyText.value = ''
  }

  function cancelReply () {
    replyingTo.value = null
    replyText.value = ''
  }

  async function _handleSendReply () {
    const text = replyText.value.trim()
    if (!text || sendingReply.value || !replyingTo.value) return

    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    if (!id) return

    const parentId = replyingTo.value.id
    sendingReply.value = true
    try {
      const res = await addEventComment(id, text, parentId)

      const replyData = res?.data?.data || res?.data
      const newReplyObj: Comment = {
        id: replyData?.id || `temp-${Date.now()}`,
        content: text,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLikedByMe: false,
        parentCommentId: parentId,
        replies: [],
        user: {
          id: loggedUser.value?.id || '',
          name: loggedUser.value?.name || 'Você',
          profileImage: loggedUser.value?.profileImage,
          role: undefined,
        },
      }

      const parent = comments.value.find(c => c.id === parentId)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(newReplyObj)
        expandedReplies.value[parentId] = true
      }

      cancelReply()
      fetchComments()
    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
    } finally {
      sendingReply.value = false
    }
  }

  async function handleDeleteComment (commentId: string) {
    if (deletingCommentId.value) return

    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    if (!id) return

    deletingCommentId.value = commentId
    try {
      await deleteEventComment(id, commentId)
      comments.value = comments.value.filter(c => c.id !== commentId)
    } catch (error) {
      console.error('Erro ao excluir comentário:', error)
    } finally {
      deletingCommentId.value = null
    }
  }

  async function _handleToggleLikeComment (comment: Comment) {
    if (likingCommentId.value === comment.id) return

    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    if (!id) return

    likingCommentId.value = comment.id

    const wasLiked = isCommentLiked(comment)
    localLiked.value[comment.id] = !wasLiked
    localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? -1 : 1)

    try {
      await toggleLikeComment(id, comment.id)
    } catch (error) {
      localLiked.value[comment.id] = wasLiked
      localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? 1 : -1)
      console.error('Erro ao curtir comentário:', error)
    } finally {
      likingCommentId.value = null
    }
  }

  // Carrega comentários quando a aba é selecionada
  watch(activeTab, tab => {
    if (tab === 'comments' && comments.value.length === 0) {
      fetchComments()
    }
  })

  // FAQs state
  const openFaqIndex = ref<number | null>(null)
  const showFaqs = ref(false)

  // Terms and Privacy Modal (unused - kept for potential future use)
  const showTermsModal = ref(false)
  const termsModalPdf = ref<'terms' | 'privacy'>('terms')

  function _openTermsModal (type: 'terms' | 'privacy') {
    termsModalPdf.value = type
    showTermsModal.value = true
  }

  // Gradientes padrão para FAQs
  const defaultGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ]

  // Computed para verificar se há FAQs disponíveis e normalizar dados
  const normalizedFaqs = computed(() => {
    if (!Array.isArray(event.value.faq) || event.value.faq.length === 0) {
      return []
    }

    return event.value.faq.map((faq, index) => ({
      question: faq.question || 'Pergunta não informada',
      answer: faq.answer || 'Resposta não disponível',
      icon: faq.icon || 'mdi-help-circle-outline',
      gradient: faq.gradient || defaultGradients[index % defaultGradients.length],
    }))
  })

  const hasFaqs = computed(() => {
    return normalizedFaqs.value.length > 0
  })

  function toggleFaq (index: number) {
    openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  // Countdown timer
  const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  function updateCountdown () {
    if (!event.value.rawDate) {
      countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return
    }

    const now = Date.now()
    const eventTime = event.value.rawDate.getTime()
    const distance = eventTime - now

    if (distance < 0) {
      countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
      return
    }

    countdown.value = {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    }
  }

  function startCountdown () {
    if (countdownInterval) clearInterval(countdownInterval)
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  }

  onUnmounted(() => {
    if (countdownInterval) clearInterval(countdownInterval)
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('scroll', handleMobileScroll)
  })

  function resolveEventDate (data: any): Date | null {
    const candidates = [
      data?.date,
      data?.startDate,
      data?.dateTime,
      data?.startAt,
      data?.eventDate,
      data?.start_date,
      data?.schedule,
    ]
    for (const val of candidates) {
      if (!val) continue
      const parsed = new Date(val)
      if (!Number.isNaN(parsed.getTime())) return parsed
    }
    return null
  }

  function formatEventDate (d: Date | null): string {
    if (!d) return 'Data não informada'
    return d.toLocaleString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function mapEventPayload (data: any): EventDetail {
    const rawDate = resolveEventDate(data)

    // Usa a mesma lógica do FeedCard para processar imagens por ratio
    let finalImage = ''
    if (data?.images && Array.isArray(data.images) && data.images.length > 0) {
      const images = data.images

      // Desktop: melhor imagem 16_9 (maior resolução)
      const landscapeImages = images
        .filter((img: any) => img.ratio === '16_9')
        .toSorted((a: any, b: any) => b.width - a.width)

      finalImage = landscapeImages[0]?.url || ''

      // Fallback: se não houver 16_9, tenta 3_2
      if (!finalImage) {
        const verticalImage = images.find((img: any) => img.ratio === '3_2')
        finalImage = verticalImage?.url || ''
      }

      // Fallback: usa a primeira imagem disponível
      if (!finalImage && images.length > 0) {
        finalImage = images[0]?.url || ''
      }
    }

    // Fallback final para formatos antigos
    if (!finalImage) {
      const bestPhotoUrl = extractPhotoUrl(data?.photos)
      finalImage = bestPhotoUrl || data?.bannerUrl || data?.banner || ''
    }

    // Melhora a qualidade da URL de imagem
    finalImage = enhanceImageUrl(finalImage)

    return {
      id: data?.id,
      title: data?.name || data?.title || 'Evento sem título',
      date: formatEventDate(rawDate),
      rawDate,
      location: data?.location || data?.address || data?.place || 'Local não informado',
      image: resolveAsset(finalImage),
      description: data?.description || 'Sem descrição disponível.',
      attractions: data?.attractions || data?.lineup || [],
      contactInfo: data?.contactInfo || 'Informações de contato não disponíveis.',
      categories: data?.categories || data?.tags || (data?.eventInterests || []).map((i: any) => i.interest?.name).filter(Boolean) || [],
      confirmedCount: data?.confirmedCount || data?.confirmed || 0,
      likes: data?.likes || data?._count?.likes || 0,
      organizer: {
        name: data?.organizer?.name || data?.hostName || data?.creator?.name || 'Organizador',
        avatar: data?.organizer?.avatar || data?.hostAvatar || data?.creator?.profileImage || '',
      },
      sourceUrl: data?.sourceUrl || data?.source_url || data?.externalUrl || data?.external_url || undefined,
      faq: Array.isArray(data?.faq) ? data.faq : (Array.isArray(data?.faqs) ? data.faqs : []),
      images: data?.images || undefined,
    }
  }

  const isLiked = computed(() => eventsStore.isLiked(event.value.id))
  const isSaved = computed(() => eventsStore.isSaved(event.value.id))
  const isConfirmed = computed(() => eventsStore.isConfirmed(event.value.id))
  const displayLikes = computed(() => {
    return (event.value.likes || 0) + (isLiked.value ? 1 : 0)
  })

  const displayConfirmed = computed(() => {
    return event.value.confirmedCount + (isConfirmed.value ? 1 : 0)
  })

  const eventStatus = computed(() => {
    if (!event.value.rawDate) return 'upcoming'
    const now = new Date()
    const eventDate = event.value.rawDate
    if (eventDate < now) return 'past'
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 3) return 'soon'
    return 'upcoming'
  })

  const badgeStatus = computed(() => {
    if (eventStatus.value === 'past') return { show: true, type: 'past', text: 'Evento encerrado', icon: 'mdi-check-circle' }
    if (isConfirmed.value) return { show: true, type: 'confirmed', text: 'Presença confirmada', icon: 'mdi-check-all' }
    if (eventStatus.value === 'soon') return { show: true, type: 'soon', text: 'Em breve!', icon: 'mdi-clock-fast' }
    return { show: false, type: '', text: '', icon: '' }
  })

  // Avatar color logic
  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ]

  const organizerAvatarColor = computed(() => {
    const name = event.value.organizer?.name || ''
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash) % avatarColors.length]
  })

  const organizerInitial = computed(() => {
    return (event.value.organizer?.name || 'O').charAt(0).toUpperCase()
  })

  const isEventPast = computed(() => eventStatus.value === 'past')

  function toggleLike () {
    if (event.value.id && !isEventPast.value) {
      eventsStore.toggleLike(event.value.id)
    }
  }

  function toggleSave () {
    if (!event.value.id || isEventPast.value) return

    const feedItem = {
      id: event.value.id,
      banner: event.value.image,
      creator: event.value.organizer ? { name: event.value.organizer.name } : { name: 'Unknown' },
      hostAvatar: event.value.organizer ? event.value.organizer.avatar : '',
      schedule: event.value.date,
      location: event.value.location,
      title: event.value.title,
      description: event.value.description,
      confirmed: event.value.confirmedCount,
      interested: 0,
      likes: event.value.likes,
    }
    eventsStore.toggleSave(feedItem)
  }

  async function handleConfirmAttendance () {
    if (isEventPast.value || confirmingAttendance.value) return
    // Define a ação do modal baseado no estado atual (antes de abrir)
    isModalCanceling.value = isConfirmed.value
    showConfirmModal.value = true
  }

  async function confirmAttendance () {
    await toggleAttendanceApi()
    showConfirmModal.value = false
  }

  async function toggleAttendanceApi () {
    if (!event.value.id || confirmingAttendance.value) return

    confirmingAttendance.value = true
    errorMessage.value = ''

    try {
      // Usa a store que já faz a chamada à API internamente
      await eventsStore.toggleConfirm(event.value.id)

      // Feedback visual ao usuário — emite o alerta da ação executada
      const isNowConfirmed = eventsStore.isConfirmed(event.value.id)
      showSnackbar(
        isNowConfirmed ? 'Presença confirmada com sucesso!' : 'Presença cancelada com sucesso!',
        SNACKBAR_COLORS.success,
      )
    } catch (error: any) {
      console.error('Erro ao confirmar presença:', error)
      errorMessage.value = error?.message || 'Não foi possível confirmar presença. Tente novamente.'
      showSnackbar(
        isModalCanceling.value ? 'Erro ao cancelar presença. Tente novamente.' : 'Erro ao confirmar presença. Tente novamente.',
        SNACKBAR_COLORS.error,
      )

      // Limpa a mensagem de erro após 5 segundos
      setTimeout(() => {
        errorMessage.value = ''
      }, 5000)
    } finally {
      confirmingAttendance.value = false
    }
  }

  async function fetchEventDetails (id: string | number) {
    // Se eventData já foi fornecido via prop, usa ele ao invés de fazer nova requisição
    if (props.eventData) {
      event.value = mapEventPayload(props.eventData)
      startCountdown()
      await syncAttendanceStatus(id)
      return
    }

    // Fallback: busca da API se eventData não foi fornecido
    loading.value = true
    errorMessage.value = ''
    try {
      const response = await getEventById(id)
      const payload = response?.data?.event || response?.data || response
      event.value = mapEventPayload(payload)
      startCountdown()
      await syncAttendanceStatus(id)
    } catch (error) {
      console.error(error)
      errorMessage.value = 'Não foi possível carregar os detalhes do evento.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Sincroniza o status de confirmação de presença com o backend
   */
  async function syncAttendanceStatus (eventId: string | number) {
    try {
      const response = await getMyAttendance(eventId)
      const data = response?.data || response

      // Verifica se há dados de presença retornados
      // O endpoint retorna status: "INTERESTED" ou "CONFIRMED"
      const isAttending = data?.status === 'CONFIRMED' || data?.status === 'INTERESTED' || data?.isAttending || false
      eventsStore.setConfirmed(eventId, isAttending)
    } catch (error) {
      console.warn('Não foi possível sincronizar status de presença:', error)
    }
  }

  onMounted(() => {
    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    if (id) {
      fetchEventDetails(id)
      // Carrega comentários logo de início para a contagem aparecer no badge
      // mesmo antes de abrir a aba e ao transitar entre outras abas
      fetchComments()
    }

    // Mobile responsive setup
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('scroll', handleMobileScroll, { passive: true })
  })

  watch(
    () => props.eventId,
    newId => {
      const id = Array.isArray(newId) ? newId[0] : newId
      if (id) fetchEventDetails(id)
    },
  )

  // Watch eventData para atualizar quando os dados forem carregados ou atualizados
  watch(
    () => props.eventData,
    newData => {
      if (newData) {
        event.value = mapEventPayload(newData)
        startCountdown()
      }
    },
  )

  function openMap () {
    const loc = event.value?.location
    if (!loc) return
    const query = encodeURIComponent(loc)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function getMapEmbedUrl () {
    const loc = event.value?.location
    if (!loc) return ''

    const encodedLocation = encodeURIComponent(loc)
    const apiKey = import.meta.env.VITE__GOOGLE_MAPS_API_KEY

    // Se tiver API key, usa o Embed API (melhor qualidade)
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}&zoom=15`
    }

    // Fallback: usa iframe simples do Google Maps (funciona sem API key)
    // Nota: pode ter limitações de estilo e funcionalidade
    return `https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }

  function _openSourceUrl () {
    if (event.value?.sourceUrl) {
      window.open(event.value.sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const shareStore = useShareStore()

  function handleShare () {
    const id = Array.isArray(props.eventId) ? props.eventId[0] : props.eventId
    shareStore.open({
      title: event.value.title,
      text: 'Veja esse evento que encontrei que você também pode gostar',
      url: `${window.location.origin}/private/event/${id}`,
    })
  }
</script>

<template>
  <div class="event-details-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-wrapper">
      <AppLoader size="lg" text="Carregando evento incrível..." />
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-wrapper">
      <div class="error-icon">
        <i class="mdi mdi-alert-circle-outline" />
      </div>
      <p class="error-text">{{ errorMessage }}</p>
      <button class="retry-btn" @click="fetchEventDetails(Array.isArray(eventId) ? (eventId[0] || '') : eventId)">
        <i class="mdi mdi-refresh" /> Tentar novamente
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-image-wrapper">
          <img v-if="event.image" :alt="event.title" class="hero-image" :src="event.image">
          <div v-else class="hero-image-placeholder">
            <i class="mdi mdi-image-off-outline" />
            <p>Imagem do evento não disponível</p>
          </div>
          <div class="hero-overlay" />
          <div class="hero-gradient" />
        </div>

        <!-- Status Badge -->
        <div v-if="badgeStatus.show" class="status-badge" :class="badgeStatus.type">
          <i class="mdi" :class="badgeStatus.icon" />
          <span>{{ badgeStatus.text }}</span>
        </div>

        <!-- Floating Action Buttons -->
        <div class="floating-actions">
          <button
            class="fab-btn like-btn"
            :class="{ active: isLiked, disabled: isEventPast }"
            :disabled="isEventPast"
            @click="toggleLike"
          >
            <svg
              class="fab-icon"
              :fill="isLiked ? 'currentColor' : 'none'"
              height="17"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="17"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
            <span class="fab-count">{{ displayLikes }}</span>
          </button>

          <button
            class="fab-btn save-btn"
            :class="{ active: isSaved, disabled: isEventPast }"
            :disabled="isEventPast"
            @click="toggleSave"
          >
            <i class="mdi" :class="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'" />
          </button>

          <button class="fab-btn share-btn" @click="handleShare">
            <i class="mdi mdi-share-variant" />
          </button>
        </div>

        <!-- Hero Content -->
        <div class="hero-content">
          <div class="category-pills">
            <span v-for="cat in event.categories.slice(0, 3)" :key="cat" class="category-pill">
              {{ cat }}
            </span>
          </div>
          <h1 class="hero-title">{{ event.title }}</h1>
        </div>
      </div>

      <!-- Countdown Timer -->
      <div v-if="eventStatus !== 'past'" class="countdown-section">
        <div class="countdown-label">
          <i class="mdi mdi-timer-outline" />
          <span>Contagem regressiva</span>
        </div>
        <div class="countdown-grid">
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.days).padStart(2, '0') }}</span>
            <span class="countdown-unit">dias</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.hours).padStart(2, '0') }}</span>
            <span class="countdown-unit">horas</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.minutes).padStart(2, '0') }}</span>
            <span class="countdown-unit">min</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ String(countdown.seconds).padStart(2, '0') }}</span>
            <span class="countdown-unit">seg</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-icon likes">
            <svg
              class="stat-icon-img"
              fill="none"
              height="20"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              />
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ displayLikes }}</span>
            <span class="stat-label">curtidas</span>
          </div>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <div class="stat-icon confirmed">
            <i class="mdi mdi-account-check" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ displayConfirmed }}</span>
            <span class="stat-label">confirmados</span>
          </div>
        </div>
        <div class="stat-divider" />
        <div class="stat-item clickable" @click="handleShare">
          <div class="stat-icon share">
            <i class="mdi mdi-share-variant" />
          </div>
          <div class="stat-info">
            <span class="stat-label">Compartilhar</span>
          </div>
        </div>
      </div>

      <!-- Organizer Card -->
      <div class="organizer-card">
        <div class="organizer-avatar" :style="{ backgroundColor: organizerAvatarColor }">
          <template v-if="event.organizer?.avatar">
            <img :alt="event.organizer.name" :src="event.organizer.avatar">
          </template>
          <template v-else>
            {{ organizerInitial }}
          </template>
        </div>
        <div class="organizer-info">
          <span class="organizer-label">Organizado por</span>
          <span class="organizer-name">{{ event.organizer?.name }}</span>
        </div>
      </div>

      <!-- Content Tabs -->
      <div class="content-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <i class="mdi mdi-information-outline" />
          <span>Informações</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'comments' }" @click="activeTab = 'comments'">
          <i class="mdi mdi-comment-outline" />
          <span>Comentários</span>
          <span v-if="comments.length > 0" class="tab-badge">{{ comments.length }}</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'location' }" @click="activeTab = 'location'">
          <i class="mdi mdi-map-marker-outline" />
          <span>Local</span>
        </button>
        <button
          v-if="event.attractions.length > 0"
          class="tab-btn"
          :class="{ active: activeTab === 'lineup' }"
          @click="activeTab = 'lineup'"
        >
          <i class="mdi mdi-star-outline" />
          <span>Atrações</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Info Tab -->
        <div v-show="activeTab === 'info'" class="tab-panel info-panel">
          <div class="info-card">
            <div class="info-header">
              <i class="mdi mdi-calendar-clock" />
              <span>Data e Horário</span>
            </div>
            <p class="info-value">{{ event.date }}</p>
          </div>

          <div class="info-card description-card">
            <div class="info-header">
              <i class="mdi mdi-text-box-outline" />
              <span>Sobre o Evento</span>
            </div>
            <p class="description-text">{{ event.description }}</p>
          </div>

          <div
            v-if="event.contactInfo && event.contactInfo !== 'Informações de contato não disponíveis.'"
            class="info-card"
          >
            <div class="info-header">
              <i class="mdi mdi-help-circle-outline" />
              <span>Dúvidas e Contato</span>
            </div>
            <p class="info-value">{{ event.contactInfo }}</p>
          </div>

          <!-- Botão Saiba Mais / Comprar Ingressos - Só aparece se tiver sourceUrl -->
          <div v-if="event.sourceUrl" class="external-link-card">
            <div class="external-link-content">
              <div class="external-link-icon">
                <i class="mdi mdi-ticket-confirmation-outline" />
              </div>
              <div class="external-link-info">
                <span class="external-link-title">Ingressos e mais informações</span>
                <span class="external-link-desc">Acesse o site oficial para comprar ingressos</span>
              </div>
            </div>
            <button class="external-link-btn" @click="_openSourceUrl">
              <span>Saiba mais</span>
              <i class="mdi mdi-open-in-new" />
            </button>
          </div>

          <!-- FAQs Section (collapsible inside info tab) - Só aparece se houver FAQs da API -->
          <div v-if="hasFaqs" class="faqs-section-inline">
            <button class="faqs-toggle-btn" :class="{ open: showFaqs }" @click="showFaqs = !showFaqs">
              <div class="faqs-toggle-left">
                <div class="faqs-icon-wrapper-sm">
                  <i class="mdi mdi-help-circle" />
                </div>
                <div class="faqs-toggle-text">
                  <span class="faqs-toggle-title">Perguntas Frequentes</span>
                  <span class="faqs-toggle-sub">Tire suas dúvidas sobre o evento</span>
                </div>
              </div>
              <div class="faqs-chevron" :class="{ rotated: showFaqs }">
                <i class="mdi mdi-chevron-down" />
              </div>
            </button>

            <Transition name="faq-expand">
              <div v-if="showFaqs" class="faqs-content">
                <div class="faqs-list">
                  <div
                    v-for="(faq, index) in normalizedFaqs"
                    :key="index"
                    class="faq-item"
                    :class="{ open: openFaqIndex === index }"
                    :style="{ animationDelay: `${index * 0.05}s` }"
                  >
                    <button class="faq-question" :style="{ background: faq.gradient }" @click="toggleFaq(index)">
                      <div class="faq-q-content">
                        <div class="faq-icon">
                          <i :class="faq.icon" />
                        </div>
                        <span class="faq-q-text">{{ faq.question }}</span>
                      </div>
                      <div class="faq-toggle-icon" :class="{ rotated: openFaqIndex === index }">
                        <i class="mdi mdi-chevron-down" />
                      </div>
                    </button>
                    <Transition name="faq-expand">
                      <div v-if="openFaqIndex === index" class="faq-answer">
                        <div class="faq-answer-content">
                          <i class="mdi mdi-chat-question-outline faq-answer-icon" />
                          <p>{{ faq.answer }}</p>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Location Tab -->
        <div v-show="activeTab === 'location'" class="tab-panel location-panel">
          <!-- Google Maps Embed -->
          <div class="map-container">
            <iframe
              allowfullscreen
              class="google-map-embed"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              :src="getMapEmbedUrl()"
              title="Mapa do local do evento"
            />
          </div>

          <div class="location-card-modern">
            <div class="location-icon-wrapper">
              <i class="mdi mdi-map-marker" />
            </div>
            <div class="location-details">
              <span class="location-label">Endereço do evento</span>
              <p class="location-address">{{ event.location }}</p>
            </div>
          </div>

          <button class="map-button" @click="openMap">
            <i class="mdi mdi-google-maps" />
            <span>Abrir no Google Maps</span>
            <i class="mdi mdi-arrow-right" />
          </button>
        </div>

        <!-- Lineup Tab -->
        <div v-show="activeTab === 'lineup'" class="tab-panel lineup-panel">
          <div
            v-for="(attraction, index) in event.attractions"
            :key="index"
            class="lineup-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="lineup-number">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="lineup-info">
              <span class="lineup-name">{{ typeof attraction === 'string' ? attraction : (attraction?.name || 'Atração')
              }}</span>
            </div>
            <div class="lineup-icon">
              <i class="mdi mdi-microphone-variant" />
            </div>
          </div>
        </div>

        <!-- Comments Tab -->
        <div v-show="activeTab === 'comments'" class="tab-panel comments-panel">
          <!-- Comments List -->
          <div ref="commentsContainer" class="comments-list-container">
            <!-- Loading -->
            <div v-if="commentsLoading" class="comments-loading">
              <AppLoader size="sm" text="Carregando comentários..." />
            </div>

            <!-- Empty State -->
            <div v-else-if="comments.length === 0" class="comments-empty">
              <div class="empty-icon">
                <i class="mdi mdi-comment-text-outline" />
              </div>
              <span class="empty-title">Nenhum comentário ainda</span>
              <span class="empty-sub">Seja o primeiro a comentar neste evento!</span>
            </div>

            <!-- Comments -->
            <div v-else class="comments-list">
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="comment-avatar-wrapper">
                  <img
                    v-if="comment.user?.profileImage"
                    :alt="comment.user?.name"
                    class="comment-avatar"
                    :src="resolveAsset(comment.user?.profileImage)"
                  >
                  <div
                    v-else
                    class="comment-avatar placeholder"
                    :style="{ backgroundColor: getCommentAvatarColor(comment.user?.name || '') }"
                  >
                    {{ getCommentInitial(comment.user?.name || '') }}
                  </div>
                </div>

                <div class="comment-content">
                  <div class="comment-bubble">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.user?.name || 'Usuário' }}</span>
                      <span v-if="comment.user?.role === 'ADMIN'" class="comment-admin-badge">Admin</span>
                      <span class="comment-time">{{ formatCommentDate(comment.createdAt) }}</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>

                  <!-- Actions -->
                  <div class="comment-actions">
                    <button
                      v-if="isMyComment(comment)"
                      class="comment-action-btn delete-btn"
                      :disabled="deletingCommentId === comment.id"
                      type="button"
                      @click="handleDeleteComment(comment.id)"
                    >
                      <template v-if="deletingCommentId !== comment.id">
                        <i class="mdi mdi-delete-outline" />
                        <span>Excluir</span>
                      </template>
                      <v-progress-circular
                        v-else
                        color="#ff5fa6"
                        indeterminate
                        size="12"
                        :width="2"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Comment Input -->
          <div class="comment-input-section">
            <div class="comment-input-wrapper">
              <input
                v-model="newComment"
                :disabled="sendingComment"
                maxlength="500"
                placeholder="Escreva um comentário..."
                type="text"
                @keyup.enter="handleSendComment"
              >
              <button
                class="send-comment-btn"
                :disabled="!newComment.trim() || sendingComment"
                type="button"
                @click="handleSendComment"
              >
                <i v-if="!sendingComment" class="mdi mdi-send" />
                <v-progress-circular
                  v-else
                  color="#fff"
                  indeterminate
                  size="16"
                  :width="2"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="cta-section">
        <div class="cta-info">
          <span class="cta-label">{{ isConfirmed ? 'Você confirmou presença!' : 'Garanta sua vaga!' }}</span>
          <span class="cta-sub">{{ displayConfirmed }} pessoas confirmadas</span>
        </div>
        <button
          class="cta-button"
          :class="{ 'not-going': isConfirmed, disabled: isEventPast || confirmingAttendance }"
          :disabled="isEventPast || confirmingAttendance"
          @click="handleConfirmAttendance"
        >
          <i
            v-if="!confirmingAttendance"
            class="mdi"
            :class="isConfirmed ? 'mdi-emoticon-sad-outline' : 'mdi-party-popper'"
          />
          <v-progress-circular
            v-else
            color="#fff"
            indeterminate
            size="20"
            :width="2"
          />
          <span>{{ confirmingAttendance ? (isModalCanceling ? 'CANCELANDO...' : 'CONFIRMANDO...') : (isEventPast ? 'EVENTO ENCERRADO' : (isConfirmed ? 'NÃO VOU MAIS' : 'EU VOU!')) }}</span>
        </button>
      </div>

    </template>

    <!-- Snackbar de feedback (confirmar / cancelar presença) -->
    <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" :timeout="1500" />

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
          <div class="modal-content">
            <div class="modal-icon" :class="{ 'cancel-icon': isModalCanceling }">
              <i class="mdi" :class="isModalCanceling ? 'mdi-calendar-remove' : 'mdi-party-popper'" />
            </div>
            <h3 class="modal-title">{{ isModalCanceling ? 'Cancelar Presença' : 'Confirmar Presença' }}</h3>
            <p class="modal-text">
              {{ isModalCanceling
                ? `Deseja cancelar sua presença em`
                : `Você está prestes a confirmar sua presença em`
              }} <strong>{{ event.title }}</strong>{{ isModalCanceling ? '?' : '!' }}
            </p>
            <div class="modal-actions">
              <button class="modal-btn cancel" @click="showConfirmModal = false">Voltar</button>
              <button
                class="modal-btn"
                :class="isModalCanceling ? 'cancel-attendance' : 'confirm'"
                @click="confirmAttendance"
              >
                <i class="mdi" :class="isModalCanceling ? 'mdi-close' : 'mdi-check'" />
                {{ isModalCanceling ? 'Cancelar Presença' : 'Confirmar!' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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

    <!-- Mobile Floating Action Bar -->
    <Teleport to="body">
      <Transition name="mobile-actions">
        <div
          v-if="isMobile && !loading && !errorMessage"
          class="mobile-action-bar"
          :class="{ hidden: !showMobileActions }"
        >
          <div class="mobile-action-bar-content">
            <!-- Quick Actions -->
            <div class="mobile-quick-actions">
              <button
                class="mobile-action-btn"
                :class="{ active: isLiked, disabled: isEventPast }"
                :disabled="isEventPast"
                type="button"
                @click="toggleLike"
              >
                <svg
                  :fill="isLiked ? 'currentColor' : 'none'"
                  height="20"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="20"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span class="mobile-action-count">{{ displayLikes }}</span>
              </button>

              <button
                class="mobile-action-btn"
                :class="{ active: isSaved, disabled: isEventPast }"
                :disabled="isEventPast"
                type="button"
                @click="toggleSave"
              >
                <i class="mdi" :class="isSaved ? 'mdi-bookmark' : 'mdi-bookmark-outline'" />
              </button>

              <button class="mobile-action-btn" type="button" @click="handleShare">
                <i class="mdi mdi-share-variant" />
              </button>
            </div>

            <!-- CTA Button -->
            <button
              class="mobile-cta-btn"
              :class="{ 'not-going': isConfirmed, disabled: isEventPast || confirmingAttendance }"
              :disabled="isEventPast || confirmingAttendance"
              type="button"
              @click="handleConfirmAttendance"
            >
              <template v-if="!confirmingAttendance">
                <i class="mdi" :class="isConfirmed ? 'mdi-check-circle' : 'mdi-party-popper'" />
                <span>{{ isEventPast ? 'ENCERRADO' : (isConfirmed ? 'CONFIRMADO' : 'EU VOU!') }}</span>
              </template>
              <template v-else>
                <v-progress-circular color="#fff" indeterminate size="18" :width="2" />
              </template>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.event-details-container {
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  font-family: 'Poppins', sans-serif;
  position: relative;
}

/* Loading State */
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 400px;
}

/* Error State */
.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 400px;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  color: #ff5fa6;
  margin-bottom: 1rem;
}

.error-text {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 95, 166, 0.3);
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 380px;
  overflow: hidden;
}

.hero-image-wrapper {
  position: absolute;
  inset: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  /* For\u00e7a renderiza\u00e7\u00e3o de alta qualidade */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: high-quality;

  /* Suaviza\u00e7\u00e3o avan\u00e7ada para melhor qualidade */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);

  /* For\u00e7a a GPU a processar a imagem */
  will-change: transform;
}

.event-details-container:hover .hero-image {
  transform: scale(1.03);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 50%,
      rgba(0, 0, 0, 0.7) 100%);
}

.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: linear-gradient(to top,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0) 100%);
}

/* Status Badge */
.status-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  animation: slideInLeft 0.5s ease;
}

.status-badge.upcoming {
  background: rgba(76, 175, 80, 0.9);
  color: white;
}

.status-badge.soon {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  animation: slideInLeft 0.5s ease, glow 2s ease-in-out infinite;
}

.status-badge.past {
  background: rgba(158, 158, 158, 0.9);
  color: white;
}

.status-badge.confirmed {
  background: rgba(76, 175, 80, 0.95);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

@keyframes slideInLeft {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes glow {

  0%,
  100% {
    box-shadow: 0 0 5px rgba(255, 95, 166, 0.5);
  }

  50% {
    box-shadow: 0 0 20px rgba(255, 95, 166, 0.8), 0 0 30px rgba(255, 186, 75, 0.5);
  }
}

/* Floating Action Buttons */
.floating-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  position: relative;
}

.fab-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.fab-btn.like-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5fa6 100%);
  color: white;
}

.fab-btn.like-btn.active i {
  animation: confettiBurst 0.6s ease;
}

.fab-btn img {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%) invert(20%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(95%) contrast(95%);
}

.fab-btn.like-btn.active img {
  filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  animation: confettiBurst 0.6s ease;
}

.fab-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%);
}

.fab-btn.like-btn.active .fab-icon {
  filter: brightness(0) saturate(100%) invert(100%);
  animation: confettiBurst 0.6s ease;
}

.fab-btn.save-btn.active {
  background: linear-gradient(135deg, #ffba4b 0%, #ffa502 100%);
  color: white;
}

.fab-btn.disabled,
.fab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.fab-btn.disabled:hover,
.fab-btn:disabled:hover {
  transform: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.fab-count {
  position: absolute;
  bottom: -8px;
  right: -8px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.4);
}

@keyframes confettiBurst {
  0% {
    transform: scale(1) rotate(0deg);
  }

  25% {
    transform: scale(1.3) rotate(-10deg);
  }

  50% {
    transform: scale(1.4) rotate(10deg);
  }

  75% {
    transform: scale(1.2) rotate(-5deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* Hero Content */
.hero-content {
  position: absolute;
  bottom: 30px;
  left: 24px;
  right: 24px;
  z-index: 2;
}

.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.category-pill {
  padding: 0.35rem 0.9rem;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
  margin: 0;
}

/* Countdown Section */
.countdown-section {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1) 0%, rgba(255, 95, 166, 0.1) 100%);
  border-bottom: 1px solid rgba(255, 95, 166, 0.1);
}

.countdown-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
}

.countdown-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.1);
  min-width: 60px;
}

.countdown-value {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.countdown-unit {
  font-size: 0.7rem;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.countdown-separator {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff5fa6;
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

/* Stats Bar */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1.25rem;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-item.clickable {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  transition: background 0.2s;
}

.stat-item.clickable:hover {
  background: rgba(255, 95, 166, 0.1);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-icon.likes {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 95, 166, 0.15) 100%);
  color: #ff5fa6;
}

.stat-icon svg {
  color: inherit;
}

.stat-icon.confirmed {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%);
  color: #4CAF50;
}

.stat-icon.share {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(100, 181, 246, 0.15) 100%);
  color: #2196F3;
}

.stat-icon-img {
  width: 24px;
  height: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.15rem;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #e0e0e0, transparent);
}

/* Organizer Card */
.organizer-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  margin: 1rem 1.25rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 95, 166, 0.1);
}

.organizer-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.organizer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.organizer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.organizer-label {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.organizer-name {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
}

.follow-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 1.25rem;
  border: 2px solid #ff5fa6;
  border-radius: 50px;
  background: transparent;
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background: #ff5fa6;
  color: white;
  transform: scale(1.05);
}

/* Content Tabs */
.content-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0 1.25rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.content-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 12px;
  background: #f5f5f5;
  color: #666;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: rgba(255, 95, 166, 0.1);
  color: #ff5fa6;
}

.tab-btn.active {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

/* Tab Content */
.tab-content {
  padding: 0 1.25rem;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Info Panel */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  padding: 1.25rem;
  background: #fafafa;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.info-card:hover {
  border-color: rgba(255, 95, 166, 0.2);
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.08);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
}

.info-header i {
  font-size: 1.2rem;
}

.info-value {
  color: #444;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.description-card {
  background: linear-gradient(135deg, #fff5f8 0%, #f8f9ff 100%);
}

.description-text {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
}

/* External Link Card - Saiba Mais */
.external-link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fff5f8 0%, #fff8f0 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 95, 166, 0.15);
  transition: all 0.3s ease;
}

.external-link-card:hover {
  border-color: rgba(255, 95, 166, 0.3);
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.12);
}

.external-link-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.external-link-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff5fa6, #ffba4b);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.external-link-icon i {
  font-size: 1.5rem;
  color: white;
}

.external-link-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.external-link-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1a1c2e;
}

.external-link-desc {
  font-size: 0.8rem;
  color: #9aa0b8;
}

.external-link-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #ff5fa6, #ff7eb3);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.external-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 95, 166, 0.35);
}

.external-link-btn i {
  font-size: 1rem;
}

/* Location Panel */
.location-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-container {
  width: 100%;
  height: 300px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border: 2px solid rgba(255, 95, 166, 0.1);
  position: relative;
}

.google-map-embed {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.location-card-modern {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 95, 166, 0.1);
}

.location-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(255, 95, 166, 0.25);
}

.location-details {
  flex: 1;
}

.location-label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 0.5rem;
}

.location-address {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.5;
}

.map-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
}

.map-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 133, 244, 0.4);
}

.map-button i:last-child {
  transition: transform 0.3s ease;
}

.map-button:hover i:last-child {
  transform: translateX(5px);
}

/* Lineup Panel */
.lineup-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lineup-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  animation: slideInRight 0.5s ease backwards;
}

.lineup-card:hover {
  transform: translateX(8px);
  border-color: rgba(255, 95, 166, 0.3);
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.1);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.lineup-number {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  min-width: 40px;
}

.lineup-info {
  flex: 1;
}

.lineup-name {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.lineup-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.15) 0%, rgba(255, 95, 166, 0.15) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5fa6;
  font-size: 1.1rem;
}

/* CTA Section */
.cta-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 1.25rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #fff5f8 0%, #f8f9ff 100%);
  border-top: 1px solid rgba(255, 95, 166, 0.1);
}

.cta-info {
  display: flex;
  flex-direction: column;
}

.cta-label {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
}

.cta-sub {
  font-size: 0.85rem;
  color: #888;
}

.cta-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 25px rgba(255, 95, 166, 0.35);
}

.cta-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(255, 95, 166, 0.45);
}

.cta-button:active {
  transform: translateY(0) scale(0.98);
}

.cta-button.confirmed {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.35);
}

.cta-button.confirmed:hover {
  box-shadow: 0 12px 35px rgba(76, 175, 80, 0.45);
}

.cta-button.not-going {
  background: linear-gradient(135deg, #78909C 0%, #90A4AE 100%);
  box-shadow: 0 8px 25px rgba(120, 144, 156, 0.35);
}

.cta-button.not-going:hover {
  background: linear-gradient(135deg, #607D8B 0%, #78909C 100%);
  box-shadow: 0 12px 35px rgba(96, 125, 139, 0.45);
}

.cta-button.disabled,
.cta-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background: linear-gradient(135deg, #999 0%, #777 100%);
  box-shadow: none;
}

.cta-button.disabled:hover,
.cta-button:disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Legal Section */
.legal-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #fafafa;
}

.legal-link {
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.legal-link:hover {
  color: #ff5fa6;
}

.legal-dot {
  color: #ccc;
}

/* FAQs Section - Inline in info tab */
.faqs-section-inline {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  background: #fafafa;
  transition: all 0.3s ease;
}

.faqs-section-inline:hover {
  border-color: rgba(255, 95, 166, 0.2);
}

.faqs-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;
}

.faqs-toggle-btn:hover {
  background: rgba(255, 95, 166, 0.04);
}

.faqs-toggle-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.faqs-icon-wrapper-sm {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.25);
}

.faqs-toggle-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.faqs-toggle-title {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  background: linear-gradient(135deg, #ff5fa6, #ffba4b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.faqs-toggle-sub {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.1rem;
}

.faqs-chevron {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 95, 166, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #ff5fa6;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.faqs-chevron.rotated {
  transform: rotate(180deg);
  background: rgba(255, 95, 166, 0.2);
}

.faqs-content {
  border-top: 1px solid rgba(255, 95, 166, 0.1);
  padding: 1.25rem;
}

/* FAQs Section */
.faqs-section {
  padding: 3rem 1.5rem;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  position: relative;
}

.faqs-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, #ff5fa6, #ffba4b);
  border-image-slice: 1;
}

.faqs-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  box-shadow: 0 8px 25px rgba(255, 95, 166, 0.3);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.faqs-title-block {
  flex: 1;
}

.faqs-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.25rem;
  background: linear-gradient(135deg, #ff5fa6, #ffba4b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.faqs-subtitle {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

.faqs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.faq-item {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.faq-item:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.faq-item.open {
  box-shadow: 0 10px 35px rgba(255, 95, 166, 0.15);
}

.faq-question {
  width: 100%;
  padding: 1.25rem 1.5rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  /* Gradiente padrão caso não venha da API */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.faq-question::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.faq-question:hover::before {
  opacity: 1;
}

.faq-q-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  text-align: left;
}

.faq-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.faq-q-text {
  line-height: 1.4;
}

.faq-toggle-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.faq-toggle-icon.rotated {
  transform: rotate(180deg);
  background: rgba(255, 255, 255, 0.35);
}

.faq-answer {
  background: white;
  overflow: hidden;
}

.faq-answer-content {
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.faq-answer-icon {
  font-size: 1.5rem;
  color: #ff5fa6;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.faq-answer-content p {
  margin: 0;
  color: #555;
  line-height: 1.7;
  font-size: 0.95rem;
}

/* FAQ Expand Transition */
.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: all 0.3s ease;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.faq-expand-enter-to,
.faq-expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 250, 250, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  border-radius: 24px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(255, 154, 181, 0.2);
  border: 1px solid rgba(255, 154, 181, 0.15);
}

.modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  animation: bounce 0.6s ease;
}

@keyframes bounce {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem;
}

.modal-text {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-btn {
  flex: 1;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.modal-btn.cancel {
  background: #f0f0f0;
  color: #666;
}

.modal-btn.cancel:hover {
  background: #e0e0e0;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

.modal-btn.confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 95, 166, 0.4);
}

.modal-btn.cancel-attendance {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(238, 82, 83, 0.3);
}

.modal-btn.cancel-attendance:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(238, 82, 83, 0.4);
}

.modal-icon.cancel-icon {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

/* Responsive */
@media (max-width: 640px) {
  .hero-section {
    height: 320px;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-content {
    bottom: 20px;
    left: 16px;
    right: 16px;
  }

  .floating-actions {
    top: 16px;
    right: 16px;
  }

  .fab-btn {
    width: 42px;
    height: 42px;
    font-size: 1.1rem;
  }

  .countdown-item {
    padding: 0.5rem 0.75rem;
    min-width: 50px;
  }

  .countdown-value {
    font-size: 1.4rem;
  }

  .stats-bar {
    padding: 1rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .organizer-card {
    margin: 1rem;
    padding: 1rem;
  }

  .content-tabs {
    padding: 0 1rem;
  }

  .tab-content {
    padding: 0 1rem;
  }

  .map-container {
    height: 250px;
    border-radius: 16px;
  }

  .cta-section {
    flex-direction: column;
    text-align: center;
    padding: 1.25rem 1rem;
  }

  .cta-button {
    width: 100%;
    justify-content: center;
  }

  .faqs-section {
    padding: 2rem 1rem;
  }

  .faqs-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .faqs-title {
    font-size: 1.5rem;
  }

  .faq-question {
    padding: 1rem;
    font-size: 0.9rem;
  }

  .faq-icon {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .faq-answer-content {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    height: 280px;
  }

  .status-badge {
    top: 12px;
    left: 12px;
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }

  .category-pills {
    gap: 0.35rem;
  }

  .category-pill {
    font-size: 0.65rem;
    padding: 0.25rem 0.65rem;
  }

  .countdown-grid {
    gap: 0.25rem;
  }

  .countdown-item {
    padding: 0.4rem 0.5rem;
    min-width: 45px;
  }

  .countdown-value {
    font-size: 1.2rem;
  }

  .countdown-unit {
    font-size: 0.6rem;
  }

  .countdown-separator {
    font-size: 1.2rem;
  }

  .faqs-icon-wrapper {
    width: 50px;
    height: 50px;
    font-size: 1.6rem;
  }

  .faq-q-text {
    font-size: 0.85rem;
  }

  .faq-toggle-icon {
    width: 32px;
    height: 32px;
    font-size: 1.3rem;
  }

  .faqs-toggle-btn {
    padding: 1rem;
  }

  .faqs-icon-wrapper-sm {
    width: 38px;
    height: 38px;
    font-size: 1.2rem;
  }

  .faqs-toggle-title {
    font-size: 0.9rem;
  }

  .faqs-toggle-sub {
    font-size: 0.72rem;
  }

  .faqs-chevron {
    width: 32px;
    height: 32px;
    font-size: 1.2rem;
  }

  .faqs-content {
    padding: 0.85rem;
  }
}

@media (max-width: 360px) {
  .hero-section {
    height: 240px;
  }

  .hero-title {
    font-size: 1.2rem;
  }

  .hero-content {
    bottom: 14px;
    left: 12px;
    right: 12px;
  }

  .countdown-grid {
    flex-wrap: wrap;
    justify-content: center;
  }

  .countdown-item {
    min-width: 40px;
    padding: 0.35rem 0.4rem;
  }

  .countdown-value {
    font-size: 1rem;
  }

  .countdown-separator {
    font-size: 1rem;
  }

  .stat-icon {
    width: 30px;
    height: 30px;
    font-size: 0.85rem;
  }

  .stat-value {
    font-size: 0.95rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .stat-divider {
    height: 28px;
  }

  .organizer-avatar {
    width: 40px;
    height: 40px;
  }

  .follow-btn {
    padding: 0.45rem 0.9rem;
    font-size: 0.78rem;
  }

  .tab-btn {
    padding: 0.6rem 0.9rem;
    font-size: 0.8rem;
  }

  .cta-button {
    padding: 0.85rem 1.25rem;
    font-size: 0.95rem;
  }

  .location-icon-wrapper {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }

  .location-address {
    font-size: 0.9rem;
  }

  .faq-question {
    padding: 0.85rem;
    font-size: 0.82rem;
  }

  .faq-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .modal-content {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .modal-icon {
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .modal-actions {
    flex-direction: column;
  }
}

/* ---- Modal de Termos ---- */
.terms-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(255, 250, 250, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.terms-modal {
  background: linear-gradient(180deg, #fff5f5 0%, #fff0f3 50%, #ffeef2 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(255, 154, 181, 0.2);
  overflow: hidden;
  border: 1px solid rgba(255, 154, 181, 0.15);
}

.terms-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 154, 181, 0.15);
}

.terms-modal-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.terms-modal-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 154, 181, 0.1);
  color: #ff5fa6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terms-modal-close:hover {
  background: rgba(255, 154, 181, 0.2);
  color: #f97316;
}

.terms-modal-body {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
}

.terms-pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border: none;
}

.terms-modal-footer {
  display: flex;
  gap: 10px;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 154, 181, 0.15);
  justify-content: flex-end;
}

.terms-close-btn {
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #F978A3 0%, #f97316 100%);
  color: #fff;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(249, 120, 163, 0.3);
}

.terms-close-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(249, 120, 163, 0.4);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ─── Hero Image Placeholder ─────────────────────────────────────────────── */
.hero-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #999;
}

.hero-image-placeholder i {
  font-size: 4rem;
  opacity: 0.5;
}

.hero-image-placeholder p {
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.7;
  margin: 0;
}

/* ─── Source URL Section ─────────────────────────────────────────────────── */
.source-url-section {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fff8fa 0%, #f8f9ff 100%);
  border-top: 1px solid rgba(255, 95, 166, 0.1);
  border-bottom: 1px solid rgba(255, 95, 166, 0.1);
}

.source-url-full-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.25rem 1.5rem;
  border: 2px solid rgba(255, 95, 166, 0.2);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.05) 0%, rgba(255, 95, 166, 0.05) 100%);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.source-url-full-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.source-url-full-btn:hover::before {
  left: 100%;
}

.source-url-full-btn:hover {
  border-color: rgba(255, 95, 166, 0.4);
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1) 0%, rgba(255, 95, 166, 0.1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 95, 166, 0.15);
}

.source-url-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 1.3rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.source-url-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.25rem;
  text-align: left;
}

.source-url-label {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  letter-spacing: -0.01em;
}

.source-url-sublabel {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.source-url-arrow {
  font-size: 1.5rem;
  color: #ff5fa6;
  transition: transform 0.3s ease;
}

.source-url-full-btn:hover .source-url-arrow {
  transform: translateX(5px);
}

/* ─── CTA Buttons Adjustments ────────────────────────────────────────────── */
.cta-confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 25px rgba(255, 95, 166, 0.35);
}

.cta-confirm-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(255, 95, 166, 0.45);
}

.cta-confirm-btn:active {
  transform: translateY(0) scale(0.98);
}

.cta-confirm-btn.confirmed {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.35);
}

.cta-confirm-btn.confirmed:hover {
  box-shadow: 0 12px 35px rgba(76, 175, 80, 0.45);
}

.cta-confirm-btn.disabled,
.cta-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background: linear-gradient(135deg, #999 0%, #777 100%);
}

.cta-sublabel {
  font-size: 0.85rem;
  color: #888;
}

@media (max-width: 640px) {
  .source-url-full-btn {
    padding: 1rem 1.25rem;
  }

  .source-url-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }

  .source-url-label {
    font-size: 0.95rem;
  }

  .source-url-sublabel {
    font-size: 0.75rem;
  }

  .source-url-arrow {
    font-size: 1.2rem;
  }
}

/* ================================
   COMMENTS TAB STYLES
   ================================ */

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0 0.35rem;
  border-radius: 50%;
  margin-left: 0.35rem;
  box-sizing: border-box;
  border: 1px solid white;
}

.comments-panel {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 600px;
}

.comments-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 0;
}

.comments-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
  color: #888;
  font-size: 0.9rem;
}

.comments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.comments-empty .empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff5f8 0%, #f8f9ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.comments-empty .empty-icon i {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.comments-empty .empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.comments-empty .empty-sub {
  font-size: 0.9rem;
  color: #888;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.comment-item,
.reply-item {
  display: flex;
  gap: 0.75rem;
}

.comment-avatar-wrapper {
  flex-shrink: 0;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-avatar.small {
  width: 32px;
  height: 32px;
}

.comment-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.comment-avatar.small.placeholder {
  font-size: 0.85rem;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-bubble {
  background: #f5f5f5;
  border-radius: 16px;
  border-top-left-radius: 4px;
  padding: 0.75rem 1rem;
}

.comment-bubble.reply-bubble {
  background: #fafafa;
  border-radius: 12px;
  border-top-left-radius: 4px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.comment-admin-badge {
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.comment-time {
  font-size: 0.75rem;
  color: #999;
}

.comment-text {
  font-size: 0.9rem;
  color: #444;
  line-height: 1.5;
  margin: 0;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-left: 0.25rem;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.comment-action-btn:hover {
  background: #f0f0f0;
  color: #555;
}

.comment-action-btn.like-btn.active {
  color: #ff5fa6;
}

.comment-action-btn.delete-btn:hover {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.toggle-replies-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: #ff5fa6;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-top: 0.25rem;
  transition: all 0.2s ease;
}

.toggle-replies-btn:hover {
  color: #e6408f;
}

.replies-list {
  margin-top: 0.75rem;
  padding-left: 1rem;
  border-left: 2px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reply-input-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  background: #fafafa;
  border-radius: 12px;
  padding: 0.5rem;
}

.reply-input-area input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  padding: 0.5rem;
  outline: none;
}

.reply-cancel-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #eee;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.reply-cancel-btn:hover {
  background: #ddd;
}

.reply-send-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.reply-send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.reply-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Comment Input Section */
.comment-input-section {
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.comment-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;
}

.comment-input-wrapper:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(255, 95, 166, 0.2);
}

.comment-input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  padding: 0.5rem;
  outline: none;
}

.comment-input-wrapper input::placeholder {
  color: #aaa;
}

.send-comment-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-comment-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.4);
}

.send-comment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-comment-btn i {
  font-size: 1.2rem;
}

/* Responsive Comments */
@media (max-width: 640px) {
  .comments-panel {
    max-height: 500px;
  }

  .comment-avatar {
    width: 36px;
    height: 36px;
  }

  .comment-avatar.small {
    width: 28px;
    height: 28px;
  }

  .comment-bubble {
    padding: 0.6rem 0.8rem;
  }

  .comment-author {
    font-size: 0.85rem;
  }

  .comment-text {
    font-size: 0.85rem;
  }

  .comment-actions {
    gap: 0.5rem;
  }

  .comment-action-btn {
    font-size: 0.75rem;
    padding: 0.2rem 0.35rem;
  }

  .replies-list {
    padding-left: 0.75rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE FLOATING ACTION BAR
   ═══════════════════════════════════════════════════════════════════════════ */

.mobile-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 252, 254, 0.99) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 95, 166, 0.12);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.08);
  padding: 0.75rem 1rem;
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.mobile-action-bar.hidden {
  transform: translateY(100%);
  opacity: 0;
}

.mobile-action-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

.mobile-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: rgba(245, 245, 247, 0.9);
  color: #555;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.mobile-action-btn:active {
  transform: scale(0.92);
}

.mobile-action-btn.active {
  background: linear-gradient(135deg, rgba(255, 95, 166, 0.15) 0%, rgba(255, 186, 75, 0.15) 100%);
  color: #ff5fa6;
}

.mobile-action-btn.disabled,
.mobile-action-btn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.mobile-action-count {
  position: absolute;
  bottom: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255, 95, 166, 0.3);
}

.mobile-cta-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 48px;
  min-width: 140px;
  max-width: 200px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.35);
}

.mobile-cta-btn:active {
  transform: scale(0.96);
}

.mobile-cta-btn.not-going {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.35);
}

.mobile-cta-btn.disabled,
.mobile-cta-btn:disabled {
  background: linear-gradient(135deg, #999 0%, #777 100%);
  box-shadow: none;
  opacity: 0.6;
  pointer-events: none;
}

.mobile-cta-btn i {
  font-size: 1.1rem;
}

/* Mobile Actions Transition */
.mobile-actions-enter-active,
.mobile-actions-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-actions-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.mobile-actions-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ENHANCED RESPONSIVE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

/* Tablet & Small Desktop (max-width: 900px) */
@media (max-width: 900px) {
  .event-details-container {
    border-radius: 20px;
  }

  .hero-section {
    height: 340px;
  }

  .floating-actions {
    gap: 0.6rem;
  }

  .fab-btn {
    width: 44px;
    height: 44px;
    font-size: 1.15rem;
  }

  .stats-bar {
    padding: 1rem 0.75rem;
  }

  .countdown-item {
    padding: 0.6rem 0.9rem;
    min-width: 55px;
  }

  .countdown-value {
    font-size: 1.5rem;
  }
}

/* Mobile Large (max-width: 768px) */
@media (max-width: 768px) {
  .event-details-container {
    border-radius: 16px;
    margin-bottom: 80px;
  }

  .hero-section {
    height: 300px;
  }

  .hero-title {
    font-size: 1.6rem;
    line-height: 1.25;
  }

  .hero-content {
    bottom: 24px;
    left: 20px;
    right: 20px;
  }

  .floating-actions {
    top: 16px;
    right: 16px;
    gap: 0.5rem;
  }

  .fab-btn {
    width: 40px;
    height: 40px;
    font-size: 1.05rem;
  }

  .fab-count {
    min-width: 20px;
    height: 20px;
    font-size: 0.65rem;
    bottom: -6px;
    right: -6px;
  }

  .status-badge {
    top: 16px;
    left: 16px;
    font-size: 0.75rem;
    padding: 0.4rem 0.85rem;
  }

  .category-pills {
    gap: 0.4rem;
    margin-bottom: 0.75rem;
  }

  .category-pill {
    font-size: 0.7rem;
    padding: 0.3rem 0.75rem;
  }

  .countdown-section {
    padding: 1rem;
  }

  .countdown-grid {
    gap: 0.35rem;
  }

  .countdown-item {
    padding: 0.5rem 0.6rem;
    min-width: 48px;
    border-radius: 12px;
  }

  .countdown-value {
    font-size: 1.35rem;
  }

  .countdown-unit {
    font-size: 0.65rem;
  }

  .countdown-separator {
    font-size: 1.1rem;
  }

  .stats-bar {
    padding: 0.85rem 0.75rem;
    gap: 0.4rem;
  }

  .stat-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    font-size: 1rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .stat-divider {
    height: 32px;
  }

  .organizer-card {
    margin: 0.75rem;
    padding: 1rem;
    border-radius: 14px;
  }

  .organizer-avatar {
    width: 44px;
    height: 44px;
  }

  .organizer-name {
    font-size: 0.95rem;
  }

  .content-tabs {
    padding: 0 0.75rem;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
  }

  .tab-btn {
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
    border-radius: 10px;
    gap: 0.4rem;
    min-height: 44px;
  }

  .tab-btn i {
    font-size: 1.1rem;
  }

  .tab-content {
    padding: 0 0.75rem;
  }

  .info-card {
    padding: 1rem;
    border-radius: 14px;
  }

  .info-header {
    font-size: 0.85rem;
    gap: 0.5rem;
  }

  .info-header i {
    font-size: 1.1rem;
  }

  .info-value {
    font-size: 0.9rem;
  }

  .description-text {
    font-size: 0.9rem;
    line-height: 1.7;
  }

  .map-container {
    height: 220px;
    border-radius: 14px;
  }

  .location-card-modern {
    padding: 1.25rem;
    border-radius: 16px;
  }

  .location-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    font-size: 1.3rem;
  }

  .location-address {
    font-size: 0.95rem;
  }

  .map-button {
    padding: 0.85rem;
    font-size: 0.95rem;
    border-radius: 14px;
  }

  .lineup-card {
    padding: 0.85rem 1rem;
    border-radius: 14px;
  }

  .lineup-number {
    font-size: 1.3rem;
    min-width: 35px;
  }

  .lineup-name {
    font-size: 0.95rem;
  }

  .lineup-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  /* Hide desktop CTA on mobile */
  .cta-section {
    display: none;
  }

  .external-link-card {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
  }

  .external-link-btn {
    width: 100%;
    justify-content: center;
    padding: 0.85rem 1rem;
    border-radius: 10px;
  }

  .faqs-section-inline {
    border-radius: 14px;
  }

  .faqs-toggle-btn {
    padding: 1rem;
  }

  .faqs-icon-wrapper-sm {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    font-size: 1.2rem;
  }

  .faqs-content {
    padding: 1rem;
  }

  .faq-question {
    padding: 1rem;
    font-size: 0.9rem;
    border-radius: 12px;
  }

  .faq-icon {
    width: 38px;
    height: 38px;
    font-size: 1.1rem;
    border-radius: 8px;
  }

  .faq-answer-content {
    padding: 1rem;
    gap: 0.75rem;
  }

  /* Modal responsivo */
  .modal-content {
    padding: 1.75rem 1.5rem;
    border-radius: 20px;
    max-width: 90%;
    margin: 1rem;
  }

  .modal-icon {
    width: 70px;
    height: 70px;
    font-size: 2.2rem;
  }

  .modal-title {
    font-size: 1.35rem;
  }

  .modal-text {
    font-size: 0.9rem;
  }

  .modal-actions {
    gap: 0.75rem;
  }

  .modal-btn {
    padding: 0.85rem 1.25rem;
    font-size: 0.9rem;
    border-radius: 10px;
  }
}

/* Mobile Standard (max-width: 640px) */
@media (max-width: 640px) {
  .event-details-container {
    border-radius: 14px;
  }

  .hero-section {
    height: 260px;
  }

  .hero-title {
    font-size: 1.4rem;
  }

  .hero-content {
    bottom: 20px;
    left: 16px;
    right: 16px;
  }

  .floating-actions {
    top: 14px;
    right: 14px;
    flex-direction: row;
    gap: 0.4rem;
  }

  .fab-btn {
    width: 38px;
    height: 38px;
    font-size: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  }

  .fab-count {
    min-width: 18px;
    height: 18px;
    font-size: 0.6rem;
    bottom: -5px;
    right: -5px;
  }

  .status-badge {
    top: 14px;
    left: 14px;
    font-size: 0.7rem;
    padding: 0.35rem 0.7rem;
  }

  .category-pill {
    font-size: 0.65rem;
    padding: 0.25rem 0.6rem;
  }

  .countdown-grid {
    gap: 0.25rem;
  }

  .countdown-item {
    padding: 0.4rem 0.5rem;
    min-width: 42px;
    border-radius: 10px;
  }

  .countdown-value {
    font-size: 1.15rem;
  }

  .countdown-unit {
    font-size: 0.6rem;
  }

  .countdown-separator {
    font-size: 1rem;
  }

  .stats-bar {
    padding: 0.75rem 0.6rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .stats-bar::-webkit-scrollbar {
    display: none;
  }

  .stat-item {
    flex-shrink: 0;
  }

  .stat-icon {
    width: 34px;
    height: 34px;
    font-size: 0.95rem;
  }

  .stat-value {
    font-size: 1rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .organizer-card {
    margin: 0.6rem;
    padding: 0.85rem;
    gap: 0.75rem;
  }

  .organizer-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .organizer-label {
    font-size: 0.7rem;
  }

  .organizer-name {
    font-size: 0.9rem;
  }

  .content-tabs {
    padding: 0 0.6rem;
    gap: 0.35rem;
  }

  .tab-btn {
    padding: 0.55rem 0.85rem;
    font-size: 0.8rem;
    min-height: 42px;
  }

  .tab-btn span {
    display: none;
  }

  .tab-btn i {
    font-size: 1.2rem;
  }

  .tab-content {
    padding: 0 0.6rem;
  }

  .info-panel {
    gap: 0.75rem;
  }

  .info-card {
    padding: 0.85rem;
    border-radius: 12px;
  }

  .map-container {
    height: 180px;
    border-radius: 12px;
  }

  .location-card-modern {
    padding: 1rem;
    border-radius: 14px;
  }

  .location-icon-wrapper {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }

  .comments-panel {
    min-height: 350px;
    max-height: 450px;
  }

  .comment-input-section {
    padding: 0.85rem;
    position: sticky;
    bottom: 0;
    background: #fff;
    border-top: 1px solid #f0f0f0;
  }

  .comment-input-wrapper {
    border-radius: 22px;
    padding: 0.4rem 0.65rem;
  }

  .comment-input-wrapper input {
    font-size: 0.9rem;
    padding: 0.4rem;
  }

  .send-comment-btn {
    width: 36px;
    height: 36px;
  }

  .send-comment-btn i {
    font-size: 1.1rem;
  }
}

/* Mobile Small (max-width: 480px) */
@media (max-width: 480px) {
  .event-details-container {
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  }

  .hero-section {
    height: 220px;
  }

  .hero-title {
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .hero-content {
    bottom: 16px;
    left: 14px;
    right: 14px;
  }

  .floating-actions {
    top: 12px;
    right: 12px;
  }

  .fab-btn {
    width: 36px;
    height: 36px;
    font-size: 0.95rem;
  }

  .status-badge {
    top: 12px;
    left: 12px;
    font-size: 0.65rem;
    padding: 0.3rem 0.6rem;
    gap: 0.35rem;
  }

  .status-badge i {
    font-size: 0.8rem;
  }

  .category-pills {
    gap: 0.3rem;
    margin-bottom: 0.6rem;
  }

  .category-pill {
    font-size: 0.6rem;
    padding: 0.2rem 0.5rem;
  }

  .countdown-section {
    padding: 0.85rem;
  }

  .countdown-label {
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
  }

  .countdown-item {
    padding: 0.35rem 0.4rem;
    min-width: 38px;
    border-radius: 8px;
  }

  .countdown-value {
    font-size: 1rem;
  }

  .countdown-unit {
    font-size: 0.55rem;
    margin-top: 0.15rem;
  }

  .countdown-separator {
    font-size: 0.9rem;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .stat-value {
    font-size: 0.95rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .stat-divider {
    height: 26px;
  }

  .organizer-card {
    margin: 0.5rem;
    padding: 0.75rem;
    border-radius: 12px;
    gap: 0.6rem;
  }

  .organizer-avatar {
    width: 36px;
    height: 36px;
  }

  .content-tabs {
    padding: 0 0.5rem;
    gap: 0.3rem;
  }

  .tab-btn {
    padding: 0.5rem 0.7rem;
    min-height: 40px;
    border-radius: 8px;
  }

  .tab-btn i {
    font-size: 1.15rem;
  }

  .tab-content {
    padding: 0 0.5rem;
  }

  .info-card {
    padding: 0.75rem;
    border-radius: 10px;
  }

  .info-header {
    font-size: 0.8rem;
  }

  .info-header i {
    font-size: 1rem;
  }

  .info-value,
  .description-text {
    font-size: 0.85rem;
  }

  .map-container {
    height: 160px;
    border-radius: 10px;
  }

  .location-card-modern {
    padding: 0.85rem;
    border-radius: 12px;
    gap: 0.75rem;
  }

  .location-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    font-size: 1.1rem;
  }

  .location-label {
    font-size: 0.7rem;
  }

  .location-address {
    font-size: 0.85rem;
  }

  .map-button {
    padding: 0.75rem;
    font-size: 0.9rem;
    border-radius: 10px;
    gap: 0.5rem;
  }

  .lineup-card {
    padding: 0.75rem;
    border-radius: 12px;
    gap: 0.75rem;
  }

  .lineup-number {
    font-size: 1.1rem;
    min-width: 30px;
  }

  .lineup-name {
    font-size: 0.9rem;
  }

  .lineup-icon {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .external-link-card {
    padding: 0.85rem;
    border-radius: 12px;
  }

  .external-link-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    font-size: 1.2rem;
  }

  .external-link-title {
    font-size: 0.9rem;
  }

  .external-link-desc {
    font-size: 0.75rem;
  }

  .external-link-btn {
    padding: 0.75rem 0.85rem;
    font-size: 0.85rem;
    border-radius: 8px;
  }

  .faqs-toggle-btn {
    padding: 0.85rem;
  }

  .faqs-icon-wrapper-sm {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
    border-radius: 8px;
  }

  .faqs-toggle-title {
    font-size: 0.85rem;
  }

  .faqs-toggle-sub {
    font-size: 0.7rem;
  }

  .faqs-chevron {
    width: 30px;
    height: 30px;
    font-size: 1.1rem;
  }

  .faqs-content {
    padding: 0.75rem;
  }

  .faq-item {
    border-radius: 10px;
  }

  .faq-question {
    padding: 0.8rem;
    font-size: 0.82rem;
    border-radius: 10px;
  }

  .faq-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
    border-radius: 6px;
  }

  .faq-toggle-icon {
    width: 28px;
    height: 28px;
    font-size: 1.1rem;
  }

  .faq-answer-content {
    padding: 0.85rem;
  }

  .faq-answer-content p {
    font-size: 0.85rem;
  }

  .faq-answer-icon {
    font-size: 1.2rem;
  }

  /* Mobile action bar ajustes */
  .mobile-action-bar {
    padding: 0.65rem 0.85rem;
  }

  .mobile-action-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    font-size: 1.1rem;
  }

  .mobile-cta-btn {
    height: 44px;
    font-size: 0.9rem;
    border-radius: 12px;
    min-width: 120px;
  }

  /* Modal */
  .modal-content {
    padding: 1.5rem 1.25rem;
    margin: 0.75rem;
    border-radius: 18px;
  }

  .modal-icon {
    width: 60px;
    height: 60px;
    font-size: 1.8rem;
    margin-bottom: 1.25rem;
  }

  .modal-title {
    font-size: 1.2rem;
  }

  .modal-text {
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }

  .modal-btn {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }
}

/* Very Small Mobile (max-width: 360px) */
@media (max-width: 360px) {
  .hero-section {
    height: 180px;
  }

  .hero-title {
    font-size: 1.05rem;
  }

  .hero-content {
    bottom: 12px;
    left: 12px;
    right: 12px;
  }

  .floating-actions {
    top: 10px;
    right: 10px;
    gap: 0.3rem;
  }

  .fab-btn {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .fab-count {
    min-width: 16px;
    height: 16px;
    font-size: 0.55rem;
    bottom: -4px;
    right: -4px;
  }

  .status-badge {
    top: 10px;
    left: 10px;
    font-size: 0.6rem;
    padding: 0.25rem 0.5rem;
  }

  .category-pill {
    font-size: 0.55rem;
    padding: 0.15rem 0.4rem;
  }

  .countdown-section {
    padding: 0.7rem;
  }

  .countdown-item {
    min-width: 34px;
    padding: 0.3rem;
  }

  .countdown-value {
    font-size: 0.9rem;
  }

  .countdown-unit {
    font-size: 0.5rem;
  }

  .stats-bar {
    padding: 0.6rem 0.5rem;
    gap: 0.3rem;
  }

  .stat-icon {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 0.85rem;
  }

  .stat-label {
    font-size: 0.6rem;
  }

  .stat-item {
    gap: 0.5rem;
  }

  .organizer-card {
    margin: 0.4rem;
    padding: 0.65rem;
  }

  .organizer-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .content-tabs {
    padding: 0 0.4rem;
  }

  .tab-btn {
    padding: 0.4rem 0.6rem;
    min-height: 38px;
  }

  .tab-btn i {
    font-size: 1.1rem;
  }

  .tab-content {
    padding: 0 0.4rem;
  }

  .info-card {
    padding: 0.65rem;
  }

  .map-container {
    height: 140px;
  }

  .location-card-modern {
    padding: 0.7rem;
  }

  .location-icon-wrapper {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .map-button {
    padding: 0.65rem;
    font-size: 0.85rem;
  }

  /* Modal compacto */
  .modal-content {
    padding: 1.25rem 1rem;
    margin: 0.5rem;
    border-radius: 16px;
  }

  .modal-icon {
    width: 54px;
    height: 54px;
    font-size: 1.6rem;
  }

  .modal-title {
    font-size: 1.1rem;
  }

  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .mobile-action-bar {
    padding: 0.5rem 0.6rem;
  }

  .mobile-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 1rem;
  }

  .mobile-cta-btn {
    height: 40px;
    font-size: 0.85rem;
    min-width: 100px;
    border-radius: 10px;
  }

  .mobile-cta-btn i {
    font-size: 1rem;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOUCH DEVICE OPTIMIZATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

@media (hover: none) and (pointer: coarse) {
  /* Aumenta áreas de toque */
  .fab-btn,
  .tab-btn,
  .mobile-action-btn,
  .mobile-cta-btn,
  .map-button,
  .external-link-btn,
  .faq-question,
  .modal-btn {
    min-height: 44px;
    min-width: 44px;
  }

  /* Remove hover effects em touch devices */
  .fab-btn:hover,
  .tab-btn:hover,
  .info-card:hover,
  .lineup-card:hover,
  .faq-item:hover {
    transform: none;
    box-shadow: inherit;
  }

  /* Active states para feedback visual */
  .fab-btn:active {
    transform: scale(0.92);
    transition: transform 0.1s ease;
  }

  .tab-btn:active {
    transform: scale(0.96);
    background: rgba(255, 95, 166, 0.15);
  }

  .info-card:active,
  .lineup-card:active {
    transform: scale(0.98);
  }

  .faq-question:active {
    opacity: 0.9;
  }

  .map-button:active,
  .external-link-btn:active {
    transform: scale(0.97);
  }

  /* Scroll momentum */
  .content-tabs,
  .stats-bar,
  .comments-list-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  /* Safe area insets */
  .mobile-action-bar {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LANDSCAPE MOBILE OPTIMIZATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

@media (max-height: 500px) and (orientation: landscape) {
  .hero-section {
    height: 150px;
  }

  .hero-title {
    font-size: 1rem;
  }

  .floating-actions {
    flex-direction: row;
    top: 8px;
    right: 8px;
    gap: 0.3rem;
  }

  .fab-btn {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .countdown-section {
    padding: 0.6rem;
  }

  .countdown-item {
    padding: 0.3rem 0.4rem;
    min-width: 36px;
  }

  .countdown-value {
    font-size: 0.9rem;
  }

  .stats-bar {
    padding: 0.5rem;
  }

  .organizer-card {
    margin: 0.4rem;
    padding: 0.5rem 0.75rem;
  }

  .content-tabs {
    margin-bottom: 0.5rem;
  }

  .mobile-action-bar {
    padding: 0.35rem 0.6rem;
    padding-bottom: max(0.35rem, env(safe-area-inset-bottom));
  }

  .mobile-action-btn {
    width: 34px;
    height: 34px;
  }

  .mobile-cta-btn {
    height: 38px;
    font-size: 0.8rem;
  }

  .modal-content {
    max-height: 85vh;
    overflow-y: auto;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRINT STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

@media print {
  .mobile-action-bar,
  .floating-actions,
  .cta-section,
  .modal-overlay,
  .terms-modal-overlay {
    display: none !important;
  }

  .event-details-container {
    box-shadow: none;
    border-radius: 0;
    margin-bottom: 0;
  }

  .hero-section {
    height: auto;
    page-break-inside: avoid;
  }

  .hero-image {
    max-height: 300px;
    object-fit: contain;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REDUCED MOTION PREFERENCES
   ═══════════════════════════════════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .mobile-action-bar {
    transition: none;
  }

  .fab-btn,
  .tab-btn,
  .info-card,
  .lineup-card {
    transition: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HIGH CONTRAST MODE
   ═══════════════════════════════════════════════════════════════════════════ */

@media (prefers-contrast: high) {
  .tab-btn.active {
    outline: 2px solid #000;
  }

  .mobile-cta-btn {
    outline: 2px solid #fff;
    outline-offset: -2px;
  }

  .fab-btn:focus,
  .tab-btn:focus,
  .mobile-action-btn:focus,
  .mobile-cta-btn:focus {
    outline: 3px solid #000;
    outline-offset: 2px;
  }
}
</style>
