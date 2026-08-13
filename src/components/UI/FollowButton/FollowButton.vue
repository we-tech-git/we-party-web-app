<script setup lang="ts">
  /**
   * Botão de seguir/deixar de seguir reutilizável.
   *
   * Visual e comportamento extraídos da lista de convites (`/public/AddFriends`):
   * contorno em gradiente com ícone de "adicionar" quando não segue, e preenchido
   * com ícone de check ("seguindo") quando segue. Os textos são configuráveis via
   * props para cada contexto ("Seguir"/"Seguindo", "Enviar"/"Enviado", etc.).
   */
  withDefaults(defineProps<{
    following: boolean
    disabled?: boolean
    label?: string
    followingLabel?: string
  }>(), {
    disabled: false,
    label: 'Seguir',
    followingLabel: 'Seguindo',
  })

  const emit = defineEmits<{
    toggle: []
  }>()
</script>

<template>
  <button
    :class="['follow-btn', following ? 'is-following' : 'is-follow']"
    :disabled="disabled"
    type="button"
    @click="emit('toggle')"
  >
    <svg
      v-if="!following"
      class="follow-icon"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <line
        stroke-linecap="round"
        x1="19"
        x2="19"
        y1="8"
        y2="14"
      />
      <line
        stroke-linecap="round"
        x1="22"
        x2="16"
        y1="11"
        y2="11"
      />
    </svg>
    <svg
      v-else
      class="follow-icon"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    {{ following ? followingLabel : label }}
  </button>
</template>

<style scoped>
.follow-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 1.2rem;
  min-width: 120px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.follow-icon {
  width: 0.95rem;
  height: 0.95rem;
  color: inherit;
  flex-shrink: 0;
}

.follow-btn.is-follow {
  color: #F978A3;
  border: 1.5px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #FFC947 0%, #F978A3 100%) border-box;
}

.follow-btn.is-follow:hover {
  box-shadow: none;
}

.follow-btn.is-following {
  border: none;
  background: linear-gradient(90deg, #FFC947 0%, #F978A3 100%);
  background-size: 100% 100%;
  color: #fff;
  box-shadow: 0 10px 18px rgba(249, 120, 163, 0.25);
}

.follow-btn.is-following:hover {
  box-shadow: 0 12px 22px rgba(249, 120, 163, 0.3);
}

.follow-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .follow-btn {
    min-width: 140px;
    padding: 0.55rem 1.25rem;
  }
}

@media (max-width: 480px) {
  .follow-btn {
    min-width: 120px;
    padding: 0.5rem 1.1rem;
    font-size: 0.82rem;
  }
}
</style>
