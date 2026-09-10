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
  max-width: 720px;
  margin: 2rem auto 0;
  padding: 0 1.25rem;
}

.itp-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #16171f;
  margin: 0 0 0.75rem;
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
