<script setup lang="ts">
/**
 * Diálogo de confirmação genérico.
 *
 * Criado para o descarte de alterações do perfil, mas sem nada específico
 * daquele contexto — qualquer ação destrutiva/irreversível pode usar.
 * Textos vêm por prop para o chamador controlar o i18n.
 */
  withDefaults(defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmLabel: string
    cancelLabel: string
    /** Pinta o botão de confirmar como ação destrutiva. */
    danger?: boolean
  }>(), {
    danger: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'confirm': []
    'cancel': []
  }>()

  function onCancel () {
    emit('cancel')
    emit('update:modelValue', false)
  }

  function onConfirm () {
    emit('confirm')
    emit('update:modelValue', false)
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <!-- Este diálogo é a última barreira antes de descartar dados, então
           clicar fora NÃO fecha: exige uma escolha explícita. -->
      <div v-if="modelValue" aria-modal="true" class="confirm-overlay" role="dialog">
        <div class="confirm-box">
          <div class="confirm-icon" :class="{ 'is-danger': danger }">
            <i class="mdi" :class="danger ? 'mdi-alert-outline' : 'mdi-help-circle-outline'" />
          </div>

          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>

          <div class="confirm-actions">
            <button class="confirm-btn confirm-btn--ghost" type="button" @click="onCancel">
              {{ cancelLabel }}
            </button>
            <button
              class="confirm-btn"
              :class="danger ? 'confirm-btn--danger' : 'confirm-btn--primary'"
              type="button"
              @click="onConfirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000; /* acima do modal de edição, que é quem o dispara */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.62);
  backdrop-filter: blur(4px);
}

.confirm-box {
  width: min(92vw, 380px);
  padding: 1.75rem;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 60px -20px rgba(17, 24, 39, 0.45);
  text-align: center;
}

.confirm-icon {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: rgba(62, 123, 251, 0.12);
  color: #3e7bfb;
  font-size: 1.6rem;
}

.confirm-icon.is-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.confirm-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1f2437;
}

.confirm-message {
  margin: 0 0 1.4rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #6b7194;
}

.confirm-actions {
  display: flex;
  gap: 0.6rem;
}

.confirm-btn {
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.18s ease, transform 0.18s ease;
}

.confirm-btn:hover {
  filter: brightness(0.96);
  transform: translateY(-1px);
}

.confirm-btn--ghost {
  background: #eef0f6;
  color: #6b7194;
}

.confirm-btn--primary {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: #fff;
}

.confirm-btn--danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
