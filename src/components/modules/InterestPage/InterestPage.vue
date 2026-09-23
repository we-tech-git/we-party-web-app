<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import AppHeader from '@/components/UI/AppHeader/AppHeader.vue'
  import LoginRequiredDialog from '@/components/UI/LoginRequiredDialog/LoginRequiredDialog.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useGuestMode } from '@/composables/useGuestMode'
  import { useInterestPageStore } from '@/stores/interestPage'
  import { useShareStore } from '@/stores/share'
  import { logger } from '@/utils/logger'
  import InlineComments from '../Feed/InlineComments.vue'
  import NotFound from '../NotFound/NotFound.vue'
  import InterestEmptyState from './InterestEmptyState.vue'
  import InterestFeaturedEvents from './InterestFeaturedEvents.vue'
  import InterestHero from './InterestHero.vue'
  import InterestRelated from './InterestRelated.vue'
  import InterestTopPeople from './InterestTopPeople.vue'
  import InterestUpcomingList from './InterestUpcomingList.vue'

  const props = defineProps<{
    slug: string
  }>()

  const store = useInterestPageStore()
  const shareStore = useShareStore()
  const { isFullyAuthenticated, loggedUser } = useAuth()
  const { requireLogin } = useGuestMode()
  const { t } = useI18n()

  // Mesmo shape de `Feed.vue` pro `AppHeader` — header e busca são o
  // mesmo componente da rota `/explore`, não uma reimplementação.
  const headerUser = computed(() => ({
    name: loggedUser.value?.name || '',
    avatar: loggedUser.value?.profileImage || '',
    username: loggedUser.value?.username ? `@${loggedUser.value.username}` : '',
  }))

  // Visitante cai no explore público; logado, no feed (mesma regra do logo do AppHeader).
  const exploreTo = computed(() => isFullyAuthenticated.value ? '/feed' : '/explore')

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

  // Compartilha a URL "bonita" (slug), não a que o usuário abriu — que pode ser o id.
  function handleShare () {
    const interest = store.interest
    if (!interest) {
      return
    }
    shareStore.open({
      heading: t('interestPage.share.heading'),
      title: interest.name,
      text: t('interestPage.share.text', { name: interest.name }),
      url: `${window.location.origin}/interests/${interest.slug ?? props.slug}`,
    })
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
    <!-- Sobreposto ao hero só quando ele existe; em loading/NotFound o
         conteúdo começa no topo e ficaria escondido atrás do header. -->
    <AppHeader
      :guest-mode="!isFullyAuthenticated"
      :transparent="!store.loadingHero && !store.notFound && !!store.interest"
      :user="headerUser"
    />

    <WePartyLoader v-if="store.loadingHero" fullscreen :messages="['Carregando interesse...']" />

    <NotFound v-else-if="store.notFound" />

    <template v-else-if="store.interest">
      <InterestHero
        :active-events-count="store.activeEventsCount"
        :follow-busy="followBusy"
        :followers-count="store.followersCount"
        :interest="store.interest"
        :is-following="store.isFollowing"
        :logged-user="loggedUser"
        :sample-followers="store.sampleFollowers"
        :slides="store.heroSlides"
        @share="handleShare"
        @toggle-follow="handleToggleFollow"
      />

      <!-- Sem nenhum evento: em vez de deixar a página "oca", convida a seguir. -->
      <InterestEmptyState
        v-if="store.hasNoEvents"
        :emoji="store.interest.emoji"
        :explore-to="exploreTo"
        :follow-busy="followBusy"
        :interest-name="store.interest.name"
        :is-following="store.isFollowing"
        @toggle-follow="handleToggleFollow"
      />
      <template v-else>
        <InterestFeaturedEvents :events="store.featuredEvents" />
        <InterestUpcomingList :events="store.upcomingEvents" />
      </template>

      <!-- Sem beco sem saída: leva pra outros interesses que rolam junto -->
      <InterestRelated :interest-name="store.interest.name" :interests="store.relatedInterests" />

      <InterestTopPeople :following="store.topPeopleFollowing" :others="store.topPeopleOthers" />

      <section class="ip-comments">
        <p class="ip-comments-kicker">{{ t('interestPage.comments.kicker') }}</p>
        <h2 class="ip-comments-title">{{ t('interestPage.comments.title') }}</h2>
        <InlineComments
          :subject-id="store.interestId ?? ''"
          subject-type="interest"
          variant="interest"
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
  /*
   * `src/styles/css-variables.css` (radius/sombra/blur/gradiente/fonte de
   * exibição) nunca é importado globalmente (achado documentado em
   * `src/styles/README.md`, ainda não resolvido) — ativar esse arquivo pro
   * app inteiro mudaria Feed/Profile/etc. que usam os mesmos nomes de var.
   * Definindo aqui, só a árvore da página de Interesse (que já referencia
   * essas vars em Hero/Featured/Upcoming/TopPeople) herda os valores reais;
   * o resto do site não é afetado. Valores idênticos aos de `css-variables.css`.
   */
  --font-display: 'Poppins', sans-serif;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 999px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
  --blur-sm: blur(4px);
  --gradient-primary: linear-gradient(135deg, #ff9a4d, #ff5f8f);

  min-height: 100vh;
  background: #fdf1f4;
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
