<script setup lang="ts">
  import type { NavItem } from '@/types/navigation'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { callApi } from '@/api'
  import { getUserInterests, getUserProfile, updateUserProfile, uploadBannerImage, uploadProfileImage } from '@/api/users'
  import AppFooter from '@/components/AppFooter.vue'
  import FeedSidebarNav from '@/components/modules/Feed/FeedSidebarNav.vue'
  import FeedTopHeader from '@/components/modules/Feed/FeedTopHeader.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import { useAuth } from '@/composables/useAuth'
  import { AuthService } from '@/services/auth'
  import { useEventsStore } from '@/stores/events'

  const { t } = useI18n()
  const router = useRouter()
  const { loggedUser, updateUser } = useAuth()
  const eventsStore = useEventsStore()

  // ── Loading state ──
  const loading = ref(true)
  const error = ref<string | null>(null)
  const uploadingAvatar = ref(false)
  const uploadingBanner = ref(false)

  // ── Snackbar ──
  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref('#22c55e')

  function showSnackbar (message: string, color = '#22c55e') {
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

  // ── Avatar colors para fallback ──
  const avatarColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  ]

  function getAvatarColor (name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash % avatarColors.length)
    return avatarColors[index] ?? '#F44336'
  }

  function getInitials (name: string): string {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0]?.charAt(0) || '').toUpperCase() + (parts.at(-1)?.charAt(0) || '').toUpperCase()
    }
    return (name.charAt(0) || 'U').toUpperCase()
  }

  // ── User data (reactive for editing) ──
  // Inicializa com os dados do loggedUser (dados salvos durante o login)
  const user = reactive({
    name: loggedUser.value?.name || '',
    username: loggedUser.value?.username ? `@${loggedUser.value.username}` : '',
    avatar: loggedUser.value?.profileImage || '',
    banner: '',
    bio: '',
    location: '',
    joined: '',
    stats: {
      following: 0,
      followers: 0,
    },
  })

  // Watch loggedUser — só refaz o fetch se o ID do usuário mudou (evita loop infinito)
  watch(() => loggedUser.value?.id, (newId, oldId) => {
    if (newId && newId !== oldId) {
      user.name = loggedUser.value?.name || ''
      user.username = loggedUser.value?.username ? `@${loggedUser.value.username}` : ''
      user.avatar = loggedUser.value?.profileImage || ''
      fetchUserProfile()
    }
  })

  onMounted(async () => {
    if (loggedUser.value?.id) {
      await fetchUserProfile()
      await fetchLikedEvents()
    } else {
      error.value = 'Usuário não autenticado'
      loading.value = false
    }
  })

  // ── User interests ──
  interface UserInterest {
    id: string
    name: string
  }
  const userInterests = ref<UserInterest[]>([])

  // ── Computed para verificar se tem avatar ──
  const hasAvatar = computed(() => {
    return user.avatar && user.avatar.trim() !== '' && !user.avatar.includes('pravatar')
  })

  const hasBanner = computed(() => {
    return user.banner && user.banner.trim() !== '' && !user.banner.includes('unsplash')
  })

  // ── File inputs refs ──
  const avatarInputRef = ref<HTMLInputElement | null>(null)
  const bannerInputRef = ref<HTMLInputElement | null>(null)
  const modalAvatarInputRef = ref<HTMLInputElement | null>(null)
  const modalBannerInputRef = ref<HTMLInputElement | null>(null)

  // ── Avatar Cropper ──
  const showCropModal = ref(false)
  const cropImageSrc = ref('')
  const cropZoom = ref(1)
  const cropOffset = reactive({ x: 0, y: 0 })
  const cropDragging = ref(false)
  const cropDragStart = reactive({ x: 0, y: 0 })
  const cropOffsetStart = reactive({ x: 0, y: 0 })
  const cropImageNatural = reactive({ width: 0, height: 0 })
  let pendingAvatarInput: HTMLInputElement | null = null

  // Container = 300px, circle area inside
  const CROP_CONTAINER = 300

  // Base display size: image fits entirely inside the container (contain)
  function getBaseSize () {
    const { width: nw, height: nh } = cropImageNatural
    if (!nw || !nh) return { w: CROP_CONTAINER, h: CROP_CONTAINER }
    const aspect = nw / nh
    if (aspect >= 1) {
      return { w: CROP_CONTAINER, h: CROP_CONTAINER / aspect }
    }
    return { w: CROP_CONTAINER * aspect, h: CROP_CONTAINER }
  }

  function clampOffset (ox: number, oy: number, zoom: number) {
    const base = getBaseSize()
    const scaledW = base.w * zoom
    const scaledH = base.h * zoom
    // Garantir que o círculo (CROP_CONTAINER) nunca veja fora da imagem
    const maxX = Math.max(0, (scaledW - CROP_CONTAINER) / 2)
    const maxY = Math.max(0, (scaledH - CROP_CONTAINER) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    }
  }

  // Zoom mínimo para que a imagem cubra o círculo inteiro
  const cropMinZoom = computed(() => {
    const base = getBaseSize()
    const minDim = Math.min(base.w, base.h)
    return minDim > 0 ? CROP_CONTAINER / minDim : 1
  })

  function openCropModal (imageSrc: string, input: HTMLInputElement) {
    cropImageSrc.value = imageSrc
    pendingAvatarInput = input
    cropOffset.x = 0
    cropOffset.y = 0

    const img = new Image()
    img.addEventListener('load', () => {
      cropImageNatural.width = img.naturalWidth
      cropImageNatural.height = img.naturalHeight
      // Inicia com zoom mínimo (imagem cobrindo o círculo)
      cropZoom.value = cropMinZoom.value
      showCropModal.value = true
    })
    img.src = imageSrc
  }

  function closeCropModal () {
    showCropModal.value = false
    cropImageSrc.value = ''
    if (pendingAvatarInput) {
      pendingAvatarInput.value = ''
      pendingAvatarInput = null
    }
  }

  // Watch zoom para clampar offset e respeitar mínimo
  watch(cropZoom, newZoom => {
    if (newZoom < cropMinZoom.value) {
      cropZoom.value = cropMinZoom.value
    }
    const clamped = clampOffset(cropOffset.x, cropOffset.y, cropZoom.value)
    cropOffset.x = clamped.x
    cropOffset.y = clamped.y
  })

  function onCropMouseDown (e: MouseEvent) {
    cropDragging.value = true
    cropDragStart.x = e.clientX
    cropDragStart.y = e.clientY
    cropOffsetStart.x = cropOffset.x
    cropOffsetStart.y = cropOffset.y
  }

  function onCropMouseMove (e: MouseEvent) {
    if (!cropDragging.value) return
    const raw = {
      x: cropOffsetStart.x + (e.clientX - cropDragStart.x),
      y: cropOffsetStart.y + (e.clientY - cropDragStart.y),
    }
    const clamped = clampOffset(raw.x, raw.y, cropZoom.value)
    cropOffset.x = clamped.x
    cropOffset.y = clamped.y
  }

  function onCropMouseUp () {
    cropDragging.value = false
  }

  function onCropTouchStart (e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch || e.touches.length !== 1) return
    cropDragging.value = true
    cropDragStart.x = touch.clientX
    cropDragStart.y = touch.clientY
    cropOffsetStart.x = cropOffset.x
    cropOffsetStart.y = cropOffset.y
  }

  function onCropTouchMove (e: TouchEvent) {
    const touch = e.touches[0]
    if (!cropDragging.value || !touch || e.touches.length !== 1) return
    e.preventDefault()
    const raw = {
      x: cropOffsetStart.x + (touch.clientX - cropDragStart.x),
      y: cropOffsetStart.y + (touch.clientY - cropDragStart.y),
    }
    const clamped = clampOffset(raw.x, raw.y, cropZoom.value)
    cropOffset.x = clamped.x
    cropOffset.y = clamped.y
  }

  function onCropTouchEnd () {
    cropDragging.value = false
  }

  // Estilo computado da imagem no crop
  const cropImageStyle = computed(() => {
    const base = getBaseSize()
    const z = cropZoom.value
    const w = base.w * z
    const h = base.h * z
    return {
      width: `${w}px`,
      height: `${h}px`,
      left: `${(CROP_CONTAINER - w) / 2 + cropOffset.x}px`,
      top: `${(CROP_CONTAINER - h) / 2 + cropOffset.y}px`,
    }
  })

  async function confirmCrop () {
    const canvas = document.createElement('canvas')
    const outputSize = 512
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = cropImageSrc.value

    await new Promise<void>(resolve => {
      img.addEventListener('load', () => resolve())
      if (img.complete) resolve()
    })

    const base = getBaseSize()
    const z = cropZoom.value
    const scaledW = base.w * z
    const scaledH = base.h * z

    // Posição da imagem no container
    const imgLeft = (CROP_CONTAINER - scaledW) / 2 + cropOffset.x
    const imgTop = (CROP_CONTAINER - scaledH) / 2 + cropOffset.y

    // Mapear o quadrado do container (0,0 → CROP_CONTAINER,CROP_CONTAINER) para coordenadas da imagem original
    const scaleToNatX = img.naturalWidth / scaledW
    const scaleToNatY = img.naturalHeight / scaledH

    const srcX = -imgLeft * scaleToNatX
    const srcY = -imgTop * scaleToNatY
    const srcW = CROP_CONTAINER * scaleToNatX
    const srcH = CROP_CONTAINER * scaleToNatY

    // Clip circular
    ctx.beginPath()
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize)

    canvas.toBlob(async blob => {
      if (!blob) return
      const croppedFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' })

      try {
        uploadingAvatar.value = true
        showCropModal.value = false

        await uploadProfileImage(croppedFile)
        await fetchUserProfile()

        showSnackbar('Foto de perfil atualizada com sucesso! 🎉')
      } catch (error_: any) {
        const errorMessage = error_.message || 'Erro ao fazer upload da foto. Tente novamente.'
        showSnackbar(errorMessage, '#ef4444')
      } finally {
        uploadingAvatar.value = false
        if (pendingAvatarInput) {
          pendingAvatarInput.value = ''
          pendingAvatarInput = null
        }
      }
    }, 'image/jpeg', 0.9)
  }

  // ── Fetch user profile data ──
  async function fetchUserProfile () {
    if (!loggedUser.value?.id) {
      error.value = 'Usuário não autenticado'
      loading.value = false
      return
    }

    try {
      loading.value = true
      error.value = null
      const response = await getUserProfile(loggedUser.value.id)
      // A API retorna { success, data: { ...camposDoUsuario } }
      const userData = response.data?.data ?? response.data

      // Popula os dados do usuário, mantendo dados do loggedUser como fallback
      user.name = userData.name || loggedUser.value?.name || ''
      user.username = userData.username ? `@${userData.username}` : (loggedUser.value?.username ? `@${loggedUser.value.username}` : '')
      user.avatar = userData.profilePhoto || userData.profileImage || userData.avatar || loggedUser.value?.profileImage || ''
      user.banner = userData.profileCoverImage || userData.coverPhoto || userData.banner || userData.bannerImage || ''
      user.bio = userData.bio || ''
      user.location = userData.location || ''
      user.joined = userData.createdAt ? formatJoinDate(userData.createdAt) : ''
      user.stats.following = userData.followingCount || userData.stats?.following || 0
      user.stats.followers = userData.followersCount || userData.stats?.followers || 0

      // Sincroniza com localStorage para manter consistência em todas as páginas
      updateUser({
        name: userData.name || '',
        username: userData.username || '',
        profileImage: userData.profilePhoto || userData.profileImage || userData.avatar || '',
      })

      // Busca os interesses do usuário
      await fetchUserInterests()
    } catch {
      error.value = 'Erro ao carregar dados do perfil'
    } finally {
      loading.value = false
    }
  }

  // ── Fetch user interests ──
  async function fetchUserInterests () {
    try {
      const response = await getUserInterests()
      const data = response.data

      // Tenta extrair interesses de diferentes estruturas
      if (data?.data?.interests) {
        userInterests.value = data.data.interests
      } else if (data?.interests) {
        userInterests.value = data.interests
      } else if (Array.isArray(data?.data)) {
        userInterests.value = data.data
      } else if (Array.isArray(data)) {
        userInterests.value = data
      } else {
        userInterests.value = []
      }
    } catch {
      userInterests.value = []
    }
  }

  // ── Format join date ──
  function formatJoinDate (dateString: string): string {
    const date = new Date(dateString)
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ]
    return `${months[date.getMonth()]} de ${date.getFullYear()}`
  }

  // ── Format short date for mini cards ──
  function formatShortDate (dateString: string): string {
    try {
      const date = new Date(dateString)
      if (Number.isNaN(date.getTime())) return 'Em breve'

      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      return `${day}/${month}`
    } catch {
      return 'Em breve'
    }
  }

  // ── Upload handlers ──
  function triggerAvatarUpload () {
    avatarInputRef.value?.click()
  }

  function triggerBannerUpload () {
    bannerInputRef.value?.click()
  }

  function triggerModalAvatarUpload () {
    modalAvatarInputRef.value?.click()
  }

  function triggerModalBannerUpload () {
    modalBannerInputRef.value?.click()
  }

  async function handleAvatarChange (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    // Validação do arquivo
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      showSnackbar('A imagem deve ter no máximo 5MB', '#ef4444')
      input.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      showSnackbar('Por favor, selecione apenas arquivos de imagem', '#ef4444')
      input.value = ''
      return
    }

    // Abre o modal de crop em vez de fazer upload direto
    const reader = new FileReader()
    reader.addEventListener('load', e => {
      const result = (e.target as FileReader)?.result as string
      if (result) {
        openCropModal(result, input)
      }
    })
    reader.readAsDataURL(file)
  }

  async function handleBannerChange (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    // Validação do arquivo
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      showSnackbar('A imagem deve ter no máximo 5MB', '#ef4444')
      input.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      showSnackbar('Por favor, selecione apenas arquivos de imagem', '#ef4444')
      input.value = ''
      return
    }

    try {
      uploadingBanner.value = true

      await uploadBannerImage(file)

      // Recarrega o perfil para pegar as URLs atualizadas do servidor
      await fetchUserProfile()

      showSnackbar('Capa atualizada com sucesso! 🎉')
    } catch (error_: any) {
      const errorMessage = error_.message || 'Erro ao fazer upload da capa. Tente novamente.'
      showSnackbar(errorMessage, '#ef4444')
    } finally {
      uploadingBanner.value = false
      input.value = ''
    }
  }

  // ── Navigation ──
  const activeNav = ref('profile')

  const navItems = computed<NavItem[]>(() => [
    { id: 'home', label: t('feed.nav.home'), icon: 'home' },
    { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
    { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
    { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
  ])

  function handleNavSelect (id: string) {
    if (id === 'home' || id === 'top-events' || id === 'favorites') {
      router.push({ path: '/private/feed', query: { tab: id } })
    }
  }

  // ── Tabs ──
  const activeTab = ref('liked')
  const tabs = [
    // { id: 'badges', label: 'Conquistas', icon: 'mdi-trophy-outline' }, // Comentado - não será usado no primeiro momento
    { id: 'liked', label: 'Curtidos', icon: 'mdi-heart-outline' },
    // Aba Favoritos removida do projeto
    { id: 'settings', label: 'Preferências', icon: 'mdi-cog-outline' },
  ]

  // Refetch liked events quando entra na aba
  watch(activeTab, val => {
    if (val === 'liked') {
      fetchLikedEvents()
    }
  })

  // Watch no store para atualizar quando curte/descurte no feed
  watch(() => eventsStore.likedEvents.length, () => {
    if (activeTab.value === 'liked') {
      fetchLikedEvents()
    }
  })

  // Comentado - não usado no primeiro momento
  // const badges = [
  //   { icon: 'mdi-party-popper', color: '#FF4081', name: 'Party Animal', desc: 'Foi em 10 festas este mês' },
  //   { icon: 'mdi-map-marker-check', color: '#7C4DFF', name: 'Explorador', desc: 'Visitou 5 locais diferentes' },
  //   { icon: 'mdi-fire', color: '#FF9800', name: 'Em Chamas', desc: 'Sequência de 3 finais de semana' },
  //   { icon: 'mdi-crown', color: '#FFD700', name: 'VIP', desc: 'Membro premium da comunidade' },
  // ]

  // ── Edit Profile Modal ──
  const showEditModal = ref(false)
  const editForm = reactive({
    name: '',
    username: '',
    bio: '',
    location: '',
  })
  const saving = ref(false)

  function openEditModal () {
    editForm.name = user.name
    editForm.username = user.username.replace('@', '')
    editForm.bio = user.bio
    editForm.location = user.location
    showEditModal.value = true
  }

  function closeEditModal () {
    showEditModal.value = false
  }

  async function saveProfile () {
    saving.value = true
    try {
      const userId = loggedUser.value?.id
      if (!userId) {
        throw new Error('ID do usuário não encontrado')
      }
      await updateUserProfile(userId, {
        name: editForm.name,
        username: editForm.username.replace('@', ''),
        bio: editForm.bio,
        location: editForm.location,
      })

      user.name = editForm.name
      user.username = `@${editForm.username.replace('@', '')}`
      user.bio = editForm.bio
      user.location = editForm.location
      showEditModal.value = false

      // Sincroniza com localStorage para manter consistência
      updateUser({
        name: editForm.name,
        username: editForm.username.replace('@', ''),
      })

      showSnackbar('Perfil atualizado com sucesso! ✅')
    } catch {
      showSnackbar('Erro ao salvar perfil. Tente novamente.', '#ef4444')
    } finally {
      saving.value = false
    }
  }

  // ── Settings toggles ──
  const settingsNotifications = ref(true)

  // ── Liked events ──
  interface LikedEventItem {
    id: string | number
    banner: string
    creator: { name: string }
    hostAvatar: string
    schedule: string
    location?: string
    title: string
    description: string
    confirmed: number
    interested: number
    likes?: number
    interests?: string[]
    commentsCount?: number
  }
  const likedEventsItems = ref<LikedEventItem[]>([])
  const loadingLiked = ref(false)
  const displayLimit = ref(5)

  const displayedLikedEvents = computed(() => {
    return likedEventsItems.value.slice(0, displayLimit.value)
  })

  const hasMoreEvents = computed(() => {
    return likedEventsItems.value.length > displayLimit.value
  })

  function showMoreEvents () {
    displayLimit.value += 5
  }

  // ── Helpers para eventos curtidos ──
  function extractEventsFromResponse (data: any): any[] {
    if (data?.data?.events && Array.isArray(data.data.events)) return data.data.events
    if (data?.data?.items && Array.isArray(data.data.items)) return data.data.items
    if (data?.events && Array.isArray(data.events)) return data.events
    if (data?.items && Array.isArray(data.items)) return data.items
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data)) return data
    return []
  }

  function mapLikedEvent (evt: any): LikedEventItem {
    const rawBanner = evt.bannerUrl || evt.banner || (Array.isArray(evt.photos) ? evt.photos[0] : '') || ''
    const hostName = evt.organizer?.name || evt.hostName || evt.creator?.name || 'Organizador'
    const resolveSchedule = (e: any): string => {
      const candidates = [e.date, e.startDate, e.dateTime, e.startAt, e.eventDate, e.start_date, e.schedule]
      for (const val of candidates) {
        if (!val) continue
        const parsed = new Date(val)
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        }
      }
      return 'Data a definir'
    }
    return {
      id: evt.id,
      banner: rawBanner,
      creator: { name: hostName },
      hostAvatar: evt.organizer?.avatar || evt.hostAvatar || evt.creator?.profileImage || '',
      schedule: resolveSchedule(evt),
      location: evt.location || evt.address || 'Local a definir',
      title: evt.name || evt.title || 'Evento',
      description: evt.description || '',
      confirmed: evt.confirmedCount || evt._count?.attendances || 0,
      interested: evt.interestedCount || 0,
      likes: evt.likesCount || evt.likes || evt._count?.likes || 0,
      interests: (evt.eventInterests || evt.interests || evt.categories || []).map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name).filter(Boolean),
      commentsCount: evt.commentsCount ?? evt._count?.comments ?? 0,
    }
  }

  async function fetchLikedEvents () {
    loadingLiked.value = true
    try {
      // Tenta endpoints de listagem bulk primeiro
      const endpoints = [
        '/users/liked-events',
        '/users/likes',
        '/events/liked-by-me',
        '/events/my-likes',
      ]

      let events: any[] = []
      let bulkSuccess = false

      for (const endpoint of endpoints) {
        try {
          const response = await callApi('GET', `${endpoint}?page=1&limit=50`, {}, true)
          const extracted = extractEventsFromResponse(response.data)
          if (extracted.length > 0 || response.status === 200) {
            events = extracted
            bulkSuccess = true
            break
          }
        } catch {
        // endpoint não disponível, tenta próximo
        }
      }

      // Fallback: busca cada evento pelo ID salvo no localStorage
      if (!bulkSuccess) {
        const likedIds = eventsStore.likedEvents

        const results = await Promise.allSettled(
          likedIds.map(id => callApi('GET', `/events/${id}`, {}, true)),
        )

        events = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map(r => r.value?.data?.data ?? r.value?.data ?? r.value)
          .filter(e => e && e.id)
      }

      likedEventsItems.value = events.map(evt => mapLikedEvent(evt))
    } catch (error_) {
      console.error('Erro ao buscar eventos curtidos:', error_)
      likedEventsItems.value = []
    } finally {
      loadingLiked.value = false
    }
  }

  // Removido - não é mais usado com mini cards
  // async function handleToggleSaveLiked (item: LikedEventItem) {
  //   await eventsStore.toggleSave({
  //     id: item.id,
  //     banner: item.banner,
  //     creator: item.creator,
  //     hostAvatar: item.hostAvatar,
  //     schedule: item.schedule,
  //     location: item.location,
  //     title: item.title,
  //     description: item.description,
  //     confirmed: item.confirmed,
  //     interested: item.interested,
  //     likes: item.likes,
  //     interests: item.interests,
  //   })
  // }

  function handleLogout () {
    AuthService.logout()
    router.push('/public/Login')
  }

  function handleBackNavigation () {
    router.push({ path: '/private/feed', query: { tab: 'favorites' } })
  }
</script>

<template>
  <div class="profile-page-layout">
    <FeedTopHeader :user="user" />

    <section class="layout-shell">
      <FeedSidebarNav :active="activeNav" class="layout-sidebar" :items="navItems" @select="handleNavSelect" />

      <!-- Main Content -->
      <main class="layout-main">
        <!-- Breadcrumb -->
        <div class="breadcrumb-nav">
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
          <span class="breadcrumb-current">{{ t('feed.nav.profile') }}</span>
        </div>

        <!-- Profile Header Card -->
        <div class="profile-card">
          <!-- Hidden file inputs -->
          <input
            ref="bannerInputRef"
            accept="image/*"
            hidden
            type="file"
            @change="handleBannerChange"
          >
          <input
            ref="avatarInputRef"
            accept="image/*"
            hidden
            type="file"
            @change="handleAvatarChange"
          >

          <div
            class="cover-image"
            :class="{ 'no-banner': !hasBanner }"
            :style="hasBanner ? { backgroundImage: `url(${user.banner})` } : {}"
          >
            <div class="overlay" />
            <button
              class="cover-edit-btn"
              :disabled="uploadingBanner"
              title="Alterar capa"
              @click="triggerBannerUpload"
            >
              <i v-if="uploadingBanner" class="mdi mdi-loading mdi-spin" />
              <i v-else class="mdi mdi-camera-outline" />
            </button>
          </div>

          <div class="profile-content">
            <div class="avatar-section">
              <div class="avatar-wrapper" @click="triggerAvatarUpload">
                <!-- Avatar com imagem -->
                <img v-if="hasAvatar" :alt="user.name" class="avatar-img" :src="user.avatar">
                <!-- Avatar com iniciais (fallback) -->
                <div
                  v-else
                  class="avatar-img avatar-placeholder"
                  :style="{ backgroundColor: getAvatarColor(user.name) }"
                >
                  {{ getInitials(user.name) }}
                </div>
                <div class="status-indicator" />
                <div class="avatar-edit-overlay">
                  <i v-if="uploadingAvatar" class="mdi mdi-loading mdi-spin" />
                  <i v-else class="mdi mdi-camera-outline" />
                </div>
              </div>

              <div class="profile-actions-top">
                <button class="edit-btn" @click="openEditModal">
                  <i class="mdi mdi-pencil-outline" />
                  Editar Perfil
                </button>
                <button class="share-btn" title="Compartilhar perfil">
                  <i class="mdi mdi-share-variant-outline" />
                </button>
              </div>
            </div>

            <div class="header-info">
              <h1>{{ user.name || 'Seu Nome' }}</h1>
              <span class="handle">{{ user.username || '@username' }}</span>
              <p v-if="user.bio" class="bio">{{ user.bio }}</p>
              <p v-else class="bio bio-placeholder">Adicione uma bio clicando em "Editar Perfil"</p>

              <!-- User Interests -->
              <div v-if="userInterests.length > 0" class="interests-section">
                <div class="interests-chips">
                  <span v-for="interest in userInterests" :key="interest.id" class="interest-chip">
                    {{ interest.name }}
                  </span>
                </div>
              </div>

              <div class="meta-row">
                <span v-if="user.location" class="meta-item">
                  <i class="mdi mdi-map-marker-outline" />
                  {{ user.location }}
                </span>
                <span class="meta-item">
                  <i class="mdi mdi-calendar-outline" />
                  Entrou em {{ user.joined }}
                </span>
              </div>

              <div class="stats-row">
                <button class="stat-item" type="button">
                  <span class="stat-value">{{ user.stats.followers }}</span>
                  <span class="stat-label">Seguidores</span>
                </button>
                <div class="stat-dot" />
                <button class="stat-item" type="button">
                  <span class="stat-value">{{ user.stats.following }}</span>
                  <span class="stat-label">Seguindo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="content-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i class="mdi tab-icon" :class="tab.icon" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-panel">
          <!-- Badges - Comentado para primeira versão -->
          <!--
          <div v-if="activeTab === 'badges'" class="badges-grid">
            <div v-for="(badge, i) in badges" :key="i" class="badge-card">
              <div class="badge-icon" :style="{ background: `${badge.color}15`, color: badge.color }">
                <i class="mdi" :class="badge.icon" />
              </div>
              <div class="badge-info">
                <h3>{{ badge.name }}</h3>
                <p>{{ badge.desc }}</p>
              </div>
            </div>
          </div>
          -->

          <!-- Liked -->
          <div v-if="activeTab === 'liked'" class="liked-events-panel">
            <div v-if="loadingLiked" class="loading-liked">
              <div class="skeleton-grid-mini">
                <div v-for="n in 5" :key="n" class="skeleton-mini-card">
                  <div class="skeleton-mini-banner" />
                  <div class="skeleton-mini-content">
                    <div class="skeleton-line short" />
                    <div class="skeleton-line medium" />
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="likedEventsItems.length > 0">
              <TransitionGroup class="liked-mini-cards-grid" name="mini-card" tag="div">
                <div
                  v-for="item in displayedLikedEvents"
                  :key="item.id"
                  class="mini-event-card"
                  @click="router.push(`/private/event/${item.id}`)"
                >
                  <div class="mini-card-banner">
                    <img :alt="item.title" :src="item.banner">
                    <div class="mini-card-date">
                      <i class="mdi mdi-calendar" />
                      {{ formatShortDate(item.schedule) }}
                    </div>
                  </div>
                  <div class="mini-card-content">
                    <h4 class="mini-card-title">{{ item.title }}</h4>
                    <div class="mini-card-location">
                      <i class="mdi mdi-map-marker" />
                      {{ item.location || 'Local a definir' }}
                    </div>
                    <div class="mini-card-stats">
                      <span class="mini-stat">
                        <i class="mdi mdi-account-multiple" />
                        {{ item.confirmed }}
                      </span>
                      <span class="mini-stat">
                        <i class="mdi mdi-heart" :class="{ 'liked': eventsStore.isLiked(item.id) }" />
                        {{ (item.likes || 0) + (eventsStore.isLiked(item.id) ? 1 : 0) }}
                      </span>
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Botão Mostrar Mais -->
              <div v-if="hasMoreEvents" class="show-more-container">
                <button class="show-more-btn" @click="showMoreEvents">
                  <span>Mostrar mais eventos</span>
                  <i class="mdi mdi-chevron-down" />
                </button>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon">
                <i class="mdi mdi-heart-outline" />
              </div>
              <h3>Nenhum evento curtido</h3>
              <p>Curta eventos para salvá-los aqui e acessá-los rapidamente depois</p>
              <button class="empty-action" @click="router.push('/private/feed')">
                <i class="mdi mdi-compass-outline" />
                Explorar Eventos
              </button>
            </div>
          </div>

          <!-- Favorites - Removido do projeto - Removido do projeto -->

          <!-- Settings -->
          <div v-if="activeTab === 'settings'" class="settings-panel">
            <div class="settings-group">
              <h4 class="settings-group-title">Geral</h4>
              <div class="setting-item" @click="settingsNotifications = !settingsNotifications">
                <div class="setting-left">
                  <div class="setting-icon-wrap">
                    <i class="mdi mdi-bell-outline" />
                  </div>
                  <div>
                    <span class="setting-name">Notificações</span>
                    <span class="setting-desc">Receba alertas sobre eventos e amigos</span>
                  </div>
                </div>
                <div class="toggle-switch" :class="{ checked: settingsNotifications }" />
              </div>

            </div>

            <div class="settings-group">
              <h4 class="settings-group-title">Conta</h4>
              <div class="setting-item" @click="openEditModal">
                <div class="setting-left">
                  <div class="setting-icon-wrap">
                    <i class="mdi mdi-account-edit-outline" />
                  </div>
                  <div>
                    <span class="setting-name">Editar Perfil</span>
                    <span class="setting-desc">Altere nome, bio e foto</span>
                  </div>
                </div>
                <i class="mdi mdi-chevron-right setting-arrow" />
              </div>
              <div class="setting-item danger" @click="handleLogout">
                <div class="setting-left">
                  <div class="setting-icon-wrap danger">
                    <i class="mdi mdi-logout" />
                  </div>
                  <div>
                    <span class="setting-name">Sair da conta</span>
                    <span class="setting-desc">Encerrar sessão atual</span>
                  </div>
                </div>
                <i class="mdi mdi-chevron-right setting-arrow" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar -->
      <aside class="layout-extras">
        <div class="sidebar-card interests-card">
          <h3>Interesses</h3>
          <div v-if="userInterests.length > 0" class="interests-tags">
            <span v-for="interest in userInterests" :key="interest.id" class="tag">
              {{ interest.name }}
            </span>
          </div>
          <p v-else class="interests-empty">Nenhum interesse adicionado ainda.</p>
        </div>
      </aside>
    </section>

    <AppFooter />

    <!-- Edit Profile Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
          <div class="modal-container">
            <div class="modal-header">
              <h2>Editar Perfil</h2>
              <button class="modal-close" @click="closeEditModal">
                <i class="mdi mdi-close" />
              </button>
            </div>

            <div class="modal-body">
              <!-- Hidden file inputs for modal -->
              <input
                ref="modalBannerInputRef"
                accept="image/*"
                hidden
                type="file"
                @change="handleBannerChange"
              >
              <input
                ref="modalAvatarInputRef"
                accept="image/*"
                hidden
                type="file"
                @change="handleAvatarChange"
              >

              <!-- Avatar edit section -->
              <div class="modal-avatar-section">
                <div
                  class="modal-banner"
                  :class="{ 'no-banner': !hasBanner }"
                  :style="hasBanner ? { backgroundImage: `url(${user.banner})` } : {}"
                >
                  <div class="modal-banner-overlay" />
                  <button
                    class="modal-banner-edit"
                    :disabled="uploadingBanner"
                    title="Alterar capa"
                    @click="triggerModalBannerUpload"
                  >
                    <i v-if="uploadingBanner" class="mdi mdi-loading mdi-spin" />
                    <i v-else class="mdi mdi-camera-outline" />
                  </button>
                </div>
                <div class="modal-avatar-wrapper" @click="triggerModalAvatarUpload">
                  <img v-if="hasAvatar" :alt="user.name" class="modal-avatar-img" :src="user.avatar">
                  <div
                    v-else
                    class="modal-avatar-img avatar-placeholder"
                    :style="{ backgroundColor: getAvatarColor(user.name) }"
                  >
                    {{ getInitials(user.name) }}
                  </div>
                  <button class="modal-avatar-edit" :disabled="uploadingAvatar" title="Alterar foto">
                    <i v-if="uploadingAvatar" class="mdi mdi-loading mdi-spin" />
                    <i v-else class="mdi mdi-camera-outline" />
                  </button>
                </div>
              </div>

              <!-- Form fields -->
              <div class="form-group">
                <label class="form-label" for="edit-name">Nome</label>
                <input
                  id="edit-name"
                  v-model="editForm.name"
                  class="form-input"
                  maxlength="50"
                  placeholder="Seu nome completo"
                  type="text"
                >
                <span class="char-count">{{ editForm.name.length }}/50</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-username">Nome de usuário</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">@</span>
                  <input
                    id="edit-username"
                    v-model="editForm.username"
                    class="form-input with-prefix"
                    maxlength="30"
                    placeholder="seunome"
                    type="text"
                  >
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-bio">Bio</label>
                <textarea
                  id="edit-bio"
                  v-model="editForm.bio"
                  class="form-textarea"
                  maxlength="160"
                  placeholder="Conte um pouco sobre você..."
                  rows="3"
                />
                <span class="char-count">{{ editForm.bio.length }}/160</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-location">Localização</label>
                <div class="input-with-icon">
                  <i class="mdi mdi-map-marker-outline input-icon" />
                  <input
                    id="edit-location"
                    v-model="editForm.location"
                    class="form-input with-icon"
                    maxlength="60"
                    placeholder="Sua cidade"
                    type="text"
                  >
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" @click="closeEditModal">Cancelar</button>
              <button class="btn-save" :disabled="saving" @click="saveProfile">
                <i v-if="saving" class="mdi mdi-loading mdi-spin" />
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Crop Avatar Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCropModal" class="modal-overlay crop-modal-overlay" @click.self="closeCropModal">
          <div class="crop-modal-container">
            <div class="crop-modal-header">
              <h2>Enquadrar foto</h2>
              <button class="modal-close" @click="closeCropModal">
                <i class="mdi mdi-close" />
              </button>
            </div>

            <div class="crop-modal-body">
              <div
                class="crop-area"
                @mousedown.prevent="onCropMouseDown"
                @mouseleave="onCropMouseUp"
                @mousemove.prevent="onCropMouseMove"
                @mouseup="onCropMouseUp"
                @touchend="onCropTouchEnd"
                @touchmove="onCropTouchMove"
                @touchstart.prevent="onCropTouchStart"
              >
                <img class="crop-image" draggable="false" :src="cropImageSrc" :style="cropImageStyle">
                <div class="crop-circle-mask" />
              </div>

              <div class="crop-zoom-control">
                <i class="mdi mdi-image-size-select-small" />
                <input
                  v-model.number="cropZoom"
                  class="crop-zoom-slider"
                  max="3"
                  :min="cropMinZoom"
                  step="0.01"
                  type="range"
                >
                <i class="mdi mdi-magnify-plus-outline" />
              </div>
            </div>

            <div class="crop-modal-footer">
              <button class="btn-cancel" @click="closeCropModal">Cancelar</button>
              <button class="btn-save" :disabled="uploadingAvatar" @click="confirmCrop">
                <i v-if="uploadingAvatar" class="mdi mdi-loading mdi-spin" />
                {{ uploadingAvatar ? 'Enviando...' : 'Aplicar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Snackbar de notificações -->
    <Snackbar v-model="snackbarVisible" :color="snackbarColor" :message="snackbarMessage" />
  </div>
</template>

<style scoped>
.profile-page-layout {
  min-height: 100vh;
  background: linear-gradient(142.35deg, rgba(252, 162, 89, 0.05) -1.66%, rgba(255, 98, 159, 0.08) 100.44%);
  display: flex;
  flex-direction: column;
  font-family: 'Baloo Thambi 2', sans-serif;
}

/* ── Layout Grid ── */
.layout-shell {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 240px minmax(0, 720px) 320px;
  grid-template-areas: 'sidebar main extras';
  column-gap: 2rem;
  width: min(100%, 1280px);
  margin: 0 auto 3.5rem;
  align-items: start;
}

.layout-sidebar {
  grid-area: sidebar;
  position: sticky;
  top: 120px;
}

.layout-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 1.5rem;
}

.layout-extras {
  grid-area: extras;
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Profile Card ── */
.profile-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.cover-image {
  height: 180px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.35), transparent 60%);
}

.cover-edit-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s;
  opacity: 0;
}

.profile-card:hover .cover-edit-btn {
  opacity: 1;
}

.cover-edit-btn:hover {
  background: rgba(0, 0, 0, 0.65);
  transform: scale(1.08);
}

.profile-content {
  padding: 0 2rem 2rem;
  position: relative;
  margin-top: -48px;
}

.avatar-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: white;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: #22c55e;
  border: 3px solid white;
  border-radius: 50%;
}

.profile-actions-top {
  display: flex;
  gap: 0.5rem;
  padding-top: 56px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.25rem;
  background: white;
  color: #2d2f55;
  border: 1.5px solid #e0e2ed;
  border-radius: 99px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  border-color: #ff5fa6;
  color: #ff5fa6;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.12);
}

.edit-btn i {
  font-size: 1rem;
}

.share-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #e0e2ed;
  background: white;
  color: #555b77;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
}

.share-btn:hover {
  border-color: #ff5fa6;
  color: #ff5fa6;
}

.header-info {
  padding-left: 0.25rem;
}

.header-info h1 {
  font-size: 1.4rem;
  color: #1a1c2e;
  margin: 0;
  line-height: 1.2;
  font-weight: 700;
}

.handle {
  color: #9aa0b8;
  font-size: 0.9rem;
  font-weight: 500;
}

.bio {
  margin: 0.75rem 0;
  color: #4a4f6a;
  font-size: 0.95rem;
  line-height: 1.5;
}

.bio-placeholder {
  color: #9aa0b8;
  font-style: italic;
}

/* Avatar placeholder com iniciais */
.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 2rem;
  text-transform: uppercase;
}

/* Avatar edit overlay */
.avatar-wrapper {
  cursor: pointer;
}

.avatar-edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
  font-size: 1.5rem;
}

.avatar-wrapper:hover .avatar-edit-overlay {
  opacity: 1;
}

/* Cover image sem banner */
.cover-image.no-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Interesses do usuário */
.interests-section {
  margin: 1rem 0;
}

.interests-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.interest-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  background: linear-gradient(135deg, rgba(255, 95, 166, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: #ff5fa6;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(255, 95, 166, 0.2);
}

/* Modal banner sem imagem */
.modal-banner.no-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Modal avatar placeholder */
.modal-avatar-wrapper {
  cursor: pointer;
}

.modal-avatar-img.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

/* Loading spinner */
.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #9aa0b8;
  font-size: 0.85rem;
}

.meta-item i {
  font-size: 1rem;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.2s;
}

.stat-item:hover .stat-value {
  color: #ff5fa6;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1c2e;
}

.stat-label {
  font-size: 0.85rem;
  color: #9aa0b8;
  font-weight: 500;
}

.stat-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #d0d4e3;
}

/* ── Tabs ── */
.content-tabs {
  display: flex;
  gap: 0;
  background: white;
  border-radius: 16px;
  padding: 0.35rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow-x: auto;
  scrollbar-width: none;
}

.content-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 1rem;
  background: transparent;
  border: none;
  font-weight: 600;
  color: #9aa0b8;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #555b77;
  background: rgba(0, 0, 0, 0.02);
}

.tab-btn.active {
  color: white;
  background: linear-gradient(135deg, #ff7eb3, #ff5fa6);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.25);
}

.tab-icon {
  font-size: 1rem;
}

/* ── Liked Events Panel ── */
.liked-events-panel {
  min-height: 200px;
}

.loading-liked {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.skeleton-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.skeleton-card {
  background: #ffffff;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.skeleton-banner {
  width: 100%;
  height: 320px;
  background: linear-gradient(90deg,
      rgba(240, 240, 240, 1) 0%,
      rgba(250, 250, 250, 1) 50%,
      rgba(240, 240, 240, 1) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(90deg,
      rgba(240, 240, 240, 1) 0%,
      rgba(250, 250, 250, 1) 50%,
      rgba(240, 240, 240, 1) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line.short {
  width: 30%;
}

.skeleton-line.medium {
  width: 60%;
}

.skeleton-line.long {
  width: 85%;
}

@keyframes skeleton-pulse {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.liked-events-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Card transitions */
.liked-card-enter-active {
  transition: all 0.4s ease-out;
}

.liked-card-leave-active {
  transition: all 0.3s ease-in;
}

.liked-card-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.liked-card-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.9);
}

.liked-card-move {
  transition: transform 0.5s ease;
}

/* ── Mini Cards para Eventos Curtidos ── */
.liked-mini-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mini-event-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.mini-event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 95, 166, 0.15);
}

.mini-card-banner {
  position: relative;
  height: 140px;
  overflow: hidden;
}

.mini-card-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.mini-event-card:hover .mini-card-banner img {
  transform: scale(1.05);
}

.mini-card-date {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.mini-card-date i {
  font-size: 0.9rem;
}

.mini-card-content {
  padding: 1rem;
}

.mini-card-title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1c2e;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.mini-card-location {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #9aa0b8;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
}

.mini-card-location i {
  font-size: 1rem;
}

.mini-card-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #555b77;
  font-weight: 600;
}

.mini-stat i {
  font-size: 1.1rem;
  color: #9aa0b8;
}

.mini-stat i.liked {
  color: #ff5fa6;
}

/* Transitions para mini cards */
.mini-card-enter-active {
  transition: all 0.4s ease-out;
}

.mini-card-leave-active {
  transition: all 0.3s ease-in;
}

.mini-card-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.mini-card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.mini-card-move {
  transition: transform 0.4s ease;
}

/* Skeleton para mini cards */
.skeleton-grid-mini {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.skeleton-mini-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.skeleton-mini-banner {
  width: 100%;
  height: 140px;
  background: linear-gradient(90deg,
      rgba(240, 240, 240, 1) 0%,
      rgba(250, 250, 250, 1) 50%,
      rgba(240, 240, 240, 1) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-mini-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Botão Mostrar Mais */
.show-more-container {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  margin-top: 0.5rem;
}

.show-more-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 2rem;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  border-radius: 99px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 95, 166, 0.25);
  transition: all 0.3s ease;
}

.show-more-btn:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 8px 28px rgba(255, 95, 166, 0.4);
}

.show-more-btn:active {
  transform: translateY(-1px) scale(1.01);
}

.show-more-btn i {
  font-size: 1.3rem;
  transition: transform 0.3s ease;
}

.show-more-btn:hover i {
  transform: translateY(2px);
}

/* ── Badges ── */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.badge-card {
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.2s;
}

.badge-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.badge-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.badge-info h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #1a1c2e;
}

.badge-info p {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #9aa0b8;
  line-height: 1.3;
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 3.5rem 2rem;
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 126, 179, 0.1), rgba(255, 95, 166, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
}

.empty-icon i {
  font-size: 2rem;
  color: #ff5fa6;
}

.empty-icon.fav {
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1), rgba(255, 152, 0, 0.15));
}

.empty-icon.fav i {
  color: #ff9800;
}

.empty-icon.hist {
  background: linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(124, 77, 255, 0.15));
}

.empty-icon.hist i {
  color: #7C4DFF;
}

.empty-state h3 {
  margin: 0 0 0.3rem;
  font-size: 1.1rem;
  color: #1a1c2e;
}

.empty-state p {
  margin: 0 0 1.25rem;
  color: #9aa0b8;
  font-size: 0.9rem;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.8rem;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  border-radius: 99px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.2);
  transition: all 0.25s ease;
}

.empty-action:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 95, 166, 0.35);
}

.empty-action:active {
  transform: translateY(-1px);
}

/* ── Settings ── */
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-group {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.settings-group-title {
  margin: 0;
  padding: 1rem 1.25rem 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9aa0b8;
  font-weight: 700;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
}

.setting-item:hover {
  background: rgba(0, 0, 0, 0.015);
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.setting-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1), rgba(255, 95, 166, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #ff5fa6;
}

.setting-icon-wrap.danger {
  background: rgba(244, 63, 94, 0.08);
  color: #f43f5e;
}

.setting-name {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
  color: #1a1c2e;
}

.setting-desc {
  display: block;
  font-size: 0.78rem;
  color: #9aa0b8;
  margin-top: 1px;
}

.setting-arrow {
  font-size: 1.25rem;
  color: #c4c9de;
}

.setting-item.danger .setting-name {
  color: #f43f5e;
}

.setting-item.danger .setting-desc {
  color: #fca5a5;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: #e0e2ed;
  border-radius: 99px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch.checked {
  background: #22c55e;
}

.toggle-switch.checked::after {
  transform: translateX(20px);
}

/* ── Sidebar Cards ── */
.sidebar-card {
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.sidebar-card h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #1a1c2e;
  font-weight: 700;
}

.about-items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.about-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #555b77;
}

.about-item i {
  font-size: 1.1rem;
  color: #9aa0b8;
}

.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.quick-stat-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.quick-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.12), rgba(255, 95, 166, 0.12));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #ff5fa6;
  flex-shrink: 0;
}

.quick-stat-info {
  display: flex;
  flex-direction: column;
}

.quick-stat-value {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1a1c2e;
}

.quick-stat-label {
  font-size: 0.78rem;
  color: #9aa0b8;
}

.interests-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.interests-empty {
  font-size: 0.85rem;
  color: #9aa0b8;
  margin: 0;
}

.tag {
  padding: 0.4rem 0.85rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.08), rgba(255, 95, 166, 0.08));
  border-radius: 99px;
  font-size: 0.82rem;
  color: #555b77;
  font-weight: 500;
  transition: all 0.2s;
}

.tag:hover {
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.18), rgba(255, 95, 166, 0.18));
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: #1a1c2e;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #555b77;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1c2e;
}

.modal-body {
  padding: 0 1.5rem 1.5rem;
}

/* Avatar section in modal */
.modal-avatar-section {
  position: relative;
  margin-bottom: 2.5rem;
}

.modal-banner {
  height: 120px;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin-top: 1rem;
}

.modal-banner-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
}

.modal-banner-edit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.modal-banner-edit:hover {
  background: rgba(0, 0, 0, 0.7);
}

.modal-avatar-wrapper {
  position: absolute;
  bottom: -32px;
  left: 1.5rem;
}

.modal-avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modal-avatar-edit {
  position: absolute;
  bottom: 0;
  right: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: transform 0.2s;
}

.modal-avatar-edit:hover {
  transform: scale(1.1);
}

/* Form */
.form-group {
  margin-bottom: 1.25rem;
  position: relative;
}

.form-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #555b77;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  font-size: 0.92rem;
  color: #1a1c2e;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  box-sizing: border-box;
  background: #fafbfc;
}

.form-input:focus {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background: white;
}

.form-textarea {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  font-size: 0.92rem;
  color: #1a1c2e;
  font-family: inherit;
  resize: vertical;
  outline: none;
  min-height: 80px;
  box-sizing: border-box;
  background: #fafbfc;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background: white;
}

.char-count {
  position: absolute;
  right: 0.75rem;
  bottom: -1.2rem;
  font-size: 0.7rem;
  color: #c4c9de;
}

.input-with-prefix {
  display: flex;
  align-items: center;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  background: #fafbfc;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-with-prefix:focus-within {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background: white;
}

.input-prefix {
  padding: 0 0 0 0.9rem;
  color: #9aa0b8;
  font-weight: 600;
  font-size: 0.92rem;
}

.form-input.with-prefix {
  border: none;
  background: transparent;
  padding-left: 0.25rem;
  box-shadow: none;
}

.form-input.with-prefix:focus {
  box-shadow: none;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  color: #9aa0b8;
}

.form-input.with-icon {
  padding-left: 2.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
  border-radius: 0 0 20px 20px;
}

.btn-cancel {
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.88rem;
  color: #555b77;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #c4c9de;
  background: rgba(0, 0, 0, 0.02);
}

.btn-save {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.25);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.35);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Modal Transitions */
.modal-enter-active {
  transition: all 0.3s ease;
}

.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.95) translateY(20px);
}

.modal-leave-to .modal-container {
  transform: scale(0.97) translateY(10px);
}

/* ── Breadcrumb ── */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1.15rem;
  background: white;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.03);
  color: #555b77;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
}

.breadcrumb-back:hover {
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  transform: translateX(-2px);
}

.back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  color: #d0d4e3;
}

.breadcrumb-current {
  font-weight: 700;
  font-size: 0.92rem;
  color: #1a1c2e;
}

/* ── Responsive ── */
@media (max-width: 1240px) {
  .layout-shell {
    grid-template-columns: 220px 1fr;
    grid-template-areas: 'sidebar main';
    width: min(100%, 960px);
    padding: 0 2rem;
  }

  .layout-extras {
    display: none;
  }
}

@media (max-width: 960px) {
  .layout-shell {
    grid-template-columns: 1fr;
    grid-template-areas: 'main';
    width: 100%;
    padding: 1rem;
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  }

  .layout-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    z-index: 1000;
  }
}

@media (max-width: 640px) {
  .profile-content {
    padding: 0 1.25rem 1.25rem;
  }

  .avatar-img {
    width: 80px;
    height: 80px;
  }

  .profile-actions-top {
    padding-top: 40px;
  }

  .cover-image {
    height: 140px;
  }

  .profile-content {
    margin-top: -36px;
  }

  .tab-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.82rem;
  }

  .tab-icon {
    display: none;
  }

  .breadcrumb-nav {
    padding: 0.5rem 0.85rem;
  }

  .breadcrumb-back {
    padding: 0.35rem 0.7rem;
    font-size: 0.82rem;
  }

  .back-text {
    display: none;
  }

  .modal-container {
    max-width: 100%;
    border-radius: 16px;
  }

  .liked-events-grid {
    gap: 1rem;
  }

  .liked-mini-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.85rem;
  }

  .skeleton-grid-mini {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.85rem;
  }

  .content-tabs {
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .content-tabs::-webkit-scrollbar {
    display: none;
  }

  .header-info h1 {
    font-size: 1.2rem;
  }

  .stats-row {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .layout-shell {
    padding: 0.5rem;
    padding-bottom: 5rem;
  }

  .profile-content {
    padding: 0 1rem 1rem;
  }

  .avatar-img {
    width: 72px;
    height: 72px;
  }

  .cover-image {
    height: 120px;
  }

  .profile-content {
    margin-top: -32px;
  }

  .edit-btn {
    padding: 0.45rem 0.9rem;
    font-size: 0.78rem;
  }

  .tab-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.78rem;
  }

  .badge-card {
    padding: 1rem;
  }

  .badge-icon {
    width: 44px;
    height: 44px;
    font-size: 1.3rem;
  }

  .liked-mini-cards-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .skeleton-grid-mini {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .mini-card-banner {
    height: 160px;
  }

  .show-more-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 360px) {
  .avatar-img {
    width: 64px;
    height: 64px;
  }

  .cover-image {
    height: 100px;
  }

  .header-info h1 {
    font-size: 1.05rem;
  }

  .tab-btn {
    padding: 0.35rem 0.5rem;
    font-size: 0.72rem;
  }

  .profile-content {
    padding: 0 0.75rem 0.75rem;
  }

  .modal-container {
    padding: 1rem;
  }
}

/* ── Crop Modal ── */
.crop-modal-overlay {
  z-index: 10001;
}

.crop-modal-container {
  background: #1a1c2e;
  border-radius: 20px;
  width: min(420px, 92vw);
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  animation: modal-pop 0.3s ease;
}

.crop-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.crop-modal-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.crop-modal-header .modal-close {
  color: rgba(255, 255, 255, 0.6);
}

.crop-modal-header .modal-close:hover {
  color: #fff;
}

.crop-modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.crop-area {
  width: 300px;
  height: 300px;
  position: relative;
  overflow: hidden;
  cursor: grab;
  background: #000;
  touch-action: none;
  border-radius: 4px;
}

.crop-area:active {
  cursor: grabbing;
}

.crop-image {
  position: absolute;
  display: block;
  pointer-events: none;
  user-select: none;
}

.crop-circle-mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
}

.crop-circle-mask::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.crop-zoom-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.3rem;
}

.crop-zoom-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
}

.crop-zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.3);
  transition: transform 0.15s;
}

.crop-zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.crop-zoom-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.3);
}

.crop-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.crop-modal-footer .btn-cancel {
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(255, 255, 255, 0.15);
}

.crop-modal-footer .btn-cancel:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}
</style>
