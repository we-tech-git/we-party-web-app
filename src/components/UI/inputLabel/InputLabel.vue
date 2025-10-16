<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { type StrokeLinecap, type StrokeLinejoin, svgIcons } from '@/utils/svgSet'

  interface Props {
    modelValue: string
    label: string
    type?: string
    id?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    inputPassword?: boolean
    error?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: string): void
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    id: '',
    placeholder: '',
    required: false,
    disabled: false,
    inputPassword: false,
    error: false,
  })

  const emit = defineEmits<Emits>()

  const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 11)}`)
  const showPassword = ref(false)

  const inputType = computed(() => {
    if (props.inputPassword) {
      return showPassword.value ? 'text' : 'password'
    }
    return props.type
  })

  function updateValue (event: Event) {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', target.value)
  }

  function togglePassword () {
    showPassword.value = !showPassword.value
  }
</script>

<template>
  <div class="input-wrapper">
    <label :class="{ 'active': modelValue, 'has-error': error }" :for="inputId">
      {{ label }}
    </label>
    <input
      :id="inputId"
      class="input-field"
      :class="{ 'filled': modelValue, 'has-error': error }"
      :disabled="disabled"
      :placeholder="placeholder"
      :required="required"
      :type="inputType"
      :value="modelValue"
      @input="updateValue"
    >
    <button v-if="inputPassword" class="eye-button" type="button" @click="togglePassword">
      <svg
        v-if="!showPassword"
        class="eye-icon"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" />
        <path
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg
        v-else
        class="eye-icon"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        :viewBox="svgIcons.eyeClosed ? svgIcons.eyeClosed.viewBox : '0 0 24 24'"
      >
        <path
          v-for="(path, index) in (svgIcons.eyeClosed ? svgIcons.eyeClosed.paths : [{ d: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21', strokeLinecap: 'round', strokeLinejoin: 'round' }])"
          :key="index"
          :d="path.d"
          :stroke-linecap="path.strokeLinecap as StrokeLinecap"
          :stroke-linejoin="path.strokeLinejoin as StrokeLinejoin"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* ===============================
   TEMA E VARIÁVEIS
   - Use var(--il-*) com fallback para permitir customizar cores por tela
================================ */

/* ===============================
   WRAPPER DO INPUT E LABEL (floating label)
================================ */
.input-wrapper {
  position: relative;
}

.input-wrapper label {
  position: absolute;
  top: 18px;
  /* posição inicial dentro do input */
  left: 16px;
  color: #9ca3af;
  /* cinza claro padrão do label */
  pointer-events: none;
  transition: all 0.2s ease;
  font-size: 1rem;
}

/* Label quando o input tem valor (ou está focado) */
.input-wrapper label.active {
  top: 8px;
  /* sobe o label */
  font-size: 0.75rem;
  /* diminui o label */
  color: var(--il-label-active, #FFB37B);
}

.input-wrapper label.has-error {
  color: var(--il-border-error, #ef4444);
}

/* ===============================
   CAMPO: ESTADO BASE
================================ */
.input-field {
  width: 100%;
  padding: 24px 16px 8px 16px;
  /* espaço para o label flutuante */
  background-color: #FFFFFF;
  border: 1px solid var(--il-border-neutral, #F0F0F0);
  border-radius: 12px;
  color: var(--il-text, #072961);
  transition: all 0.2s ease-in-out;
  font-size: 1rem;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.04);
  /* leve elevação */
}

/* CAMPO: quando preenchido */
.input-field.filled {
  border-color: var(--il-border-filled, #FFD3B5);
  color: #212121;
  font-weight: 500;
}

/* ===============================
   CAMPO: FOCO
================================ */
.input-field:focus {
  outline: none;
  border-color: var(--il-border-focus, #f97316);
  background-color: #fff;
  box-shadow: 0 0 0 2px var(--il-focus-halo, rgba(249, 115, 22, 0.2));
}

.input-field:focus+label {
  top: 8px;
  font-size: 0.75rem;
  color: var(--il-border-focus, #f97316);
}

.input-field.has-error {
  border-color: var(--il-border-error, #ef4444);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2);
}

.input-field.has-error:focus {
  border-color: var(--il-border-error, #ef4444);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

/* ===============================
   CORREÇÃO DE AUTOFILL (WEBKIT)
================================ */
input.input-field:-webkit-autofill,
input.input-field:-webkit-autofill:hover,
input.input-field:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--il-text, #072961);
  -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset;
  box-shadow: 0 0 0px 1000px #FFFFFF inset;
  border: 1px solid var(--il-border-filled, #FFD3B5) !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* ===============================
   BOTÃO DE OLHO (mostrar/ocultar senha)
================================ */
.eye-button {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
}

.eye-icon {
  width: 24px;
  height: 24px;
}
</style>
