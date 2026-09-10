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
  <section aria-labelledby="interest-hero-title" class="ih-hero" :style="interest.coverImageUrl ? { backgroundImage: `url(${interest.coverImageUrl})` } : {}">
    <div aria-hidden="true" class="ih-scrim" />

    <div class="ih-content">
      <div v-if="interest.emoji" aria-hidden="true" class="ih-emoji">{{ interest.emoji }}</div>

      <span class="ih-badge">{{ interest.heroLabel }}</span>

      <h1 id="interest-hero-title" class="ih-title">{{ interest.name }}</h1>

      <p v-if="interest.welcomeText" class="ih-welcome">{{ interest.welcomeText }}</p>
      <p v-else-if="interest.description" class="ih-welcome">{{ interest.description }}</p>

      <div class="ih-stats-row">
        <div v-if="sampleFollowers.length > 0" aria-hidden="true" class="ih-avatars">
          <UserAvatar
            v-for="person in sampleFollowers.slice(0, 5)"
            :key="person.id"
            class="ih-avatar"
            :image="person.profileImage"
            :name="person.name"
            :size="34"
          />
        </div>

        <span class="ih-stat">
          <strong>{{ followersCount }}</strong> {{ interest.memberNoun }}
        </span>

        <span v-if="activeEventsCount !== null" class="ih-stat-sep">·</span>
        <span v-if="activeEventsCount !== null" class="ih-stat">
          <strong>{{ activeEventsCount }}</strong> eventos
        </span>
      </div>

      <FollowButton
        class="ih-follow-btn"
        :disabled="followBusy"
        :following="isFollowing"
        :following-label="t('interestPage.hero.followingLabel')"
        :label="t('interestPage.hero.followLabel', { name: interest.name })"
        @toggle="emit('toggle-follow')"
      />
    </div>
  </section>
</template>

<style scoped>
.ih-hero {
  position: relative;
  min-height: 340px;
  display: flex;
  align-items: flex-end;
  background-size: cover;
  background-position: center;
  background-color: #1a1a2e;
  border-radius: 0 0 28px 28px;
  overflow: hidden;
}

.ih-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 9, 26, 0.35) 0%, rgba(7, 9, 26, 0.55) 55%, rgba(7, 9, 26, 0.9) 100%);
}

.ih-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 3rem 1.25rem 2.25rem;
  color: #fff;
  text-align: center;
}

.ih-emoji {
  font-size: 2.4rem;
  margin-bottom: 0.4rem;
}

.ih-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(6px);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ih-title {
  margin: 0.6rem 0 0;
  font-size: clamp(1.8rem, 5vw, 2.6rem);
  font-weight: 900;
  letter-spacing: -0.02em;
}

.ih-welcome {
  margin: 0.6rem auto 0;
  max-width: 480px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
}

.ih-stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.1rem 0;
  flex-wrap: wrap;
}

.ih-avatars {
  display: flex;
  margin-right: 0.3rem;
}

.ih-avatar {
  border: 2px solid #1a1a2e;
  border-radius: 50%;
  margin-left: -8px;
}

.ih-avatar:first-child {
  margin-left: 0;
}

.ih-stat {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.ih-stat strong {
  font-weight: 800;
  color: #fff;
}

.ih-stat-sep {
  color: rgba(255, 255, 255, 0.4);
}

.ih-follow-btn {
  margin-top: 0.25rem;
}

@media (max-width: 480px) {
  .ih-hero {
    min-height: 280px;
  }

  .ih-content {
    padding: 2.25rem 1rem 1.75rem;
  }
}
</style>
