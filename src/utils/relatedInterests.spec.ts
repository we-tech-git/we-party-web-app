import { describe, expect, it } from 'vitest'
import { buildRelatedInterests } from './relatedInterests'

function interest (id: string, name: string, extra: Record<string, unknown> = {}) {
  return { id, name, slug: name.toLowerCase(), status: 'APPROVED', emoji: null, ...extra }
}

function event (...interests: ReturnType<typeof interest>[]) {
  return { eventInterests: interests.map(i => ({ interest: i })) }
}

const metal = interest('1', 'Metal')
const rock = interest('2', 'Rock')
const heavy = interest('3', 'Heavy Metal')
const punk = interest('4', 'Punk')

describe('buildRelatedInterests', () => {
  it('exclui o próprio interesse da página', () => {
    const result = buildRelatedInterests([event(metal, rock)], '1')
    expect(result.map(r => r.name)).toEqual(['Rock'])
  })

  it('ordena pelos que aparecem em mais eventos', () => {
    const result = buildRelatedInterests([event(metal, rock, punk), event(metal, rock), event(metal, heavy)], '1')
    expect(result.map(r => [r.name, r.eventCount])).toEqual([['Rock', 2], ['Heavy Metal', 1], ['Punk', 1]])
  })

  it('desempata por nome', () => {
    const result = buildRelatedInterests([event(metal, punk, heavy)], '1')
    expect(result.map(r => r.name)).toEqual(['Heavy Metal', 'Punk'])
  })

  it('ignora interesse que não está APROVADO ou não tem slug (página pública daria 404)', () => {
    const result = buildRelatedInterests([
      event(metal, interest('5', 'Pendente', { status: 'PENDING' }), interest('6', 'SemSlug', { slug: null }), rock),
    ], '1')
    expect(result.map(r => r.name)).toEqual(['Rock'])
  })

  it('conta um interesse repetido no mesmo evento só uma vez', () => {
    const result = buildRelatedInterests([event(metal, rock, rock)], '1')
    expect(result[0]?.eventCount).toBe(1)
  })

  it('respeita o limite', () => {
    const many = Array.from({ length: 12 }, (_, i) => interest(String(i + 10), `Tag ${i}`))
    expect(buildRelatedInterests([event(metal, ...many)], '1', 5)).toHaveLength(5)
  })

  it('lida com eventos sem eventInterests', () => {
    expect(buildRelatedInterests([{}, { eventInterests: null }, event(metal)], '1')).toEqual([])
  })
})
