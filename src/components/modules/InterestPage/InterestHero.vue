<script setup lang="ts">
  import type { InterestPageSkin, InterestPerson } from '@/stores/interestPage'
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import FollowButton from '@/components/UI/FollowButton/FollowButton.vue'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'

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
  }>()

  const emit = defineEmits<{
    (e: 'toggle-follow'): void
  }>()

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
    :class="{ 'ih-hero--cover': interest.coverImageUrl }"
    :style="interest.coverImageUrl ? { backgroundImage: `url(${interest.coverImageUrl})` } : {}"
  >
    <!-- Sem `coverImageUrl` (interesse novo, sem curadoria visual ainda): gradiente +
         textura no lugar de uma capa cinza — placeholder digno em vez de "sem imagem". -->
    <div v-if="!interest.coverImageUrl" aria-hidden="true" class="ih-placeholder-bg" />
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
  margin: 0 auto;
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

.ih-actions-row {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  flex-wrap: wrap;
  margin-top: 1.6rem;
}

.ih-follow-btn {
  flex-shrink: 0;
}

:deep(.ih-follow-btn.follow-btn) {
  font-size: 1rem;
  padding: 0.8rem 1.6rem;
  min-width: 160px;
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

@media (max-width: 640px) {
  .ih-hero {
    min-height: 440px;
    min-height: max(65svh, 440px);
  }

  .ih-content {
    padding: 2.25rem 1.1rem 1.9rem;
  }

  .ih-actions-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
