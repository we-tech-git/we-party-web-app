<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(defineProps<{
    modelValue: boolean
    document: 'terms' | 'privacy'
    /** Exibe o botão "Aceitar e continuar" (fluxo de cadastro). */
    showAcceptButton?: boolean
  }>(), {
    showAcceptButton: false,
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'accept': []
    'close': []
  }>()

  const title = computed(() => props.document === 'terms' ? 'Termos de Uso' : 'Política de Privacidade')
  const pdfSrc = computed(() => props.document === 'terms' ? '/termos-de-uso.pdf' : '/politica-de-privacidade.pdf')

  function close () {
    emit('update:modelValue', false)
    emit('close')
  }

  function accept () {
    emit('accept')
    emit('update:modelValue', false)
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="terms-privacy-modal-fade">
      <div v-if="modelValue" class="terms-privacy-overlay" @click.self="close">
        <div class="terms-privacy-modal">
          <div class="terms-privacy-header">
            <h3 class="terms-privacy-title">{{ title }}</h3>
            <button
              aria-label="Fechar"
              class="terms-privacy-close"
              data-testid="terms-privacy-modal-close"
              type="button"
              @click="close"
            >
              <svg
                fill="none"
                height="18"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="18"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="terms-privacy-body">
            <iframe
              class="terms-privacy-pdf-viewer"
              :src="pdfSrc"
              title="Documento legal"
            />
          </div>
          <div class="terms-privacy-footer">
            <button
              v-if="showAcceptButton"
              class="terms-privacy-btn terms-privacy-btn--accept"
              data-testid="terms-privacy-modal-accept"
              type="button"
              @click="accept"
            >
              ✓ Aceitar e continuar
            </button>
            <button
              class="terms-privacy-btn terms-privacy-btn--secondary"
              data-testid="terms-privacy-modal-close-btn"
              type="button"
              @click="close"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.terms-privacy-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.terms-privacy-modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.terms-privacy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.terms-privacy-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.terms-privacy-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terms-privacy-close:hover {
  background: #fee2e2;
  color: #ef4444;
}

.terms-privacy-body {
  flex: 1;
  overflow: hidden;
}

.terms-privacy-pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border: none;
}

.terms-privacy-footer {
  display: flex;
  gap: 10px;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  justify-content: flex-end;
}

.terms-privacy-btn {
  padding: 0.55rem 1.4rem;
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terms-privacy-btn--accept {
  border: none;
  background: linear-gradient(135deg, #ff5f8f 0%, #f97316 100%);
  color: #fff;
  font-weight: 700;
}

.terms-privacy-btn--accept:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(249, 120, 163, 0.4);
}

.terms-privacy-btn--secondary {
  border: 2px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #666;
}

.terms-privacy-btn--secondary:hover {
  border-color: #f978a3;
  color: #f978a3;
  transform: translateY(-1px);
}

.terms-privacy-modal-fade-enter-active,
.terms-privacy-modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.terms-privacy-modal-fade-enter-from,
.terms-privacy-modal-fade-leave-to {
  opacity: 0;
}
</style>
