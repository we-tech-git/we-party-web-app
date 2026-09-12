<script setup lang="ts">
  // Extraído de Profile.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 4ª fatia da
  // decomposição do mega-arquivo. Modal de editar perfil (nome/username/bio
  // + trigger de troca de avatar/capa, que abrem os modais de recorte,
  // ainda não extraídos).
  //
  // `pendingAvatarFile`/`pendingBannerFile`/`discardPendingImages`/
  // `hasUnsavedChanges`/`showDiscardConfirm`/`saveProfile` continuam no pai
  // — são compartilhados com os modais de recorte (ainda não extraídos) e
  // com o `ConfirmDialog` de descarte. `editForm` (nome/username/bio)
  // também fica no pai: os campos aqui viram props + `update:campo`
  // (mesma convenção `modelValue` do resto do design system).
  //
  // Os `<input type="file">` ocultos (avatar/capa) moraram sempre dentro
  // deste modal — diferente das fatias 1-3 (que só passavam adiante
  // eventos simples), aqui o valor emitido carrega o próprio elemento
  // `<input>` (`avatar-selected`/`banner-selected`), porque o pai precisa
  // dele depois pra resetar `input.value` quando o modal de recorte é
  // fechado sem salvar (permite escolher o mesmo arquivo de novo). Emitir
  // o elemento inteiro é mais simples do que replicar esse reset aqui.
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  defineProps<{
    visible: boolean
    name: string
    username: string
    bio: string
    bioMaxLength: number
    displayAvatar: string
    displayBanner: string
    avatarName: string
    saving: boolean
    uploadingAvatar: boolean
    uploadingBanner: boolean
  }>()

  const emit = defineEmits<{
    'update:name': [value: string]
    'update:username': [value: string]
    'update:bio': [value: string]
    'close': []
    'save': []
    'avatar-selected': [dataUrl: string, input: HTMLInputElement]
    'banner-selected': [dataUrl: string, input: HTMLInputElement]
    'upload-error': [message: string]
  }>()

  const { t } = useI18n()

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

  const modalAvatarInputRef = ref<HTMLInputElement | null>(null)
  const modalBannerInputRef = ref<HTMLInputElement | null>(null)

  function triggerModalAvatarUpload () {
    modalAvatarInputRef.value?.click()
  }

  function triggerModalBannerUpload () {
    modalBannerInputRef.value?.click()
  }

  function readAsDataUrl (input: HTMLInputElement, onLoaded: (result: string) => void) {
    const file = input.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE_BYTES) {
      emit('upload-error', t('profile.messages.fileSizeError'))
      input.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      emit('upload-error', t('profile.messages.fileTypeError'))
      input.value = ''
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', e => {
      const result = (e.target as FileReader)?.result as string
      if (result) onLoaded(result)
    })
    reader.readAsDataURL(file)
  }

  function handleAvatarChange (event: Event) {
    const input = event.target as HTMLInputElement
    readAsDataUrl(input, result => emit('avatar-selected', result, input))
  }

  function handleBannerChange (event: Event) {
    const input = event.target as HTMLInputElement
    readAsDataUrl(input, result => emit('banner-selected', result, input))
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ t('profile.editModal.title') }}</h2>
            <button class="modal-close" @click="emit('close')">
              <i class="mdi mdi-close" />
            </button>
          </div>

          <div class="modal-body">
            <!-- Hidden file inputs for modal -->
            <input
              ref="modalBannerInputRef"
              accept="image/*"
              hidden
              type="file"
              @change="handleBannerChange"
            >
            <input
              ref="modalAvatarInputRef"
              accept="image/*"
              hidden
              type="file"
              @change="handleAvatarChange"
            >

            <!-- Avatar edit section -->
            <div class="modal-avatar-section">
              <div
                class="modal-banner"
                :class="{ 'no-banner': !displayBanner }"
                :style="displayBanner ? { backgroundImage: `url(${displayBanner})` } : {}"
              >
                <div class="modal-banner-overlay" />
                <button
                  class="modal-banner-edit"
                  :disabled="uploadingBanner"
                  title="Alterar capa"
                  @click="triggerModalBannerUpload"
                >
                  <i v-if="uploadingBanner" class="mdi mdi-loading mdi-spin" />
                  <i v-else class="mdi mdi-camera-outline" />
                </button>
              </div>
              <div class="modal-avatar-wrapper" @click="triggerModalAvatarUpload">
                <UserAvatar
                  class="modal-avatar-img"
                  :image="displayAvatar"
                  :name="avatarName"
                  :size="72"
                />
                <button
                  class="modal-avatar-edit"
                  :disabled="uploadingAvatar"
                  :title="t('profile.editModal.changeAvatar')"
                >
                  <i v-if="uploadingAvatar" class="mdi mdi-loading mdi-spin" />
                  <i v-else class="mdi mdi-camera-outline" />
                </button>
              </div>
            </div>

            <!-- Form fields -->
            <div class="form-group">
              <label class="form-label" for="edit-name">{{ t('profile.editModal.name') }}</label>
              <input
                id="edit-name"
                class="form-input"
                maxlength="50"
                :placeholder="t('profile.editModal.namePlaceholder')"
                type="text"
                :value="name"
                @input="emit('update:name', ($event.target as HTMLInputElement).value)"
              >
              <span class="char-count">{{ name.length }}/50</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-username">{{ t('profile.editModal.username') }}</label>
              <div class="input-with-prefix">
                <span class="input-prefix">@</span>
                <input
                  id="edit-username"
                  class="form-input with-prefix"
                  maxlength="30"
                  :placeholder="t('profile.editModal.usernamePlaceholder')"
                  type="text"
                  :value="username"
                  @input="emit('update:username', ($event.target as HTMLInputElement).value)"
                >
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-bio">{{ t('profile.editModal.bio') }}</label>
              <textarea
                id="edit-bio"
                class="form-textarea"
                :maxlength="bioMaxLength"
                :placeholder="t('profile.editModal.bioPlaceholder')"
                rows="3"
                :value="bio"
                @input="emit('update:bio', ($event.target as HTMLTextAreaElement).value)"
              />
              <span class="char-count">{{ bio.length }}/{{ bioMaxLength }}</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" :disabled="saving" @click="emit('close')">
              {{ t('profile.editModal.cancel') }}
            </button>
            <button class="btn-save" :disabled="saving" @click="emit('save')">
              <i v-if="saving" class="mdi mdi-loading mdi-spin" />
              {{ saving ? t('profile.editModal.saving') : t('profile.editModal.save') }}
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

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: #1a1c2e;
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

.modal-body {
  padding: 0 1.5rem 1.5rem;
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

.modal-enter-from .modal-container {
  transform: scale(0.97) translateY(8px);
}

.modal-leave-to .modal-container {
  transform: scale(0.98) translateY(4px);
}

/* Exclusivo deste modal. */
.modal-avatar-section {
  position: relative;
  margin-bottom: 2.5rem;
}

.modal-banner {
  height: 120px;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin-top: 1rem;
}

.modal-banner.no-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-banner-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
}

.modal-banner-edit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.modal-banner-edit:hover {
  background: rgba(0, 0, 0, 0.7);
}

.modal-avatar-wrapper {
  cursor: pointer;
  position: absolute;
  bottom: -32px;
  left: 1.5rem;
}

.modal-avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modal-avatar-edit {
  position: absolute;
  bottom: 0;
  right: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: transform 0.2s;
}

.modal-avatar-edit:hover {
  transform: scale(1.1);
}

/* Form */
.form-group {
  margin-bottom: 1.25rem;
  position: relative;
}

.form-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #555b77;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  font-size: 0.92rem;
  color: #1a1c2e !important;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  box-sizing: border-box;
  background-color: #fafbfc !important;
}

.form-input:focus {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background-color: white !important;
}

.form-textarea {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  font-size: 0.92rem;
  color: #1a1c2e !important;
  font-family: inherit;
  resize: vertical;
  outline: none;
  min-height: 80px;
  box-sizing: border-box;
  background-color: #fafbfc !important;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background-color: white !important;
}

.char-count {
  position: absolute;
  right: 0.75rem;
  bottom: -1.2rem;
  font-size: 0.7rem;
  color: #c4c9de;
}

.input-with-prefix {
  display: flex;
  align-items: center;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  background-color: #fafbfc !important;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-with-prefix:focus-within {
  border-color: #ff5fa6;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.1);
  background-color: white !important;
}

.input-prefix {
  padding: 0 0 0 0.9rem;
  color: #9aa0b8;
  font-weight: 600;
  font-size: 0.92rem;
}

.form-input.with-prefix {
  border: none;
  background-color: transparent !important;
  padding-left: 0.25rem;
  box-shadow: none;
}

.form-input.with-prefix:focus {
  box-shadow: none;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
  border-radius: 0 0 20px 20px;
}

/* Estilo "correto" deste modal (ver achado em ProfileInterestsModal.vue —
   2 `.btn-cancel` conflitantes existiam no arquivo original; esta é a
   versão que sempre pertenceu a este modal). */
.btn-cancel {
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1.5px solid #e0e2ed;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.88rem;
  color: #555b77;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #c4c9de;
  background: rgba(0, 0, 0, 0.02);
}

.btn-save {
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 95, 166, 0.25);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 95, 166, 0.35);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Duplicado de Profile.vue — usado pelo ícone de loading dos botões
   acima. Achado durante a Fase 5: essa animação nunca tinha sido
   duplicada nos modais extraídos nas partes 2-6 (o ícone `mdi-spin`
   ficava parado, sem girar, porque `<style scoped>` não atravessa
   fronteira de componente) — corrigido retroativamente em todos eles. */
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
