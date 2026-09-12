<script setup lang="ts">
  // Extraído de Profile.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 6ª e
  // última fatia da decomposição de Profile.vue. Modal de recorte da capa
  // (usa ImageCropper). Irmão de ProfileCropModal.vue (recorte do
  // avatar) — mantidos separados de propósito, ver comentário lá.
  //
  // Mesma mecânica dos outros modais: estado (`pendingBannerFile` etc.)
  // e decisão de nome de arquivo continuam no pai; este componente só
  // pega o blob recortado e emite `confirmed`.
  //
  // Achado (fora de escopo corrigir agora): este modal, diferente do de
  // avatar, nunca usou `t()` — todo o texto (título, dica, botões) está
  // hardcoded em português. Preservado assim; vira um item pra Fase 7
  // (i18n) se o time quiser, não parte desta decomposição.
  import { ref } from 'vue'
  import ImageCropper from '@/components/UI/ImageCropper/ImageCropper.vue'

  defineProps<{
    visible: boolean
    imageSrc: string
    mimeType: string
    uploading: boolean
  }>()

  const emit = defineEmits<{
    close: []
    confirmed: [blob: Blob]
  }>()

  const BANNER_ASPECT = 16 / 5
  const BANNER_OUTPUT_SIZE = 1600

  const bannerCropperRef = ref<InstanceType<typeof ImageCropper> | null>(null)

  async function confirm () {
    const blob = await bannerCropperRef.value?.getCroppedBlob()
    if (!blob) return
    emit('confirmed', blob)
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="modal-overlay banner-crop-modal-overlay"
        @click.self="emit('close')"
      >
        <div class="banner-crop-modal-container">
          <div class="crop-modal-header">
            <div class="banner-crop-header-content">
              <i class="mdi mdi-panorama" />
              <h2>Enquadrar Foto de Capa</h2>
            </div>
            <button class="modal-close" @click="emit('close')">
              <i class="mdi mdi-close" />
            </button>
          </div>

          <div class="banner-crop-modal-body">
            <p class="banner-crop-hint">
              <i class="mdi mdi-gesture-swipe" />
              Arraste para reposicionar · Use os controles abaixo para ajustar o zoom
            </p>

            <ImageCropper
              ref="bannerCropperRef"
              :aspect-ratio="BANNER_ASPECT"
              :output-mime-type="mimeType"
              :output-size="BANNER_OUTPUT_SIZE"
              :src="imageSrc"
            />
          </div>

          <div class="crop-modal-footer">
            <button class="btn-cancel" @click="emit('close')">Cancelar</button>
            <button class="btn-save" :disabled="uploading" @click="confirm">
              <i v-if="uploading" class="mdi mdi-loading mdi-spin" />
              {{ uploading ? 'Enviando...' : 'Aplicar' }}
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

/* Botão compartilhado com outros modais (ver achado em
   ProfileCropModal.vue) — versão que hoje "vence" a cascata, reproduzida
   aqui como base pro override abaixo funcionar igual. */
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

/* Compartilhado com ProfileCropModal.vue (mesmos nomes de classe,
   valores idênticos). */
.crop-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.crop-modal-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.crop-modal-header .modal-close {
  color: rgba(255, 255, 255, 0.6);
}

.crop-modal-header .modal-close:hover {
  color: #fff;
}

.crop-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.crop-modal-footer .btn-cancel {
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(255, 255, 255, 0.15);
}

.crop-modal-footer .btn-cancel:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

/* Exclusivo deste modal. */
.banner-crop-modal-overlay {
  z-index: 10002;
}

.banner-crop-modal-container {
  background: #1a1c2e;
  border-radius: 20px;
  width: min(660px, 92vw);
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  animation: modal-pop 0.3s ease;
}

.banner-crop-header-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #fff;
}

.banner-crop-header-content i {
  font-size: 1.3rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.banner-crop-modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.banner-crop-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  text-align: center;
}

.banner-crop-hint i {
  font-size: 1rem;
  opacity: 0.7;
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Duplicado de Profile.vue — usado pelo ícone de loading do botão
   "Aplicar" (achado retroativo, ver comentário em
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
