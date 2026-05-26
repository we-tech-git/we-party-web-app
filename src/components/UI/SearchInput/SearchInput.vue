<!--
  Componente: SearchInput.vue
  Descrição: Input de busca padronizado para uso em todo o sistema.

  Props:
  - modelValue: string - valor do input (v-model)
  - placeholder: string - texto do placeholder
  - loading: boolean - exibe indicador de carregamento
  - clearable: boolean - exibe botão de limpar (padrão: true)
  - debounce: number - tempo de debounce em ms (padrão: 500)
  - disabled: boolean - desabilita o input
  - size: 'small' | 'medium' | 'large' - tamanho do input (padrão: 'medium')

  Emits:
  - update:modelValue: atualização do valor
  - search: disparado após debounce com o valor atual
  - clear: disparado ao limpar o campo

  Autor: we-tech-git
  Data: 23/05/2026
-->
<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'

  interface Props {
    modelValue?: string
    placeholder?: string
    loading?: boolean
    clearable?: boolean
    debounce?: number
    disabled?: boolean
    size?: 'small' | 'medium' | 'large'
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: 'Buscar...',
    loading: false,
    clearable: true,
    debounce: 500,
    disabled: false,
    size: 'medium',
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string]
    'search': [value: string]
    'clear': []
  }>()

  // Ref do input para autofocus se necessário
  const inputRef = ref<HTMLInputElement | null>(null)

  // Timeout do debounce
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null

  // Valor interno para controle
  const internalValue = computed({
    get: () => props.modelValue,
    set: (value: string) => emit('update:modelValue', value),
  })

  // Classes computadas baseadas no tamanho
  const sizeClasses = computed(() => {
    return {
      'search-input--small': props.size === 'small',
      'search-input--medium': props.size === 'medium',
      'search-input--large': props.size === 'large',
    }
  })

  // Mostra botão de limpar quando há texto e clearable é true
  const showClearButton = computed(() => {
    return props.clearable && internalValue.value.length > 0 && !props.loading
  })

  // Watch para debounce da busca
  watch(internalValue, newValue => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    debounceTimeout = setTimeout(() => {
      emit('search', newValue)
    }, props.debounce)
  })

  // Limpa o campo
  function handleClear () {
    internalValue.value = ''
    emit('clear')
    inputRef.value?.focus()
  }

  // Handler para tecla Enter (busca imediata)
  function handleKeydown (event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
      emit('search', internalValue.value)
    }
  }

  // Cleanup do timeout
  onBeforeUnmount(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
  })

  // Expõe método de focus para uso externo
  defineExpose({
    focus: () => inputRef.value?.focus(),
    blur: () => inputRef.value?.blur(),
  })
</script>

<template>
  <div class="search-input-container" :class="[sizeClasses, { 'search-input--disabled': disabled }]">
    <!-- Ícone de busca -->
    <span aria-hidden="true" class="search-input-icon">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15z"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    <!-- Input -->
    <input
      ref="inputRef"
      v-model="internalValue"
      class="search-input-field"
      :disabled="disabled"
      :placeholder="placeholder"
      type="text"
      @keydown="handleKeydown"
    >

    <!-- Loading indicator -->
    <span v-if="loading" aria-label="Carregando..." class="search-input-loading">
      <svg class="search-loading-spinner" fill="none" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-dasharray="31.4 31.4"
          stroke-linecap="round"
          stroke-width="3"
        />
      </svg>
    </span>

    <!-- Botão de limpar -->
    <button
      v-else-if="showClearButton"
      aria-label="Limpar busca"
      class="search-input-clear"
      type="button"
      @click="handleClear"
    >
      <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Container principal */
.search-input-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    color: #374151;
}

/* Ícone de busca */
.search-input-icon {
    position: absolute;
    left: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: #4b5563 !important;
    transition: color 0.2s ease;
    z-index: 2;
}

.search-input-icon svg {
    width: 1.25rem;
    height: 1.25rem;
    stroke-width: 2.5;
}

/* Input field
   Usa "input.search-input-field" para atingir especificidade (0,2,1) e garantir
   que supere o seletor do dark-mode em shared-styles.css, que também é (0,2,1).
   Como o CSS scoped do componente é injetado depois do CSS global, ganha no empate. */
input.search-input-field {
    width: 100%;
    padding: 0.75rem 2.75rem 0.75rem 2.75rem;
    border: 2px solid #d1d5e0;
    border-radius: 12px;
    font-size: 0.9rem;
    font-family: inherit;
    color: #1a1c2e !important;
    -webkit-text-fill-color: #1a1c2e !important;
    background-color: #ffffff !important;
    opacity: 1;
    outline: none;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

input.search-input-field::placeholder {
    color: #6b7280 !important;
    -webkit-text-fill-color: #6b7280 !important;
    font-weight: 400;
    opacity: 1 !important;
}

.search-input-field:hover:not(:disabled) {
    border-color: #cfd2e0;
    background-color: #fff !important;
}

.search-input-field:focus {
    border-color: #ff5fa6;
    background-color: #fff !important;
    box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
}

/* Focus state - muda cor do ícone */
.search-input-container:focus-within .search-input-icon {
    color: #ff5fa6;
}

/* Loading indicator */
.search-input-loading {
    position: absolute;
    right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff5fa6 !important;
    z-index: 2;
}

.search-loading-spinner {
    width: 1.25rem;
    height: 1.25rem;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Botão de limpar */
.search-input-clear {
    position: absolute;
    right: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.06);
    color: #6b7280 !important;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 2;
}

.search-input-clear:hover {
    background: rgba(255, 95, 166, 0.12);
    color: #ff5fa6;
}

.search-input-clear:active {
    transform: scale(0.95);
}

.search-input-clear svg {
    width: 0.875rem;
    height: 0.875rem;
}

/* ================================
   VARIAÇÕES DE TAMANHO
================================ */

/* Small */
.search-input--small .search-input-icon {
    left: 0.75rem;
}

.search-input--small .search-input-icon svg {
    width: 1rem;
    height: 1rem;
}

.search-input--small .search-input-field {
    padding: 0.5rem 2.25rem 0.5rem 2.25rem;
    font-size: 0.8rem;
    border-radius: 10px;
}

.search-input--small .search-input-clear {
    right: 0.375rem;
    width: 1.5rem;
    height: 1.5rem;
}

.search-input--small .search-input-clear svg {
    width: 0.75rem;
    height: 0.75rem;
}

/* Large */
.search-input--large .search-input-icon {
    left: 1.25rem;
}

.search-input--large .search-input-icon svg {
    width: 1.35rem;
    height: 1.35rem;
    stroke-width: 2.5;
}

.search-input--large .search-input-field {
    padding: 1rem 3.25rem 1rem 3.5rem;
    font-size: 1rem;
    border-radius: 16px;
    border-width: 2px;
}

.search-input--large .search-input-clear {
    right: 0.75rem;
    width: 2rem;
    height: 2rem;
}

.search-input--large .search-input-clear svg {
    width: 1rem;
    height: 1rem;
}

/* ================================
   ESTADO DESABILITADO
================================ */
.search-input--disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.search-input--disabled .search-input-field {
    cursor: not-allowed;
    background-color: #f0f1f5 !important;
}

/* ================================
   DARK MODE SUPPORT
   O app não possui tema escuro. Mantemos a aparência light mesmo
   quando o SO está em modo escuro, para evitar texto claro em fundo claro.
================================ */
@media (prefers-color-scheme: dark) {
    input.search-input-field {
        background-color: #ffffff !important;
        color: #1a1c2e !important;
        -webkit-text-fill-color: #1a1c2e !important;
        border-color: #d1d5e0;
    }

    input.search-input-field::placeholder {
        color: #6b7280 !important;
        -webkit-text-fill-color: #6b7280 !important;
        opacity: 1 !important;
    }

    .search-input-clear:hover {
        background: rgba(255, 95, 166, 0.2);
        color: #ff5fa6;
    }
}
</style>
