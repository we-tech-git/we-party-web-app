import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export interface EventImage {
  ratio: string
  url: string
  width: number
}

/**
 * Seleciona a melhor imagem disponível para desktop (16:9) e mobile (3:2).
 * Evita duplicar essa lógica em FeedCard e EventView.
 */
export function useEventImages (images: MaybeRefOrGetter<EventImage[] | undefined>) {
  return computed(() => {
    const imgs = toValue(images)
    if (!imgs?.length) {
      return { desktop: '', mobile: '' }
    }

    const landscape = imgs
      .filter(i => i.ratio === '16_9')
      .toSorted((a, b) => b.width - a.width)

    const vertical = imgs.filter(i => i.ratio === '3_2')
    const mobilePool = vertical.length > 0
      ? vertical.toSorted((a, b) => b.width - a.width)
      : landscape.toReversed()

    return {
      desktop: landscape[0]?.url ?? '',
      mobile: mobilePool[0]?.url ?? landscape[0]?.url ?? '',
    }
  })
}
