<script setup lang="ts">
/**
 * Diálogo de denúncia genérico — evento, comentário de evento ou comentário
 * de interesse usam o mesmo esqueleto (motivo em texto livre, opcional).
 * Extraído do modal que já existia só em `InlineComments.vue` (Fase de
 * denúncia de comentário de interesse) ao aparecer a 2ª necessidade —
 * denunciar evento — ver critério de reuso em docs/DESIGN_SYSTEM.md.
 *
 * A chamada de API (que varia o `ReportType` e o alvo) fica com quem abre
 * o diálogo; este componente só coleta o motivo e emite `submit`.
 */
  import { ref, watch } from 'vue'

  const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    submitting?: boolean
    submitLabel?: string
    cancelLabel?: string
  }>(), {
    title: 'Reportar',
    subtitle: 'Conte o que há de errado (opcional) — a equipe vai revisar.',
    submitting: false,
    submitLabel: 'Denunciar',
    cancelLabel: 'Cancelar',
  })

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'submit': [reason: string]
    'cancel': []
  }>()

  const reason = ref('')

  // Cada abertura nasce com o campo limpo — evita reenviar por engano o
  // motivo de uma denúncia anterior (diálogo é reaproveitado entre alvos).
  watch(() => props.modelValue, open => {
    if (open) reason.value = ''
  })

  function close () {
    if (props.submitting) return
    emit('cancel')
    emit('update:modelValue', false)
  }

  function submit () {
    if (props.submitting) return
    emit('submit', reason.value.trim())
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="report-dialog-fade">
      <div
        v-if="modelValue"
        aria-modal="true"
        class="report-overlay"
        role="dialog"
        @click.self="close"
      >
        <div class="report-box">
          <h3 class="report-title">{{ title }}</h3>
          <p class="report-subtitle">{{ subtitle }}</p>
          <textarea
            v-model="reason"
            class="report-textarea"
            data-testid="report-dialog-textarea"
            maxlength="500"
            placeholder="Motivo (opcional)"
            rows="3"
          />
          <div class="report-actions">
            <button
              class="report-btn report-btn--ghost"
              data-testid="report-dialog-cancel"
              :disabled="submitting"
              type="button"
              @click="close"
            >
              {{ cancelLabel }}
            </button>
            <button
              class="report-btn report-btn--primary"
              data-testid="report-dialog-submit"
              :disabled="submitting"
              type="button"
              @click="submit"
            >
              {{ submitting ? 'Enviando…' : submitLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.report-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.62);
  backdrop-filter: blur(4px);
}

.report-box {
  width: min(92vw, 380px);
  padding: 1.5rem;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 60px -20px rgba(17, 24, 39, 0.45);
}

.report-title {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1f2437;
}

.report-subtitle {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  line-height: 1.4;
  color: #6b7194;
}

.report-textarea {
  width: 100%;
  border: 1.5px solid #e4e6ef;
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  font-size: 0.87rem;
  color: #1a1a1a;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.report-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 95, 143, 0.14);
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;
}

.report-btn {
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: filter 0.18s ease, transform 0.18s ease;
}

.report-btn:hover:not(:disabled) {
  filter: brightness(0.96);
  transform: translateY(-1px);
}

.report-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.report-btn--ghost {
  background: #eef0f6;
  color: #6b7194;
}

.report-btn--primary {
  background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
  color: #fff;
}

.report-dialog-fade-enter-active,
.report-dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.report-dialog-fade-enter-from,
.report-dialog-fade-leave-to {
  opacity: 0;
}
</style>
