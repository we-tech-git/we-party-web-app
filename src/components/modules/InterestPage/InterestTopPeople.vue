<script setup lang="ts">
  import type { InterestPerson } from '@/stores/interestPage'
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'
  import { useUserNavigation } from '@/composables/useUserNavigation'

  const props = defineProps<{
    following: InterestPerson[]
    others: InterestPerson[]
  }>()

  const { goToProfile } = useUserNavigation()
  const { t } = useI18n()

  // "Quem eu sigo" primeiro (mais relevante pro usuário logado), completa
  // com os demais até um teto razoável pra não virar uma lista infinita.
  const people = computed(() => [...props.following, ...props.others].slice(0, 12))
</script>

<template>
  <section v-if="people.length > 0" aria-labelledby="top-people-heading" class="itp-section">
    <p class="itp-kicker">{{ t('interestPage.topPeople.kicker') }}</p>
    <h2 id="top-people-heading" class="itp-title">{{ t('interestPage.topPeople.title') }}</h2>
    <div class="itp-list">
      <button
        v-for="person in people"
        :key="person.id"
        class="itp-person"
        type="button"
        @click="goToProfile(person.id)"
      >
        <UserAvatar :image="person.profileImage" :name="person.name" :size="52" />
        <span class="itp-name">{{ person.name }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.itp-section {
  max-width: 810px;
  margin: 2.5rem auto 0;
  padding: 0 1.25rem;
}

.itp-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f978a3;
}

.itp-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0 0 1.1rem;
}

.itp-list {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none;
}

.itp-list::-webkit-scrollbar {
  display: none;
}

.itp-person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  width: 68px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.itp-name {
  font-size: 0.72rem;
  font-weight: 600;
  color: #16171f;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
