<script setup lang="ts">
  import { onBeforeUnmount, watch } from 'vue'

  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#ff9800', // Laranja como padrão
    },
    timeout: {
      type: Number,
      default: 5000, // 5 segundos
    },
  })

  const emit = defineEmits(['update:modelValue'])

  let timer: number | undefined

  function close () {
    emit('update:modelValue', false)
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  watch(() => props.modelValue, show => {
    if (show) {
      if (timer) {
        clearTimeout(timer)
      }
      timer = window.setTimeout(() => {
        close()
      }, props.timeout)
      return
    }

    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  })
</script>

<template>
  <Teleport to="body">
    <transition name="snackbar-fade">
      <div v-if="modelValue" class="snackbar-container">
        <div class="snackbar-content" :style="{ backgroundColor: color }">
          <span class="snackbar-message">{{ message }}</span>
          <button aria-label="Fechar" class="close-btn" type="button" @click="close">
            &times;
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.snackbar-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    width: max-content;
    max-width: min(500px, calc(100vw - 2rem));
    padding: 0 1rem;
}

.snackbar-content {
    color: white;
    padding: 14px 20px;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'Baloo Thambi 2', sans-serif;
    font-weight: 500;
}

.snackbar-message {
    /*
     * With the container sized to `max-content`, short messages stay on a
     * single line; only text that would overflow the screen wraps.
     */
    line-height: 1.35;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    margin-left: 16px;
    padding: 0 5px;
    opacity: 0.8;
}

.close-btn:hover {
    opacity: 1;
}

/* Animação de fade e slide */
.snackbar-fade-enter-active,
.snackbar-fade-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.snackbar-fade-enter-from,
.snackbar-fade-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}
</style>
