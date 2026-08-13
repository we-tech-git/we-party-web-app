<script setup lang="ts">
  import type { NavItem } from '@/types/navigation'
  import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRoute, useRouter } from 'vue-router'
  import { isRequestCanceled, unwrapItem, unwrapList } from '@/api'
  import { followUserById, getFollowStats, getMyFollowers, getMyFollowing, unfollowUserById } from '@/api/follows'
  import { addUserInterest, getInterests, getUnownedInterestSuggestions, removeUserInterest, requestNewInterests, searchInterestsByName } from '@/api/interest'
  import { getUserInterests, getUserProfile, getUserRecomendations, searchUsers, updateUserProfile, uploadBannerImage, uploadProfileImage } from '@/api/users'
  import AppFooter from '@/components/AppFooter.vue'
  import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
  import FeedSidebarNav from '@/components/modules/Feed/FeedSidebarNav.vue'
  import FeedTopHeader from '@/components/modules/Feed/FeedTopHeader.vue'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import ConfirmDialog from '@/components/UI/ConfirmDialog/ConfirmDialog.vue'
  import FollowButton from '@/components/UI/FollowButton/FollowButton.vue'
  import ImageCropper from '@/components/UI/ImageCropper/ImageCropper.vue'
  import SearchInput from '@/components/UI/SearchInput/SearchInput.vue'
  import SelectableChip from '@/components/UI/SelectableChip/SelectableChip.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useLoading } from '@/composables/useLoading'
  import { AuthService } from '@/services/auth'
  import { useEventsStore } from '@/stores/events'
  import { useShareStore } from '@/stores/share'
  import { logger } from '@/utils/logger'

  // ── Constantes (evita magic numbers) ──
  /** Espelha BIO_MAX_LENGTH do backend (VarChar(500) + validação no service).
   *  Se mudar lá, mude aqui. */
  const BIO_MAX_LENGTH = 500

  const CONFIG = {
    MAX_FILE_SIZE_MB: 5,
    AVATAR_OUTPUT_SIZE: 512,
    EVENTS_DISPLAY_INCREMENT: 6,
    INITIAL_DISPLAY_LIMIT: 6,
    MAX_NAME_LENGTH: 50,
    MAX_USERNAME_LENGTH: 30,
    MAX_BIO_LENGTH: 160,
    MAX_LOCATION_LENGTH: 60,
    MAX_SEARCH_RESULTS: 10,
    MAX_SUGGESTED_INTERESTS: 20,
  } as const

  const SNACKBAR_COLORS = {
    success: '#22c55e',
    error: '#ef4444',
  } as const

  const { t } = useI18n()
  const router = useRouter()
  const route = useRoute()
  const { loggedUser, updateUser } = useAuth()
  const eventsStore = useEventsStore()
  const shareStore = useShareStore()

  // ── Loading state ──
  const loading = ref(true)
  const error = ref<string | null>(null)
  const uploadingAvatar = ref(false)
  const uploadingBanner = ref(false)

  // ── Followers/Following state ──
  interface FollowUser {
    id: string | number
    name: string
    username?: string
    profileImage?: string
    isFollowing?: boolean
  }

  const followStats = ref({ followers: 0, following: 0 })
  const followersList = ref<FollowUser[]>([])
  const followingList = ref<FollowUser[]>([])
  const recommendedUsers = ref<FollowUser[]>([])
  const loadingFollowStats = ref(false)
  const loadingFollowers = ref(false)
  const loadingFollowing = ref(false)
  const loadingRecommendations = ref(true)
  const showFollowersModal = ref(false)
  const showFollowingModal = ref(false)

  // ── Snackbar ──
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

  // ── Avatar colors para fallback ──
  // (substituído pelo componente global UserAvatar — as iniciais e o gradiente
  //  agora vivem em src/utils/avatar.ts)

  // ── User data (reactive for editing) ──
  // Inicializa com os dados do loggedUser (dados salvos durante o login)
  const user = reactive({
    name: loggedUser.value?.name || '',
    username: loggedUser.value?.username ? `@${loggedUser.value.username}` : '',
    avatar: loggedUser.value?.profileImage || '',
    banner: '',
    bio: '',
    joined: '',
  })

  // Watch loggedUser — só refaz o fetch se o ID do usuário mudou (evita loop infinito)
  watch(() => loggedUser.value?.id, (newId, oldId) => {
    if (newId && newId !== oldId) {
      user.name = loggedUser.value?.name || ''
      user.username = loggedUser.value?.username ? `@${loggedUser.value.username}` : ''
      user.avatar = loggedUser.value?.profileImage || ''
    // fetchUserProfile removido - o onMounted já cuida do carregamento inicial
    }
  })

  onMounted(async () => {
    if (loggedUser.value?.id) {
      await fetchUserProfile()
      // Carrega dados em paralelo para melhor performance
      await Promise.all([
        activeTab.value === 'liked' ? fetchLikedEvents() : Promise.resolve(),
        fetchFollowStats(),
        fetchRecommendedUsers(),
      ])
    } else {
      error.value = 'Usuário não autenticado'
      loading.value = false
    }
  })

  // Cleanup para evitar memory leaks
  onUnmounted(() => {
    // Prévias de recorte não salvas: sem revogar, os object URLs vazam ao sair
    // da página com o modal aberto.
    discardPendingImages()

    if (interestsSearchTimeout) {
      clearTimeout(interestsSearchTimeout)
      interestsSearchTimeout = null
    }
    if (userSearchTimeout) {
      clearTimeout(userSearchTimeout)
      userSearchTimeout = null
    }
    if (likedEventsTimeout) {
      clearTimeout(likedEventsTimeout)
      likedEventsTimeout = null
    }
    if (confirmedEventsTimeout) {
      clearTimeout(confirmedEventsTimeout)
      confirmedEventsTimeout = null
    }
    if (userSearchCtrl) {
      userSearchCtrl.abort()
      userSearchCtrl = null
    }
  })

  // ── User interests ──
  interface UserInterest {
    id: string
    name: string
  }
  const userInterests = ref<UserInterest[]>([])
  // Loading dedicado do card de interesses (independente do load principal da página),
  // para mostrar o loader sempre que os interesses forem (re)carregados.
  const loadingInterests = ref(false)

  // ── Cache dos dados do perfil para evitar chamadas duplicadas ──
  const cachedUserProfileData = ref<any>(null)

  // ── Computed para verificar se tem avatar ──
  const hasAvatar = computed(() => {
    return user.avatar && user.avatar.trim() !== '' && !user.avatar.includes('pravatar')
  })

  const hasBanner = computed(() => {
    return user.banner && user.banner.trim() !== '' && !user.banner.includes('unsplash')
  })

  // ── File inputs refs ──
  const modalAvatarInputRef = ref<HTMLInputElement | null>(null)
  const modalBannerInputRef = ref<HTMLInputElement | null>(null)

  // ── Recorte de imagem (Cropper.js) ──
  // A geometria do recorte fica no componente ImageCropper; aqui só controlamos
  // abertura do modal, upload e feedback.
  const AVATAR_ASPECT = 1
  const BANNER_ASPECT = 16 / 5

  const showCropModal = ref(false)
  const cropImageSrc = ref('')
  const cropMimeType = ref('image/jpeg')
  const avatarCropperRef = ref<InstanceType<typeof ImageCropper> | null>(null)
  let pendingAvatarInput: HTMLInputElement | null = null

  /** Imagens recortadas aguardando o "Salvar" do modal de edição. */
  const pendingAvatarFile = ref<File | null>(null)
  const pendingAvatarPreview = ref<string | null>(null)
  const pendingBannerFile = ref<File | null>(null)
  const pendingBannerPreview = ref<string | null>(null)

  const showBannerCropModal = ref(false)
  const bannerCropImageSrc = ref('')
  const bannerCropMimeType = ref('image/jpeg')
  const bannerCropperRef = ref<InstanceType<typeof ImageCropper> | null>(null)
  let pendingBannerInput: HTMLInputElement | null = null

  function openCropModal (imageSrc: string, input: HTMLInputElement) {
    cropImageSrc.value = imageSrc
    cropMimeType.value = input.files?.[0]?.type || 'image/jpeg'
    pendingAvatarInput = input
    showCropModal.value = true
  }

  function closeCropModal () {
    showCropModal.value = false
    cropImageSrc.value = ''
    if (pendingAvatarInput) {
      pendingAvatarInput.value = ''
      pendingAvatarInput = null
    }
  }

  function openBannerCropModal (imageSrc: string, input: HTMLInputElement) {
    bannerCropImageSrc.value = imageSrc
    bannerCropMimeType.value = input.files?.[0]?.type || 'image/jpeg'
    pendingBannerInput = input
    showBannerCropModal.value = true
  }

  function closeBannerCropModal () {
    showBannerCropModal.value = false
    bannerCropImageSrc.value = ''
    if (pendingBannerInput) {
      pendingBannerInput.value = ''
      pendingBannerInput = null
    }
  }

  /** Extensão coerente com o MIME, para o backend não receber .jpg contendo PNG. */
  function fileNameFor (base: string, mimeType: string) {
    const ext = mimeType === 'image/png' ? 'png' : (mimeType === 'image/webp' ? 'webp' : 'jpg')
    return `${base}.${ext}`
  }

  /**
   * Confirma o recorte do avatar — apenas prepara a prévia local.
   * O upload só acontece em `saveProfile()`; assim fechar o modal de edição
   * descarta a troca, como qualquer outro campo do formulário.
   */
  async function confirmCrop () {
    const blob = await avatarCropperRef.value?.getCroppedBlob()
    if (!blob) return

    // Libera a prévia anterior antes de trocar, senão o object URL vaza.
    if (pendingAvatarPreview.value) URL.revokeObjectURL(pendingAvatarPreview.value)

    pendingAvatarFile.value = new File([blob], fileNameFor('profile', cropMimeType.value), { type: blob.type })
    pendingAvatarPreview.value = URL.createObjectURL(blob)

    showCropModal.value = false
    if (pendingAvatarInput) {
      pendingAvatarInput.value = ''
      pendingAvatarInput = null
    }
  }

  /** Idem `confirmCrop`, para a capa. */
  async function confirmBannerCrop () {
    const blob = await bannerCropperRef.value?.getCroppedBlob()
    if (!blob) return

    if (pendingBannerPreview.value) URL.revokeObjectURL(pendingBannerPreview.value)

    pendingBannerFile.value = new File([blob], fileNameFor('banner', bannerCropMimeType.value), { type: blob.type })
    pendingBannerPreview.value = URL.createObjectURL(blob)

    showBannerCropModal.value = false
    if (pendingBannerInput) {
      pendingBannerInput.value = ''
      pendingBannerInput = null
    }
  }

  /** Descarta imagens recortadas mas não salvas, liberando os object URLs. */
  function discardPendingImages () {
    if (pendingAvatarPreview.value) URL.revokeObjectURL(pendingAvatarPreview.value)
    if (pendingBannerPreview.value) URL.revokeObjectURL(pendingBannerPreview.value)
    pendingAvatarFile.value = null
    pendingAvatarPreview.value = null
    pendingBannerFile.value = null
    pendingBannerPreview.value = null
  }

  // ── Fetch user profile data ──
  let isFetchingProfile = false // Flag para evitar chamadas duplicadas

  async function fetchUserProfile () {
    // Evita chamadas duplicadas
    if (isFetchingProfile) {
      return
    }

    if (!loggedUser.value?.id) {
      error.value = 'Usuário não autenticado'
      loading.value = false
      return
    }

    try {
      isFetchingProfile = true
      loading.value = true
      error.value = null

      // Invalida o cache para forçar nova chamada à API
      cachedUserProfileData.value = null

      const response = await getUserProfile(loggedUser.value.id)
      // A API retorna { success, data: { ...camposDoUsuario } }
      const userData = unwrapItem(response) ?? {}

      // Armazena os dados em cache para evitar chamadas duplicadas
      cachedUserProfileData.value = userData

      // Popula os dados do usuário, mantendo dados do loggedUser como fallback
      user.name = userData.name || loggedUser.value?.name || ''
      user.username = userData.username ? `@${userData.username}` : (loggedUser.value?.username ? `@${loggedUser.value.username}` : '')
      user.avatar = userData.profilePhoto || userData.profileImage || userData.avatar || loggedUser.value?.profileImage || ''
      user.banner = userData.profileCoverImage || userData.coverPhoto || userData.banner || userData.bannerImage || ''
      user.bio = userData.bio || ''
      user.joined = userData.createdAt ? formatJoinDate(userData.createdAt) : ''

      // Sincroniza com localStorage para manter consistência em todas as páginas
      updateUser({
        name: userData.name || '',
        username: userData.username || '',
        profileImage: userData.profilePhoto || userData.profileImage || userData.avatar || '',
      })

      // Busca os interesses em paralelo, sem bloquear o load principal da página:
      // o card de interesses exibe o próprio loader (loadingInterests) enquanto carrega.
      fetchUserInterests()

      // ── Extrai eventos confirmados (eventAttendances) que já vem no getUserProfile ──
      // A API retorna eventAttendances no GET /users/:id, evitando chamada adicional
      if (userData.eventAttendances && Array.isArray(userData.eventAttendances)) {
        confirmedEventsItems.value = userData.eventAttendances
          .filter((e: any) => e && (e.id || e.eventId))
          .map((evt: any) => {
            // Se eventAttendances contém o objeto do evento completo ou apenas referência
            const eventData = evt.event || evt
            return mapConfirmedAttendance(eventData)
          })
      } else {
        confirmedEventsItems.value = []
      }
    } catch {
      error.value = t('profile.messages.loadProfileError')
    } finally {
      loading.value = false
      isFetchingProfile = false
    }
  }

  // ── Fetch user interests ──
  async function fetchUserInterests () {
    loadingInterests.value = true
    try {
      const response = await getUserInterests()
      // unwrapList aceita todos os envelopes conhecidos da API
      userInterests.value = unwrapList(response, 'interests')
    } catch {
      userInterests.value = []
    } finally {
      loadingInterests.value = false
    }
  }

  // ── Fetch Follow Stats ──
  async function fetchFollowStats () {
    if (!loggedUser.value?.id) return

    try {
      loadingFollowStats.value = true
      const response = await getFollowStats(loggedUser.value.id)
      const data = unwrapItem(response)

      followStats.value = {
        followers: data?.followersCount ?? data?.followers ?? 0,
        following: data?.followingCount ?? data?.following ?? 0,
      }
    } catch (error_) {
      console.error('Erro ao buscar estatísticas de follow:', error_)
      followStats.value = { followers: 0, following: 0 }
    } finally {
      loadingFollowStats.value = false
    }
  }

  // ── Fetch Followers List ──
  async function fetchFollowersList () {
    try {
      loadingFollowers.value = true
      const response = await getMyFollowers()
      const users = unwrapList<any>(response, 'followers', 'users')

      followersList.value = users.map((u: any) => ({
        id: u.id || u._id,
        name: u.name || u.username || 'Usuário',
        username: u.username,
        profileImage: u.profileImage || u.profilePhoto || u.avatar,
        isFollowing: u.isFollowing ?? false,
      }))
    } catch (error_) {
      console.error('Erro ao buscar seguidores:', error_)
      followersList.value = []
    } finally {
      loadingFollowers.value = false
    }
  }

  // ── Fetch Following List ──
  async function fetchFollowingList () {
    try {
      loadingFollowing.value = true
      const response = await getMyFollowing()
      const users = unwrapList<any>(response, 'following', 'users')

      followingList.value = users.map((u: any) => ({
        id: u.id || u._id,
        name: u.name || u.username || 'Usuário',
        username: u.username,
        profileImage: u.profileImage || u.profilePhoto || u.avatar,
        isFollowing: true, // Se está na lista de following, já está seguindo
      }))
    } catch (error_) {
      console.error('Erro ao buscar seguindo:', error_)
      followingList.value = []
    } finally {
      loadingFollowing.value = false
    }
  }

  // ── Search Users in Recommendations ──
  const userSearchQuery = ref('')
  const filteredRecommendedUsers = ref<FollowUser[]>([])
  const allRecommendedUsers = ref<FollowUser[]>([])
  const searchingUsers = ref(false)
  let userSearchCtrl: AbortController | null = null

  // ── Fetch User Recommendations ──
  async function fetchRecommendedUsers () {
    try {
      loadingRecommendations.value = true
      const response = await getUserRecomendations()
      const users = unwrapList<any>(response, 'users')

      // Armazena todos os usuários recomendados
      allRecommendedUsers.value = users.map((u: any) => ({
        id: u.id || u._id,
        name: u.name || u.username || 'Usuário',
        username: u.username,
        profileImage: u.profileImage || u.profilePhoto || u.avatar,
        isFollowing: u.isFollowing ?? false,
      }))

      // Inicializa a lista filtrada com todos os usuários
      filteredRecommendedUsers.value = [...allRecommendedUsers.value]
      recommendedUsers.value = allRecommendedUsers.value.slice(0, 5)
    } catch (error_) {
      console.error('Erro ao buscar recomendações de usuários:', error_)
      allRecommendedUsers.value = []
      filteredRecommendedUsers.value = []
      recommendedUsers.value = []
    } finally {
      loadingRecommendations.value = false
    }
  }

  // Ativa o loading imediatamente ao digitar (antes do debounce do SearchInput),
  // para evitar que a UI mostre "nenhum resultado" durante a janela de debounce.
  watch(userSearchQuery, newValue => {
    if (newValue.trim()) {
      filteredRecommendedUsers.value = []
      searchingUsers.value = true
    } else {
      filteredRecommendedUsers.value = [...allRecommendedUsers.value]
      searchingUsers.value = false
    }
  })

  // ── Handler para busca de usuários (chamado pelo SearchInput com debounce) ──
  // Mesmo comportamento da página /public/AddFriends: busca real no backend
  // (GET /social/search), com cancelamento da requisição anterior para evitar
  // respostas fora de ordem.
  async function handleUserSearch (query: string) {
    if (!query.trim()) {
      userSearchCtrl?.abort()
      filteredRecommendedUsers.value = [...allRecommendedUsers.value]
      searchingUsers.value = false
      return
    }

    // Aborta a busca anterior antes de disparar a nova
    userSearchCtrl?.abort()
    userSearchCtrl = new AbortController()
    const { signal } = userSearchCtrl

    try {
      const response = await searchUsers(query.trim(), 1, 20, signal)
      const userData = unwrapList<any>(response, 'users')
      filteredRecommendedUsers.value = userData.map((u: any) => ({
        id: u.id || u._id,
        name: u.name || u.username || 'Usuário',
        username: u.username,
        profileImage: u.profileImage || u.profilePhoto || u.avatar,
        isFollowing: u.isFollowing ?? false,
      }))
    } catch (error_: any) {
      // Requisição substituída por outra mais recente: mantém o loading da atual
      if (isRequestCanceled(error_)) return

      console.error('Erro ao buscar usuários:', error_)
      filteredRecommendedUsers.value = []
      showSnackbar(error_?.response?.data?.message || 'Erro ao buscar usuários', SNACKBAR_COLORS.error)
    } finally {
      searchingUsers.value = false
    }
  }

  // ── Handler para limpar busca de usuários ──
  function handleClearUserSearch () {
    userSearchCtrl?.abort()
    filteredRecommendedUsers.value = [...allRecommendedUsers.value]
    searchingUsers.value = false
  }

  // ── Toggle Follow User ──
  async function toggleFollowUser (user: FollowUser) {
    const previousState = user.isFollowing

    // Atualização otimista
    user.isFollowing = !user.isFollowing

    try {
      if (previousState) {
        await unfollowUserById(user.id)
        followStats.value.following = Math.max(0, followStats.value.following - 1)
        showSnackbar(t('profile.messages.unfollowSuccess', { name: user.name }), '#6b7280')
      } else {
        await followUserById(user.id)
        followStats.value.following++
        showSnackbar(t('profile.messages.followSuccess', { name: user.name }), SNACKBAR_COLORS.success)
      }
    } catch (error_) {
      // Reverte em caso de erro
      user.isFollowing = previousState
      console.error('Erro ao alterar follow:', error_)
      showSnackbar(t('profile.messages.followUpdateError'), SNACKBAR_COLORS.error)
    }
  }

  // ── Open/Close Followers/Following Modals ──
  function openFollowersModal () {
    showFollowersModal.value = true
    fetchFollowersList()
  }

  function closeFollowersModal () {
    showFollowersModal.value = false
  }

  function openFollowingModal () {
    showFollowingModal.value = true
    fetchFollowingList()
  }

  function closeFollowingModal () {
    showFollowingModal.value = false
  }

  // ── Manage Interests Modal ──
  const showInterestsModal = ref(false)
  const interestsSearchQuery = ref('')
  const searchedInterests = ref<UserInterest[]>([])
  const suggestedInterests = ref<UserInterest[]>([])
  const tempUserInterests = ref<UserInterest[]>([]) // Interesses temporários (enquanto modal está aberto)
  const isSearchingInterests = ref(false)
  const isSavingInterests = ref(false)
  const isLoadingSuggestions = ref(false)

  // ── Sugestões inline (aparecem no card do perfil quando não há interesses) ──
  const INLINE_SUGGESTIONS_LIMIT = 5
  const inlineSuggestions = ref<UserInterest[]>([])
  const isLoadingInlineSuggestions = ref(false)
  /** Id do interesse sendo adicionado — alimenta o loading do próprio chip. */
  const addingInterestId = ref<string | null>(null)

  // ── Request New Interests Modal ──
  const showRequestModal = ref(false)
  const newInterestName = ref('')
  const pendingInterests = ref<string[]>([])
  const isSubmittingRequest = ref(false)

  async function openInterestsModal () {
    // Cria cópia dos interesses atuais para trabalhar temporariamente
    tempUserInterests.value = [...userInterests.value]
    showInterestsModal.value = true
    interestsSearchQuery.value = ''
    searchedInterests.value = []
    await loadSuggestedInterests()
  }

  async function loadSuggestedInterests () {
    try {
      isLoadingSuggestions.value = true
      const response = await getInterests()
      const interests: UserInterest[] = unwrapList(response, 'interests')

      // Filtra interesses que o usuário já possui (usa tempUserInterests) e limita a 20 sugestões
      const userInterestIds = new Set(tempUserInterests.value.map(i => i.id))
      suggestedInterests.value = interests
        .filter(i => !userInterestIds.has(i.id))
        .slice(0, 20)
    } catch (error) {
      console.error('Erro ao carregar interesses sugeridos:', error)
      suggestedInterests.value = []
    } finally {
      isLoadingSuggestions.value = false
    }
  }

  function closeInterestsModal () {
    // Descarta mudanças temporárias ao fechar sem salvar
    tempUserInterests.value = []
    showInterestsModal.value = false
    interestsSearchQuery.value = ''
    searchedInterests.value = []
    suggestedInterests.value = []
  }

  // Ativa o loading imediatamente ao digitar (antes do debounce do SearchInput),
  // para evitar que a UI mostre "interesse não encontrado" durante a janela de debounce.
  watch(interestsSearchQuery, newValue => {
    if (newValue.trim()) {
      searchedInterests.value = []
      isSearchingInterests.value = true
    } else {
      searchedInterests.value = []
      isSearchingInterests.value = false
    }
  })

  // Cancela a busca anterior quando uma nova é disparada (evita respostas fora de ordem)
  let interestsSearchCtrl: AbortController | null = null

  // ── Handler para busca de interesses (chamado pelo SearchInput com debounce) ──
  async function handleInterestsSearch (query: string) {
    if (!query.trim()) {
      interestsSearchCtrl?.abort()
      searchedInterests.value = []
      isSearchingInterests.value = false
      return
    }

    // Ativa loading (caso ainda não esteja ativo pelo watcher)
    isSearchingInterests.value = true

    // Aborta a busca anterior antes de disparar a nova
    interestsSearchCtrl?.abort()
    interestsSearchCtrl = new AbortController()
    const { signal } = interestsSearchCtrl

    try {
      const response = await searchInterestsByName(query.trim(), signal)
      const interests: UserInterest[] = unwrapList(response, 'interests')

      // Filtra interesses que o usuário já possui (usa tempUserInterests)
      const userInterestIds = new Set(tempUserInterests.value.map(i => i.id))
      searchedInterests.value = interests.filter(i => !userInterestIds.has(i.id)).slice(0, 10)
      isSearchingInterests.value = false
    } catch (error) {
      // Requisição substituída por outra mais recente: mantém o loading do request atual
      if (isRequestCanceled(error)) return
      console.error('Erro ao buscar interesses:', error)
      searchedInterests.value = []
      isSearchingInterests.value = false
    }
  }

  // ── Handler para limpar busca de interesses ──
  function handleClearInterestsSearch () {
    searchedInterests.value = []
    isSearchingInterests.value = false
  }

  function addInterestToUser (interest: UserInterest) {
    // Adiciona apenas na lista temporária (não faz requisição ainda)
    tempUserInterests.value.push(interest)

    // Remove dos resultados de busca e sugestões
    searchedInterests.value = searchedInterests.value.filter(i => i.id !== interest.id)
    suggestedInterests.value = suggestedInterests.value.filter(i => i.id !== interest.id)
  }

  function removeInterestFromUser (interestId: string) {
    // Remove apenas da lista temporária (não faz requisição ainda)
    const removed = tempUserInterests.value.find(i => i.id === interestId)
    tempUserInterests.value = tempUserInterests.value.filter(i => i.id !== interestId)

    // Se removeu, adiciona de volta às sugestões
    if (removed) {
      suggestedInterests.value.unshift(removed)
    }
  }

  async function saveInterestsChanges () {
    try {
      isSavingInterests.value = true

      // Identifica interesses adicionados e removidos
      const originalIds = new Set(userInterests.value.map(i => i.id))
      const tempIds = new Set(tempUserInterests.value.map(i => i.id))

      const toAdd = tempUserInterests.value.filter(i => !originalIds.has(i.id))
      const toRemove = userInterests.value.filter(i => !tempIds.has(i.id))

      // Faz as requisições em paralelo
      const addPromises = toAdd.map(interest => addUserInterest(interest.id))
      const removePromises = toRemove.map(interest => removeUserInterest(interest.id))

      // Aguarda todas as requisições
      await Promise.all([...addPromises, ...removePromises])

      // Atualiza a lista real com os valores temporários
      userInterests.value = [...tempUserInterests.value]

      showSnackbar(t('profile.messages.interestsUpdateSuccess'), '#22c55e')
      closeInterestsModal()
    } catch (error) {
      console.error('Erro ao salvar interesses:', error)
      showSnackbar(t('profile.messages.interestsUpdateError'), '#ef4444')
    } finally {
      isSavingInterests.value = false
    }
  }

  // ── Remove interesse diretamente (usado no botão X da sidebar) ──
  async function removeInterestDirectly (interestId: string) {
    try {
      await removeUserInterest(interestId)

      // Remove da lista local
      userInterests.value = userInterests.value.filter(i => i.id !== interestId)

      showSnackbar(t('profile.messages.interestRemoveSuccess'), '#22c55e')
    } catch (error) {
      console.error('❌ Erro ao remover interesse:', error)
      showSnackbar(t('profile.messages.interestRemoveError'), '#ef4444')
    }
  }

  /**
   * Carrega sugestões de interesses que o usuário ainda não possui.
   *
   * O filtro é do backend (`excludeOwned=true`), não do cliente: assim a lista
   * chega já sem o que ele tem e sempre vem completa com `INLINE_SUGGESTIONS_LIMIT`
   * opções — filtrar no cliente encolheria o bloco a cada interesse adicionado.
   */
  async function loadInlineSuggestions () {
    try {
      isLoadingInlineSuggestions.value = true
      const response = await getUnownedInterestSuggestions(INLINE_SUGGESTIONS_LIMIT)
      inlineSuggestions.value = unwrapList(response, 'interests').slice(0, INLINE_SUGGESTIONS_LIMIT)
    } catch (error) {
      logger.error('Erro ao carregar sugestões de interesse:', error)
      inlineSuggestions.value = []
    } finally {
      isLoadingInlineSuggestions.value = false
    }
  }

  /** Adiciona um interesse sugerido direto do card, sem abrir o modal. */
  async function addInterestDirectly (interest: UserInterest) {
    if (addingInterestId.value) return // evita disparo duplo

    addingInterestId.value = interest.id
    try {
      await addUserInterest(interest.id)

      userInterests.value = [...userInterests.value, interest]
      // Remove na hora (feedback imediato); o watch abaixo recarrega da API e
      // repõe a vaga com um interesse que o usuário ainda não tem.
      inlineSuggestions.value = inlineSuggestions.value.filter(i => i.id !== interest.id)

      showSnackbar(t('profile.messages.interestAddSuccess'), SNACKBAR_COLORS.success)
    } catch (error) {
      logger.error('Erro ao adicionar interesse:', error)
      showSnackbar(t('profile.messages.interestAddError'), SNACKBAR_COLORS.error)
    } finally {
      addingInterestId.value = null
    }
  }

  // Recarrega as sugestões sempre que a lista de interesses muda (adição ou
  // remoção), para o bloco nunca oferecer algo que o usuário já tem.
  watch(userInterests, () => {
    loadInlineSuggestions()
  }, { deep: true })

  // ── Request New Interests ──
  function openRequestModal () {
    newInterestName.value = interestsSearchQuery.value.trim()
    pendingInterests.value = []
    showRequestModal.value = true
  }

  function closeRequestModal () {
    showRequestModal.value = false
    newInterestName.value = ''
    pendingInterests.value = []
    isSubmittingRequest.value = false
  }

  function addToPending () {
    const name = newInterestName.value.trim()
    if (name && !pendingInterests.value.includes(name)) {
      pendingInterests.value.push(name)
      newInterestName.value = ''
    }
  }

  function removePending (index: number) {
    pendingInterests.value.splice(index, 1)
  }

  async function submitNewInterestRequest () {
    // Adiciona o que estiver no input se o usuário esqueceu de clicar no +
    addToPending()

    if (pendingInterests.value.length === 0) {
      showSnackbar(t('profile.messages.addAtLeastOne'), '#ef4444')
      return
    }

    try {
      isSubmittingRequest.value = true

      // Envia a solicitação para o backend
      await requestNewInterests([...pendingInterests.value])

      // Limpa e fecha o modal
      pendingInterests.value = []
      closeRequestModal()

      // Mostra mensagem de sucesso
      showSnackbar(t('profile.messages.requestSuccess'), '#22c55e')

      // Limpa a busca
      interestsSearchQuery.value = ''
      searchedInterests.value = []
    } catch (error: any) {
      console.error('❌ Erro ao solicitar novo interesse:', error)
      const errorMessage = error?.response?.data?.message || t('profile.messages.requestError')
      showSnackbar(errorMessage, '#ef4444')
    } finally {
      isSubmittingRequest.value = false
    }
  }

  // ── Format join date ──
  function formatJoinDate (dateString: string): string {
    const date = new Date(dateString)
    const months = [
      t('profile.months.january'),
      t('profile.months.february'),
      t('profile.months.march'),
      t('profile.months.april'),
      t('profile.months.may'),
      t('profile.months.june'),
      t('profile.months.july'),
      t('profile.months.august'),
      t('profile.months.september'),
      t('profile.months.october'),
      t('profile.months.november'),
      t('profile.months.december'),
    ]
    return `${months[date.getMonth()]} de ${date.getFullYear()}`
  }

  // ── Format short date for mini cards ──
  function formatShortDate (dateString: string): string {
    try {
      const date = new Date(dateString)
      if (Number.isNaN(date.getTime())) return t('profile.likedEvents.soon')

      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      return `${day}/${month}`
    } catch {
      return t('profile.likedEvents.soon')
    }
  }

  // ── Upload handlers ──
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
      showSnackbar(t('profile.messages.fileSizeError'), '#ef4444')
      input.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      showSnackbar(t('profile.messages.fileTypeError'), '#ef4444')
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
      showSnackbar(t('profile.messages.fileSizeError'), '#ef4444')
      input.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      showSnackbar(t('profile.messages.fileTypeError'), '#ef4444')
      input.value = ''
      return
    }

    // Abre o modal de enquadramento da capa
    const reader = new FileReader()
    reader.addEventListener('load', e => {
      const result = (e.target as FileReader)?.result as string
      if (result) {
        openBannerCropModal(result, input)
      }
    })
    reader.readAsDataURL(file)
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
      router.push({
        path: '/private/feed',
        query: id === 'home' ? {} : { tab: id },
      })
    }
  }

  // ── Tabs ──
  const VALID_TABS = ['liked', 'confirmed', 'settings'] as const
  type TabId = typeof VALID_TABS[number]
  const initialTab = VALID_TABS.includes(route.query.tab as TabId)
    ? (route.query.tab as TabId)
    : 'liked'
  const activeTab = ref<TabId>(initialTab)

  const tabs: Array<{ id: TabId, label: string, icon: string }> = [
    { id: 'liked', label: t('profile.tabs.liked'), icon: 'mdi-heart-outline' },
    { id: 'confirmed', label: 'Confirmados', icon: 'mdi-calendar-check' },
    { id: 'settings', label: t('profile.tabs.settings'), icon: 'mdi-cog-outline' },
  ]

  // Persiste a aba na URL e re-busca dados ao trocar
  watch(activeTab, val => {
    router.replace({ query: { ...route.query, tab: val } })
    if (!loggedUser.value?.id) return
    if (val === 'liked') fetchLikedEvents()
    if (val === 'confirmed') fetchConfirmedEvents()
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
  })
  const saving = ref(false)

  /** Confirmação exibida ao tentar fechar o modal com alterações pendentes. */
  const showDiscardConfirm = ref(false)

  // Dentro do modal, o recorte pendente tem precedência sobre a imagem salva —
  // é o que dá ao usuário a noção de "vai ficar assim se eu salvar".
  const displayAvatar = computed(() => pendingAvatarPreview.value ?? (hasAvatar.value ? user.avatar : ''))
  const displayBanner = computed(() => pendingBannerPreview.value ?? (hasBanner.value ? user.banner : ''))

  function openEditModal () {
    // Sempre carrega os valores atuais do perfil ao abrir
    editForm.name = user.name
    editForm.username = user.username.replace('@', '')
    editForm.bio = user.bio
    discardPendingImages()
    showEditModal.value = true
  }

  /** Há algo digitado ou recortado que ainda não foi para o servidor? */
  const hasUnsavedChanges = computed(() =>
    editForm.name !== user.name
    || editForm.username !== user.username.replace('@', '')
    || editForm.bio !== user.bio
    || pendingAvatarFile.value !== null
    || pendingBannerFile.value !== null,
  )

  /** Fecha de fato, descartando tudo que não foi salvo. */
  function discardAndCloseEditModal () {
    showDiscardConfirm.value = false
    showEditModal.value = false
    discardPendingImages()
    editForm.name = user.name
    editForm.username = user.username.replace('@', '')
    editForm.bio = user.bio
  }

  /** Ponto de saída do modal: pede confirmação se houver alteração pendente. */
  function closeEditModal () {
    if (saving.value) return

    if (hasUnsavedChanges.value) {
      showDiscardConfirm.value = true
      return
    }

    discardAndCloseEditModal()
  }

  async function saveProfile () {
    saving.value = true
    try {
      const userId = loggedUser.value?.id
      if (!userId) {
        throw new Error('ID do usuário não encontrado')
      }

      // Sobe as imagens recortadas antes dos campos de texto. Se um upload
      // falhar, o catch interrompe e nada é persistido pela metade.
      if (pendingAvatarFile.value) {
        uploadingAvatar.value = true
        try {
          await uploadProfileImage(pendingAvatarFile.value)
        } finally {
          uploadingAvatar.value = false
        }
      }

      if (pendingBannerFile.value) {
        uploadingBanner.value = true
        try {
          await uploadBannerImage(pendingBannerFile.value)
        } finally {
          uploadingBanner.value = false
        }
      }

      // Envia para o backend
      const response = await updateUserProfile(userId, {
        name: editForm.name,
        username: editForm.username.replace('@', ''),
        bio: editForm.bio,
      })

      // Usa o que o backend efetivamente confirmou salvar, não o que foi digitado —
      // se a API silenciosamente não persistir a bio, isso fica visível na hora
      // em vez de só aparecer depois de um reload.
      // Usa 'in' (não ??) para diferenciar "campo ausente na resposta" (mantém o
      // valor digitado) de "campo presente mas vazio/null" (backend confirmou que
      // não salvou — reflete isso na hora em vez de mascarar com o valor digitado).
      const savedData: Record<string, any> = unwrapItem(response) ?? {}
      user.name = 'name' in savedData ? (savedData.name || editForm.name) : editForm.name
      user.username = 'username' in savedData && savedData.username ? `@${savedData.username}` : `@${editForm.username.replace('@', '')}`
      user.bio = 'bio' in savedData ? (savedData.bio ?? '') : editForm.bio

      // As prévias já foram para o servidor; libera os object URLs e fecha.
      const hadNewImages = pendingAvatarFile.value !== null || pendingBannerFile.value !== null
      discardPendingImages()
      showEditModal.value = false

      // Só relê o perfil quando houve troca de imagem — as URLs finais das
      // fotos vêm do backend, não dos blobs locais.
      if (hadNewImages) await fetchUserProfile()

      if ('bio' in savedData && (savedData.bio ?? '') !== editForm.bio) {
        logger.warn('[Profile] Backend não persistiu a bio enviada:', { enviado: editForm.bio, salvo: savedData.bio })
      }

      // Invalida o cache para forçar reload na próxima vez
      cachedUserProfileData.value = null

      // Sincroniza com localStorage para manter consistência
      updateUser({
        name: editForm.name,
        username: editForm.username.replace('@', ''),
      })

      showSnackbar(t('profile.messages.profileUpdateSuccess'))
    } catch (error: any) {
      // Em caso de erro, não atualiza nada e mantém os valores originais
      showSnackbar(t('profile.messages.profileUpdateError'), '#ef4444')
      console.error('Erro ao atualizar perfil:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      })
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
    title: string
    description: string
    confirmed: number
    interested: number
    /** Local do evento — não confundir com a localização do perfil, que foi removida. */
    location?: string
    likes?: number
    interests?: string[]
    commentsCount?: number
  }
  const { startLoading, stopLoading, isLoading: checkLoading } = useLoading()

  // Tempo mínimo (ms) que o skeleton fica visível. Sem isso, quando os dados vêm
  // do cache a busca resolve no mesmo tick e o loader não chega a aparecer.
  const MIN_SKELETON_MS = 600

  const likedEventsItems = ref<LikedEventItem[]>([])
  const displayLimit = ref(CONFIG.INITIAL_DISPLAY_LIMIT)
  let likedEventsTimeout: ReturnType<typeof setTimeout> | null = null
  let interestsSearchTimeout: ReturnType<typeof setTimeout> | null = null
  let userSearchTimeout: ReturnType<typeof setTimeout> | null = null

  // ── Estados para eventos confirmados ──
  const confirmedEventsItems = ref<LikedEventItem[]>([])
  const confirmedDisplayLimit = ref(CONFIG.INITIAL_DISPLAY_LIMIT)
  let confirmedEventsTimeout: ReturnType<typeof setTimeout> | null = null

  const displayedConfirmedEvents = computed(() => {
    return confirmedEventsItems.value.slice(0, confirmedDisplayLimit.value)
  })

  const hasMoreConfirmedEvents = computed(() => {
    return confirmedEventsItems.value.length > confirmedDisplayLimit.value
  })

  const showConfirmedCollapseButton = computed(() => {
    return confirmedDisplayLimit.value > CONFIG.INITIAL_DISPLAY_LIMIT
  })

  function showMoreConfirmedEvents () {
    confirmedDisplayLimit.value += CONFIG.EVENTS_DISPLAY_INCREMENT
  }

  function collapseConfirmedEvents () {
    confirmedDisplayLimit.value = CONFIG.INITIAL_DISPLAY_LIMIT
  }

  const displayedLikedEvents = computed(() => {
    return likedEventsItems.value.slice(0, displayLimit.value)
  })

  const hasMoreEvents = computed(() => {
    return likedEventsItems.value.length > displayLimit.value
  })

  const showCollapseButton = computed(() => {
    return displayLimit.value > CONFIG.INITIAL_DISPLAY_LIMIT
  })

  function showMoreEvents () {
    displayLimit.value += CONFIG.EVENTS_DISPLAY_INCREMENT
  }

  function collapseEvents () {
    displayLimit.value = CONFIG.INITIAL_DISPLAY_LIMIT
  }

  // ── Helpers para eventos curtidos ──
  // O payload de confirmados varia conforme a origem: /events traz `confirmedCount`,
  // enquanto o `event` aninhado em `eventAttendances` do perfil vem só com `_count`
  // (ou com a própria lista de presenças). Tenta todas as formas antes de cair em 0.
  function resolveConfirmedCount (evt: any): number {
    const candidates = [
      evt?.confirmedCount,
      evt?.attendancesCount,
      evt?.attendeesCount,
      evt?._count?.attendances,
      evt?._count?.eventAttendances,
      evt?._count?.attendees,
      Array.isArray(evt?.attendances) ? evt.attendances.length : undefined,
      Array.isArray(evt?.eventAttendances) ? evt.eventAttendances.length : undefined,
      Array.isArray(evt?.attendees) ? evt.attendees.length : undefined,
    ]
    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) return value
    }
    return 0
  }

  /**
   * A listagem de perfil (`GET /users/:id`) traz o evento aninhado em
   * `eventAttendances` num formato enxuto, sem os campos de contagem que o
   * endpoint de detalhe do evento tem (`confirmedCount`, `_count.attendances`
   * etc.) — então `resolveConfirmedCount` cai em 0 mesmo quando existe
   * confirmação. Mas o próprio fato do evento estar em `eventAttendances` já
   * prova que há pelo menos 1 confirmado: o usuário logado. Piso o valor aqui
   * em vez de em `resolveConfirmedCount`, que também serve a aba de curtidos —
   * lá 0 pode ser o valor real.
   */
  function mapConfirmedAttendance (evt: any): LikedEventItem {
    const mapped = mapLikedEvent(evt)
    return { ...mapped, confirmed: Math.max(1, mapped.confirmed) }
  }

  /**
   * Mesmo raciocínio de `mapConfirmedAttendance`, aplicado à aba "Curtidos":
   * o evento só está em `userData.likedEvents` porque o usuário logado o
   * curtiu, então `likes` é comprovadamente >= 1 mesmo quando o payload enxuto
   * do perfil não traz nenhum campo de contagem.
   */
  function mapLikedEventItem (evt: any): LikedEventItem {
    const mapped = mapLikedEvent(evt)
    return { ...mapped, likes: Math.max(1, mapped.likes ?? 0) }
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
      return t('profile.likedEvents.dateUndefined')
    }
    return {
      id: evt.id,
      banner: rawBanner,
      creator: { name: hostName },
      hostAvatar: evt.organizer?.avatar || evt.hostAvatar || evt.creator?.profileImage || '',
      schedule: resolveSchedule(evt),
      location: evt.location || evt.address || t('profile.likedEvents.locationUndefined'),
      title: evt.name || evt.title || t('profile.likedEvents.eventTitle'),
      description: evt.description || '',
      confirmed: resolveConfirmedCount(evt),
      interested: evt.interestedCount || 0,
      likes: evt.likesCount || evt.likes || evt._count?.likes || 0,
      interests: (evt.eventInterests || evt.interests || evt.categories || []).map((i: any) => typeof i === 'string' ? i : i.interest?.name || i.name).filter(Boolean),
      commentsCount: evt.commentsCount ?? evt._count?.comments ?? 0,
    }
  }

  async function fetchLikedEvents () {
    if (!loggedUser.value?.id) return

    likedEventsItems.value = []
    startLoading('profile:liked')
    const likedStartedAt = Date.now()

    // Timeout de 3 segundos para o skeleton loading
    if (likedEventsTimeout) {
      clearTimeout(likedEventsTimeout)
    }

    likedEventsTimeout = setTimeout(() => {
      if (checkLoading('profile:liked')) {
        stopLoading('profile:liked')
      }
    }, 3000)

    try {
      // Usa dados do cache se disponível, senão busca da API
      let userData = cachedUserProfileData.value

      if (!userData) {
        const response = await getUserProfile(loggedUser.value.id)
        userData = unwrapItem(response) ?? {}
        cachedUserProfileData.value = userData
      }

      // Extrai eventos curtidos do perfil do usuário
      let events: any[] = []
      if (userData?.likedEvents && Array.isArray(userData.likedEvents)) {
        events = userData.likedEvents
      } else if (userData?.events?.liked && Array.isArray(userData.events.liked)) {
        events = userData.events.liked
      } else if (userData?.likes && Array.isArray(userData.likes)) {
        events = userData.likes
      }

      // Mapeia para o formato de exibição
      likedEventsItems.value = events
        .filter((e: any) => e && e.id)
        .map((evt: any) => mapLikedEventItem(evt))

      // Registra contagem e estado pelo store, e não escrevendo em likedEvents
      // direto: a escrita direta atropelava um clique em voo (o store guarda
      // esses ids) e zerava a contagem que outras telas já tinham resolvido.
      for (const evt of events) {
        if (evt?.id) eventsStore.registerEventLikeState({ ...evt, isLiked: true })
      }

      // Se a lista está vazia, aguarda o timeout de 3 segundos antes de mostrar empty state
      if (events.length === 0) {
        // O timeout já foi configurado acima, apenas aguarda
        return
      }

      // Cancela o timeout de fallback e encerra o loading respeitando o tempo
      // mínimo de skeleton (garante que o loader apareça mesmo com cache).
      if (likedEventsTimeout) {
        clearTimeout(likedEventsTimeout)
      }
      const likedElapsed = Date.now() - likedStartedAt
      likedEventsTimeout = setTimeout(() => {
        stopLoading('profile:liked')
        likedEventsTimeout = null
      }, Math.max(0, MIN_SKELETON_MS - likedElapsed))
    } catch (error_) {
      console.error('Erro ao buscar eventos curtidos do perfil do usuário:', error_)
      likedEventsItems.value = []
    // Em caso de erro, o timeout de 3s já está configurado
    }
  }

  async function handleUnlikeEvent (eventId: string | number, event: Event) {
    // Previne a navegação para a página do evento
    event.stopPropagation()

    try {
      // Toggle like no store (vai descurtir já que está curtido)
      await eventsStore.toggleLike(eventId)

      // Remove o item da lista de eventos curtidos
      const index = likedEventsItems.value.findIndex(item => String(item.id) === String(eventId))
      if (index !== -1) {
        likedEventsItems.value.splice(index, 1)
      }

      showSnackbar(t('profile.likedEvents.unlikedSuccess'), SNACKBAR_COLORS.success)
    } catch (error_) {
      console.error('Erro ao descurtir evento:', error_)
      showSnackbar(t('profile.likedEvents.unlikedError'), SNACKBAR_COLORS.error)
    }
  }

  // ── Fetch eventos confirmados ──
  // NOTA: Os eventos confirmados agora vem direto do getUserProfile (eventAttendances)
  // Esta função fica disponível caso seja necessário fazer um refresh manual
  async function fetchConfirmedEvents () {
    if (!loggedUser.value?.id) return

    confirmedEventsItems.value = []
    startLoading('profile:confirmed')
    const confirmedStartedAt = Date.now()

    if (confirmedEventsTimeout) {
      clearTimeout(confirmedEventsTimeout)
    }

    confirmedEventsTimeout = setTimeout(() => {
      if (checkLoading('profile:confirmed')) {
        stopLoading('profile:confirmed')
      }
    }, 3000)

    try {
      // Usa o mesmo endpoint de getUserProfile que já retorna eventAttendances corretamente
      const response = await getUserProfile(loggedUser.value.id)
      const userData = unwrapItem(response) ?? {}

      confirmedEventsItems.value = userData?.eventAttendances && Array.isArray(userData.eventAttendances)
        ? userData.eventAttendances
          .filter((e: any) => e && (e.id || e.eventId))
          .map((evt: any) => mapConfirmedAttendance(evt.event || evt))
        : []

      if (confirmedEventsTimeout) {
        clearTimeout(confirmedEventsTimeout)
      }
      const confirmedElapsed = Date.now() - confirmedStartedAt
      confirmedEventsTimeout = setTimeout(() => {
        stopLoading('profile:confirmed')
        confirmedEventsTimeout = null
      }, Math.max(0, MIN_SKELETON_MS - confirmedElapsed))
    } catch (error_) {
      console.error('Erro ao buscar eventos confirmados:', error_)
      confirmedEventsItems.value = []
      stopLoading('profile:confirmed')
    }
  }

  // Cancelar presença foi movido para a página do evento — o card do perfil é só leitura.

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

  // ── Share Profile ──
  function handleShareProfile () {
    const profileUrl = `${window.location.origin}/private/profile`
    const shareText = user.bio || `Confira o perfil de ${user.name} no WE PARTY!`

    shareStore.open({
      title: `Perfil de ${user.name}`,
      text: shareText,
      url: profileUrl,
    })
  }
</script>

<template>
  <div class="profile-page-layout">
    <WePartyLoader
      v-if="loading"
      :messages="[
        'Carregando seu perfil...',
        'Buscando suas informações...',
        'Quase lá...',
      ]"
    />

    <FeedTopHeader :user="user" />

    <section :aria-label="t('profile.aria.profileContent')" class="layout-shell">
      <FeedSidebarNav :active="activeNav" class="layout-sidebar" :items="navItems" @select="handleNavSelect" />

      <!-- Main Content -->
      <main class="layout-main" role="main">
        <!-- Breadcrumb com acessibilidade -->
        <nav :aria-label="t('profile.aria.navigation')" class="breadcrumb-nav">
          <button
            :aria-label="t('profile.aria.backToFeed')"
            class="breadcrumb-back"
            type="button"
            @click="handleBackNavigation"
          >
            <span aria-hidden="true" class="back-icon">
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
            <span class="back-text">{{ t('common.back') }}</span>
          </button>
          <span aria-hidden="true" class="breadcrumb-separator">
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
        </nav>

        <!-- Profile Header Card -->
        <div class="profile-card">
          <div
            :aria-label="hasBanner ? t('profile.aria.coverImage') : t('profile.aria.defaultCover')"
            class="cover-image"
            :class="{ 'no-banner': !hasBanner }"
            role="img"
            :style="hasBanner ? { backgroundImage: `url(${user.banner})` } : {}"
          >
            <div aria-hidden="true" class="overlay" />
          </div>

          <div class="profile-content">
            <div class="avatar-section">
              <div class="avatar-wrapper">
                <UserAvatar
                  class="avatar-img"
                  :image="hasAvatar ? user.avatar : null"
                  :name="user.name"
                  :size="96"
                />
                <div :aria-label="t('profile.aria.onlineStatus')" class="status-indicator" role="status" />
              </div>

              <div class="profile-actions-top">
                <button :aria-label="t('profile.editProfile')" class="edit-btn" type="button" @click="openEditModal">
                  <i aria-hidden="true" class="mdi mdi-pencil-outline" />
                  {{ t('profile.editProfile') }}
                </button>
                <button
                  :aria-label="t('profile.shareProfile')"
                  class="share-btn"
                  type="button"
                  @click="handleShareProfile"
                >
                  <i aria-hidden="true" class="mdi mdi-share-variant-outline" />
                </button>
              </div>
            </div>

            <header class="header-info">
              <h1>{{ user.name || t('profile.yourName') }}</h1>
              <span class="handle">{{ user.username || `@${t('profile.username')}` }}</span>
              <p v-if="user.bio" class="bio">{{ user.bio }}</p>
              <p v-else class="bio bio-placeholder">{{ t('profile.bioPlaceholder') }}</p>

              <!-- User Interests -->
              <div v-if="userInterests.length > 0" :aria-label="t('profile.yourInterests')" class="interests-section">
                <div class="interests-chips-wrapper">
                  <ul class="interests-chips" role="list">
                    <li v-for="interest in userInterests" :key="interest.id" class="interest-chip">
                      {{ interest.name }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Follow Stats -->
              <div class="follow-stats-row">
                <button class="follow-stat" type="button" @click="openFollowersModal">
                  <span class="follow-stat-count">{{ followStats.followers }}</span>
                  <span class="follow-stat-label">{{ t('profile.followers') }}</span>
                </button>
                <span class="follow-stat-divider" />
                <button class="follow-stat" type="button" @click="openFollowingModal">
                  <span class="follow-stat-count">{{ followStats.following }}</span>
                  <span class="follow-stat-label">{{ t('profile.following') }}</span>
                </button>
              </div>

              <div class="meta-row">
                <span class="meta-item">
                  <i aria-hidden="true" class="mdi mdi-calendar-outline" />
                  {{ t('profile.joinedIn') }} {{ user.joined }}
                </span>
              </div>

            </header>
          </div>
        </div>

        <!-- Tabs com acessibilidade -->
        <div :aria-label="t('profile.aria.profileTabs')" class="content-tabs" role="tablist">
          <button
            v-for="tab in tabs"
            :id="`tab-${tab.id}`"
            :key="tab.id"
            :aria-controls="`tabpanel-${tab.id}`"
            :aria-selected="activeTab === tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            role="tab"
            @click="activeTab = tab.id"
          >
            <img
              v-if="tab.icon.startsWith('/')"
              :alt="''"
              aria-hidden="true"
              class="tab-icon-img"
              :src="tab.icon"
            >
            <i v-else aria-hidden="true" class="mdi tab-icon" :class="tab.icon" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div :id="`tabpanel-${activeTab}`" :aria-labelledby="`tab-${activeTab}`" class="tab-panel" role="tabpanel">
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
            <div v-if="loading || checkLoading('profile:liked')" class="loading-liked">
              <div class="skeleton-event-grid">
                <div v-for="n in 6" :key="n" class="skeleton-event-card">
                  <div class="skel-banner">
                    <div class="skel-date-chip" />
                  </div>
                  <div class="skel-body">
                    <div class="skel-line skel-title" />
                    <div class="skel-line skel-location" />
                    <div class="skel-stats-row">
                      <div class="skel-line skel-stat" />
                      <div class="skel-line skel-stat-sm" />
                    </div>
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
                      {{ item.location || t('profile.likedEvents.locationUndefined') }}
                    </div>
                    <div class="mini-card-stats">
                      <span class="mini-stat">
                        <i class="mdi mdi-account-multiple" />
                        {{ item.confirmed }}
                      </span>
                      <button
                        class="mini-stat mini-stat-btn"
                        :title="t('profile.likedEvents.unlikeTooltip')"
                        @click="handleUnlikeEvent(item.id, $event)"
                      >
                        <svg
                          class="mini-stat-icon"
                          :fill="eventsStore.isLiked(item.id) ? 'currentColor' : 'none'"
                          height="14"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                          width="14"
                        >
                          <path
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                          />
                        </svg>
                        {{ eventsStore.getLikeCount(item.id, item.likes || 0) }}
                      </button>
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Botões de Mostrar Mais / Recolher -->
              <div v-if="hasMoreEvents || showCollapseButton" class="show-more-container">
                <button v-if="hasMoreEvents" class="show-more-btn" @click="showMoreEvents">
                  <span>{{ t('profile.likedEvents.showMore') }}</span>
                  <i class="mdi mdi-chevron-down" />
                </button>
                <button v-if="showCollapseButton" class="collapse-btn" @click="collapseEvents">
                  <span>{{ t('profile.likedEvents.showLess') }}</span>
                  <i class="mdi mdi-chevron-up" />
                </button>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon">
                <svg
                  class="empty-icon-img"
                  fill="none"
                  height="48"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="48"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </div>
              <h3>{{ t('profile.likedEvents.empty') }}</h3>
              <p>{{ t('profile.likedEvents.emptyDescription') }}</p>
              <button class="empty-action" @click="router.push('/private/feed')">
                <i class="mdi mdi-compass-outline" />
                {{ t('profile.likedEvents.exploreEvents') }}
              </button>
            </div>
          </div>

          <!-- Confirmed Events -->
          <div v-if="activeTab === 'confirmed'" class="confirmed-events-panel">
            <div v-if="loading || checkLoading('profile:confirmed')" class="loading-liked">
              <div class="skeleton-event-grid">
                <div v-for="n in 6" :key="n" class="skeleton-event-card">
                  <div class="skel-banner">
                    <div class="skel-date-chip" />
                  </div>
                  <div class="skel-body">
                    <div class="skel-line skel-title" />
                    <div class="skel-line skel-location" />
                    <div class="skel-stats-row">
                      <div class="skel-line skel-stat" />
                      <div class="skel-line skel-stat-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="confirmedEventsItems.length > 0">
              <TransitionGroup class="liked-mini-cards-grid" name="mini-card" tag="div">
                <div
                  v-for="item in displayedConfirmedEvents"
                  :key="item.id"
                  class="mini-event-card confirmed-card"
                  @click="router.push(`/private/event/${item.id}`)"
                >
                  <div class="mini-card-banner">
                    <img :alt="item.title" :src="item.banner">
                    <div class="mini-card-date">
                      <i class="mdi mdi-calendar" />
                      {{ formatShortDate(item.schedule) }}
                    </div>
                    <div class="confirmed-badge">
                      <i class="mdi mdi-check-circle" />
                    </div>
                  </div>
                  <div class="mini-card-content">
                    <h4 class="mini-card-title">{{ item.title }}</h4>
                    <div class="mini-card-location">
                      <i class="mdi mdi-map-marker" />
                      {{ item.location || 'Local não definido' }}
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Botões de Mostrar Mais / Recolher -->
              <div v-if="hasMoreConfirmedEvents || showConfirmedCollapseButton" class="show-more-container">
                <button v-if="hasMoreConfirmedEvents" class="show-more-btn" @click="showMoreConfirmedEvents">
                  <span>Mostrar Mais</span>
                  <i class="mdi mdi-chevron-down" />
                </button>
                <button v-if="showConfirmedCollapseButton" class="collapse-btn" @click="collapseConfirmedEvents">
                  <span>Mostrar Menos</span>
                  <i class="mdi mdi-chevron-up" />
                </button>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon confirmed-empty-icon">
                <i class="mdi mdi-calendar-check-outline" />
              </div>
              <h3>Nenhuma presença confirmada</h3>
              <p>Você ainda não confirmou presença em nenhum evento. Explore e confirme sua presença nos eventos que
                deseja participar!</p>
              <button class="empty-action" @click="router.push('/private/feed')">
                <i class="mdi mdi-compass-outline" />
                Explorar eventos
              </button>
            </div>
          </div>

          <!-- Settings -->
          <div v-if="activeTab === 'settings'" class="settings-panel">
            <div class="settings-group">
              <h4 class="settings-group-title">{{ t('profile.settings.general') }}</h4>
              <div class="setting-item" @click="settingsNotifications = !settingsNotifications">
                <div class="setting-left">
                  <div class="setting-icon-wrap">
                    <i class="mdi mdi-bell-outline" />
                  </div>
                  <div>
                    <span class="setting-name">{{ t('profile.settings.notifications') }}</span>
                    <span class="setting-desc">{{ t('profile.settings.notificationsDesc') }}</span>
                  </div>
                </div>
                <div class="toggle-switch" :class="{ checked: settingsNotifications }" />
              </div>

              <div class="setting-item language-setting">
                <div class="setting-left">
                  <div class="setting-icon-wrap">
                    <i class="mdi mdi-web" />
                  </div>
                  <div>
                    <span class="setting-name">{{ t('profile.settings.language') }}</span>
                    <span class="setting-desc">{{ t('profile.settings.languageDesc') }}</span>
                  </div>
                </div>
                <div class="language-selector">
                  <LanguageSwitcher />
                </div>
              </div>

            </div>

            <div class="settings-group">
              <h4 class="settings-group-title">{{ t('profile.settings.account') }}</h4>
              <div class="setting-item" @click="openEditModal">
                <div class="setting-left">
                  <div class="setting-icon-wrap">
                    <i class="mdi mdi-account-edit-outline" />
                  </div>
                  <div>
                    <span class="setting-name">{{ t('profile.settings.editProfile') }}</span>
                    <span class="setting-desc">{{ t('profile.settings.editProfileDesc') }}</span>
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
                    <span class="setting-name">{{ t('profile.settings.logout') }}</span>
                    <span class="setting-desc">{{ t('profile.settings.logoutDesc') }}</span>
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
          <div class="interests-header">
            <h3>{{ t('profile.interests.title') }}</h3>
            <button class="add-interest-btn" :title="t('profile.interests.manage')" @click="openInterestsModal">
              <i class="mdi mdi-plus" />
            </button>
          </div>
          <div v-if="loading || loadingInterests" class="interests-sidebar-loading">
            <AppLoader size="sm" :text="t('profile.interests.loading')" />
          </div>
          <div v-else-if="userInterests.length > 0" class="interests-tags-wrapper">
            <div class="interests-tags">
              <span v-for="interest in userInterests" :key="interest.id" class="tag">
                {{ interest.name }}
                <button
                  class="remove-interest-btn"
                  :title="t('profile.interests.remove')"
                  type="button"
                  @click.stop="removeInterestDirectly(interest.id)"
                >
                  <i class="mdi mdi-close" />
                </button>
              </span>
            </div>
          </div>
          <p v-else class="interests-empty">{{ t('profile.interests.empty') }}</p>

          <!-- Sugestões: aparecem tendo o usuário interesses ou não. O backend já
               devolve só o que ele ainda não possui (excludeOwned=true). -->
          <div
            v-if="!loading && !loadingInterests && (isLoadingInlineSuggestions || inlineSuggestions.length > 0)"
            class="interests-suggestions"
          >
            <p class="interests-suggestions-hint">{{ t('profile.interests.suggestionsHint') }}</p>

            <AppLoader v-if="isLoadingInlineSuggestions" size="sm" :text="t('profile.interests.loadingSuggestions')" />

            <div v-else class="interests-suggestions-list">
              <SelectableChip
                v-for="interest in inlineSuggestions"
                :key="interest.id"
                :disabled="addingInterestId !== null"
                :is-selected="false"
                :label="interest.name"
                :loading="addingInterestId === interest.id"
                @toggle="addInterestDirectly(interest)"
              />
            </div>
          </div>
        </div>

        <!-- Recomendações de Usuários -->
        <div class="sidebar-card recommendations-card">
          <div class="recommendations-header">
            <h3>{{ t('profile.recommendations.title') }}</h3>
          </div>
          <!-- Campo de busca de usuários -->
          <div class="user-search-wrapper">
            <SearchInput
              v-model="userSearchQuery"
              :loading="searchingUsers"
              :placeholder="t('profile.recommendations.searchPlaceholder') || 'Buscar usuários...'"
              size="small"
              @clear="handleClearUserSearch"
              @search="handleUserSearch"
            />
          </div>
          <div v-if="loadingRecommendations" class="recommendations-loading">
            <AppLoader size="sm" :text="t('profile.recommendations.loading')" />
          </div>
          <div v-else-if="searchingUsers && userSearchQuery.trim()" class="recommendations-loading">
            <AppLoader size="sm" :text="t('profile.recommendations.searching') || 'Buscando...'" />
          </div>
          <div v-else-if="filteredRecommendedUsers.length > 0" class="recommendations-list-wrapper">
            <ul class="recommendations-list">
              <li v-for="recUser in filteredRecommendedUsers" :key="recUser.id" class="recommendation-item">
                <div class="recommendation-avatar">
                  <UserAvatar
                    :image="recUser.profileImage"
                    :name="recUser.name"
                    :size="40"
                  />
                </div>
                <div class="recommendation-info">
                  <span class="recommendation-name">{{ recUser.name }}</span>
                  <span v-if="recUser.username" class="recommendation-username">@{{ recUser.username }}</span>
                </div>
                <FollowButton
                  :following="!!recUser.isFollowing"
                  :following-label="t('profile.followersModal.following')"
                  :label="t('profile.followersModal.follow')"
                  @toggle="toggleFollowUser(recUser)"
                />
              </li>
            </ul>
          </div>
          <p v-else-if="userSearchQuery && !searchingUsers && filteredRecommendedUsers.length === 0" class="recommendations-empty">
            {{ t('profile.recommendations.noResults') || 'Nenhum usuário encontrado' }}
          </p>
          <p v-else class="recommendations-empty">{{ t('profile.recommendations.empty') }}</p>
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
              <h2>{{ t('profile.editModal.title') }}</h2>
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
                  :class="{ 'no-banner': !displayBanner }"
                  :style="displayBanner ? { backgroundImage: `url(${displayBanner})` } : {}"
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
                  <UserAvatar
                    class="modal-avatar-img"
                    :image="displayAvatar"
                    :name="user.name"
                    :size="72"
                  />
                  <button
                    class="modal-avatar-edit"
                    :disabled="uploadingAvatar"
                    :title="t('profile.editModal.changeAvatar')"
                  >
                    <i v-if="uploadingAvatar" class="mdi mdi-loading mdi-spin" />
                    <i v-else class="mdi mdi-camera-outline" />
                  </button>
                </div>
              </div>

              <!-- Form fields -->
              <div class="form-group">
                <label class="form-label" for="edit-name">{{ t('profile.editModal.name') }}</label>
                <input
                  id="edit-name"
                  v-model="editForm.name"
                  class="form-input"
                  maxlength="50"
                  :placeholder="t('profile.editModal.namePlaceholder')"
                  type="text"
                >
                <span class="char-count">{{ editForm.name.length }}/50</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-username">{{ t('profile.editModal.username') }}</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">@</span>
                  <input
                    id="edit-username"
                    v-model="editForm.username"
                    class="form-input with-prefix"
                    maxlength="30"
                    :placeholder="t('profile.editModal.usernamePlaceholder')"
                    type="text"
                  >
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-bio">{{ t('profile.editModal.bio') }}</label>
                <textarea
                  id="edit-bio"
                  v-model="editForm.bio"
                  class="form-textarea"
                  :maxlength="BIO_MAX_LENGTH"
                  :placeholder="t('profile.editModal.bioPlaceholder')"
                  rows="3"
                />
                <span class="char-count">{{ editForm.bio.length }}/{{ BIO_MAX_LENGTH }}</span>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" :disabled="saving" @click="closeEditModal">
                {{ t('profile.editModal.cancel') }}
              </button>
              <button class="btn-save" :disabled="saving" @click="saveProfile">
                <i v-if="saving" class="mdi mdi-loading mdi-spin" />
                {{ saving ? t('profile.editModal.saving') : t('profile.editModal.save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Confirmação de descarte ao fechar o modal de edição -->
    <ConfirmDialog
      v-model="showDiscardConfirm"
      :cancel-label="t('profile.discardModal.keepEditing')"
      :confirm-label="t('profile.discardModal.discard')"
      danger
      :message="t('profile.discardModal.message')"
      :title="t('profile.discardModal.title')"
      @confirm="discardAndCloseEditModal"
    />

    <!-- Crop Avatar Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCropModal" class="modal-overlay crop-modal-overlay" @click.self="closeCropModal">
          <div class="crop-modal-container">
            <div class="crop-modal-header">
              <h2>{{ t('profile.cropModal.title') }}</h2>
              <button class="modal-close" @click="closeCropModal">
                <i class="mdi mdi-close" />
              </button>
            </div>

            <div class="crop-modal-body">
              <ImageCropper
                ref="avatarCropperRef"
                :aspect-ratio="AVATAR_ASPECT"
                circle
                :output-mime-type="cropMimeType"
                :output-size="CONFIG.AVATAR_OUTPUT_SIZE"
                :src="cropImageSrc"
              />
            </div>

            <div class="crop-modal-footer">
              <button class="btn-cancel" @click="closeCropModal">{{ t('profile.cropModal.cancel') }}</button>
              <button class="btn-save" :disabled="uploadingAvatar" @click="confirmCrop">
                <i v-if="uploadingAvatar" class="mdi mdi-loading mdi-spin" />
                {{ uploadingAvatar ? t('profile.cropModal.uploading') : t('profile.cropModal.apply') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Banner Crop Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showBannerCropModal"
          class="modal-overlay banner-crop-modal-overlay"
          @click.self="closeBannerCropModal"
        >
          <div class="banner-crop-modal-container">
            <div class="crop-modal-header">
              <div class="banner-crop-header-content">
                <i class="mdi mdi-panorama" />
                <h2>Enquadrar Foto de Capa</h2>
              </div>
              <button class="modal-close" @click="closeBannerCropModal">
                <i class="mdi mdi-close" />
              </button>
            </div>

            <div class="banner-crop-modal-body">
              <p class="banner-crop-hint">
                <i class="mdi mdi-gesture-swipe" />
                Arraste para reposicionar · Use os controles abaixo para ajustar o zoom
              </p>

              <ImageCropper
                ref="bannerCropperRef"
                :aspect-ratio="BANNER_ASPECT"
                :output-mime-type="bannerCropMimeType"
                :output-size="1600"
                :src="bannerCropImageSrc"
              />
            </div>

            <div class="crop-modal-footer">
              <button class="btn-cancel" @click="closeBannerCropModal">Cancelar</button>
              <button class="btn-save" :disabled="uploadingBanner" @click="confirmBannerCrop">
                <i v-if="uploadingBanner" class="mdi mdi-loading mdi-spin" />
                {{ uploadingBanner ? 'Enviando...' : 'Aplicar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Manage Interests Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showInterestsModal" class="modal-overlay" @click.self="closeInterestsModal">
          <div class="interests-modal-container">
            <div class="interests-modal-header">
              <h2>{{ t('profile.interestsModal.title') }}</h2>
              <button class="modal-close" @click="closeInterestsModal">
                <i class="mdi mdi-close" />
              </button>
            </div>

            <div class="interests-modal-body">
              <!-- Busca de interesses -->
              <div class="interests-search-section">
                <SearchInput
                  v-model="interestsSearchQuery"
                  :loading="isSearchingInterests"
                  :placeholder="t('profile.interests.searchPlaceholder')"
                  @clear="handleClearInterestsSearch"
                  @search="handleInterestsSearch"
                />
              </div>

              <!-- Estado de loading -->
              <div v-if="isSearchingInterests && interestsSearchQuery.trim()" class="loading-suggestions">
                <AppLoader size="md" :text="t('profile.interests.searching') || 'Buscando interesses...'" />
              </div>

              <!-- Resultados da busca -->
              <div v-else-if="interestsSearchQuery.trim() && searchedInterests.length > 0" class="search-results-section">
                <h4>{{ t('profile.interests.searchResults') }}</h4>
                <div class="interests-list">
                  <div v-for="interest in searchedInterests" :key="interest.id" class="interest-item">
                    <span class="interest-name">{{ interest.name }}</span>
                    <button class="add-btn" @click="addInterestToUser(interest)">
                      <i class="mdi mdi-plus" />
                      {{ t('profile.interests.add') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Mensagem quando não há resultados -->
              <div
                v-else-if="interestsSearchQuery.trim() && !isSearchingInterests && searchedInterests.length === 0"
                class="no-results"
              >
                <i class="mdi mdi-emoticon-sad-outline" />
                <p>{{ t('profile.interests.noResults') }}</p>
                <button class="request-interest-btn" @click="openRequestModal">
                  <i class="mdi mdi-plus-circle" />
                  {{ t('profile.interests.requestNew') }}
                </button>
              </div>

              <!-- Sugestões de interesses (quando não há busca ativa) -->
              <div v-if="!interestsSearchQuery.trim()" class="suggestions-section">
                <h4>{{ t('profile.interests.suggestions') }}</h4>
                <div v-if="isLoadingSuggestions" class="loading-suggestions">
                  <AppLoader size="md" :text="t('profile.interests.loadingSuggestions')" />
                </div>
                <div v-else-if="suggestedInterests.length > 0" class="interests-list">
                  <div v-for="interest in suggestedInterests" :key="interest.id" class="interest-item">
                    <span class="interest-name">{{ interest.name }}</span>
                    <button class="add-btn" @click="addInterestToUser(interest)">
                      <i class="mdi mdi-plus" />
                      {{ t('profile.interests.add') }}
                    </button>
                  </div>
                </div>
                <p v-else class="empty-suggestions">
                  {{ t('profile.interests.noSuggestions') }}
                </p>
              </div>

              <!-- Meus interesses atuais -->
              <div class="current-interests-section">
                <h4>{{ t('profile.interests.myInterests') }} ({{ tempUserInterests.length }})</h4>
                <div v-if="tempUserInterests.length > 0" class="interests-list">
                  <div v-for="interest in tempUserInterests" :key="interest.id" class="interest-item current">
                    <span class="interest-name">{{ interest.name }}</span>
                    <button class="remove-btn" @click="removeInterestFromUser(interest.id)">
                      <i class="mdi mdi-close" />
                      {{ t('profile.interests.remove') }}
                    </button>
                  </div>
                </div>
                <p v-else class="empty-message">
                  {{ t('profile.interests.emptyMessage') }}
                </p>
              </div>
            </div>

            <div class="interests-modal-footer">
              <button class="btn-cancel" @click="closeInterestsModal">
                {{ t('profile.interestsModal.cancel') }}
              </button>
              <button class="btn-done" :disabled="isSavingInterests" @click="saveInterestsChanges">
                <i v-if="isSavingInterests" class="mdi mdi-loading mdi-spin" />
                {{ isSavingInterests ? t('profile.interestsModal.saving') : t('profile.interestsModal.done') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Request New Interests Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRequestModal" class="modal-overlay" @click.self="closeRequestModal">
          <div class="request-modal-container">
            <div class="request-modal-header">
              <h2>{{ t('profile.requestInterestModal.title') }}</h2>
              <button class="modal-close" @click="closeRequestModal">
                <i class="mdi mdi-close" />
              </button>
            </div>

            <div class="request-modal-body">
              <p class="request-description">
                {{ t('profile.requestInterestModal.description') }}
              </p>

              <div class="input-wrapper">
                <label class="input-label" for="newInterest">{{ t('profile.requestInterestModal.label') }}</label>
                <div class="input-group">
                  <input
                    id="newInterest"
                    v-model="newInterestName"
                    class="request-input"
                    :placeholder="t('profile.requestInterestModal.placeholder')"
                    type="text"
                    @keyup.enter="addToPending"
                  >
                  <button class="add-pending-btn" type="button" @click="addToPending">
                    <i class="mdi mdi-plus" />
                  </button>
                </div>
              </div>

              <div v-if="pendingInterests.length > 0" class="pending-list">
                <span v-for="(item, index) in pendingInterests" :key="index" class="pending-chip">
                  {{ item }}
                  <button class="remove-pending-btn" type="button" @click="removePending(index)">
                    <i class="mdi mdi-close" />
                  </button>
                </span>
              </div>
            </div>

            <div class="request-modal-footer">
              <button class="btn-cancel" @click="closeRequestModal">
                {{ t('profile.requestInterestModal.cancel') }}
              </button>
              <button
                class="btn-submit"
                :disabled="(pendingInterests.length === 0 && !newInterestName.trim()) || isSubmittingRequest"
                @click="submitNewInterestRequest"
              >
                <i v-if="isSubmittingRequest" class="mdi mdi-loading mdi-spin" />
                {{ isSubmittingRequest ? t('profile.requestInterestModal.submitting') :
                  t('profile.requestInterestModal.submit') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Seguidores -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showFollowersModal" class="modal-overlay" @click.self="closeFollowersModal">
          <div class="modal-container follow-modal">
            <div class="modal-header">
              <h2>{{ t('profile.followersModal.title') }}</h2>
              <button class="modal-close" type="button" @click="closeFollowersModal">
                <i class="mdi mdi-close" />
              </button>
            </div>
            <div class="modal-body follow-modal-body">
              <div v-if="loadingFollowers" class="follow-modal-loading">
                <AppLoader size="sm" :text="t('profile.followersModal.loading')" />
              </div>
              <ul v-else-if="followersList.length > 0" class="follow-modal-list">
                <li v-for="follower in followersList" :key="follower.id" class="follow-modal-item">
                  <div class="follow-modal-avatar">
                    <UserAvatar
                      :image="follower.profileImage"
                      :name="follower.name"
                      :size="48"
                    />
                  </div>
                  <div class="follow-modal-info">
                    <span class="follow-modal-name">{{ follower.name }}</span>
                    <span v-if="follower.username" class="follow-modal-username">@{{ follower.username }}</span>
                  </div>
                  <button
                    class="follow-modal-btn"
                    :class="{ following: follower.isFollowing }"
                    type="button"
                    @click="toggleFollowUser(follower)"
                  >
                    {{ follower.isFollowing ? t('profile.followersModal.following') : t('profile.followersModal.follow')
                    }}
                  </button>
                </li>
              </ul>
              <div v-else class="follow-modal-empty">
                <i class="mdi mdi-account-group-outline" />
                <p>{{ t('profile.followersModal.empty') }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de Seguindo -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showFollowingModal" class="modal-overlay" @click.self="closeFollowingModal">
          <div class="modal-container follow-modal">
            <div class="modal-header">
              <h2>{{ t('profile.followingModal.title') }}</h2>
              <button class="modal-close" type="button" @click="closeFollowingModal">
                <i class="mdi mdi-close" />
              </button>
            </div>
            <div class="modal-body follow-modal-body">
              <div v-if="loadingFollowing" class="follow-modal-loading">
                <AppLoader size="sm" :text="t('profile.followingModal.loading')" />
              </div>
              <ul v-else-if="followingList.length > 0" class="follow-modal-list">
                <li v-for="following in followingList" :key="following.id" class="follow-modal-item">
                  <div class="follow-modal-avatar">
                    <UserAvatar
                      :image="following.profileImage"
                      :name="following.name"
                      :size="48"
                    />
                  </div>
                  <div class="follow-modal-info">
                    <span class="follow-modal-name">{{ following.name }}</span>
                    <span v-if="following.username" class="follow-modal-username">@{{ following.username }}</span>
                  </div>
                  <button class="follow-modal-btn following" type="button" @click="toggleFollowUser(following)">
                    {{ t('profile.followingModal.unfollow') }}
                  </button>
                </li>
              </ul>
              <div v-else class="follow-modal-empty">
                <i class="mdi mdi-account-search-outline" />
                <p>{{ t('profile.followingModal.empty') }}</p>
              </div>
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
/* ═════════════════════════════════════════════════════
   CSS Custom Properties - Design System
   ═════════════════════════════════════════════════════ */
.profile-page-layout {
  /* Cores primárias */
  --color-primary: #ff5fa6;
  --color-primary-light: #ff7eb3;
  --color-secondary: #ffba4b;
  --color-accent-gradient: linear-gradient(135deg, var(--color-secondary), var(--color-primary));

  /* Cores neutras */
  --color-text-primary: #1a1c2e;
  --color-text-secondary: #555b77;
  --color-text-muted: #9aa0b8;
  --color-border: rgba(0, 0, 0, 0.04);
  --color-border-strong: #e0e2ed;

  /* Cores de fundo */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #fafbfc;
  --color-bg-gradient: linear-gradient(142.35deg, rgba(252, 162, 89, 0.05) -1.66%, rgba(255, 98, 159, 0.08) 100.44%);

  /* Espaçamentos */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Sombras */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-primary: 0 4px 16px rgba(255, 95, 166, 0.25);

  /* Transições */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;

  /* Tipografia */
  --font-family: 'Baloo Thambi 2', sans-serif;

  /* Layout base */
  min-height: 100vh;
  background: var(--color-bg-gradient);
  display: flex;
  flex-direction: column;
  font-family: var(--font-family);
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
  margin-top: 2rem;
}

.layout-sidebar {
  grid-area: sidebar;
  position: sticky;
  top: 100px;
  /* Offset para ficar abaixo do header sticky */
  align-self: flex-start;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: none;
  /* Firefox */
  z-index: 10;
}

.layout-sidebar::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari */
}

.layout-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100vh;
  /* Garante que o conteúdo possa rolar */
}

.layout-extras {
  grid-area: extras;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: sticky;
  top: 100px;
  /* Offset para ficar abaixo do header sticky */
  align-self: flex-start;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: none;
  /* Firefox */
  z-index: 10;
}

.layout-extras::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari */
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

.profile-card:hover .cover-edit-btn {
  opacity: 1;
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

/* ── Follow Stats Row ── */
.follow-stats-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.follow-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 95, 166, 0.06);
  border: 1px solid rgba(255, 95, 166, 0.28);
  cursor: pointer;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  transition: all var(--transition-fast);
}

.follow-stat::after {
  content: '';
  width: 6px;
  height: 6px;
  border-right: 1.5px solid var(--color-primary, #ff5fa6);
  border-bottom: 1.5px solid var(--color-primary, #ff5fa6);
  transform: rotate(-45deg);
  margin-left: 0.15rem;
  opacity: 0.7;
}

.follow-stat:hover {
  background: rgba(255, 95, 166, 0.14);
  border-color: rgba(255, 95, 166, 0.55);
  transform: translateY(-1px);
}

.follow-stat:active {
  transform: translateY(0);
}

.follow-stat-count {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text-primary);
}

.follow-stat-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.follow-stat-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border-strong);
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

.tab-btn svg {
  margin-right: 0.5rem;
  color: #888;
}

.tab-btn.active svg {
  color: var(--accent);
}

.tab-icon-img {
  width: 20px;
  height: 20px;
  margin-right: 0.5rem;
  filter: brightness(0) saturate(100%) invert(53%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(95%) contrast(85%);
}

.tab-btn.active .tab-icon-img {
  filter: brightness(0) saturate(100%) invert(45%) sepia(91%) saturate(1945%) hue-rotate(318deg) brightness(101%) contrast(101%);
}

/* ── Tab Panel ── */
.tab-panel {
  justify-content: center;
  align-items: center;

}

.loading-liked {
  width: 100%;
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
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #555b77;
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.2;
}

.mini-stat-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mini-stat-btn:hover {
  transform: scale(1.1);
}

.mini-stat-btn:hover svg {
  color: #ff4757;
}

.mini-stat-btn:active {
  transform: scale(0.95);
}

.mini-stat i {
  font-size: 1.1rem;
  color: #9aa0b8;
}

.mini-stat svg {
  color: #9aa0b8;
}

.mini-stat svg.liked {
  color: var(--accent);
}

.mini-stat-icon {
  width: 14px;
  height: 14px;
  filter: brightness(0) saturate(100%) invert(65%) sepia(10%) saturate(500%) hue-rotate(180deg) brightness(95%) contrast(85%);
}

.mini-stat-icon.liked {
  filter: brightness(0) saturate(100%) invert(45%) sepia(91%) saturate(1945%) hue-rotate(318deg) brightness(101%) contrast(101%);
}

/* ── Confirmed Events Panel ── */
.confirmed-events-panel {
  padding: 0;
}

.confirmed-card {
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.confirmed-card:hover {
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
}

.confirmed-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
}

.confirmed-stat {
  color: #4CAF50 !important;
}

.confirmed-stat i {
  color: #4CAF50 !important;
}

.confirmed-empty-icon {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.1) 100%);
}

.confirmed-empty-icon i {
  font-size: 48px;
  color: #4CAF50;
}

/* Mini card transitions */
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

/* ── Skeleton de eventos (Curtidos & Confirmados) ── */
.skeleton-event-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.skeleton-event-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.skel-banner {
  width: 100%;
  height: 130px;
  position: relative;
}

.skel-date-chip {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 56px;
  height: 20px;
  border-radius: 20px;
}

.skel-body {
  padding: 0.85rem 0.9rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.skel-stats-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

/* ── Base shimmer aplicado em todos os elementos do skeleton ── */
.skel-banner,
.skel-line,
.skel-date-chip {
  background: linear-gradient(
    90deg,
    #f0ecf7 0%,
    #faf7fd 38%,
    #ece6f5 62%,
    #f0ecf7 100%
  );
  background-size: 300% 100%;
  animation: shimmer-card 1.8s ease-in-out infinite;
}

.skel-date-chip {
  animation-delay: 0.15s;
}

.skel-line {
  height: 12px;
  border-radius: 6px;
}

.skel-title    { width: 68%; height: 14px; animation-delay: 0.05s; }
.skel-location { width: 46%; animation-delay: 0.1s; }
.skel-stat     { width: 48px; animation-delay: 0.15s; }
.skel-stat-sm  { width: 36px; animation-delay: 0.2s; }

@keyframes shimmer-card {
  0%   { background-position:  200% 0; }
  100% { background-position: -200% 0; }
}

/* Botão Mostrar Mais */
.show-more-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
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

/* Botão Recolher */
.collapse-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 2rem;
  background: rgba(255, 95, 166, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 95, 166, 0.3);
  border-radius: 99px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.15);
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: rgba(255, 95, 166, 0.2);
  border-color: rgba(255, 95, 166, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 95, 166, 0.25);
}

.collapse-btn:active {
  transform: translateY(-1px);
}

.collapse-btn i {
  font-size: 1.3rem;
  transition: transform 0.3s ease;
}

.collapse-btn:hover i {
  transform: translateY(-2px);
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

.empty-icon svg {
  color: #ff5fa6;
}

.empty-icon-img {
  width: 60px;
  height: 60px;
  filter: brightness(0) saturate(100%) invert(45%) sepia(91%) saturate(1945%) hue-rotate(318deg) brightness(101%) contrast(101%);
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

/* ── Language Setting ── */
.setting-item.language-setting {
  cursor: default;
}

.setting-item.language-setting:hover {
  background: transparent;
}

.language-selector {
  flex-shrink: 0;
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

/* Sugestões abaixo do estado vazio — a borda superior é o separador que
   distingue "você não tem interesses" de "adicione um destes". */
.interests-suggestions {
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(154, 160, 184, 0.22);
}

.interests-suggestions-hint {
  margin: 0 0 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7194;
}

.interests-suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tag {
  padding: 0.4rem 0.85rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.08), rgba(255, 95, 166, 0.08));
  border-radius: 99px;
  font-size: 0.82rem;
  color: #555b77;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  position: relative;
}

.tag:hover {
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.12), rgba(255, 95, 166, 0.12));
}

.interests-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.interests-header h3 {
  margin: 0;
}

.add-interest-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.2);
}

.add-interest-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.add-interest-btn:active {
  transform: scale(0.95);
}

.add-interest-btn i {
  font-size: 1.2rem;
}

.remove-interest-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  margin-left: 6px;
  position: relative;
  z-index: 10;
}

.remove-interest-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.15);
}

.remove-interest-btn:active {
  transform: scale(0.9);
  background: rgba(239, 68, 68, 0.3);
}

.remove-interest-btn i {
  font-size: 0.9rem;
  pointer-events: none;
}

/* ── Recommendations Card ── */
.recommendations-card {
  margin-top: 0;
}

.recommendations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.recommendations-header h3 {
  margin: 0;
}

.recommendations-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.recommendations-loading i {
  font-size: 1.2rem;
  color: var(--color-primary);
}

/* Estado de busca ativa */
.recommendations-searching {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  background: rgba(255, 95, 166, 0.03);
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
}

.recommendations-searching i {
  font-size: 1.2rem;
  color: var(--color-primary);
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.recommendation-item:hover {
  background: rgba(255, 95, 166, 0.04);
}

.recommendation-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.recommendation-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.recommendation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.recommendation-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommendation-username {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.recommendations-empty {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 1rem;
  margin: 0;
}

/* ── Follow Modal ── */
.follow-modal {
  width: min(480px, 90vw);
  max-height: 70vh;
}

.follow-modal-body {
  padding: 0 !important;
  max-height: 400px;
  overflow-y: auto;
}

.follow-modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.follow-modal-loading i {
  font-size: 2rem;
  color: var(--color-primary);
}

.follow-modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.follow-modal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.follow-modal-item:last-child {
  border-bottom: none;
}

.follow-modal-item:hover {
  background: rgba(255, 95, 166, 0.04);
}

.follow-modal-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.follow-modal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-modal {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.follow-modal-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.follow-modal-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.follow-modal-username {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.follow-modal-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  flex-shrink: 0;
  white-space: nowrap;
}

.follow-modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary);
}

.follow-modal-btn.following {
  background: transparent;
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
}

.follow-modal-btn.following:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: #ef4444;
  color: #ef4444;
  box-shadow: none;
}

.follow-modal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.follow-modal-empty i {
  font-size: 3rem;
  opacity: 0.5;
}

.follow-modal-empty p {
  margin: 0;
  font-size: 0.95rem;
}

/* ── Manage Interests Modal ── */
.interests-modal-container {
  background: white;
  border-radius: 20px;
  width: min(560px, 90vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.interests-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.interests-modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1a1c2e;
  font-weight: 700;
}

.interests-modal-body {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  flex: 1;
}

.interests-search-section {
  margin-bottom: 1.5rem;
}

.search-results-section {
  margin-bottom: 2rem;
}

.search-results-section h4,
.suggestions-section h4,
.current-interests-section h4 {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9aa0b8;
  font-weight: 600;
}

.interests-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.interest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  transition: all 0.2s;
}

.interest-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.interest-item.current {
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.08), rgba(255, 95, 166, 0.08));
}

.interest-item.current:hover {
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.12), rgba(255, 95, 166, 0.12));
}

.interest-name {
  font-size: 0.95rem;
  color: #1a1c2e;
  font-weight: 500;
}

.add-btn,
.remove-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Baloo Thambi 2', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s;
}

.add-btn {
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.2);
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: #9aa0b8;
}

.no-results i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.no-results p {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
}

.request-interest-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  font-family: 'Baloo Thambi 2', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(255, 95, 166, 0.2);
}

.request-interest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.request-interest-btn i {
  font-size: 1.2rem;
}

.suggestions-section {
  margin-top: 1rem;
}

.loading-suggestions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 0.75rem;
  color: #9aa0b8;
}

.empty-suggestions {
  text-align: center;
  padding: 2rem 1rem;
  color: #9aa0b8;
  font-size: 0.9rem;
  margin: 0;
}

.current-interests-section {
  margin-top: 2rem;
}

.empty-message {
  text-align: center;
  padding: 2rem 1rem;
  color: #9aa0b8;
  font-size: 0.9rem;
  margin: 0;
}

.interests-modal-footer {
  padding: 1.25rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-cancel {
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  color: #6c7080;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
}

.btn-cancel:active {
  transform: scale(0.98);
}

.btn-done {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Baloo Thambi 2', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.2);
}

.btn-done:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 95, 166, 0.3);
}

.btn-done:active {
  transform: translateY(0);
}

.btn-done:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-done:disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.2);
}

.tag:hover {
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.18), rgba(255, 95, 166, 0.18));
}

/* ── Modal ── */
.modal-overlay {
  /* O modal é teleportado para <body>, fora de .profile-page-layout,
     então precisa redeclarar os tokens do design system que usa. */
  --color-primary: #ff5fa6;
  --color-text-primary: #1a1c2e;
  --color-text-secondary: #555b77;
  --color-border: rgba(0, 0, 0, 0.04);
  --color-border-strong: #e0e2ed;
  --shadow-primary: 0 4px 16px rgba(255, 95, 166, 0.25);

  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
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
  color: #1a1c2e !important;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  box-sizing: border-box;
  background-color: #fafbfc !important;
}

.form-input:focus {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background-color: white !important;
}

.form-textarea {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  font-size: 0.92rem;
  color: #1a1c2e !important;
  font-family: inherit;
  resize: vertical;
  outline: none;
  min-height: 80px;
  box-sizing: border-box;
  background-color: #fafbfc !important;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background-color: white !important;
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
  background-color: #fafbfc !important;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-with-prefix:focus-within {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background-color: white !important;
}

.input-prefix {
  padding: 0 0 0 0.9rem;
  color: #9aa0b8;
  font-weight: 600;
  font-size: 0.92rem;
}

.form-input.with-prefix {
  border: none;
  background-color: transparent !important;
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
  transition: all 0.15s ease-out;
}

.modal-leave-active {
  transition: all 0.1s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.97) translateY(8px);
}

.modal-leave-to .modal-container {
  transform: scale(0.98) translateY(4px);
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

/* ═════════════════════════════════════════════════════
   RESPONSIVE - Mobile First Approach
   Base styles = Mobile (< 480px)
   Min-width queries progressivamente maiores
   ═════════════════════════════════════════════════════ */

/* ── BASE MOBILE STYLES (≤ 479px) ── */
/* Empilha tudo em coluna única (main + extras) de forma previsível, sem depender
   de grid-areas. O grid de 2/3 colunas é restaurado a partir de 960px. */
.layout-shell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  padding: var(--spacing-sm);
  /* A folga da bottom nav fixa fica no footer, que é o último elemento da página */
  padding-bottom: var(--spacing-sm);
}

/* Mobile: main não precisa forçar 100vh (evita lacuna antes da coluna extras) */
.layout-main {
  min-height: auto;
  width: 100%;
}

.layout-sidebar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  top: auto;
  z-index: 1000;
}

/* O footer vem depois da .layout-shell, então precisa da sua própria folga
   para não ficar por baixo da bottom nav fixa. */
:deep(.app-footer) {
  padding-bottom: calc(2rem + 5rem + env(safe-area-inset-bottom, 0px));
}

/* Mobile: mostra Interesses + Quem seguir empilhados abaixo do conteúdo principal.
   position/top/max-height/overflow/align-self são reposicionados nos breakpoints ≥960px. */
.layout-extras {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-self: stretch;
  position: static;
  top: auto;
  max-height: none;
  overflow: visible;
}

.profile-content {
  padding: 0 0.75rem 0.75rem;
  margin-top: -32px;
}

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
  padding: 0.45rem 0.7rem;
  font-size: 0.9rem;
}

.tab-icon {
  display: none;
}

.edit-btn {
  padding: 0.45rem 0.9rem;
  font-size: 0.78rem;
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
  border-radius: var(--radius-lg);
}

.liked-mini-cards-grid,
.skeleton-event-grid {
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

.badge-card {
  padding: var(--spacing-md);
}

.badge-icon {
  width: 44px;
  height: 44px;
  font-size: 1.3rem;
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

/* ── SMALL PHONES (480px+) ── */
@media (min-width: 480px) {
  .profile-content {
    padding: 0 1rem 1rem;
    margin-top: -32px;
  }

  .avatar-img {
    width: 72px;
    height: 72px;
  }

  .cover-image {
    height: 120px;
  }

  .tab-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.95rem;
  }
}

/* ── TABLETS (≥ 640px) ── */
@media (min-width: 640px) {
  .layout-shell {
    padding: var(--spacing-md);
  }

  .profile-content {
    padding: 0 1.25rem 1.25rem;
    margin-top: -36px;
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

  .tab-btn {
    padding: 0.55rem 0.9rem;
    font-size: 0.98rem;
  }

  .tab-icon {
    display: inline-block;
  }

  .breadcrumb-nav {
    padding: 0.65rem 1.15rem;
  }

  .breadcrumb-back {
    padding: 0.45rem 0.9rem;
    font-size: 0.88rem;
  }

  .back-text {
    display: inline;
  }

  .header-info h1 {
    font-size: 1.2rem;
  }

  .liked-mini-cards-grid,
  .skeleton-event-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.85rem;
  }

  .modal-container {
    max-width: 520px;
    border-radius: var(--radius-xl);
  }

  .badge-card {
    padding: 1.25rem;
  }

  .badge-icon {
    width: 52px;
    height: 52px;
    font-size: 1.5rem;
  }

  .show-more-btn {
    width: auto;
  }
}

/* ── SMALL DESKTOP (≥ 960px) ── */
@media (min-width: 960px) {
  /* Restaura o layout em grid (mobile usa flex em coluna) */
  .layout-shell {
    display: grid;
    align-items: start;
    grid-template-columns: 220px 1fr;
    grid-template-areas: 'sidebar main';
    width: min(100%, 960px);
    padding: 0 var(--spacing-xl);
  }

  /* Layout de 2 colunas (sem coluna extras): esconde novamente.
     As breakpoints 960-1099 e 1240+ reexibem a coluna extras. */
  .layout-extras {
    display: none;
  }

  /* Restaura a altura mínima da coluna principal em telas maiores */
  .layout-main {
    min-height: 100vh;
  }

  /* A sidebar volta a ser sticky, então o footer não precisa mais da folga */
  :deep(.app-footer) {
    padding-bottom: 2rem;
  }

  .layout-sidebar {
    position: sticky;
    top: 100px;
    /* Offset para ficar abaixo do header sticky */
    bottom: auto;
    left: auto;
    right: auto;
    align-self: flex-start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    z-index: 10;
  }

  .layout-sidebar::-webkit-scrollbar {
    display: none;
  }

  .profile-content {
    padding: 0 var(--spacing-xl) var(--spacing-xl);
    margin-top: -48px;
  }

  .avatar-img {
    width: 96px;
    height: 96px;
  }

  .profile-actions-top {
    padding-top: 56px;
  }

  .cover-image {
    height: 180px;
  }

  .tab-btn {
    padding: 0.65rem 1.1rem;
    font-size: 1rem;
  }

  .header-info h1 {
    font-size: 1.4rem;
  }

  .liked-mini-cards-grid,
  .skeleton-event-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }
}

/* ── MEDIUM DESKTOP (960px – 1099px): sidebar icon-only + 3 columns ── */
@media (min-width: 960px) and (max-width: 1099px) {
  .layout-shell {
    grid-template-columns: 72px minmax(0, 1fr) 240px;
    grid-template-areas: 'sidebar main extras';
    width: min(100%, 1080px);
  }

  .layout-extras {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: sticky;
    top: 100px;
    align-self: flex-start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    scrollbar-width: none;
  }

  .layout-extras::-webkit-scrollbar {
    display: none;
  }
}

/* ── LARGE DESKTOP (≥ 1240px) ── */
@media (min-width: 1240px) {
  .layout-shell {
    grid-template-columns: 240px minmax(0, 720px) 320px;
    grid-template-areas: 'sidebar main extras';
    column-gap: var(--spacing-xl);
    width: min(100%, 1280px);
    padding: 0;
  }

  .layout-extras {
    display: flex;
    position: sticky;
    top: 100px;
    /* Offset para ficar abaixo do header sticky */
    align-self: flex-start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  .layout-extras::-webkit-scrollbar {
    display: none;
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

/* ── Banner Crop Modal ── */
.banner-crop-modal-overlay {
  z-index: 10002;
}

.banner-crop-modal-container {
  background: #1a1c2e;
  border-radius: 20px;
  width: min(660px, 92vw);
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  animation: modal-pop 0.3s ease;
}

.banner-crop-header-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #fff;
}

.banner-crop-header-content i {
  font-size: 1.3rem;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.banner-crop-modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.banner-crop-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  text-align: center;
}

.banner-crop-hint i {
  font-size: 1rem;
  opacity: 0.7;
}

/* ═════════════════════════════════════════════════════
   MICRO-INTERAÇÕES E ANIMAÇÕES
   ═════════════════════════════════════════════════════ */

/* Animação de pulso para indicador online */
@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes pulse-online {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.15);
    opacity: 0.8;
  }
}

.status-indicator {
  animation: pulse-online 2s ease-in-out infinite;
}

/* Efeito de hover mais suave nos cards */
.profile-card,
.sidebar-card,
.mini-event-card {
  transition: transform var(--transition-slow), box-shadow var(--transition-slow);
}

/* Focus visible para acessibilidade */
.tab-btn:focus-visible,
.edit-btn:focus-visible,
.share-btn:focus-visible,
.stat-item:focus-visible,
.avatar-wrapper:focus-visible,
btn:focus-visible,
a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Transição suave para interesse chips */
.interest-chip,
.tag {
  transition: all var(--transition-normal);
}

.interest-chip:hover,
.tag:hover {
  transform: translateY(-1px);
}

/* Animação de entrada para conteúdo carregado */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-panel>* {
  animation: fade-in-up 0.4s ease-out;
}

/* Ripple effect para botões (usando pseudo-elemento) */
.edit-btn,
.share-btn,
.show-more-btn,
.empty-action {
  position: relative;
  overflow: hidden;
}

.edit-btn::after,
.share-btn::after,
.show-more-btn::after,
.empty-action::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  transform: scale(0);
  opacity: 0;
  transition: transform 0.5s, opacity 0.3s;
}

.edit-btn:active::after,
.share-btn:active::after,
.show-more-btn:active::after,
.empty-action:active::after {
  transform: scale(2.5);
  opacity: 1;
  transition: transform 0s;
}

/* Skeleton shimmer (legado — usado no skeleton do feed principal) */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* Reduced motion para acessibilidade */
@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .status-indicator {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {

  .profile-card,
  .sidebar-card,
  .mini-event-card {
    border: 2px solid currentColor;
  }

  .tab-btn.active {
    border: 2px solid var(--color-text-primary);
  }
}

/* ── Request New Interests Modal ── */
.request-modal-container {
  background: white;
  border-radius: 20px;
  width: min(480px, 90vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.request-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.request-modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #1a1c2e;
  font-weight: 700;
}

.request-modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.request-description {
  color: #555b77;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.input-wrapper {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1c2e;
  margin-bottom: 0.5rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.request-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'Baloo Thambi 2', sans-serif;
  transition: all 0.2s;
}

.request-input:focus {
  outline: none;
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
}

.add-pending-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.add-pending-btn:hover {
  transform: scale(1.05);
}

.pending-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pending-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(255, 186, 75, 0.1), rgba(255, 95, 166, 0.1));
  border-radius: 20px;
  font-size: 0.9rem;
  color: #1a1c2e;
  font-weight: 500;
}

.remove-pending-btn {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  padding: 0;
  transition: all 0.2s;
}

.remove-pending-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.request-modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  font-family: 'Baloo Thambi 2', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ═════════════════════════════════════════════════════
   SCROLLABLE CARDS - Limita altura e adiciona scroll
   ═════════════════════════════════════════════════════ */

/* Wrapper para interesses no sidebar - altura máxima com scroll */
.interests-tags-wrapper {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 95, 166, 0.3) transparent;
}

.interests-tags-wrapper::-webkit-scrollbar {
  width: 6px;
}

.interests-tags-wrapper::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.interests-tags-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 95, 166, 0.3);
  border-radius: 3px;
  transition: background 0.2s;
}

.interests-tags-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 95, 166, 0.5);
}

/* Wrapper para lista de recomendações - altura máxima com scroll */
.recommendations-list-wrapper {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 95, 166, 0.3) transparent;
}

.recommendations-list-wrapper::-webkit-scrollbar {
  width: 6px;
}

.recommendations-list-wrapper::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.recommendations-list-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 95, 166, 0.3);
  border-radius: 3px;
  transition: background 0.2s;
}

.recommendations-list-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 95, 166, 0.5);
}

/* Campo de busca de usuários */
.user-search-wrapper {
  margin-bottom: 1rem;
}

/* Campo de busca de usuários - wrapper */
.user-search-wrapper {
  margin-bottom: 1rem;
}

/* Wrapper para interesses no profile content - altura máxima com scroll */
.interests-chips-wrapper {
  max-height: 100px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 95, 166, 0.3) transparent;
}

.interests-chips-wrapper::-webkit-scrollbar {
  width: 5px;
}

.interests-chips-wrapper::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.interests-chips-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 95, 166, 0.3);
  border-radius: 3px;
  transition: background 0.2s;
}

.interests-chips-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 95, 166, 0.5);
}

/* Fade gradient para indicar scroll */
.interests-tags-wrapper,
.recommendations-list-wrapper,
.interests-chips-wrapper {
  position: relative;
}

/* Ajuste nos cards sidebar para não crescer demais */
.interests-card,
.recommendations-card {
  max-height: fit-content;
}

.interests-sidebar-loading {
  display: flex;
  justify-content: center;
  padding: 0.75rem 0;
}

</style>
