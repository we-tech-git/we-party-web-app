<script setup lang="ts">
  import type { NavItem } from '@/types/navigation'
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { getUserInterests, getUserProfile, updateUserProfile, uploadBannerImage, uploadProfileImage } from '@/api/users'
  import AppFooter from '@/components/AppFooter.vue'
  import FeedSidebarNav from '@/components/modules/Feed/FeedSidebarNav.vue'
  import FeedTopHeader from '@/components/modules/Feed/FeedTopHeader.vue'
  import { useAuth } from '@/composables/useAuth'

  const { t } = useI18n()
  const router = useRouter()
  const { loggedUser, updateUser } = useAuth()

  // ── Loading state ──
  const loading = ref(true)
  const error = ref<string | null>(null)
  const uploadingAvatar = ref(false)
  const uploadingBanner = ref(false)

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
  const user = reactive({
    name: '',
    username: '',
    avatar: '',
    banner: '',
    bio: '',
    location: '',
    joined: '',
    stats: {
      following: 0,
      followers: 0,
    },
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
      const userData = response.data

      // Popula os dados do usuário
      user.name = userData.name || ''
      user.username = userData.username ? `@${userData.username}` : ''
      user.avatar = userData.profileImage || userData.avatar || ''
      user.banner = userData.banner || userData.bannerImage || ''
      user.bio = userData.bio || ''
      user.location = userData.location || ''
      user.joined = userData.createdAt ? formatJoinDate(userData.createdAt) : ''
      user.stats.following = userData.followingCount || userData.stats?.following || 0
      user.stats.followers = userData.followersCount || userData.stats?.followers || 0

      // Sincroniza com localStorage para manter consistência em todas as páginas
      updateUser({
        name: userData.name || '',
        username: userData.username || '',
        profileImage: userData.profileImage || userData.avatar || '',
      })

      // Busca os interesses do usuário
      await fetchUserInterests()
    } catch (error_) {
      console.error('Erro ao carregar perfil:', error_)
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

      console.log('Interesses do usuário:', userInterests.value)
    } catch (error_) {
      console.error('Erro ao buscar interesses:', error_)
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

    try {
      uploadingAvatar.value = true
      const result = await uploadProfileImage(file)
      const newAvatarUrl = result.url || result.profileImage || result.data?.url || ''
      user.avatar = newAvatarUrl
      console.log('Avatar atualizado:', user.avatar)

      // Sincroniza com localStorage para manter consistência
      updateUser({ profileImage: newAvatarUrl })
    } catch (error_) {
      console.error('Erro ao fazer upload do avatar:', error_)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      uploadingAvatar.value = false
      input.value = '' // Reset input
    }
  }

  async function handleBannerChange (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    try {
      uploadingBanner.value = true
      const result = await uploadBannerImage(file)
      user.banner = result.url || result.bannerImage || result.data?.url || ''
      console.log('Banner atualizado:', user.banner)
    } catch (error_) {
      console.error('Erro ao fazer upload do banner:', error_)
      alert('Erro ao fazer upload da capa. Tente novamente.')
    } finally {
      uploadingBanner.value = false
      input.value = '' // Reset input
    }
  }

  onMounted(() => {
    fetchUserProfile()
  })

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
  const activeTab = ref('badges')
  const tabs = [
    { id: 'badges', label: 'Conquistas', icon: 'mdi-trophy-outline' },
    { id: 'liked', label: 'Curtidos', icon: 'mdi-heart-outline' },
    { id: 'favorites', label: 'Favoritos', icon: 'mdi-bookmark-outline' },
    { id: 'settings', label: 'Preferências', icon: 'mdi-cog-outline' },
  ]

  const badges = [
    { icon: 'mdi-party-popper', color: '#FF4081', name: 'Party Animal', desc: 'Foi em 10 festas este mês' },
    { icon: 'mdi-map-marker-check', color: '#7C4DFF', name: 'Explorador', desc: 'Visitou 5 locais diferentes' },
    { icon: 'mdi-fire', color: '#FF9800', name: 'Em Chamas', desc: 'Sequência de 3 finais de semana' },
    { icon: 'mdi-crown', color: '#FFD700', name: 'VIP', desc: 'Membro premium da comunidade' },
  ]

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
      await updateUserProfile({
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
    } catch (error_) {
      console.error('Erro ao salvar perfil:', error_)
      alert('Erro ao salvar perfil. Tente novamente.')
    } finally {
      saving.value = false
    }
  }

  // ── Settings toggles ──
  const settingsNotifications = ref(true)
  const settingsDarkMode = ref(false)

  function handleLogout () {
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
          <!-- Badges -->
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

          <!-- Liked -->
          <div v-if="activeTab === 'liked'" class="empty-state">
            <div class="empty-icon">
              <i class="mdi mdi-heart-outline" />
            </div>
            <h3>Nenhum evento curtido</h3>
            <p>Eventos que você curtir aparecerão aqui</p>
            <button class="empty-action" @click="router.push('/private/feed')">Explorar Eventos</button>
          </div>

          <!-- Favorites -->
          <div v-if="activeTab === 'favorites'" class="empty-state">
            <div class="empty-icon fav">
              <i class="mdi mdi-bookmark-outline" />
            </div>
            <h3>Nenhum evento salvo</h3>
            <p>Salve eventos para acessá-los rapidamente</p>
            <button class="empty-action" @click="router.push('/private/feed')">Explorar Eventos</button>
          </div>

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
              <div class="setting-item" @click="settingsDarkMode = !settingsDarkMode">
                <div class="setting-left">
                  <div class="setting-icon-wrap">
                    <i class="mdi mdi-theme-light-dark" />
                  </div>
                  <div>
                    <span class="setting-name">Modo Escuro</span>
                    <span class="setting-desc">Alterne entre tema claro e escuro</span>
                  </div>
                </div>
                <div class="toggle-switch" :class="{ checked: settingsDarkMode }" />
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
          <div class="interests-tags">
            <span class="tag">🎵 Eletrônica</span>
            <span class="tag">🎪 Festivais</span>
            <span class="tag">🍸 Happy Hour</span>
            <span class="tag">🌅 Ao ar livre</span>
            <span class="tag">🎤 Shows</span>
          </div>
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
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #ffba4b, #ff5fa6);
  color: white;
  border: none;
  border-radius: 99px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.2);
  transition: all 0.2s;
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.3);
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
  }

  .layout-sidebar {
    display: none;
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
}
</style>
