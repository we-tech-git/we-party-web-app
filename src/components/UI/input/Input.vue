<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    modelValue: string
    label: string
    type?: string
    id?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
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
  })

  const emit = defineEmits<Emits>()

  const inputId = computed(() => props.id || `input-${Math.random().toString(36).slice(2, 11)}`)

  function updateValue (event: Event) {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', target.value)
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
      :type="type"
      :value="modelValue"
      @input="updateValue"
    >
  </div>
</template>

<style scoped>

</style>
