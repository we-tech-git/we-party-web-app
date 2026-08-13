<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { getAvatarGradient, getInitials, resolveAvatarImage } from '@/utils/avatar'

  /**
   * Avatar global do usuário.
   *
   * Mostra a foto de perfil quando existe; caso contrário (ou se a imagem
   * falhar ao carregar) exibe as iniciais do nome sobre um gradiente estável.
   *
   * - `name`  — nome completo do usuário (para iniciais e gradiente)
   * - `image` — URL da foto (relativa à API ou absoluta)
   * - `size`  — largura/altura em px (default 40)
   * - `radius` — raio do canto em px (default 9999 = círculo)
   */
  const props = withDefaults(defineProps<{
    name?: string
    image?: string | null
    size?: number
    radius?: number
  }>(), {
    name: '',
    image: null,
    size: 40,
    radius: 9999,
  })

  const src = computed(() => resolveAvatarImage(props.image))
  const failed = ref(false)

  watch(src, () => {
    failed.value = false
  })

  const showImage = computed(() => !!src.value && !failed.value)
  const initials = computed(() => getInitials(props.name || ''))
  const background = computed(() => getAvatarGradient(props.name || ''))

  function onError () {
    failed.value = true
  }
</script>

<template>
  <span
    class="user-avatar"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: `${radius}px`,
      background: showImage ? undefined : background,
      fontSize: `${Math.round(size * 0.4)}px`,
    }"
  >
    <img
      v-if="showImage"
      :alt="name"
      class="user-avatar__img"
      loading="lazy"
      :src="src"
      @error="onError"
    >
    <template v-else>{{ initials }}</template>
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  color: #fff;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  user-select: none;
}

.user-avatar__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
