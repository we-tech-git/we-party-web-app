<script setup lang="ts">
/**
 * SelectableChip Component
 *
 * Este componente renderiza um botão de "chip" ou "tag" que pode ser selecionado.
 * Ele é utilizado para exibir categorias, interesses ou filtros que o usuário pode ativar/desativar.
 *
 * Props:
 * - label: O texto a ser exibido no chip.
 * - isSelected: Booleano que define se o chip está no estado selecionado (ativo) ou não.
 *
 * Emits:
 * - toggle: Evento disparado quando o usuário clica no chip.
 */
  defineProps<{
    label: string
    isSelected: boolean
  }>()

  defineEmits<{
    (e: 'toggle'): void
  }>()
</script>

<template>
  <button :class="['category-chip', { 'selected': isSelected }]" type="button" @click="$emit('toggle')">
    {{ label }}
  </button>
</template>

<style scoped>
.category-chip {
    height: 40px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1.5px solid #FF8CB5;
    color: #1F2937;
    background: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 0 rgba(0, 0, 0, .05);
}

.category-chip:hover {
    transform: translateY(-1px);
}

.category-chip.selected {
    background: linear-gradient(90deg, #FFC25B, #FF5FA6);
    background-size: 100% 100%;
    color: #fff;
    border: 1.5px solid transparent;
    box-shadow: 0 10px 20px rgba(255, 95, 166, .2);
}
</style>
