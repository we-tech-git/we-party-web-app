<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import FollowButton from '@/components/UI/FollowButton/FollowButton.vue'

  defineProps<{
    interestName: string
    emoji: string | null
    isFollowing: boolean
    followBusy: boolean
    /** Destino do "explorar outros eventos" — feed pra logado, explore pra visitante. */
    exploreTo: string
  }>()

  const emit = defineEmits<{
    (e: 'toggle-follow'): void
  }>()

  const { t } = useI18n()
</script>

<template>
  <section aria-labelledby="interest-empty-title" class="ie-section" data-testid="interest-empty-state">
    <div aria-hidden="true" class="ie-emoji">{{ emoji || '🎉' }}</div>
    <h2 id="interest-empty-title" class="ie-title">
      {{ t('interestPage.empty.title', { name: interestName }) }}
    </h2>
    <p class="ie-text">
      {{ isFollowing
        ? t('interestPage.empty.textFollowing', { name: interestName })
        : t('interestPage.empty.text', { name: interestName }) }}
    </p>

    <div class="ie-actions">
      <FollowButton
        class="ie-follow-btn"
        data-testid="interest-empty-follow"
        :disabled="followBusy"
        :following="isFollowing"
        :following-label="t('interestPage.hero.followingLabel')"
        :label="t('interestPage.hero.followLabel', { name: interestName })"
        solid
        @toggle="emit('toggle-follow')"
      />
      <RouterLink class="ie-explore" data-testid="interest-empty-explore" :to="exploreTo">
        {{ t('interestPage.empty.explore') }}
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.ie-section {
  max-width: 810px;
  margin: 2.5rem auto 0;
  padding: 2.25rem 1.5rem;
  text-align: center;
  background: #fff;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.ie-emoji {
  font-size: 2.6rem;
  line-height: 1;
}

.ie-title {
  margin: 0.8rem 0 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-dark);
}

.ie-text {
  max-width: 460px;
  margin: 0.6rem auto 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}

.ie-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem 1.4rem;
  margin-top: 1.4rem;
}

:deep(.ie-follow-btn.follow-btn) {
  font-size: 1rem;
  padding: 0.8rem 1.6rem;
  min-width: 160px;
}

.ie-explore {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}

.ie-explore:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .ie-section {
    margin-inline: 1.25rem;
    padding: 1.75rem 1.1rem;
  }
}
</style>
