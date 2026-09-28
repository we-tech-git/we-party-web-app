<script setup lang="ts">
  /**
   * Avatares sobrepostos ("cluster") — prova social de quem já está lá.
   * Extraído do hero de Interesse quando o perfil de terceiro passou a
   * precisar do mesmo padrão (2ª ocorrência — ver critério em
   * docs/DESIGN_SYSTEM.md). É decorativo: o texto ao lado é quem informa,
   * por isso fica `aria-hidden`.
   *
   * O anel em volta de cada avatar deve ter a cor do fundo onde o cluster
   * está — configurável via a variável CSS `--avatar-stack-ring`
   * (padrão branco), sem prop pra não amarrar o componente a um tema.
   */
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'

  withDefaults(defineProps<{
    people: { id: string | number, name: string, profileImage?: string | null }[]
    size?: number
    /** Máximo de avatares exibidos. */
    max?: number
  }>(), {
    size: 32,
    max: 3,
  })
</script>

<template>
  <div v-if="people.length > 0" aria-hidden="true" class="avatar-stack" data-testid="avatar-stack">
    <UserAvatar
      v-for="person in people.slice(0, max)"
      :key="person.id"
      class="avatar-stack__item"
      :image="person.profileImage"
      :name="person.name"
      :size="size"
    />
  </div>
</template>

<style scoped>
.avatar-stack {
  display: flex;
}

.avatar-stack__item {
  border: 2px solid var(--avatar-stack-ring, var(--color-light));
  border-radius: 50%;
  margin-left: -9px;
}

.avatar-stack__item:first-child {
  margin-left: 0;
}
</style>
