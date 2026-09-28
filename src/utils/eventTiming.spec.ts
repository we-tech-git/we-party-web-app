import { describe, expect, it } from 'vitest'
import { formatEventDateLabel, getEventTiming, partitionByTiming } from './eventTiming'

// 23/09/2026 é quarta-feira (horário local)
const NOW = new Date(2026, 8, 23, 15, 0)

function local (year: number, month: number, day: number, hour = 20) {
  return new Date(year, month - 1, day, hour).toISOString()
}

describe('getEventTiming', () => {
  it('sem data ou com data inválida é "unknown"', () => {
    expect(getEventTiming(undefined, NOW)).toEqual({ kind: 'unknown', days: null })
    expect(getEventTiming('não é data', NOW)).toEqual({ kind: 'unknown', days: null })
  })

  it('hoje é "today" mesmo que o horário já tenha passado', () => {
    expect(getEventTiming(local(2026, 9, 23, 9), NOW).kind).toBe('today')
    expect(getEventTiming(local(2026, 9, 23, 23), NOW).kind).toBe('today')
  })

  it('amanhã é "tomorrow"', () => {
    expect(getEventTiming(local(2026, 9, 24, 1), NOW)).toEqual({ kind: 'tomorrow', days: 1 })
  })

  it('de 2 a 7 dias é "soon"; depois disso "later"', () => {
    expect(getEventTiming(local(2026, 9, 25), NOW)).toEqual({ kind: 'soon', days: 2 })
    expect(getEventTiming(local(2026, 9, 30), NOW)).toEqual({ kind: 'soon', days: 7 })
    expect(getEventTiming(local(2026, 10, 1), NOW)).toEqual({ kind: 'later', days: 8 })
  })

  it('dia anterior é "past"', () => {
    expect(getEventTiming(local(2026, 9, 22, 23), NOW)).toEqual({ kind: 'past', days: -1 })
  })
})

describe('formatEventDateLabel', () => {
  it('monta "dia da semana, dd/mm · hh:mm" sem o ponto da abreviação', () => {
    const label = formatEventDateLabel(new Date(2026, 7, 8, 20, 0).toISOString(), 'pt-BR', '—')
    expect(label).toMatch(/^sáb,? 08\/08 · 20:00$/)
    expect(label).not.toContain('.')
  })

  it('devolve o fallback quando a data é inválida', () => {
    expect(formatEventDateLabel(undefined, 'pt-BR', 'Data a definir')).toBe('Data a definir')
    expect(formatEventDateLabel('xx', 'pt-BR', 'Data a definir')).toBe('Data a definir')
  })
})

describe('partitionByTiming', () => {
  const item = (id: string, startDate?: string) => ({ id, startDate })

  it('separa próximos (mais perto primeiro) de passados (mais recente primeiro)', () => {
    const { upcoming, past } = partitionByTiming([
      item('late', local(2026, 12, 1)),
      item('old', local(2026, 1, 1)),
      item('soon', local(2026, 9, 25)),
      item('recent', local(2026, 9, 1)),
    ], NOW)

    expect(upcoming.map(i => i.id)).toEqual(['soon', 'late'])
    expect(past.map(i => i.id)).toEqual(['recent', 'old'])
  })

  it('evento sem data fica em "próximos", no fim', () => {
    const { upcoming, past } = partitionByTiming([item('tbd'), item('soon', local(2026, 9, 25))], NOW)

    expect(upcoming.map(i => i.id)).toEqual(['soon', 'tbd'])
    expect(past).toEqual([])
  })

  it('não altera a lista original', () => {
    const list = [item('b', local(2026, 12, 1)), item('a', local(2026, 9, 25))]
    partitionByTiming(list, NOW)
    expect(list.map(i => i.id)).toEqual(['b', 'a'])
  })
})
