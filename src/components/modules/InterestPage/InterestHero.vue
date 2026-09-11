<script setup lang="ts">
  import type { InterestPageSkin, InterestPerson } from '@/stores/interestPage'
  import { useI18n } from 'vue-i18n'
  import FollowButton from '@/components/UI/FollowButton/FollowButton.vue'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'

  const { t } = useI18n()

  defineProps<{
    interest: InterestPageSkin
    followersCount: number
    activeEventsCount: number | null
    isFollowing: boolean
    sampleFollowers: InterestPerson[]
    followBusy: boolean
  }>()

  const emit = defineEmits<{
    (e: 'toggle-follow'): void
  }>()
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
        {{ interest.heroLabel }}
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
          @toggle="emit('toggle-follow')"
        />

        <div class="ih-stats">
          <div v-if="sampleFollowers.length > 0" aria-hidden="true" class="ih-avatars">
            <UserAvatar
              v-for="person in sampleFollowers.slice(0, 3)"
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
  min-height: 420px;
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
  background: radial-gradient(120% 120% at 18% 0%, #3a1338 0%, #160a1f 55%, #07060c 100%);
}

.ih-placeholder-bg::after {
  /* Textura sutil de "grão" — evita que o placeholder pareça um bloco de cor
     morto quando não há capa curada ainda. */
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.03) 0 2px, transparent 2px 9px);
}

.ih-hero--cover .ih-scrim {
  background: linear-gradient(180deg, rgba(7, 9, 26, 0.15) 0%, rgba(7, 9, 26, 0.35) 45%, rgba(7, 9, 26, 0.88) 100%);
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
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-full);
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
    min-height: 320px;
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
