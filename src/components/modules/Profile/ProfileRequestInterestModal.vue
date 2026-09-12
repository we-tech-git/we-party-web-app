<script setup lang="ts">
  // Extraído de Profile.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 3ª fatia da
  // decomposição do mega-arquivo. Modal de "solicitar novo interesse" —
  // aberto a partir do modal de Gerenciar Interesses (ProfileInterestsModal)
  // quando a busca não encontra nada.
  //
  // Mesmo padrão das fatias anteriores: estado e chamada de API continuam
  // no pai (`newInterestName`/`pendingInterests`/`isSubmittingRequest` +
  // `openRequestModal`/`submitNewInterestRequest`), este componente só
  // renderiza e emite. `name` segue convenção `update:name` (mesmo padrão
  // `modelValue` do resto do design system, nomeado pra ficar claro no
  // template do pai).
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'

  const props = defineProps<{
    visible: boolean
    name: string
    pending: string[]
    submitting: boolean
  }>()

  const emit = defineEmits<{
    'update:name': [value: string]
    'add-pending': []
    'remove-pending': [index: number]
    'submit': []
    'close': []
  }>()

  const { t } = useI18n()

  const nameModel = computed({
    get: () => props.name,
    set: (value: string) => emit('update:name', value),
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="request-modal-container">
          <div class="request-modal-header">
            <h2>{{ t('profile.requestInterestModal.title') }}</h2>
            <button class="modal-close" @click="emit('close')">
              <i class="mdi mdi-close" />
            </button>
          </div>

          <div class="request-modal-body">
            <p class="request-description">
              {{ t('profile.requestInterestModal.description') }}
            </p>

            <div class="input-wrapper">
              <label class="input-label" for="newInterest">{{ t('profile.requestInterestModal.label') }}</label>
              <div class="input-group">
                <input
                  id="newInterest"
                  v-model="nameModel"
                  class="request-input"
                  :placeholder="t('profile.requestInterestModal.placeholder')"
                  type="text"
                  @keyup.enter="emit('add-pending')"
                >
                <button class="add-pending-btn" type="button" @click="emit('add-pending')">
                  <i class="mdi mdi-plus" />
                </button>
              </div>
            </div>

            <div v-if="pending.length > 0" class="pending-list">
              <span v-for="(item, index) in pending" :key="index" class="pending-chip">
                {{ item }}
                <button class="remove-pending-btn" type="button" @click="emit('remove-pending', index)">
                  <i class="mdi mdi-close" />
                </button>
              </span>
            </div>
          </div>

          <div class="request-modal-footer">
            <button class="btn-cancel" @click="emit('close')">
              {{ t('profile.requestInterestModal.cancel') }}
            </button>
            <button
              class="btn-submit"
              :disabled="(pending.length === 0 && !name.trim()) || submitting"
              @click="emit('submit')"
            >
              <i v-if="submitting" class="mdi mdi-loading mdi-spin" />
              {{ submitting ? t('profile.requestInterestModal.submitting') :
                t('profile.requestInterestModal.submit') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Duplicado de Profile.vue — esqueleto genérico de modal (ver comentário
   em ProfileFollowListModal.vue). */
.modal-overlay {
  --color-primary: #ff5fa6;
  --color-text-primary: #1a1c2e;
  --color-text-secondary: #555b77;
  --color-border: rgba(0, 0, 0, 0.04);
  --color-border-strong: #e0e2ed;
  --shadow-primary: 0 4px 16px rgba(255, 95, 166, 0.25);

  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #555b77;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1c2e;
}

.modal-enter-active {
  transition: all 0.15s ease-out;
}

.modal-leave-active {
  transition: all 0.1s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Igual ProfileInterestsModal.vue: a raiz deste modal é
   `.request-modal-container`, não `.modal-container` — o original nunca
   teve a variante de transição com scale/translateY pra ele, só o fade
   acima. Preservado assim de propósito. */

/* Botão compartilhado com outros modais (ver achado em
   ProfileInterestsModal.vue) — esta é a versão "correta" para este
   modal. */
.btn-cancel {
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  color: #6c7080;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.2);
}

.btn-cancel:active {
  transform: scale(0.98);
}

/* Exclusivo deste modal. */
.request-modal-container {
  background: white;
  border-radius: 20px;
  width: min(480px, 90vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.request-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.request-modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #1a1c2e;
  font-weight: 700;
}

.request-modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.request-description {
  color: #555b77;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.input-wrapper {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1c2e;
  margin-bottom: 0.5rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.request-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'Baloo Thambi 2', sans-serif;
  transition: all 0.2s;
}

.request-input:focus {
  outline: none;
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
}

.add-pending-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.add-pending-btn:hover {
  transform: scale(1.05);
}

.pending-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pending-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(255, 154, 77, 0.1), rgba(255, 95, 143, 0.1));
  border-radius: 20px;
  font-size: 0.9rem;
  color: #1a1c2e;
  font-weight: 500;
}

.remove-pending-btn {
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  padding: 0;
  transition: all 0.2s;
}

.remove-pending-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.request-modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  font-family: 'Baloo Thambi 2', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.3);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Duplicado de Profile.vue — usado pelo ícone de loading do botão
   "Enviar" (achado retroativo, ver comentário em
   ProfileEditModal.vue). */
.mdi-spin {
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

/* Duplicado de Profile.vue — regra global de acessibilidade (achado
   retroativo, ver ProfileFollowListModal.vue). */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
