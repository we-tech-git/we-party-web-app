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
   * (mesmo chrome do resto da área logada), `ProfileBioInterests` (chips de
   * interesse) e a normalização de eventos de `src/utils/profileEvents.ts`
   * (extraída de `Profile.vue`). Seguidores em comum e grid de eventos ficam
   * em `ProfileMutualFollowers`/`ProfileEventSections` — esta página só orquestra.
   */
  import type { NavItem } from '@/types/navigation'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { unwrapItem, unwrapList } from '@/api'
  import { followUserById, getFollowers, getFollowing, unfollowUserById } from '@/api/follows'
  import { getUserProfile } from '@/api/users'
  import FeedSidebarNav from '@/components/modules/Feed/FeedSidebarNav.vue'
  import AppFooter from '@/components/UI/AppFooter/AppFooter.vue'
  import AppHeader from '@/components/UI/AppHeader/AppHeader.vue'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import BreadcrumbBack from '@/components/UI/BreadcrumbBack/BreadcrumbBack.vue'
  import FollowButton from '@/components/UI/FollowButton/FollowButton.vue'
  import ShareButton from '@/components/UI/ShareButton/ShareButton.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useMutualFollowers } from '@/composables/useMutualFollowers'
  import { useSnackbar } from '@/composables/useSnackbar'
  import { useUserNavigation } from '@/composables/useUserNavigation'
  import { useShareStore } from '@/stores/share'
  import {
    type LikedEventItem,
    mapConfirmedAttendance as mapConfirmedAttendanceUtil,
    mapLikedEventItem as mapLikedEventItemUtil,
  } from '@/utils/profileEvents'
  import ProfileBioInterests from './ProfileBioInterests.vue'
  import ProfileEventSections from './ProfileEventSections.vue'
  import ProfileMutualFollowers from './ProfileMutualFollowers.vue'

  const props = defineProps<{
    userId: string
  }>()

  const { t } = useI18n()
  const router = useRouter()
  const { loggedUser } = useAuth()
  const { goToProfile } = useUserNavigation()
  const snackbar = useSnackbar()
  const shareStore = useShareStore()

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
    /** Só interesses aprovados (a página pública do interesse existe pra todos eles). */
    interests?: { id: string, name: string, slug?: string, emoji?: string | null }[]
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

  // "Seguido por quem você segue" — só faz sentido em perfil de terceiro (`isFollowing` é null no próprio).
  const { preview: mutualPreview, extraCount: mutualExtraCount } = useMutualFollowers(
    () => profile.value?.id,
    () => profile.value?.isFollowing != null,
  )

  // Compartilha a URL pública do perfil (não `window.location.href`, que pode carregar query/hash).
  function handleShare () {
    if (!profile.value) return
    shareStore.open({
      heading: t('profile.public.share.heading'),
      title: profile.value.name,
      text: t('profile.public.share.text', { name: profile.value.name }),
      url: `${window.location.origin}/profile/${profile.value.id}`,
    })
  }

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

                <div class="profile-actions-top">
                  <ShareButton
                    data-testid="public-profile-share"
                    :label="t('profile.public.share.button')"
                    @click="handleShare"
                  />
                  <FollowButton
                    v-if="profile.isFollowing !== null"
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

                <ProfileBioInterests
                  v-if="profile.interests?.length"
                  :interests="profile.interests"
                  :label="t('profile.public.interestsLabel', { name: profile.name })"
                />

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

                <ProfileMutualFollowers :extra-count="mutualExtraCount" :people="mutualPreview" />

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
              <span class="tab-count" data-testid="public-profile-tab-liked-count">{{ likedItems.length }}</span>
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
              <span class="tab-count" data-testid="public-profile-tab-confirmed-count">{{ confirmedItems.length }}</span>
            </button>
          </div>

          <div class="tab-panel">
            <div v-if="privacyMessage" class="empty-state">
              <p>{{ privacyMessage }}</p>
            </div>
            <template v-else>
              <ProfileEventSections
                v-if="activeItems.length > 0"
                :items="activeItems"
                @open="id => router.push(`/event/${id}`)"
              />
              <div v-else class="empty-state" data-testid="public-profile-empty">
                <div aria-hidden="true" class="empty-state__emoji">{{ activeTab === 'liked' ? '❤️' : '🎟️' }}</div>
                <p class="empty-state__title">
                  {{ activeTab === 'liked' ? t('profile.public.emptyLiked') : t('profile.public.emptyConfirmed') }}
                </p>
                <p class="empty-state__hint">
                  {{ t(activeTab === 'liked' ? 'profile.public.emptyLikedHint' : 'profile.public.emptyConfirmedHint', { name: profile.name }) }}
                </p>
                <button
                  class="empty-action"
                  data-testid="public-profile-empty-explore"
                  type="button"
                  @click="router.push('/feed')"
                >
                  {{ t('profile.likedEvents.exploreEvents') }}
                </button>
              </div>
            </template>
          </div>
        </template>
      </main>
    </section>

    <AppFooter />

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

/* Mesmo shell do Profile.vue: mobile empilhado com a nav fixa embaixo
   (o próprio FeedSidebarNav se fixa ≤960px), grid com sidebar sticky a partir de 960px. */
.layout-shell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  width: min(100%, var(--layout-max-width));
  margin: 0 auto;
  padding: 1rem 0.5rem;
}

/* O footer é o último elemento da página, então carrega a folga para a
   bottom nav fixa (mobile) não cobri-lo. */
:deep(.app-footer) {
  padding-bottom: calc(2rem + 5rem + env(safe-area-inset-bottom, 0px));
}

.layout-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  min-width: 0;
}

@media (min-width: 640px) {
  .layout-shell {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}

@media (min-width: 960px) {
  .layout-shell {
    display: grid;
    align-items: start;
    grid-template-columns: 220px minmax(0, 1fr);
    grid-template-areas: 'sidebar main';
    width: min(100%, 960px);
    margin-bottom: 3.5rem;
    padding: 0 var(--layout-side-padding);
  }

  /* A sidebar volta a ser sticky, então o footer não precisa mais da folga */
  :deep(.app-footer) {
    padding-bottom: 2rem;
  }

  .layout-sidebar {
    grid-area: sidebar;
    position: sticky;
    top: 100px;
    align-self: flex-start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    scrollbar-width: none;
    z-index: 10;
  }

  .layout-sidebar::-webkit-scrollbar {
    display: none;
  }

  .layout-main {
    grid-area: main;
    min-height: 100vh;
  }
}

/* Sidebar icon-only (FeedSidebarNav esconde os labels ≤1100px) */
@media (min-width: 960px) and (max-width: 1099px) {
  .layout-shell {
    grid-template-columns: 72px minmax(0, 1fr);
    width: min(100%, 1080px);
  }
}

@media (min-width: 1240px) {
  .layout-shell {
    grid-template-columns: var(--layout-sidebar-width) minmax(0, 720px);
    justify-content: start;
    column-gap: var(--layout-column-gap);
    width: min(100%, var(--layout-max-width));
    padding: 0 1rem;
  }
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
  display: flex;
  align-items: center;
  gap: 0.6rem;
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

.tab-count {
  margin-left: 0.35rem;
  font-size: 0.75rem;
  opacity: 0.75;
}

.tab-btn.active {
  background: linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%);
  /* O gradiente por padrão nasce na área do padding e se repete sob a borda
     transparente (fio rosa na esquerda) — border-box faz ele cobrir a borda. */
  background-origin: border-box;
  color: #fff;
  border-color: transparent;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.empty-state__emoji {
  font-size: 2.4rem;
  line-height: 1;
}

.empty-state__title {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-dark);
}

.empty-state__hint {
  max-width: 360px;
  margin: 0.35rem auto 0;
  font-size: 0.88rem;
  line-height: 1.45;
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
</style>
