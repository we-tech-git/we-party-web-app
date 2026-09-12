<script setup lang="ts">
  // Extraído de Profile.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 5ª fatia da
  // decomposição do mega-arquivo. Modal de recorte do avatar (usa
  // ImageCropper). Ver ProfileBannerCropModal.vue para o irmão (recorte da
  // capa) — mantidos separados (não viraram 1 componente com `variant`
  // como o de seguidores/seguindo): proporção, formato (círculo vs
  // retângulo), tamanho de saída e até o texto de apoio diferem de
  // verdade entre os dois.
  //
  // `pendingAvatarFile`/`pendingAvatarPreview`/`showCropModal`/
  // `pendingAvatarInput` continuam no pai — são compartilhados com o
  // modal de Editar Perfil (`saveProfile` lê `pendingAvatarFile` pra
  // decidir se sobe uma imagem nova). Este componente só pega o blob
  // recortado do `ImageCropper` e emite `confirmed`; o pai decide o nome
  // do arquivo (`fileNameFor`), cria a prévia (`URL.createObjectURL`) e
  // fecha o modal — mesma lógica de sempre, só que agora reagindo a um
  // evento em vez de rodar tudo numa função só.
  //
  // Achado: havia 2 declarações conflitantes de `.btn-cancel` no arquivo
  // original (ver ProfileInterestsModal.vue) — a que "vencia" a cascata
  // pro app inteiro era a do modal de Editar Perfil. Esse modal de recorte
  // dependia dela (só sobrescrevia cor/borda via `.crop-modal-footer
  // .btn-cancel`, específico pro fundo escuro) — reproduzida aqui como
  // base + override, igual ao comportamento atual.
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
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

  const { t } = useI18n()

  const AVATAR_ASPECT = 1
  const AVATAR_OUTPUT_SIZE = 512

  const avatarCropperRef = ref<InstanceType<typeof ImageCropper> | null>(null)

  async function confirm () {
    const blob = await avatarCropperRef.value?.getCroppedBlob()
    if (!blob) return
    emit('confirmed', blob)
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay crop-modal-overlay" @click.self="emit('close')">
        <div class="crop-modal-container">
          <div class="crop-modal-header">
            <h2>{{ t('profile.cropModal.title') }}</h2>
            <button class="modal-close" @click="emit('close')">
              <i class="mdi mdi-close" />
            </button>
          </div>

          <div class="crop-modal-body">
            <ImageCropper
              ref="avatarCropperRef"
              :aspect-ratio="AVATAR_ASPECT"
              circle
              :output-mime-type="mimeType"
              :output-size="AVATAR_OUTPUT_SIZE"
              :src="imageSrc"
            />
          </div>

          <div class="crop-modal-footer">
            <button class="btn-cancel" @click="emit('close')">{{ t('profile.cropModal.cancel') }}</button>
            <button class="btn-save" :disabled="uploading" @click="confirm">
              <i v-if="uploading" class="mdi mdi-loading mdi-spin" />
              {{ uploading ? t('profile.cropModal.uploading') : t('profile.cropModal.apply') }}
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

/* Botão compartilhado com outros modais (ver achado no comentário do
   <script>) — versão que hoje "vence" a cascata (do modal de Editar
   Perfil), reproduzida aqui como base pro override abaixo funcionar
   igual. */
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

/* Exclusivo deste modal. */
.crop-modal-overlay {
  z-index: 10001;
}

.crop-modal-container {
  background: #1a1c2e;
  border-radius: 20px;
  width: min(420px, 92vw);
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  animation: modal-pop 0.3s ease;
}

/* Compartilhado com ProfileBannerCropModal.vue (mesmos nomes de classe,
   valores idênticos — ver comentário no <script>). */
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
.crop-modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
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
