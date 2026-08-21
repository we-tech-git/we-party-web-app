<script setup lang="ts">
/**
 * SelectableChip — tag de interesse padrão do produto.
 *
 * O visual é o do fluxo de cadastro (`modules/interest/Interest.vue`), que é a
 * referência: contorno rosa quando não selecionado, gradiente preenchido quando
 * selecionado. Qualquer lista de interesses (feed, perfil, cadastro) deve usar
 * este componente em vez de recriar o chip.
 *
 * O clique **alterna**: chip em contorno (+) adiciona, chip preenchido (✓, que
 * vira × no hover) remove. Quem consome decide o que cada lado significa.
 *
 * Estados:
 * - `isSelected` — o usuário já tem esse interesse (preenchido).
 * - `loading` — ação em andamento; bloqueia o clique e mostra spinner.
 * - `readonly` — apenas exibição, sem interação (ex.: listar tags de um evento
 *   para quem não está logado).
 */
  withDefaults(defineProps<{
    label: string
    isSelected: boolean
    loading?: boolean
    disabled?: boolean
    readonly?: boolean
  }>(), {
    loading: false,
    disabled: false,
    readonly: false,
  })

  const emit = defineEmits<{
    (e: 'toggle'): void
  }>()
</script>

<template>
  <component
    :is="readonly ? 'span' : 'button'"
    :aria-pressed="readonly ? undefined : isSelected"
    :class="['category-chip', { selected: isSelected, 'is-readonly': readonly, 'is-loading': loading }]"
    :disabled="readonly ? undefined : (disabled || loading)"
    :title="label"
    :type="readonly ? undefined : 'button'"
    @click="!readonly && !disabled && !loading && emit('toggle')"
  >
    <i v-if="loading" aria-hidden="true" class="mdi mdi-loading mdi-spin chip-icon" />
    <template v-else-if="!readonly">
      <!-- Selecionado: check por padrão, × no hover para sinalizar que clicar remove. -->
      <i v-if="isSelected" aria-hidden="true" class="mdi mdi-check chip-icon chip-icon--idle" />
      <i v-if="isSelected" aria-hidden="true" class="mdi mdi-close chip-icon chip-icon--hover" />
      <i v-else aria-hidden="true" class="mdi mdi-plus chip-icon" />
    </template>
    {{ label }}
  </component>
</template>

<style scoped>
/* Medidas e cores espelham `.chip` de modules/interest/Interest.vue. */
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
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  box-shadow: 0 2px 0 rgba(0, 0, 0, .05);
}

.category-chip:hover:not(:disabled):not(.is-readonly) {
  transform: translateY(-1px);
}

.category-chip.selected {
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  background-size: 100% 100%;
  color: #fff;
  border: 1.5px solid transparent;
  box-shadow: 0 10px 20px rgba(255, 95, 166, .2);
}

.category-chip:disabled {
  opacity: 0.6;
  cursor: default;
}

/* Somente leitura: mantém o visual, remove a affordance de clique. */
.category-chip.is-readonly {
  cursor: default;
}

.chip-icon {
  font-size: 0.95rem;
  line-height: 1;
}

/* Chip selecionado: check por padrão, × no hover/foco para sinalizar que clicar
   remove. Os dois ícones são da mesma fonte e largura, então a troca não muda a
   largura do chip. */
.chip-icon--hover {
  display: none;
}

.category-chip:hover:not(:disabled):not(.is-readonly) .chip-icon--idle,
.category-chip:focus-visible:not(:disabled):not(.is-readonly) .chip-icon--idle {
  display: none;
}

.category-chip:hover:not(:disabled):not(.is-readonly) .chip-icon--hover,
.category-chip:focus-visible:not(:disabled):not(.is-readonly) .chip-icon--hover {
  display: inline-block;
}
</style>
