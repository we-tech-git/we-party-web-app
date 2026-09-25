<script setup lang="ts">
  import type { HeroSlide } from '@/composables/useHeroSlideshow'
  import type { InterestPageSkin, InterestPerson } from '@/stores/interestPage'
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import FollowButton from '@/components/UI/FollowButton/FollowButton.vue'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'
  import { useHeroSlideshow } from '@/composables/useHeroSlideshow'
  import InterestHeroBackdrop from './InterestHeroBackdrop.vue'

  const { t } = useI18n()

  const props = defineProps<{
    interest: InterestPageSkin
    followersCount: number
    activeEventsCount: number | null
    isFollowing: boolean
    sampleFollowers: InterestPerson[]
    followBusy: boolean
    /** Usuário logado — só pra completar o cluster de avatares abaixo (ver `displayedFollowers`). */
    loggedUser?: InterestPerson | null
    /** Eventos do interesse com imagem — viram o fundo em slideshow quando não há capa curada. */
    slides?: HeroSlide[]
  }>()

  const emit = defineEmits<{
    'toggle-follow': []
    'share': []
  }>()

  const heroSlides = computed(() => props.slides ?? [])
  // A capa curada (`coverImageUrl`) tem prioridade: o slideshow só entra no lugar do placeholder.
  const showSlideshow = computed(() => !props.interest.coverImageUrl && heroSlides.value.length > 0)
  const { activeIndex, loadedCount, goTo } = useHeroSlideshow(heroSlides)
  const activeSlide = computed(() => heroSlides.value[activeIndex.value])

  function formatSlideDate (startDate: string) {
    return new Date(startDate).toLocaleDateString('pt-BR')
  }

  /**
   * `sampleFollowers` vem só do `fetchPage` inicial — o `toggleFollow` (otimista)
   * atualiza `followersCount`/`isFollowing`, mas a API de seguir não devolve a
   * lista de amostra atualizada. Sem isso, quem acabou de seguir não se vê no
   * cluster de avatares mesmo sendo, agora, o único seguidor. Completa aqui,
   * na camada de exibição, sem mexer em store/API — mesmo espírito da
   * atualização otimista que já existe pro contador.
   */
  const displayedFollowers = computed(() => {
    if (!props.isFollowing || !props.loggedUser) return props.sampleFollowers
    if (props.sampleFollowers.some(person => person.id === props.loggedUser!.id)) return props.sampleFollowers
    return [props.loggedUser, ...props.sampleFollowers]
  })

  /**
   * `heroLabel` hoje pode vir do backend como o valor genérico "Interesse"
   * (sem curadoria de tribo ainda) ou como um rótulo específico ("Tribo do
   * Rock"). Só mostra o "· <rótulo>" no badge quando é algo além do prefixo
   * padrão — evita "Interesse · Interesse" enquanto o conteúdo não é curado.
   */
  const badgeSuffix = computed(() => {
    const label = props.interest.heroLabel?.trim()
    if (!label) return null
    const prefix = t('interestPage.hero.badgePrefix').trim()
    return label.toLowerCase() === prefix.toLowerCase() ? null : label
  })
</script>

<template>
  <section
    aria-labelledby="interest-hero-title"
    class="ih-hero"
    :class="{ 'ih-hero--cover': interest.coverImageUrl || showSlideshow }"
    :style="interest.coverImageUrl ? { backgroundImage: `url(${interest.coverImageUrl})` } : {}"
  >
    <!-- Sem `coverImageUrl` (interesse novo, sem curadoria visual ainda): gradiente +
         textura no lugar de uma capa cinza — placeholder digno em vez de "sem imagem".
         Se houver eventos com imagem, o slideshow deles entra por cima do placeholder
         (que continua de fundo enquanto a 1ª imagem carrega). -->
    <div v-if="!interest.coverImageUrl" aria-hidden="true" class="ih-placeholder-bg" />
    <InterestHeroBackdrop
      v-if="showSlideshow"
      :active-index="activeIndex"
      :loaded-count="loadedCount"
      :slides="heroSlides"
    />
    <div aria-hidden="true" class="ih-scrim" />

    <div class="ih-content">
      <span class="ih-badge">
        <template v-if="interest.emoji">{{ interest.emoji }}</template>
        {{ t('interestPage.hero.badgePrefix') }}
        <template v-if="badgeSuffix">· {{ badgeSuffix }}</template>
      </span>

      <h1 id="interest-hero-title" class="ih-title">{{ interest.name }}</h1>

      <p v-if="interest.welcomeText" class="ih-welcome">{{ interest.welcomeText }}</p>
      <p v-else-if="interest.description" class="ih-welcome">{{ interest.description }}</p>

      <!-- Ações e legenda do slideshow dividem a mesma linha, sempre ABAIXO do título:
           por estar no fluxo (não `absolute`), a legenda nunca cobre o nome do
           interesse, por maior que ele seja — sem espaço ao lado, quebra pra baixo. -->
      <div class="ih-bottom">
        <div class="ih-actions-row">
          <FollowButton
            class="ih-follow-btn"
            :disabled="followBusy"
            :following="isFollowing"
            :following-label="t('interestPage.hero.followingLabel')"
            :label="t('interestPage.hero.followLabel', { name: interest.name })"
            solid
            @toggle="emit('toggle-follow')"
          />

          <button
            :aria-label="t('interestPage.share.button')"
            class="ih-share-btn"
            data-testid="interest-hero-share"
            type="button"
            @click="emit('share')"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="18"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.6" x2="15.4" y1="13.5" y2="17.5" />
              <line x1="15.4" x2="8.6" y1="6.5" y2="10.5" />
            </svg>
            <span class="ih-share-label">{{ t('interestPage.share.button') }}</span>
          </button>

          <div class="ih-stats">
            <div v-if="displayedFollowers.length > 0" aria-hidden="true" class="ih-avatars">
              <UserAvatar
                v-for="person in displayedFollowers.slice(0, 3)"
                :key="person.id"
                class="ih-avatar"
                :image="person.profileImage"
                :name="person.name"
                :size="32"
              />
            </div>
            <span class="ih-stat">
              <strong>{{ followersCount.toLocaleString('pt-BR') }}</strong> {{ interest.memberNoun }}
              <template v-if="activeEventsCount !== null">
                · <strong>{{ activeEventsCount.toLocaleString('pt-BR') }}</strong> eventos
              </template>
            </span>
          </div>
        </div>

        <!-- Legenda do evento que está no fundo: a imagem que passa também informa e
           leva ao evento. `:key` refaz o elemento a cada slide pra animar a troca. -->
        <div v-if="showSlideshow && activeSlide" class="ih-showcase">
          <RouterLink
            :key="activeSlide.id"
            :aria-label="t('interestPage.hero.showcaseLink', { title: activeSlide.title })"
            class="ih-showcase-link"
            data-testid="interest-hero-showcase-link"
            :to="`/event/${activeSlide.id}`"
          >
            <span class="ih-showcase-kicker">{{ t('interestPage.hero.showcaseKicker') }}</span>
            <strong class="ih-showcase-title">{{ activeSlide.title }}</strong>
            <span class="ih-showcase-meta">
              {{ formatSlideDate(activeSlide.startDate) }}<template v-if="activeSlide.location"> · {{ activeSlide.location }}</template>
            </span>
          </RouterLink>

          <div v-if="heroSlides.length > 1" class="ih-showcase-dots">
            <button
              v-for="(slide, index) in heroSlides"
              :key="slide.id"
              :aria-current="index === activeIndex"
              :aria-label="t('interestPage.hero.showcaseGoTo', { title: slide.title })"
              class="ih-showcase-dot"
              :class="{ 'ih-showcase-dot--active': index === activeIndex }"
              :data-testid="`interest-hero-showcase-dot-${index}`"
              type="button"
              @click="goTo(index)"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ih-hero {
  position: relative;
  /* Header sobreposto ao hero; ~80% da tela deixa a próxima seção aparecer */
  min-height: 560px;
  min-height: max(80svh, 560px);
  display: flex;
  align-items: flex-end;
  background-size: cover;
  background-position: center;
  background-color: var(--color-dark);
  overflow: hidden;
}

.ih-placeholder-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(75% 95% at 68% 12%, rgba(255, 45, 130, 0.65) 0%, rgba(255, 45, 130, 0) 62%),
    radial-gradient(90% 90% at 28% 105%, rgba(255, 140, 60, 0.22) 0%, rgba(255, 140, 60, 0) 50%),
    radial-gradient(140% 140% at 50% 0%, #2c1030 0%, #150816 55%, #060306 100%);
}

.ih-placeholder-bg::after {
  /* Textura sutil de "grão" — evita que o placeholder pareça um bloco de cor
     morto quando não há capa curada ainda. */
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.06) 0 2px, transparent 2px 9px);
}

.ih-hero--cover .ih-scrim {
  background: linear-gradient(180deg, rgba(7, 9, 26, 0.45) 0%, rgba(7, 9, 26, 0.35) 45%, rgba(7, 9, 26, 0.88) 100%);
}

.ih-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 9, 26, 0) 0%, rgba(7, 9, 26, 0.15) 45%, rgba(7, 9, 26, 0.8) 100%);
}

.ih-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 810px;
  /* Alinha o bloco à esquerda com o conteúdo do header (mesma grade de 1280px da
     logo), em vez de centralizá-lo: em tela larga o hero deixa de ficar solto no
     meio e o card da direita cai perto do centro da tela. */
  margin: 0 auto 0 max(0px, calc((100% - min(100%, 1280px)) / 2 - 0.5rem));
  padding: 3rem 1.5rem 2.5rem;
  color: #fff;
}

.ih-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: var(--blur-sm);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ih-title {
  margin: 0.7rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 8vw, 5.2rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.02em;
}

.ih-welcome {
  margin: 0.85rem 0 0;
  max-width: 560px;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.92);
}

/* Linha de baixo em duas colunas (ações | legenda), coladas na mesma base: o card
   nunca cobre o título (que fica na linha de cima) e, se as ações não couberem
   ao lado dele, quebram dentro da própria coluna em vez de empurrar o card.
   A coluna do card sobra com o espaço livre; ele fica centralizado nela. */
.ih-bottom {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(250px, 1fr);
  align-items: end;
  column-gap: 1.5rem;
  margin-top: 1.6rem;
}

.ih-actions-row {
  display: flex;
  align-items: center;
  gap: 1rem 1.2rem;
  flex-wrap: wrap;
}

.ih-follow-btn {
  flex-shrink: 0;
}

:deep(.ih-follow-btn.follow-btn) {
  font-size: 1rem;
  padding: 0.8rem 1.6rem;
  min-width: 160px;
}

/* Compartilhar: pílula de vidro, mesmo tratamento do badge "Interesse" */
.ih-share-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.1rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: var(--blur-sm);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.ih-share-btn:hover {
  background: rgba(255, 255, 255, 0.24);
  transform: translateY(-1px);
}

.ih-stats {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.ih-avatars {
  display: flex;
}

.ih-avatar {
  border: 2px solid var(--color-dark);
  border-radius: 50%;
  margin-left: -9px;
}

.ih-avatar:first-child {
  margin-left: 0;
}

.ih-stat {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.ih-stat strong {
  font-weight: 800;
  color: #fff;
}

/* Legenda do slideshow: centralizada no espaço livre da linha de baixo, base alinhada às ações */
.ih-showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-self: center;
  gap: 0.7rem;
  width: 250px;
}

.ih-showcase-link {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: var(--blur-sm);
  color: #fff;
  text-decoration: none;
  animation: ih-showcase-in 0.6s ease both;
  transition: background 0.2s ease, transform 0.2s ease;
}

.ih-showcase-link:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.ih-showcase-kicker {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
}

.ih-showcase-title {
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ih-showcase-meta {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ih-showcase-dots {
  display: flex;
  gap: 0.4rem;
}

.ih-showcase-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: width 0.25s ease, background 0.25s ease;
}

.ih-showcase-dot--active {
  width: 22px;
  background: #fff;
}

@keyframes ih-showcase-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ih-showcase-link {
    animation: none;
  }
}

@media (max-width: 640px) {
  .ih-hero {
    min-height: 440px;
    min-height: max(65svh, 440px);
  }

  .ih-content {
    padding: 2.25rem 1.1rem 1.9rem;
  }

  /* Mobile: sem espaço lateral, a legenda desce pra baixo das ações */
  .ih-bottom {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 1.4rem;
  }

  .ih-showcase {
    align-items: flex-start;
    width: 100%;
  }

  .ih-actions-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
