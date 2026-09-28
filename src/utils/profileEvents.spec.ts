import { describe, expect, it } from 'vitest'
import { mapLikedEvent } from './profileEvents'

const fallbacks = {
  dateUndefined: 'Data a definir',
  locationUndefined: 'Local a definir',
  eventTitle: 'Evento',
  soon: 'Em breve',
}

describe('mapLikedEvent — data do evento', () => {
  it('expõe a data crua (ISO) além do texto formatado', () => {
    const iso = new Date(2026, 10, 13, 20, 0).toISOString()
    const mapped = mapLikedEvent({ id: '1', title: 'Show', startDate: iso }, fallbacks)

    expect(mapped.startDate).toBe(iso)
    expect(mapped.schedule).toContain('13/11/2026')
  })

  it('aceita as variações de campo de data que a API já entregou', () => {
    const iso = new Date(2026, 0, 2, 10).toISOString()

    expect(mapLikedEvent({ id: '1', date: iso }, fallbacks).startDate).toBe(iso)
    expect(mapLikedEvent({ id: '2', eventDate: iso }, fallbacks).startDate).toBe(iso)
  })

  it('sem data válida, startDate fica indefinido e o texto cai no fallback', () => {
    const mapped = mapLikedEvent({ id: '1', startDate: 'lixo' }, fallbacks)

    expect(mapped.startDate).toBeUndefined()
    expect(mapped.schedule).toBe('Data a definir')
  })
})
