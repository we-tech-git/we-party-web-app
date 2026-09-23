import { describe, expect, it } from 'vitest'
import { matchesDateFilter } from './eventDateFilters'

// 23/09/2026 é quarta-feira (horário local)
const WEDNESDAY = new Date(2026, 8, 23, 15, 0)
const SUNDAY = new Date(2026, 8, 27, 12, 0)

function local (year: number, month: number, day: number, hour = 20) {
  return new Date(year, month - 1, day, hour).toISOString()
}

describe('matchesDateFilter', () => {
  it('"all" aceita qualquer data', () => {
    expect(matchesDateFilter(local(2030, 1, 1), 'all', WEDNESDAY)).toBe(true)
  })

  it('data inválida não passa em nenhum filtro específico', () => {
    for (const filter of ['week', 'month', 'nextMonth'] as const) {
      expect(matchesDateFilter('não é data', filter, WEDNESDAY)).toBe(false)
    }
  })

  describe('week (seg–dom da semana atual)', () => {
    it('inclui hoje e o domingo, exclui a segunda seguinte', () => {
      expect(matchesDateFilter(local(2026, 9, 23, 10), 'week', WEDNESDAY)).toBe(true)
      expect(matchesDateFilter(local(2026, 9, 27, 23), 'week', WEDNESDAY)).toBe(true)
      expect(matchesDateFilter(local(2026, 9, 28, 1), 'week', WEDNESDAY)).toBe(false)
    })

    it('exclui dias que já passaram', () => {
      expect(matchesDateFilter(local(2026, 9, 22), 'week', WEDNESDAY)).toBe(false)
    })

    it('no domingo, só o próprio domingo conta', () => {
      expect(matchesDateFilter(local(2026, 9, 27), 'week', SUNDAY)).toBe(true)
      expect(matchesDateFilter(local(2026, 9, 28), 'week', SUNDAY)).toBe(false)
    })
  })

  describe('nextMonth', () => {
    it('só o mês seguinte', () => {
      expect(matchesDateFilter(local(2026, 10, 1), 'nextMonth', WEDNESDAY)).toBe(true)
      expect(matchesDateFilter(local(2026, 10, 31), 'nextMonth', WEDNESDAY)).toBe(true)
      expect(matchesDateFilter(local(2026, 9, 30), 'nextMonth', WEDNESDAY)).toBe(false)
      expect(matchesDateFilter(local(2026, 11, 1), 'nextMonth', WEDNESDAY)).toBe(false)
    })

    it('vira o ano em dezembro', () => {
      const december = new Date(2026, 11, 10, 12)
      expect(matchesDateFilter(local(2027, 1, 15), 'nextMonth', december)).toBe(true)
      expect(matchesDateFilter(local(2026, 1, 15), 'nextMonth', december)).toBe(false)
    })
  })

  describe('month', () => {
    it('só o mês e ano atuais, a partir de hoje', () => {
      expect(matchesDateFilter(local(2026, 9, 30), 'month', WEDNESDAY)).toBe(true)
      expect(matchesDateFilter(local(2026, 10, 1), 'month', WEDNESDAY)).toBe(false)
      expect(matchesDateFilter(local(2027, 9, 30), 'month', WEDNESDAY)).toBe(false)
      expect(matchesDateFilter(local(2026, 9, 10), 'month', WEDNESDAY)).toBe(false)
    })
  })
})
