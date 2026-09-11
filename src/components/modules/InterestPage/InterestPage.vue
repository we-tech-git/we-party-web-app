<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import LoginRequiredDialog from '@/components/UI/LoginRequiredDialog/LoginRequiredDialog.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { useInterestPageStore } from '@/stores/interestPage'
  import { logger } from '@/utils/logger'
  import FeedTopHeader from '../Feed/FeedTopHeader.vue'
  import InlineComments from '../Feed/InlineComments.vue'
  import NotFound from '../NotFound/NotFound.vue'
  import InterestFeaturedEvents from './InterestFeaturedEvents.vue'
  import InterestHero from './InterestHero.vue'
  import InterestTopPeople from './InterestTopPeople.vue'
  import InterestUpcomingList from './InterestUpcomingList.vue'

  const props = defineProps<{
    slug: string
  }>()

  const store = useInterestPageStore()
  const { isFullyAuthenticated, loggedUser } = useAuth()
  const { requireLogin } = useGuestMode()
  const { t } = useI18n()

  // Mesmo shape de `Feed.vue` pro `FeedTopHeader` — header e busca são o
  // mesmo componente da rota `/public/explore`, não uma reimplementação.
  const headerUser = computed(() => ({
    name: loggedUser.value?.name || '',
    avatar: loggedUser.value?.profileImage || '',
    username: loggedUser.value?.username ? `@${loggedUser.value.username}` : '',
  }))

  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const followBusy = ref(false)

  function showSnackbar (message: string) {
    snackbarMessage.value = message
    snackbarVisible.value = true
  }

  async function handleToggleFollow () {
    if (!isFullyAuthenticated.value) {
      requireLogin('seguir esse interesse')
      return
    }

    followBusy.value = true
    try {
      await store.toggleFollow()
    } catch (error) {
      logger.error('Erro ao seguir/deixar de seguir interesse:', error)
      showSnackbar(t('interestPage.followError'))
    } finally {
      followBusy.value = false
    }
  }

  onMounted(() => {
    store.fetchPage(props.slug)
  })

  onUnmounted(() => {
    store.reset()
  })

  // Troca de slug sem desmontar a página (navegação entre interesses) —
  // critério de aceite do plano.
  watch(() => props.slug, slug => {
    store.reset()
    store.fetchPage(slug)
  })
</script>

<template>
  <div class="ip-page">
    <FeedTopHeader :guest-mode="!isFullyAuthenticated" :user="headerUser" />

    <WePartyLoader v-if="store.loadingHero" fullscreen :messages="['Carregando interesse...']" />

    <NotFound v-else-if="store.notFound" />

    <template v-else-if="store.interest">
      <InterestHero
        :active-events-count="store.activeEventsCount"
        :follow-busy="followBusy"
        :followers-count="store.followersCount"
        :interest="store.interest"
        :is-following="store.isFollowing"
        :sample-followers="store.sampleFollowers"
        @toggle-follow="handleToggleFollow"
      />

      <InterestFeaturedEvents :events="store.featuredEvents" />
      <InterestUpcomingList :events="store.upcomingEvents" />
      <InterestTopPeople :following="store.topPeopleFollowing" :others="store.topPeopleOthers" />

      <section class="ip-comments">
        <p class="ip-comments-kicker">{{ t('interestPage.comments.kicker') }}</p>
        <h2 class="ip-comments-title">{{ t('interestPage.comments.title') }}</h2>
        <InlineComments
          :subject-id="store.interestId ?? ''"
          subject-type="interest"
          :visible="true"
        />
      </section>
    </template>

    <LoginRequiredDialog />
    <Snackbar v-model="snackbarVisible" :message="snackbarMessage" />
  </div>
</template>

<style scoped>
.ip-page {
  min-height: 100vh;
  background: #faf9fc;
  padding-bottom: 2.5rem;
}

.ip-comments {
  max-width: 810px;
  margin: 2.5rem auto 0;
  padding: 0 1.25rem;
}

.ip-comments-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f978a3;
}

.ip-comments-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0;
}
</style>
