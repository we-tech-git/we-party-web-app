<script setup lang="ts">
/**
 * Painel que expande abaixo do card do feed.
 *
 * É a "casca" compartilhada pelos painéis inline (comentários, interesses):
 * animação de abrir por `grid-template-rows` e a caixa branca com borda e
 * sombra. Ficava duplicada em cada painel, então os dois divergiam com o tempo.
 *
 * O conteúdo — cabeçalho, corpo, ações — fica com quem usa, via slot.
 */
  defineProps<{
    visible: boolean
  }>()
</script>

<template>
  <div class="inline-panel" :class="{ expanded: visible }">
    <div class="inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.inline-panel {
  display: grid;
  /* 0fr → 1fr anima a altura sem precisar saber o tamanho do conteúdo. */
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.inline-panel.expanded {
  grid-template-rows: 1fr;
  margin-top: 0.85rem;
}

.inner {
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.inline-panel.expanded .inner {
  opacity: 1;
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 10px 28px rgba(20, 20, 40, 0.1);
}
</style>
