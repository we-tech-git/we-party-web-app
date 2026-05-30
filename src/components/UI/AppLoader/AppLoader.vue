<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      size?: 'sm' | 'md' | 'lg'
      variant?: 'spinner' | 'text' | 'overlay'
      text?: string
    }>(),
    {
      size: 'md',
      variant: 'spinner',
      text: undefined,
    },
  )

  const spinnerSize = computed(() => ({
    'size-4': props.size === 'sm',
    'size-8': props.size === 'md',
    'size-12': props.size === 'lg',
  }))

  const inlineSize = computed(() => ({
    'size-3': props.size === 'sm',
    'size-4': props.size === 'md',
    'size-5': props.size === 'lg',
  }))

  const textSize = computed(() => ({
    'text-xs': props.size === 'sm',
    'text-sm': props.size === 'md',
    'text-base': props.size === 'lg',
  }))
</script>

<template>
  <!-- variant: overlay — cobre o container pai (position: relative) com fundo semi-transparente -->
  <div
    v-if="variant === 'overlay'"
    :aria-label="text ?? 'Carregando...'"
    aria-live="polite"
    class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm dark:bg-black/60"
    role="status"
  >
    <svg
      aria-hidden="true"
      :class="['animate-spin text-brand-500', spinnerSize]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        class="opacity-90"
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="3"
      />
    </svg>
    <span
      v-if="text"
      :class="['font-medium text-gray-600 dark:text-gray-300', textSize]"
    >
      {{ text }}
    </span>
  </div>

  <!-- variant: text — spinner + texto inline; herda a cor do elemento pai (ideal dentro de botões) -->
  <span
    v-else-if="variant === 'text'"
    :aria-label="text ?? 'Carregando...'"
    aria-live="polite"
    :class="['inline-flex items-center gap-1.5 font-medium text-current', textSize]"
    role="status"
  >
    <svg
      aria-hidden="true"
      :class="['shrink-0 animate-spin text-current', inlineSize]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        class="opacity-90"
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="3"
      />
    </svg>
    <span>{{ text ?? 'Carregando...' }}</span>
  </span>

  <!-- variant: spinner — spinner circular isolado com cor brand (padrão para seções) -->
  <span
    v-else
    :aria-label="text ?? 'Carregando...'"
    aria-live="polite"
    :class="['inline-flex flex-col items-center justify-center text-brand-500', text ? 'gap-2' : '']"
    role="status"
  >
    <svg
      aria-hidden="true"
      :class="['animate-spin text-current', spinnerSize]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
      />
      <path
        class="opacity-90"
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="3"
      />
    </svg>
    <span
      v-if="text"
      :class="['text-gray-500 dark:text-gray-400', textSize]"
    >
      {{ text }}
    </span>
  </span>
</template>
