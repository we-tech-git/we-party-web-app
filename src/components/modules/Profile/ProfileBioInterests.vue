<script setup lang="ts">
  // Extraído de Profile.vue (ver aviso em AGENTS.md sobre não crescer o
  // monolito): chips de interesse da bio, limitados a BIO_INTERESTS_LIMIT
  // com toggle "ver todos" / "mostrar menos". Auto-contido — dono do
  // próprio estado de expansão, já que nada fora daqui depende dele.
  import type { UserInterest } from './types'
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useInterestNavigation } from '@/composables/useInterestNavigation'

  const props = defineProps<{
    interests: UserInterest[]
    /** `aria-label` da região — o padrão ("Seus interesses") só serve pro próprio perfil. */
    label?: string
  }>()

  const BIO_INTERESTS_LIMIT = 3

  const { t } = useI18n()
  const { goToInterest } = useInterestNavigation()

  const expanded = ref(false)

  const displayedInterests = computed(() =>
    expanded.value ? props.interests : props.interests.slice(0, BIO_INTERESTS_LIMIT),
  )

  const hasMore = computed(() => props.interests.length > BIO_INTERESTS_LIMIT)
</script>

<template>
  <div :aria-label="label ?? t('profile.yourInterests')" class="interests-section">
    <div class="interests-chips-wrapper">
      <ul class="interests-chips" role="list">
        <li v-for="interest in displayedInterests" :key="interest.id">
          <button
            class="interest-chip"
            data-testid="profile-interest-chip"
            type="button"
            @click="goToInterest(interest.id)"
          >
            {{ interest.name }}
          </button>
        </li>
        <li v-if="hasMore && !expanded">
          <v-btn
            class="interests-toggle-btn"
            color="primary"
            data-testid="profile-bio-interests-show-all"
            size="small"
            variant="text"
            @click="expanded = true"
          >
            {{ t('profile.interests.showAll') }}
          </v-btn>
        </li>
      </ul>

      <v-btn
        v-if="expanded"
        class="interests-toggle-btn interests-toggle-btn--collapse"
        color="primary"
        data-testid="profile-bio-interests-show-less"
        size="small"
        variant="text"
        @click="expanded = false"
      >
        {{ t('profile.interests.showLess') }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.interests-section {
  margin: 1rem 0;
}

.interests-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.interest-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  background: linear-gradient(135deg, rgba(255, 95, 143, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: #ff5fa6;
  border-radius: 14px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(255, 95, 166, 0.2);
  cursor: pointer;
  font-family: inherit;
  line-height: inherit;
  transition: all 0.2s ease;
}

.interest-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 95, 166, 0.45);
  background: linear-gradient(135deg, rgba(255, 95, 143, 0.18) 0%, rgba(139, 92, 246, 0.18) 100%);
}

.interests-toggle-btn {
  text-transform: none;
  font-weight: 600;
  letter-spacing: normal;
}

.interests-toggle-btn--collapse {
  margin-top: 0.35rem;
}
</style>
