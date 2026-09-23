import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { buildHeroSlides, type HeroSlide, useHeroSlideshow } from './useHeroSlideshow'

function event (id: string, url: string | null, extra: Record<string, unknown> = {}) {
  return {
    id,
    title: `Evento ${id}`,
    location: 'Local',
    startDate: '2026-10-02T20:00:00.000Z',
    images: url ? [{ ratio: '16_9', url, width: 1280 }] : [],
    ...extra,
  }
}

describe('buildHeroSlides', () => {
  it('ignora eventos sem imagem', () => {
    const slides = buildHeroSlides([event('1', null), event('2', 'a.jpg')])
    expect(slides.map(s => s.id)).toEqual(['2'])
  })

  it('não repete a mesma imagem', () => {
    const slides = buildHeroSlides([event('1', 'a.jpg'), event('2', 'a.jpg'), event('3', 'b.jpg')])
    expect(slides.map(s => s.id)).toEqual(['1', '3'])
  })

  it('respeita o limite', () => {
    const events = Array.from({ length: 8 }, (_, i) => event(String(i), `img-${i}.jpg`))
    expect(buildHeroSlides(events, 5)).toHaveLength(5)
  })

  it('cai na primeira imagem quando não há 16:9', () => {
    const slides = buildHeroSlides([{ ...event('1', null), images: [{ ratio: '3_2', url: 'p.jpg', width: 600 }] }])
    expect(slides[0]?.image).toBe('p.jpg')
  })
})

describe('useHeroSlideshow', () => {
  const slides: HeroSlide[] = ['a', 'b', 'c'].map(id => ({
    id,
    image: `${id}.jpg`,
    title: id,
    location: '',
    startDate: '2026-10-02T20:00:00.000Z',
  }))

  function mountComposable (list: HeroSlide[]) {
    let api!: ReturnType<typeof useHeroSlideshow>
    const app = createApp(defineComponent({
      setup () {
        api = useHeroSlideshow(list, 1000)
        return () => h('div')
      },
    }))
    app.mount(document.createElement('div'))
    return { api, app }
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('avança automaticamente e volta ao início', async () => {
    const { api, app } = mountComposable(slides)
    expect(api.activeIndex.value).toBe(0)

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(api.activeIndex.value).toBe(1)

    vi.advanceTimersByTime(2000)
    await nextTick()
    expect(api.activeIndex.value).toBe(0)
    app.unmount()
  })

  it('carrega o slide atual e o próximo sob demanda', () => {
    const { api, app } = mountComposable(slides)
    expect(api.loadedCount.value).toBe(2)
    api.goTo(2)
    expect(api.loadedCount.value).toBe(3)
    app.unmount()
  })

  it('não gira com um único slide', () => {
    const { api, app } = mountComposable(slides.slice(0, 1))
    vi.advanceTimersByTime(5000)
    expect(api.activeIndex.value).toBe(0)
    app.unmount()
  })
})
