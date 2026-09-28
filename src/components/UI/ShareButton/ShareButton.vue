<script setup lang="ts">
  /**
   * Botão redondo (ícone) de compartilhar. Extraído do Profile e do
   * PublicProfile, que tinham dois `.share-btn` quase iguais com hover
   * diferente (2ª ocorrência — ver critério em docs/DESIGN_SYSTEM.md).
   * Só emite o clique: quem abre o ShareSheet é a tela.
   */
  defineProps<{
    /** Texto acessível e tooltip — o botão só tem ícone. */
    label: string
  }>()

  const emit = defineEmits<{
    click: []
  }>()
</script>

<template>
  <button
    :aria-label="label"
    class="share-button"
    data-testid="share-button"
    :title="label"
    type="button"
    @click="emit('click')"
  >
    <i aria-hidden="true" class="mdi mdi-share-variant-outline" />
  </button>
</template>

<style scoped>
.share-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 1.5px solid color-mix(in srgb, var(--color-text-muted) 45%, transparent);
  border-radius: 50%;
  background: var(--color-light);
  color: var(--color-text-light);
  font-size: 1.1rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.share-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.share-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
