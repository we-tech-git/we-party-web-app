<script setup lang="ts">
  /**
   * "Seguido por A, B e mais N" no perfil de terceiro — quem o visitante já
   * segue e também segue esse perfil. Só apresenta; o cruzamento das listas
   * mora em `useMutualFollowers`.
   */
  import type { FollowPerson } from '@/utils/mutualFollowers'
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import AvatarStack from '@/components/UI/AvatarStack/AvatarStack.vue'

  const props = defineProps<{
    /** Os primeiros seguidores em comum (já limitados pelo composable). */
    people: FollowPerson[]
    /** Quantos ficam de fora dos nomes exibidos ("e mais N"). */
    extraCount: number
  }>()

  const { t } = useI18n()

  // A frase cita no máximo 2 nomes; o resto (inclusive o 3º avatar) vira "mais N".
  const text = computed(() => {
    const [first, second] = props.people
    const total = props.people.length + props.extraCount
    if (!first) {
      return ''
    }
    if (total === 1 || !second) {
      return t('profile.public.mutualFollowers.one', { a: first.name })
    }
    if (total === 2) {
      return t('profile.public.mutualFollowers.two', { a: first.name, b: second.name })
    }
    return t('profile.public.mutualFollowers.many', { a: first.name, b: second.name, count: total - 2 })
  })
</script>

<template>
  <div v-if="people.length > 0" class="mutual-followers" data-testid="public-profile-mutual-followers">
    <AvatarStack :max="3" :people="people" :size="28" />
    <span class="mutual-followers__text" data-testid="public-profile-mutual-followers-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.mutual-followers {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.mutual-followers__text {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-light);
}
</style>
