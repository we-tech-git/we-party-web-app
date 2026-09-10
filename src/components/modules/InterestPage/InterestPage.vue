<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import LoginRequiredDialog from '@/components/UI/LoginRequiredDialog/LoginRequiredDialog.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { useInterestPageStore } from '@/stores/interestPage'
  import { logger } from '@/utils/logger'
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
  const { isFullyAuthenticated } = useAuth()
  const { requireLogin } = useGuestMode()
  const { t } = useI18n()

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
  max-width: 720px;
  margin: 2rem auto 0;
  padding: 0 1.25rem;
}
</style>
