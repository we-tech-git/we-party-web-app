<script setup lang="ts">
  import { computed } from 'vue'

  /**
   * Texto com gradiente animado (background-clip: text), adaptado do componente
   * "GradientText" do React Bits para Vue — animação via CSS puro (sem framer-motion).
   */
  const props = withDefaults(defineProps<{
    tag?: string
    colors?: string[]
    animationSpeed?: number
    showBorder?: boolean
    direction?: 'horizontal' | 'vertical' | 'diagonal'
    pauseOnHover?: boolean
    yoyo?: boolean
  }>(), {
    tag: 'div',
    colors: () => ['#5227FF', '#FF9FFC', '#B497CF'],
    animationSpeed: 8,
    showBorder: false,
    direction: 'horizontal',
    pauseOnHover: false,
    yoyo: true,
  })

  const gradientAngle = computed(() => {
    if (props.direction === 'horizontal') return 'to right'
    if (props.direction === 'vertical') return 'to bottom'
    return 'to bottom right'
  })

  const backgroundSize = computed(() => {
    if (props.direction === 'horizontal') return '300% 100%'
    if (props.direction === 'vertical') return '100% 300%'
    return '300% 300%'
  })

  const directionClass = computed(() => (props.direction === 'vertical' ? 'gt-anim-y' : 'gt-anim-x'))

  const gradientStyle = computed(() => {
    const stops = [...props.colors, props.colors[0]].join(', ')
    return {
      backgroundImage: `linear-gradient(${gradientAngle.value}, ${stops})`,
      backgroundSize: backgroundSize.value,
      backgroundRepeat: 'repeat',
      animationDuration: `${props.animationSpeed}s`,
      animationTimingFunction: props.yoyo ? 'ease-in-out' : 'linear',
      animationIterationCount: 'infinite',
      animationDirection: props.yoyo ? 'alternate' : 'normal',
    }
  })
</script>

<template>
  <component
    :is="tag"
    class="gradient-text"
    :class="{ 'gradient-text--border': showBorder, 'gradient-text--pause-hover': pauseOnHover }"
  >
    <span v-if="showBorder" class="gradient-text__overlay" :class="directionClass" :style="gradientStyle" />
    <span class="gradient-text__content" :class="directionClass" :style="gradientStyle">
      <slot />
    </span>
  </component>
</template>

<style scoped>
.gradient-text {
  position: relative;
  display: inline-flex;
  max-width: fit-content;
}

.gradient-text--border {
  padding: 0.35rem 0.75rem;
  border-radius: 1.25rem;
}

.gradient-text__overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;
  pointer-events: none;
}

.gradient-text__content {
  position: relative;
  z-index: 1;
  display: inline-block;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.gradient-text--pause-hover:hover .gradient-text__content,
.gradient-text--pause-hover:hover .gradient-text__overlay {
  animation-play-state: paused;
}

.gt-anim-x {
  animation-name: gradient-text-move-x;
}

.gt-anim-y {
  animation-name: gradient-text-move-y;
}

@keyframes gradient-text-move-x {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes gradient-text-move-y {
  0% { background-position: 50% 0%; }
  100% { background-position: 50% 100%; }
}
</style>
