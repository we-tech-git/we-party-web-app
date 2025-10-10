<script setup lang="ts">
  import { computed, ref } from 'vue'

  interface Props {
    modelValue: string
    label: string
    type?: string
    id?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    inputPassword?: boolean
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
    <label
      :class="{ 'active': modelValue }"
      :for="inputId"
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      class="input-field"
      :class="{ 'filled': modelValue }"
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
      ><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <svg
        v-else
        class="eye-icon"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      ><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
  </div>
</template>

<style scoped>
.input-wrapper {
  position: relative;
}

.input-wrapper label {
  position: absolute;
  top: 18px;
  left: 16px;
  color: #9ca3af;
  pointer-events: none;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.input-wrapper label.active {
  top: 8px;
  font-size: 0.75rem;
  color: #9ca3af;
}

.input-field {
  width: 100%;
  padding: 24px 16px 8px 16px;
  background-color: #FFFFFF;
  border: 1px solid #F0F0F0;
  border-radius: 12px;
  color: #072961;
  transition: all 0.2s ease-in-out;
  font-size: 1rem;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.04);
}

.input-field.filled {
  border-color: #FFD3B5;
  color: #212121;
  font-weight: 500;
}

.input-field.filled+label,
.input-wrapper label.active {
  color: #FFB37B;
}

.input-field:focus {
  outline: none;
  border-color: #f97316;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
}

.input-field:focus+label {
  top: 8px;
  font-size: 0.75rem;
  color: #f97316;
}

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
