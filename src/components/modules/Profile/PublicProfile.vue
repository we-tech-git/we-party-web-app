<script setup lang="ts">
  /**
   * Perfil público de um terceiro (`/profile/:id`).
   *
   * Read-only por natureza: quem visita não pode editar nada aqui — sem
   * cropper, sem upload, sem gerenciar interesses/settings. Só dados que o
   * backend já calcula hoje pra um usuário (curtidos/confirmados,
   * followers/following, isFollowing) — sem "eventos criados" nesta rodada
   * (fora de escopo, ver PLAN-USER-PROFILE-NAVIGATION.md).
   *
   * Reaproveita: `UserAvatar`, `FollowButton`, `AppHeader`/`FeedSidebarNav`
   * (mesmo chrome do resto da área logada), e a normalização de eventos de
   * `src/utils/profileEvents.ts` (extraída de `Profile.vue`).
   */
  import type { NavItem } from '@/types/navigation'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { unwrapItem, unwrapList } from '@/api'
  import { followUserById, getFollowers, getFollowing, unfollowUserById } from '@/api/follows'
  import { getUserProfile } from '@/api/users'
  import FeedSidebarNav from '@/components/modules/Feed/FeedSidebarNav.vue'
  import AppHeader from '@/components/UI/AppHeader/AppHeader.vue'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import BreadcrumbBack from '@/components/UI/BreadcrumbBack/BreadcrumbBack.vue'
  import EventMiniCard from '@/components/UI/EventMiniCard/EventMiniCard.vue'
  import FollowButton from '@/components/UI/FollowButton/FollowButton.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useSnackbar } from '@/composables/useSnackbar'
  import { useUserNavigation } from '@/composables/useUserNavigation'
  import {
    formatShortDate as formatShortDateUtil,
    type LikedEventItem,
    mapConfirmedAttendance as mapConfirmedAttendanceUtil,
    mapLikedEventItem as mapLikedEventItemUtil,
  } from '@/utils/profileEvents'

  const props = defineProps<{
    userId: string
  }>()

  const { t } = useI18n()
  const router = useRouter()
  const { loggedUser } = useAuth()
  const { goToProfile } = useUserNavigation()
  const snackbar = useSnackbar()

  // ── AppHeader espera os dados do VISITANTE logado, não do perfil visitado ──
  const viewerSummary = computed(() => ({
    name: loggedUser.value?.name || '',
    avatar: loggedUser.value?.profileImage || '',
    username: loggedUser.value?.username,
  }))

  const activeNav = ref('')
  const navItems = computed<NavItem[]>(() => [
    { id: 'home', label: t('feed.nav.home'), icon: 'home' },
    { id: 'top-events', label: t('feed.nav.topEvents'), icon: 'top' },
    { id: 'favorites', label: t('feed.nav.favorites'), icon: 'bookmark' },
    { id: 'profile', label: t('feed.nav.profile'), icon: 'profile' },
  ])
  function handleNavSelect (id: string) {
    if (id === 'profile') {
      router.push('/profile')
      return
    }
    router.push({ path: '/feed', query: id === 'home' ? {} : { tab: id } })
  }

  // ── Estado do perfil ──
  interface PublicProfileData {
    id: string
    name: string
    username: string
    profileImage: string | null
    profileCoverImage: string | null
    bio: string | null
    createdAt: string
    followersCount: number
    followingCount: number
    isFollowing: boolean | null
    likedEvents: any[]
    eventAttendances: any[]
    /** Preferência de privacidade do dono do perfil — ver docs/BACKEND_PROFILE_PRIVACY_SPEC.md. */
    showLikedEvents?: boolean
    /** Preferência de privacidade do dono do perfil — ver docs/BACKEND_PROFILE_PRIVACY_SPEC.md. */
    showConfirmedEvents?: boolean
  }

  const loading = ref(true)
  const notFound = ref(false)
  const profile = ref<PublicProfileData | null>(null)
  const followBusy = ref(false)

  async function fetchProfile () {
    // Link direto pro próprio id (digitado ou de um card antigo em cache) —
    // manda pra rota de edição em vez de renderizar a versão read-only.
    if (String(props.userId) === String(loggedUser.value?.id ?? '')) {
      router.replace('/profile')
      return
    }

    loading.value = true
    notFound.value = false
    profile.value = null

    try {
      const response = await getUserProfile(props.userId)
      const data = unwrapItem<PublicProfileData>(response)
      if (!data?.id) {
        notFound.value = true
        return
      }
      profile.value = data
      // Abre na primeira aba que o dono do perfil deixa visível.
      activeTab.value = data.showLikedEvents === false && data.showConfirmedEvents !== false ? 'confirmed' : 'liked'
    } catch {
      notFound.value = true
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchProfile)
  watch(() => props.userId, fetchProfile)

  const hasAvatar = computed(() => Boolean(profile.value?.profileImage))
  const hasBanner = computed(() => Boolean(profile.value?.profileCoverImage))

  const joinedLabel = computed(() => {
    if (!profile.value?.createdAt) return ''
    const date = new Date(profile.value.createdAt)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  })

  async function toggleFollow () {
    if (!profile.value || followBusy.value) return
    const previous = profile.value.isFollowing
    const targetId = profile.value.id
    const targetName = profile.value.name

    // Atualização otimista — mesmo padrão de Profile.vue::toggleFollowUser.
    profile.value.isFollowing = !previous
    profile.value.followersCount += previous ? -1 : 1
    followBusy.value = true

    try {
      if (previous) {
        await unfollowUserById(targetId)
        snackbar.show(t('profile.messages.unfollowSuccess', { name: targetName }), '#6b7280')
      } else {
        await followUserById(targetId)
        snackbar.show(t('profile.messages.followSuccess', { name: targetName }))
      }
    } catch {
      if (!profile.value) return
      profile.value.isFollowing = previous
      profile.value.followersCount += previous ? 1 : -1
      snackbar.show(t('profile.messages.followUpdateError'), '#ef4444')
    } finally {
      followBusy.value = false
    }
  }

  // ── Tabs (curtidos / confirmados) — read-only, sem paginação sofisticada ──
  type TabId = 'liked' | 'confirmed'
  const activeTab = ref<TabId>('liked')

  const eventFallbacks = computed(() => ({
    dateUndefined: t('profile.likedEvents.dateUndefined'),
    locationUndefined: t('profile.likedEvents.locationUndefined'),
    eventTitle: t('profile.likedEvents.eventTitle'),
    soon: t('profile.likedEvents.soon'),
  }))

  const likedItems = computed<LikedEventItem[]>(() =>
    (profile.value?.likedEvents ?? []).map(evt => mapLikedEventItemUtil(evt, eventFallbacks.value)),
  )
  const confirmedItems = computed<LikedEventItem[]>(() =>
    (profile.value?.eventAttendances ?? []).map(evt => mapConfirmedAttendanceUtil(evt, eventFallbacks.value)),
  )
  const activeItems = computed(() => activeTab.value === 'liked' ? likedItems.value : confirmedItems.value)

  const canShowLiked = computed(() => profile.value?.showLikedEvents !== false)
  const canShowConfirmed = computed(() => profile.value?.showConfirmedEvents !== false)
  const privacyMessage = computed(() => {
    if (activeTab.value === 'liked' && !canShowLiked.value) return t('profile.public.privateLiked')
    if (activeTab.value === 'confirmed' && !canShowConfirmed.value) return t('profile.public.privateConfirmed')
    return null
  })

  function formatShortDate (dateString: string): string {
    return formatShortDateUtil(dateString, t('profile.likedEvents.soon'))
  }

  // ── Modais de seguidores/seguindo ──
  interface FollowListUser {
    id: string
    name: string
    username?: string
    profileImage?: string
  }
  const showFollowersModal = ref(false)
  const showFollowingModal = ref(false)
  const loadingFollowList = ref(false)
  const followersList = ref<FollowListUser[]>([])
  const followingList = ref<FollowListUser[]>([])

  async function openFollowersModal () {
    if (!profile.value) return
    showFollowersModal.value = true
    loadingFollowList.value = true
    try {
      const response = await getFollowers(profile.value.id)
      followersList.value = unwrapList<FollowListUser>(response, 'followers')
    } catch {
      followersList.value = []
    } finally {
      loadingFollowList.value = false
    }
  }

  async function openFollowingModal () {
    if (!profile.value) return
    showFollowingModal.value = true
    loadingFollowList.value = true
    try {
      const response = await getFollowing(profile.value.id)
      followingList.value = unwrapList<FollowListUser>(response, 'following')
    } catch {
      followingList.value = []
    } finally {
      loadingFollowList.value = false
    }
  }

  function closeFollowersModal () {
    showFollowersModal.value = false
  }
  function closeFollowingModal () {
    showFollowingModal.value = false
  }

  function visitFromModal (userId: string) {
    closeFollowersModal()
    closeFollowingModal()
    goToProfile(userId)
  }
</script>

<template>
  <div class="public-profile-layout">
    <WePartyLoader
      v-if="loading"
      :messages="[t('profile.public.loading1'), t('profile.public.loading2')]"
    />

    <AppHeader :user="viewerSummary" />

    <section :aria-label="t('profile.aria.profileContent')" class="layout-shell">
      <FeedSidebarNav :active="activeNav" class="layout-sidebar" :items="navItems" @select="handleNavSelect" />

      <main class="layout-main" role="main">
        <BreadcrumbBack @back="router.back()" />

        <div v-if="!loading && notFound" class="not-found-state">
          <div class="not-found-icon">🕵️</div>
          <h2>{{ t('profile.public.notFoundTitle') }}</h2>
          <p>{{ t('profile.public.notFoundDescription') }}</p>
          <button class="empty-action" @click="router.push('/feed')">
            {{ t('profile.likedEvents.exploreEvents') }}
          </button>
        </div>

        <template v-else-if="!loading && profile">
          <div class="profile-card">
            <div
              class="cover-image"
              :class="{ 'no-banner': !hasBanner }"
              :style="hasBanner ? { backgroundImage: `url(${profile.profileCoverImage})` } : {}"
            >
              <div aria-hidden="true" class="overlay" />
            </div>

            <div class="profile-content">
              <div class="avatar-section">
                <UserAvatar
                  class="avatar-img"
                  :image="hasAvatar ? profile.profileImage : null"
                  :name="profile.name"
                  :size="96"
                />

                <div v-if="profile.isFollowing !== null" class="profile-actions-top">
                  <FollowButton
                    :disabled="followBusy"
                    :following="!!profile.isFollowing"
                    :following-label="t('profile.followersModal.following')"
                    :label="t('profile.followersModal.follow')"
                    @toggle="toggleFollow"
                  />
                </div>
              </div>

              <header class="header-info">
                <h1>{{ profile.name }}</h1>
                <span v-if="profile.username" class="handle">@{{ profile.username }}</span>
                <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>

                <div class="follow-stats-row">
                  <button class="follow-stat" type="button" @click="openFollowersModal">
                    <span class="follow-stat-count">{{ profile.followersCount }}</span>
                    <span class="follow-stat-label">{{ t('profile.followers') }}</span>
                  </button>
                  <span class="follow-stat-divider" />
                  <button class="follow-stat" type="button" @click="openFollowingModal">
                    <span class="follow-stat-count">{{ profile.followingCount }}</span>
                    <span class="follow-stat-label">{{ t('profile.following') }}</span>
                  </button>
                </div>

                <div v-if="joinedLabel" class="meta-row">
                  <span class="meta-item">{{ t('profile.joinedIn') }} {{ joinedLabel }}</span>
                </div>
              </header>
            </div>
          </div>

          <div v-if="canShowLiked || canShowConfirmed" class="content-tabs" role="tablist">
            <button
              v-if="canShowLiked"
              class="tab-btn"
              :class="{ active: activeTab === 'liked' }"
              role="tab"
              type="button"
              @click="activeTab = 'liked'"
            >
              {{ t('profile.tabs.liked') }}
            </button>
            <button
              v-if="canShowConfirmed"
              class="tab-btn"
              :class="{ active: activeTab === 'confirmed' }"
              role="tab"
              type="button"
              @click="activeTab = 'confirmed'"
            >
              {{ t('profile.public.confirmedTab') }}
            </button>
          </div>

          <div class="tab-panel">
            <div v-if="privacyMessage" class="empty-state">
              <p>{{ privacyMessage }}</p>
            </div>
            <template v-else>
              <div v-if="activeItems.length > 0" class="mini-cards-grid">
                <EventMiniCard
                  v-for="item in activeItems"
                  :key="item.id"
                  :banner-url="item.banner"
                  :date-label="formatShortDate(item.schedule)"
                  :location="item.location || t('profile.likedEvents.locationUndefined')"
                  :title="item.title"
                  @click="router.push(`/event/${item.id}`)"
                >
                  <template #stats>
                    <span class="mini-stat">{{ item.confirmed }} {{ t('profile.public.confirmedCount') }}</span>
                  </template>
                </EventMiniCard>
              </div>
              <div v-else class="empty-state">
                <p>{{ activeTab === 'liked' ? t('profile.public.emptyLiked') : t('profile.public.emptyConfirmed') }}</p>
              </div>
            </template>
          </div>
        </template>
      </main>
    </section>

    <!-- Modal de Seguidores -->
    <Teleport to="body">
      <div v-if="showFollowersModal" class="modal-overlay" @click.self="closeFollowersModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ t('profile.followersModal.title') }}</h2>
            <button class="modal-close" type="button" @click="closeFollowersModal">✕</button>
          </div>
          <div class="modal-body">
            <AppLoader v-if="loadingFollowList" size="sm" />
            <ul v-else-if="followersList.length > 0" class="follow-modal-list">
              <li v-for="follower in followersList" :key="follower.id" class="follow-modal-item">
                <div class="follow-modal-user" style="cursor: pointer;" @click="visitFromModal(follower.id)">
                  <UserAvatar :image="follower.profileImage" :name="follower.name" :size="44" />
                  <div class="follow-modal-info">
                    <span class="follow-modal-name">{{ follower.name }}</span>
                    <span v-if="follower.username" class="follow-modal-username">@{{ follower.username }}</span>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="follow-modal-empty">{{ t('profile.followersModal.empty') }}</p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Seguindo -->
    <Teleport to="body">
      <div v-if="showFollowingModal" class="modal-overlay" @click.self="closeFollowingModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ t('profile.followingModal.title') }}</h2>
            <button class="modal-close" type="button" @click="closeFollowingModal">✕</button>
          </div>
          <div class="modal-body">
            <AppLoader v-if="loadingFollowList" size="sm" />
            <ul v-else-if="followingList.length > 0" class="follow-modal-list">
              <li v-for="following in followingList" :key="following.id" class="follow-modal-item">
                <div class="follow-modal-user" style="cursor: pointer;" @click="visitFromModal(following.id)">
                  <UserAvatar :image="following.profileImage" :name="following.name" :size="44" />
                  <div class="follow-modal-info">
                    <span class="follow-modal-name">{{ following.name }}</span>
                    <span v-if="following.username" class="follow-modal-username">@{{ following.username }}</span>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="follow-modal-empty">{{ t('profile.followingModal.empty') }}</p>
          </div>
        </div>
      </div>
    </Teleport>

    <Snackbar v-model="snackbar.visible.value" :color="snackbar.color.value" :message="snackbar.message.value" />
  </div>
</template>

<style scoped>
.public-profile-layout {
  min-height: 100vh;
  background: #FAFAFB;
}

.layout-shell {
  display: flex;
  max-width: 1100px;
  margin: 0 auto;
  gap: 1.5rem;
  padding: 0 1rem;
}

.layout-sidebar {
  flex: 0 0 auto;
}

.layout-main {
  flex: 1 1 auto;
  min-width: 0;
  padding: 1rem 0 3rem;
}

.not-found-state {
  text-align: center;
  padding: 4rem 1rem;
}

.not-found-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.empty-action {
  margin-top: 1rem;
  border: none;
  border-radius: 12px;
  padding: 0.7rem 1.4rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%);
  cursor: pointer;
}

.profile-card {
  background: #fff;
  border: 1px solid #ececee;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .04);
}

.cover-image {
  height: 140px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.cover-image.no-banner {
  background: linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%);
}

.cover-image .overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, .08);
}

.profile-content {
  padding: 0 1.5rem 1.5rem;
  position: relative;
  margin-top: -48px;
}

.avatar-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.avatar-img {
  width: 96px;
  height: 96px;
  border: 4px solid #fff;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .1);
  background: #fff;
  object-fit: cover;
}

.profile-actions-top {
  padding-top: 56px;
}

.header-info h1 {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0.75rem 0 0;
}

.handle {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
}

.bio {
  margin: 0.5rem 0 0;
  color: #374151;
  font-size: 0.92rem;
  line-height: 1.4;
}

.follow-stats-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.follow-stat {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.follow-stat-count {
  font-weight: 800;
  font-size: 1rem;
}

.follow-stat-label {
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 600;
}

.follow-stat-divider {
  width: 1px;
  height: 14px;
  background: #e5e7eb;
}

.meta-row {
  margin-top: 0.75rem;
  color: #9ca3af;
  font-size: 0.82rem;
  font-weight: 600;
}

.content-tabs {
  display: flex;
  gap: 0.5rem;
  margin: 1.25rem 0 1rem;
}

.tab-btn {
  border: none;
  background: #fff;
  border: 1px solid #ececee;
  border-radius: 12px;
  padding: 0.55rem 1.1rem;
  font-weight: 700;
  font-size: 0.85rem;
  color: #6b7280;
  cursor: pointer;
}

.tab-btn.active {
  background: linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%);
  color: #fff;
  border-color: transparent;
}

.mini-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

/* Shell do card (banner/data/título/localização): agora é
   src/components/UI/EventMiniCard/EventMiniCard.vue (Fase 3 do
   REFACTOR_AUDIT_PLAN.md). Só o conteúdo do slot #stats continua aqui. */
.mini-stat {
  font-size: 0.78rem;
  color: #9ca3af;
  font-weight: 700;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: #fff;
  border-radius: 18px;
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #ececee;
}

.modal-header h2 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
}

.modal-close {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #6b7280;
}

.modal-body {
  overflow-y: auto;
  padding: 0.5rem;
}

.follow-modal-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.follow-modal-item {
  padding: 0.4rem;
}

.follow-modal-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem;
  border-radius: 12px;
}

.follow-modal-user:hover {
  background: #FAFAFB;
}

.follow-modal-info {
  display: flex;
  flex-direction: column;
}

.follow-modal-name {
  font-weight: 700;
  font-size: 0.9rem;
}

.follow-modal-username {
  color: #9ca3af;
  font-size: 0.78rem;
}

.follow-modal-empty {
  text-align: center;
  color: #9ca3af;
  padding: 2rem 1rem;
  font-weight: 600;
}

@media (max-width: 900px) {
  .layout-shell {
    flex-direction: column;
  }

  .layout-sidebar {
    display: none;
  }
}
</style>
