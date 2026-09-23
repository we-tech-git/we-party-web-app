<script setup lang="ts">
  import type { HeroSlide } from '@/composables/useHeroSlideshow'
  import { onMounted, ref } from 'vue'

  defineProps<{
    slides: HeroSlide[]
    activeIndex: number
    /** Quantos slides já entram no DOM (atual + próximo) — o resto carrega depois. */
    loadedCount: number
  }>()

  // O 1º slide só ganha a classe ativa depois do mount, senão nasceria já no
  // estado final e não haveria fade-in nem zoom nele.
  const ready = ref(false)
  onMounted(() => requestAnimationFrame(() => {
    ready.value = true
  }))
</script>

<template>
  <div aria-hidden="true" class="ihb-backdrop" data-testid="interest-hero-backdrop">
    <div
      v-for="(slide, index) in slides.slice(0, loadedCount)"
      :key="slide.id"
      class="ihb-slide"
      :class="{ 'ihb-slide--active': ready && index === activeIndex }"
      :style="{ backgroundImage: `url(${slide.image})` }"
    />
  </div>
</template>

<style scoped>
.ihb-backdrop {
  position: absolute;
  inset: 0;
}

.ihb-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  /* Enquadra pelo topo: num hero largo o `cover` corta faixa de cima e de baixo, e
     rosto/cabeça de artista costuma estar no terço superior da foto. O zoom
     também nasce desse ponto, senão empurraria as cabeças pra fora do quadro. */
  background-position: center 12%;
  transform-origin: center 12%;
  opacity: 0;
  transform: scale(1);
  /* Ao sair: some em 1.2s e só depois volta a escala (delay do transform) —
     sem isso o slide "pula" de tamanho enquanto ainda está visível. */
  transition: opacity 1.2s ease, transform 0s linear 1.2s;
}

.ihb-slide--active {
  opacity: 1;
  /* Zoom lento (Ken Burns) durante o tempo em que o slide está ativo */
  transform: scale(1.05);
  transition: opacity 1.2s ease, transform 8s linear;
}

@media (prefers-reduced-motion: reduce) {
  .ihb-slide,
  .ihb-slide--active {
    transform: none;
    transition: opacity 0.3s ease;
  }
}
</style>
