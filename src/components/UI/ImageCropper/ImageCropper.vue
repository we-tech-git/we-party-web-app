<script setup lang="ts">
/**
 * Recorte de imagem sobre Cropper.js.
 *
 * Substitui o cropper feito à mão (zoom/offset/drag calculados manualmente), que
 * produzia recortes deslocados. Aqui o Cropper.js cuida da geometria e nós só
 * pedimos o canvas recortado no final.
 *
 * Serve tanto o avatar (círculo, 1:1) quanto a capa (retângulo, 16:5) — por isso
 * `aspectRatio` e `circle` são props, em vez de dois componentes quase iguais.
 */
  import Cropper from 'cropperjs'
  import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
  import 'cropperjs/dist/cropper.css'

  const props = withDefaults(defineProps<{
    /** Data URL ou object URL da imagem a recortar. */
    src: string
    /** Proporção do recorte. 1 = quadrado (avatar), 16/5 = capa. */
    aspectRatio?: number
    /** Desenha a área de recorte como círculo (só visual; a saída é quadrada). */
    circle?: boolean
    /** Lado maior da imagem exportada, em px. */
    outputSize?: number
    /** MIME de saída. Preserva o tipo original quando informado. */
    outputMimeType?: string
  }>(), {
    aspectRatio: 1,
    circle: false,
    outputSize: 512,
    outputMimeType: 'image/jpeg',
  })

  const imageRef = ref<HTMLImageElement | null>(null)
  // shallowRef: a instância do Cropper é um objeto grande e mutável; deixar o Vue
  // torná-la reativa em profundidade quebra o comportamento interno da lib.
  const cropper = shallowRef<Cropper | null>(null)

  onMounted(() => {
    if (!imageRef.value) return

    cropper.value = new Cropper(imageRef.value, {
      aspectRatio: props.aspectRatio,
      viewMode: 1, // impede arrastar a área de recorte para fora da imagem
      dragMode: 'move',
      autoCropArea: 1,
      background: false,
      guides: false,
      center: true,
      movable: true,
      zoomable: true,
      scalable: false,
      rotatable: false,
      toggleDragModeOnDblclick: false,
      responsive: true,
    })
  })

  onBeforeUnmount(() => {
    cropper.value?.destroy()
    cropper.value = null
  })

  function zoom (delta: number) {
    cropper.value?.zoom(delta)
  }

  function reset () {
    cropper.value?.reset()
  }

  /**
   * Devolve o recorte como Blob. Retorna `null` se o cropper ainda não montou.
   *
   * O segundo argumento de `toBlob` é o MIME: sem ele o canvas exporta PNG por
   * padrão, o que incharia fotos vindas de JPEG.
   */
  function getCroppedBlob (): Promise<Blob | null> {
    const instance = cropper.value
    if (!instance) return Promise.resolve(null)

    const canvas = instance.getCroppedCanvas({
      width: props.outputSize,
      height: Math.round(props.outputSize / props.aspectRatio),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), props.outputMimeType, 0.92)
    })
  }

  defineExpose({ getCroppedBlob, zoom, reset })
</script>

<template>
  <div class="image-cropper" :class="{ 'is-circle': circle }">
    <div class="image-cropper__canvas">
      <img ref="imageRef" alt="" :src="src">
    </div>

    <div class="image-cropper__controls">
      <button aria-label="Diminuir zoom" class="image-cropper__btn" type="button" @click="zoom(-0.1)">
        <i class="mdi mdi-magnify-minus-outline" />
      </button>
      <button aria-label="Restaurar" class="image-cropper__btn" type="button" @click="reset">
        <i class="mdi mdi-restore" />
      </button>
      <button aria-label="Aumentar zoom" class="image-cropper__btn" type="button" @click="zoom(0.1)">
        <i class="mdi mdi-magnify-plus-outline" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.image-cropper__canvas {
  max-height: 60vh;
  overflow: hidden;
}

/* A imagem precisa ser block e ter largura limitada para o Cropper.js medir certo. */
.image-cropper__canvas img {
  display: block;
  max-width: 100%;
}

/* Máscara circular: puramente visual. O recorte exportado continua quadrado, e
   quem exibe é que aplica border-radius. */
.image-cropper.is-circle :deep(.cropper-view-box),
.image-cropper.is-circle :deep(.cropper-face) {
  border-radius: 50%;
}

.image-cropper__controls {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1rem;
}

.image-cropper__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid rgba(154, 160, 184, 0.35);
  border-radius: 50%;
  background: transparent;
  color: #6b7194;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.image-cropper__btn:hover {
  background: rgba(255, 95, 166, 0.1);
  border-color: rgba(255, 95, 166, 0.6);
  color: #d63384;
}
</style>
