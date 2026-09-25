import { computed, type MaybeRefOrGetter, onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue'
import { pickEventImages } from '@/composables/useEventImages'

export interface HeroSlide {
  id: string
  image: string
  title: string
  location: string
  startDate: string
}

/**
 * Transforma eventos da API em slides de hero: só os que têm imagem, sem
 * repetir a mesma URL (vários eventos podem reutilizar a mesma capa — o
 * slideshow ficaria "parado" trocando de imagem igual) e limitado a `limit`
 * pra não puxar dezenas de imagens pesadas no topo da página.
 */
export function buildHeroSlides (events: any[], limit = 5): HeroSlide[] {
  const seen = new Set<string>()
  const slides: HeroSlide[] = []

  for (const event of events) {
    const image = pickEventImages(event.images).desktop || event.images?.[0]?.url || ''
    if (!image || seen.has(image)) {
      continue
    }
    seen.add(image)
    slides.push({
      id: event.id,
      image,
      title: event.title,
      location: event.location ?? '',
      startDate: event.startDate,
    })
    if (slides.length >= limit) {
      break
    }
  }

  return slides
}

function prefersReducedMotion () {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Rotação automática de slides. Não avança com a aba oculta nem quando o
 * usuário pede menos movimento (`prefers-reduced-motion`); `goTo` reinicia o
 * timer pra não pular o slide logo depois de um clique manual.
 *
 * `loadedCount` = quantos slides já devem estar no DOM (o atual + o próximo),
 * assim as imagens são baixadas sob demanda em vez de todas de uma vez.
 */
export function useHeroSlideshow (slides: MaybeRefOrGetter<HeroSlide[]>, intervalMs = 6000) {
  const activeIndex = ref(0)
  const reachedIndex = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const count = computed(() => toValue(slides).length)
  const loadedCount = computed(() => Math.min(count.value, reachedIndex.value + 2))

  function goTo (index: number) {
    if (count.value === 0) {
      return
    }
    activeIndex.value = ((index % count.value) + count.value) % count.value
    reachedIndex.value = Math.max(reachedIndex.value, activeIndex.value)
  }

  function stop () {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start () {
    stop()
    if (count.value < 2 || prefersReducedMotion() || document.hidden) {
      return
    }
    timer = setInterval(() => goTo(activeIndex.value + 1), intervalMs)
  }

  function manualGoTo (index: number) {
    goTo(index)
    start()
  }

  function onVisibilityChange () {
    if (document.hidden) {
      stop()
    } else {
      start()
    }
  }

  // Lista nova (troca de interesse / recarga) → volta pro primeiro slide.
  watch(() => toValue(slides).map(slide => slide.id).join(','), () => {
    activeIndex.value = 0
    reachedIndex.value = 0
    start()
  })

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    start()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    stop()
  })

  return { activeIndex, loadedCount, goTo: manualGoTo }
}
